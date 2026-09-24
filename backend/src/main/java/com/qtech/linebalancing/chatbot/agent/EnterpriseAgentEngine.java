package com.qtech.linebalancing.chatbot.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.dto.ChatContextDto;
import com.qtech.linebalancing.chatbot.dto.StructuredPayloadDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnterpriseAgentEngine {

    private final EnterpriseToolsService toolsService;
    private final ObjectMapper objectMapper;

    @Value("${llm.api-key:${LLM_API_KEY:}}")
    private String apiKey;

    @Value("${llm.base-url:${LLM_BASE_URL:https://api.openai.com/v1}}")
    private String baseUrl;

    @Value("${llm.model:${LLM_MODEL:gemini-2.5-flash}}")
    private String model;

    public record AgentResult(
            String responseText,
            String intent,
            String dataSource,
            boolean dataAvailable,
            StructuredPayloadDto structuredPayload,
            List<String> suggestedQuestions
    ) {}

    /**
     * Executes the Enterprise Agent with Tool-Calling & Dynamic Grounding.
     */
    public AgentResult execute(String userMessage, ChatContextDto context, List<Map<String, String>> conversationHistory) {
        String msg = userMessage != null ? userMessage.trim() : "";
        if (msg.isEmpty()) {
            return new AgentResult(
                    "Please ask a question about Master Data (Operators, Operations, Styles, Lines, Machines, Shifts), Line Balancing, Operation Bulletins, or Production Orders.",
                    "GENERAL", "SYSTEM", true, null,
                    List.of("Show Master Data Overview", "List all 8 garment styles", "Show all 5 Operation Bulletins", "Who is the top operator for Shoulder Join?")
            );
        }

        // Try External LLM Tool-Calling loop first if API key is present
        if (apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("mock") && !apiKey.contains("YOUR_")) {
            try {
                AgentResult externalResult = runExternalLLMToolCalling(msg, context, conversationHistory);
                if (externalResult != null && externalResult.responseText() != null && !externalResult.responseText().isBlank()) {
                    return externalResult;
                }
            } catch (Exception e) {
                log.warn("External LLM agent execution failed ({}), activating Zero-Failure Local Semantic Engine.", e.getMessage());
            }
        }

        // Fallback: Zero-Failure Intelligent Local Semantic Grounding Engine
        return runLocalSemanticEngine(msg, context);
    }

    /**
     * External LLM Tool Calling loop (OpenAI / Gemini function calling).
     */
    private AgentResult runExternalLLMToolCalling(String userMessage, ChatContextDto context, List<Map<String, String>> history) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(6000);
        requestFactory.setReadTimeout(18000);

        RestClient restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey.trim())
                .build();

        String systemPrompt = String.format("""
            You are SewNexa Enterprise AI Assistant, an expert Industrial Engineering & Manufacturing Intelligence Agent for garment factories.
            You have direct access to tools that query live data from the PostgreSQL manufacturing database (`qtech_linebalancing`).
            
            ACTIVE USER UI CONTEXT:
            - Page: %s
            - Selected Style: %s (ID: %s)
            - Selected Line: %s (ID: %s)
            - Selected Order: %s (ID: %s)
            - Selected Shift ID: %s
            
            DATABASE SCHEMA:
            %s
            
            INSTRUCTIONS:
            1. Whenever the user asks for facts, master data, numbers, operators, bulletins, lines, machines, calculations, or production logs, ALWAYS call the appropriate tool.
            2. If no specific tool matches, use `execute_sql_query` to query the database tables directly.
            3. Synthesize your final answer using rich GitHub Markdown: use bold headers, clean tables, bullet points, and highlight metrics.
            4. Never invent numbers or hallucinate. Rely 100%% on tool outputs.
            """,
            context != null && context.getPage() != null ? context.getPage() : "Dashboard",
            context != null && context.getStyleCode() != null ? context.getStyleCode() : "None",
            context != null && context.getStyleId() != null ? context.getStyleId() : "None",
            context != null && context.getLineCode() != null ? context.getLineCode() : "None",
            context != null && context.getLineId() != null ? context.getLineId() : "None",
            context != null && context.getOrderCode() != null ? context.getOrderCode() : "None",
            context != null && context.getOrderId() != null ? context.getOrderId() : "None",
            context != null && context.getShiftId() != null ? context.getShiftId() : "None",
            toolsService.getSchemaCatalog()
        );

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (history != null) {
            for (Map<String, String> h : history) {
                messages.add(Map.of("role", h.getOrDefault("role", "user"), "content", h.getOrDefault("content", "")));
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("tools", ToolDefinition.getOpenAITools());
        requestBody.put("tool_choice", "auto");
        requestBody.put("temperature", 0.1);

        String initialResponse = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        if (initialResponse == null) return null;

        try {
            JsonNode root = objectMapper.readTree(initialResponse);
            JsonNode choice = root.path("choices").get(0);
            JsonNode messageNode = choice.path("message");

            if (messageNode.has("tool_calls") && messageNode.path("tool_calls").isArray() && !messageNode.path("tool_calls").isEmpty()) {
                JsonNode toolCalls = messageNode.path("tool_calls");
                messages.add(objectMapper.convertValue(messageNode, new TypeReference<Map<String, Object>>() {}));

                for (JsonNode tc : toolCalls) {
                    String toolCallId = tc.path("id").asText();
                    String functionName = tc.path("function").path("name").asText();
                    String argumentsStr = tc.path("function").path("arguments").asText();
                    JsonNode args = objectMapper.readTree(argumentsStr);

                    Object toolResult = executeToolFunction(functionName, args);
                    String resultJson = objectMapper.writeValueAsString(toolResult);

                    messages.add(Map.of(
                            "role", "tool",
                            "tool_call_id", toolCallId,
                            "name", functionName,
                            "content", resultJson
                    ));
                }

                Map<String, Object> secondRequestBody = new LinkedHashMap<>();
                secondRequestBody.put("model", model);
                secondRequestBody.put("messages", messages);
                secondRequestBody.put("temperature", 0.2);

                String finalResponse = restClient.post()
                        .uri("/chat/completions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(secondRequestBody)
                        .retrieve()
                        .body(String.class);

                if (finalResponse != null) {
                    JsonNode finalRoot = objectMapper.readTree(finalResponse);
                    String content = finalRoot.path("choices").get(0).path("message").path("content").asText();
                    return new AgentResult(
                            content.trim(),
                            "LLM_TOOL_CALLING",
                            "POSTGRESQL_LIVE",
                            true,
                            null,
                            generateDynamicSuggestedQuestions(userMessage)
                    );
                }
            } else {
                String directContent = messageNode.path("content").asText();
                if (directContent != null && !directContent.isBlank()) {
                    return new AgentResult(
                            directContent.trim(),
                            "LLM_DIRECT",
                            "POSTGRESQL_LIVE",
                            true,
                            null,
                            generateDynamicSuggestedQuestions(userMessage)
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Error processing tool calls from LLM", e);
        }

        return null;
    }

    private Object executeToolFunction(String functionName, JsonNode args) {
        return switch (functionName) {
            case "execute_sql_query" -> toolsService.executeSafeQuery(args.path("query").asText());
            case "get_master_overview" -> toolsService.getMasterOverview();
            case "search_operators" -> toolsService.searchOperators(
                    args.path("query").asText(null),
                    args.path("role").asText(null),
                    args.path("department").asText(null)
            );
            case "get_operator_profile" -> toolsService.getOperatorProfile(args.path("identifier").asText());
            case "search_operations" -> toolsService.searchOperations(
                    args.path("query").asText(null),
                    args.path("machineType").asText(null)
            );
            case "get_bulletin_details" -> toolsService.getBulletinDetails(args.path("bulletinCodeOrId").asText());
            case "calculate_line_balancing" -> toolsService.calculateLineBalancing(
                    args.has("bulletinId") ? args.path("bulletinId").asLong() : 2L,
                    args.has("operatorCount") ? args.path("operatorCount").asInt() : 10,
                    args.has("targetPcsPerHour") ? args.path("targetPcsPerHour").asDouble() : 100.0,
                    args.has("efficiencyPct") ? args.path("efficiencyPct").asDouble() : 85.0
            );
            case "get_hourly_production_stats" -> toolsService.getHourlyProductionStats(
                    args.has("lineId") ? args.path("lineId").asLong() : 1L,
                    null
            );
            default -> Map.of("error", "Unknown tool: " + functionName);
        };
    }

    /**
     * Zero-Failure Intelligent Local Semantic Grounding Engine.
     */
    public AgentResult runLocalSemanticEngine(String msg, ChatContextDto context) {
        String cleanMsg = msg.trim();
        String lower = cleanMsg.toLowerCase();

        // 1. MASTER DATA OVERVIEW & SYSTEM SUMMARY
        if (lower.equals("master") || lower.equals("masters") || lower.contains("master data") ||
            ((lower.contains("overview") || lower.contains("summary") || lower.contains("catalog") || lower.contains("database")) &&
             (lower.contains("system") || lower.contains("factory") || lower.contains("master") || lower.contains("all")))) {
            Map<String, Object> master = toolsService.getMasterOverview();
            StringBuilder sb = new StringBuilder();
            sb.append("### 🏭 SewNexa Master Data Overview\n\n");
            sb.append("Live factory configuration and master records active in PostgreSQL:\n\n");
            sb.append("| Master Category | Live Record Count | Status |\n");
            sb.append("|---|---|---|\n");
            sb.append(String.format("| **Garment Operators** | `%d Operators` | ✅ Active (EMP-001 to EMP-050) |\n", master.get("operators")));
            sb.append(String.format("| **Sewing Operations** | `%d Operations` | ✅ Standard SMVs & Machines |\n", master.get("operations")));
            sb.append(String.format("| **Garment Styles** | `%d Styles` | ✅ Nike, Zara, Uniqlo, Levi's |\n", master.get("styles")));
            sb.append(String.format("| **Sewing Lines** | `%d Lines` | ✅ Modular, Hanger, Hybrid Lean |\n", master.get("lines")));
            sb.append(String.format("| **Machine Inventory** | `%d Machines` | ✅ Juki, Brother, Jack, Pegasus |\n", master.get("machines")));
            sb.append(String.format("| **Working Shifts** | `%d Shifts` | ✅ Shift A, B, C, General |\n", master.get("shifts")));
            sb.append(String.format("| **Operation Bulletins** | `%d Bulletins` | ✅ Complete Routing & SMV Plans |\n", master.get("bulletins")));
            sb.append(String.format("| **Production Orders** | `%d Orders` | ✅ Active Work Orders |\n", master.get("orders")));
            sb.append(String.format("| **Garment Sizes** | `%d Sizes` | ✅ XS to 2XL Standard Range |\n", master.get("sizes")));
            sb.append(String.format("| **Skill Matrix Ratings** | `%d Matrix Entries` | ✅ Verified 1–5 Ratings |\n", master.get("skillRatingsRecorded")));

            sb.append("\n💡 *Try asking: \"Show details for Pooja Deshmukh\", \"What is the standard SMV for Sleeve Attach?\", \"Show details of OB-POLO-800\", or \"Calculate line balancing for 12 operators\".*");

            StructuredPayloadDto payload = StructuredPayloadDto.builder()
                    .type("METRIC")
                    .title("Master Data Inventory")
                    .metrics(master)
                    .build();

            return new AgentResult(sb.toString(), "MASTER_OVERVIEW", "POSTGRESQL_LIVE", true, payload,
                    List.of("Show details for Pooja Deshmukh", "What is standard SMV for Sleeve Attach?", "Show all 5 Operation Bulletins", "Calculate Line Balancing for 12 operators"));
        }

        // 2. INDUSTRIAL ENGINEERING KNOWLEDGE BASE & FAQS
        if (lower.contains("what is smv") || lower.contains("what is sam") || lower.contains("standard minute value") || lower.contains("standard allowed minute")) {
            return new AgentResult("""
                ### ⏱️ Standard Minute Value (SMV) / Standard Allowed Minute (SAM)
                
                **SMV (Standard Minute Value)** is the standard time required by a qualified operator working at normal performance (100% rating) to complete a single garment sewing operation, including standard allowances for fatigue, personal needs, and machine delays.
                
                #### 📐 Calculation Formula:
                $$\\text{SMV} = \\text{Observed Cycle Time} \\times \\left(\\frac{\\text{Operator Rating}}{100}\\right) \\times (1 + \\text{PFD Allowance})$$
                
                - **PFD Allowance**: Personal, Fatigue, and Delay allowance (typically **12% to 15%** in apparel manufacturing).
                - **Significance**:
                  - Used to calculate **Pitch Time**, **Line Balancing**, and **Workstation Takt Time**.
                  - Governs **Operator Piece-Rate Incentives** and **Factory Capacity Planning**.
                
                💡 *In SewNexa, standard SMVs are defined per operation in `Operations Master` and mapped sequentially in `Operation Bulletins`.*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("What is Pitch Time?", "What is Line Balancing?", "What is the standard SMV for Sleeve Attach?", "Show Master Data Overview"));
        }

        if (lower.contains("what is pitch time") || lower.contains("pitch time formula") || lower.contains("how is pitch time calculated")) {
            return new AgentResult("""
                ### ⚡ Pitch Time in Garment Line Balancing
                
                **Pitch Time** is the average available time allocated per operator to complete their portion of work on a garment style.
                
                #### 📐 Pitch Time Formula:
                $$\\text{Pitch Time (seconds)} = \\frac{\\text{Total Garment SMV (seconds)}}{\\text{Total Number of Operators Allocated}}$$
                $$\\text{Pitch Time (minutes)} = \\frac{\\text{Total Garment SMV (minutes)}}{\\text{Total Number of Operators Allocated}}$$
                
                #### 🏭 Industrial Application:
                - **Target Pace**: Sets the benchmark cycle time for each workstation.
                - **Bottleneck Detection**: Any operation whose standard SMV **exceeds the Pitch Time** is a **Bottleneck** and requires work-sharing, parallel machines, or 2 operators.
                - **Hourly Target Output**: $\\text{Target Output (pcs/hr)} = \\frac{3600}{\\text{Pitch Time (sec)}} \\times \\text{Efficiency \\%}$.
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Calculate line balancing for 12 operators", "What is Takt Time?", "Show Operation Bulletin OB-POLO-800", "Master Data Overview"));
        }

        if (lower.contains("what is takt time") || lower.contains("difference between pitch time and takt time")) {
            return new AgentResult("""
                ### 🎯 Takt Time vs. Pitch Time
                
                - **Takt Time** is the **Customer Demand Pace** — how often a finished garment must come off the sewing line to satisfy order deadlines:
                  $$\\text{Takt Time} = \\frac{\\text{Net Available Working Seconds per Shift}}{\\text{Customer Order Demand (pieces per shift)}}$$
                - **Pitch Time** is the **Internal Line Capacity Pace** based on garment work content (SMV) and manpower:
                  $$\\text{Pitch Time} = \\frac{\\text{Total Garment SMV}}{\\text{Allocated Operators}}$$
                
                #### ⚖️ Line Balancing Objective:
                Industrial Engineers balance the line so that **Pitch Time $\\le$ Takt Time** at expected line efficiency.
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Calculate line balancing for 12 operators", "What is Line Balancing?", "Show details of OB-POLO-800"));
        }

        if (lower.contains("what is line balancing") || lower.contains("how to balance a line") || lower.contains("line balancing concept")) {
            return new AgentResult("""
                ### 🪡 Garment Line Balancing
                
                **Line Balancing** is the industrial engineering process of distributing sewing operations evenly across workstations along a sewing line so that each operator's workload matches the **Pitch Time** as closely as possible.
                
                #### 🎯 Key Objectives:
                1. **Eliminate Bottlenecks**: Prevent upstream WIP buildup and downstream operator starvation.
                2. **Maximize Line Efficiency & Balancing Efficiency (Balancing % $\\ge 85\\%$)**.
                3. **Optimize Operator Skill Matching**: Assign operators with rating 4–5 to critical bottleneck operations.
                4. **Control WIP Buffers**: Enforce buffer threshold limits (typically 15–25 pcs) between consecutive stations.
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Calculate line balancing for 12 operators", "Show WIP queue buffer limits", "Who are the floater operators?"));
        }

        if (lower.contains("wip threshold") || lower.contains("wip buffer") || lower.contains("buffer limit")) {
            return new AgentResult("""
                ### 📦 Work-In-Progress (WIP) Buffer Thresholds
                
                In garment manufacturing, **WIP Buffers** represent intermediate bundled garments queued between consecutive sewing workstations.
                
                - **Standard Buffer Limit**: Typically **15 to 25 pieces** per workstation.
                - **Yellow Alert (Warning)**: Buffer reaches 80% of threshold limit $\\rightarrow$ indicates early stage flow imbalance.
                - **Red Alert (Critical Bottleneck)**: Buffer exceeds limit $\\rightarrow$ floater operators must be immediately deployed to absorb overflow.
                
                💡 *In SewNexa, WIP buffer thresholds are configured per sequence step in each Operation Bulletin.*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Show details of OB-POLO-800", "Who are the floater operators?", "Show Master Data Overview"));
        }

        // 3. LINE BALANCING CALCULATIONS & IE ENGINE
        if (lower.contains("pitch") || lower.contains("takt") || lower.contains("balance") || lower.contains("balancing") || (lower.contains("calculate") && (lower.contains("operator") || lower.contains("polo") || lower.contains("target") || lower.contains("line")))) {
            Matcher numMatcher = Pattern.compile("(\\d+)\\s*(?:operators?|ops?|workers?|persons?)?", Pattern.CASE_INSENSITIVE).matcher(lower);
            int ops = 10;
            if (numMatcher.find()) {
                int parsed = Integer.parseInt(numMatcher.group(1));
                if (parsed > 0 && parsed <= 100) ops = parsed;
            }

            Long bulId = 2L; // Default OB-POLO-800
            String bulletinName = "OB-POLO-800 (Polo T-Shirt)";
            if (lower.contains("ts-480") || lower.contains("tshirt") || lower.contains("t-shirt") || lower.contains("crew")) {
                bulId = 1L;
                bulletinName = "OB-TS-480 (Basic Crew Neck T-Shirt)";
            } else if (lower.contains("shirt-920") || lower.contains("shirt") || lower.contains("oxford")) {
                bulId = 3L;
                bulletinName = "OB-SHIRT-920 (Formal Oxford Shirt)";
            } else if (lower.contains("jeans") || lower.contains("dnm") || lower.contains("denim")) {
                bulId = 4L;
                bulletinName = "OB-JEANS-1100 (5-Pocket Denim Jeans)";
            } else if (lower.contains("hoodie") || lower.contains("jacket")) {
                bulId = 5L;
                bulletinName = "OB-HOODIE-1250 (Fleece Zip Hoodie)";
            }

            Map<String, Object> calc = toolsService.calculateLineBalancing(bulId, ops, 120.0, 85.0);
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### ⚡ Industrial Engineering: Line Balancing Calculation for %s\n\n", bulletinName));
            sb.append(String.format("Calculations based on **%d Operators** at **85.0%% Target Line Efficiency**:\n\n", ops));
            sb.append("| Key IE Metric | Calculated Value | Formula / Benchmark |\n");
            sb.append("|---|---|---|\n");
            sb.append(String.format("| **Total Garment SMV** | `%.1f seconds` (%.2f min) | Total sequential work content |\n", calc.get("totalSmvSeconds"), calc.get("totalSmvMinutes")));
            sb.append(String.format("| **Calculated Pitch Time** | **%s seconds** | `Total SMV / %d Operators` |\n", calc.get("pitchTimeSeconds"), ops));
            sb.append(String.format("| **Takt Time (Target 120 pcs/hr)** | **30.00 seconds** | `3600 sec / 120 pcs` |\n"));
            sb.append(String.format("| **Theoretical Target (100%% Eff)** | **%d pcs / hour** | `3600 / Pitch Time` |\n", calc.get("targetPcsPerHour100Pct")));
            sb.append(String.format("| **Expected Target (85%% Eff)** | **%d pcs / hour** | `100%% Target * 0.85` |\n", calc.get("targetPcsPerHourExpected")));
            sb.append(String.format("| **8-Hour Shift Production Target** | **%d pieces** | `Expected Output * 8 Hours` |\n", calc.get("shiftTarget8Hrs")));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> bList = (List<Map<String, Object>>) calc.get("bottleneckOperations");
            if (bList != null && !bList.isEmpty()) {
                sb.append("\n#### 🚨 Identified Bottleneck Operations:\n");
                sb.append("The following operations exceed the calculated Pitch Time of **").append(calc.get("pitchTimeSeconds")).append("s** and require parallel splitting or skilled floaters:\n\n");
                for (Map<String, Object> b : bList) {
                    sb.append(String.format("- **%s (%s)**: SMV = **%.1fs** (+%ss over pitch). *Recommended: %s operator(s)*\n",
                            b.get("operation_name"), b.get("operation_code"), ((Number) b.get("smv_seconds")).doubleValue(),
                            b.get("varianceSec"), b.get("recommendedOps")));
                }
            } else {
                sb.append("\n✅ *All individual operations are within the calculated pitch time threshold. Line is smoothly balanced.*");
            }

            return new AgentResult(sb.toString(), "LINE_BALANCING_CALC", "IE_ENGINE", true, null,
                    List.of(String.format("Calculate for %d operators", ops + 2), "Show details of " + bulletinName.split(" ")[0], "Who are the floater operators?"));
        }

        // 4. OPERATION BULLETINS MASTER & ROUTING (OB-POLO-800, OB-TS-480, etc.)
        if (lower.contains("bulletin") || lower.contains("ob-") || lower.contains("routing") || lower.contains("sequence")) {
            Matcher obMatcher = Pattern.compile("ob[-_]?[a-z0-9]+[-_]?[a-z0-9]*", Pattern.CASE_INSENSITIVE).matcher(lower);
            String obCode = obMatcher.find() ? obMatcher.group(0).toUpperCase() : (lower.contains("polo") ? "OB-POLO-800" : (lower.contains("t-shirt") || lower.contains("tshirt") ? "OB-TS-480" : (lower.contains("shirt") ? "OB-SHIRT-920" : (lower.contains("jeans") ? "OB-JEANS-1100" : (lower.contains("hoodie") ? "OB-HOODIE-1250" : null)))));

            if (obCode != null) {
                Map<String, Object> bDetails = toolsService.getBulletinDetails(obCode);
                if (Boolean.TRUE.equals(bDetails.get("found"))) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> b = (Map<String, Object>) bDetails.get("bulletin");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> routing = (List<Map<String, Object>>) bDetails.get("routing");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> styles = (List<Map<String, Object>>) bDetails.get("linkedStyles");

                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("### 📋 Operation Bulletin: %s (%s)\n\n", b.get("bulletin_code"), b.get("name")));
                    sb.append(String.format("- **Total Standard SMV**: **%s sec** (%s min) | **Status**: `%s`\n",
                            bDetails.get("totalSmvSeconds"), bDetails.get("totalSmvMinutes"), b.get("status")));
                    if (styles != null && !styles.isEmpty()) {
                        sb.append(String.format("- **Linked Styles**: %s\n", styles.get(0).get("style_no") + " (" + styles.get(0).get("buyer") + ")"));
                    }
                    sb.append("\n#### ⚙️ Sequential Operation Routing & Buffer Thresholds:\n\n");
                    sb.append("| Seq | Operation Code | Operation Name | SMV (sec) | Machine Required | WIP Buffer Limit | Notes |\n");
                    sb.append("|---|---|---|---|---|---|---|\n");
                    for (Map<String, Object> l : routing) {
                        sb.append(String.format("| `#%d` | **%s** | %s | **%.1fs** | %s | 🟡 `%d pcs` | %s |\n",
                                ((Number) l.get("sequence")).intValue(), l.get("operation_code"), l.get("operation_name"),
                                ((Number) l.get("smv_seconds")).doubleValue(), l.get("machine_type"),
                                l.get("wip_threshold") != null ? ((Number) l.get("wip_threshold")).intValue() : 20,
                                l.get("notes") != null ? l.get("notes") : "Standard sequence"));
                    }
                    return new AgentResult(sb.toString(), "BULLETIN_DETAIL", "POSTGRESQL_LIVE", true, null,
                            List.of("Calculate Line Balancing for " + b.get("bulletin_code") + " with 12 operators", "Show all 5 Operation Bulletins", "Who is certified for OP-001?"));
                }
            }

            Map<String, Object> allB = toolsService.executeSafeQuery("""
                SELECT b.id, b.bulletin_code, b.name, b.version, b.status, b.total_smv,
                       ROUND(b.total_smv * 60, 1) as total_smv_sec,
                       COUNT(bl.id) as operation_count
                FROM operation_bulletins b
                LEFT JOIN bulletin_lines bl ON b.id = bl.bulletin_id
                GROUP BY b.id, b.bulletin_code, b.name, b.version, b.status, b.total_smv
                ORDER BY b.id ASC
            """);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> bRows = (List<Map<String, Object>>) allB.get("rows");

            StringBuilder sb = new StringBuilder();
            sb.append("### 📑 Operation Bulletins Library\n\n");
            sb.append("Here are the **Operation Bulletins** configured for production lines:\n\n");
            sb.append("| Bulletin Code | Bulletin Name | Operations | Total SMV | Status |\n");
            sb.append("|---|---|---|---|---|\n");
            for (Map<String, Object> r : bRows) {
                sb.append(String.format("| **%s** | %s | `%s ops` | **%s sec** (%.2f min) | `%s` |\n",
                        r.get("bulletin_code"), r.get("name"), r.get("operation_count"),
                        r.get("total_smv_sec"), ((Number) r.get("total_smv")).doubleValue(), r.get("status")));
            }

            return new AgentResult(sb.toString(), "BULLETINS_LIST", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for Operation Bulletin OB-POLO-800", "Show details of OB-TS-480", "Calculate line balancing for 12 operators"));
        }

        // 5. DIRECT OPERATOR LOOKUP & DISAMBIGUATION (Pooja Deshmukh, EMP-012, Priya, etc.)
        Matcher empCodeMatcher = Pattern.compile("emp[-_]?(\\d+)", Pattern.CASE_INSENSITIVE).matcher(lower);
        String directEmpCode = empCodeMatcher.find() ? "EMP-" + String.format("%03d", Integer.parseInt(empCodeMatcher.group(1))) : null;

        String candidateName = directEmpCode;
        if (candidateName == null && !lower.contains("operation") && !lower.contains("bulletin") && !lower.contains("machine") && !lower.contains("line") && !lower.contains("shift") && !lower.contains("order")) {
            String stripped = cleanMsg
                    .replaceAll("(?i)^(who is|tell me about|show details for|show profile of|show operator|details of|operator|worker|search for|about)\\s+", "")
                    .replaceAll("[?!.]", "").trim();
            if (stripped.length() >= 2 && !stripped.equalsIgnoreCase("operator") && !stripped.equalsIgnoreCase("floaters") && !stripped.equalsIgnoreCase("operators") && !stripped.equalsIgnoreCase("master")) {
                candidateName = stripped;
            }
        }

        if (candidateName != null) {
            List<Map<String, Object>> matchedOps = toolsService.searchOperators(candidateName, null, null);
            if (!matchedOps.isEmpty()) {
                if (matchedOps.size() == 1 || (directEmpCode != null)) {
                    String opIdOrCode = directEmpCode != null ? directEmpCode : String.valueOf(matchedOps.get(0).get("employee_id"));
                    Map<String, Object> profile = toolsService.getOperatorProfile(opIdOrCode);
                    if (Boolean.TRUE.equals(profile.get("found"))) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> op = (Map<String, Object>) profile.get("operator");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> skills = (List<Map<String, Object>>) profile.get("skills");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> attendance = (List<Map<String, Object>>) profile.get("recentAttendance");

                        StringBuilder sb = new StringBuilder();
                        sb.append(String.format("### 👤 Garment Operator Profile: %s (%s)\n\n", op.get("name"), op.get("employee_id")));
                        sb.append(String.format("- **Role**: `%s` | **Department**: `%s`\n", op.get("role"), op.get("department")));
                        sb.append(String.format("- **Age / Gender**: %s yrs / %s | **Joining Date**: %s\n", op.get("age"), op.get("gender"), op.get("joining_date")));
                        sb.append(String.format("- **Active Floor Status**: %s\n\n", Boolean.TRUE.equals(op.get("active")) ? "🟢 Active On Floor" : "⚪ Inactive"));

                        sb.append("#### 🧵 Verified Skill Matrix Ratings (1–5 scale):\n\n");
                        if (skills != null && !skills.isEmpty()) {
                            sb.append("| Op Code | Operation Name | Required Machine | Skill Rating | Standard Cycle Time |\n");
                            sb.append("|---|---|---|---|---|\n");
                            for (Map<String, Object> s : skills) {
                                int rating = ((Number) s.get("rating")).intValue();
                                String stars = "⭐".repeat(rating);
                                sb.append(String.format("| **%s** | %s | %s | **%d/5** %s | `%s sec` |\n",
                                        s.get("operation_code"), s.get("operation_name"), s.get("machine_type"), rating, stars, s.get("cycle_time_seconds")));
                            }
                        } else {
                            sb.append("*No skill matrix assessments currently recorded for this operator.*\n");
                        }

                        if (attendance != null && !attendance.isEmpty()) {
                            sb.append("\n#### 📅 Recent Floor Attendance (Last 7 Days):\n");
                            for (Map<String, Object> a : attendance) {
                                String statusBadge = "PRESENT".equals(a.get("status")) ? "🟢 Present" : ("ABSENT".equals(a.get("status")) ? "🔴 Absent" : "🟡 " + a.get("status"));
                                sb.append(String.format("- **%s**: %s (%s)\n", a.get("attendance_date"), statusBadge, a.get("shift_name") != null ? a.get("shift_name") : "General Shift"));
                            }
                        }

                        return new AgentResult(sb.toString(), "OPERATOR_PROFILE", "POSTGRESQL_LIVE", true, null,
                                List.of("List all floater operators on Line 1", "Show Master Data Overview", "Who is the top operator for Shoulder Join?"));
                    }
                } else {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("### 👥 Found %d Operators matching \"%s\"\n\n", matchedOps.size(), candidateName));
                    sb.append("Please select or ask about a specific operator below:\n\n");
                    sb.append("| EMP ID | Operator Name | Role | Department | Skills Rated | Avg Rating |\n");
                    sb.append("|---|---|---|---|---|---|\n");
                    List<String> suggestions = new ArrayList<>();
                    for (Map<String, Object> o : matchedOps) {
                        sb.append(String.format("| **%s** | **%s** | `%s` | %s | `%s ops` | ⭐ %s |\n",
                                o.get("employee_id"), o.get("name"), o.get("role"), o.get("department"),
                                o.get("rated_skills_count"), o.get("avg_skill_rating")));
                        if (suggestions.size() < 3) {
                            suggestions.add("Show details for " + o.get("name") + " (" + o.get("employee_id") + ")");
                        }
                    }
                    suggestions.add("Show Master Data Overview");
                    return new AgentResult(sb.toString(), "OPERATORS_DISAMBIGUATION", "POSTGRESQL_LIVE", true, null, suggestions);
                }
            }
        }

        // 6. WORKFORCE / OPERATORS DIRECTORY FILTER (Floaters, Supervisors, Checkers, Helpers)
        if (lower.contains("operator") || lower.contains("worker") || lower.contains("floater") || lower.contains("supervisor") || lower.contains("checker") || lower.contains("helper") || lower.contains("workforce")) {
            String roleFilter = lower.contains("floater") ? "FLOATER" :
                               (lower.contains("supervisor") ? "LINE_SUPERVISOR" :
                               (lower.contains("checker") || lower.contains("qc") ? "QUALITY_CHECKER" :
                               (lower.contains("helper") ? "HELPER" : null)));
            String deptFilter = lower.contains("line 1") || lower.contains("line-01") ? "Line 1" :
                               (lower.contains("line 2") || lower.contains("line-02") ? "Line 2" :
                               (lower.contains("line 3") || lower.contains("line-03") ? "Line 3" :
                               (lower.contains("line 4") || lower.contains("line-04") ? "Line 4" : null)));

            List<Map<String, Object>> ops = toolsService.searchOperators(null, roleFilter, deptFilter);
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 👥 Factory Workforce Directory (%d Records Found)\n\n", ops.size()));
            if (roleFilter != null) sb.append(String.format("Filtered by Role: **`%s`**", roleFilter));
            if (deptFilter != null) sb.append(String.format(" | Department: **`%s`**", deptFilter));
            if (roleFilter != null || deptFilter != null) sb.append("\n\n");

            sb.append("| EMP ID | Name | Role | Department | Rated Skills | Avg Rating |\n");
            sb.append("|---|---|---|---|---|---|\n");
            for (Map<String, Object> o : ops.subList(0, Math.min(ops.size(), 20))) {
                sb.append(String.format("| **%s** | %s | `%s` | %s | `%s ops` | ⭐ %s |\n",
                        o.get("employee_id"), o.get("name"), o.get("role"), o.get("department"),
                        o.get("rated_skills_count"), o.get("avg_skill_rating")));
            }
            if (ops.size() > 20) {
                sb.append(String.format("\n*...and %d more operators registered in the system.*\n", ops.size() - 20));
            }

            return new AgentResult(sb.toString(), "OPERATORS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for EMP-001", "Show details for Pooja Deshmukh", "What is standard SMV for Sleeve Attach?"));
        }

        // 7. SMV ANALYTICS & EXTREMES (Least SMV, Highest SMV, Shortest/Longest operations)
        boolean asksLeastSmv = lower.contains("least smv") || lower.contains("lowest smv") || lower.contains("minimum smv") || lower.contains("min smv") || lower.contains("shortest operation") || lower.contains("fastest operation") || lower.contains("smallest smv");
        boolean asksHighestSmv = lower.contains("highest smv") || lower.contains("maximum smv") || lower.contains("max smv") || lower.contains("longest operation") || lower.contains("slowest operation") || lower.contains("biggest smv") || lower.contains("most smv");
        boolean asksAvgSmv = lower.contains("average smv") || lower.contains("mean smv") || lower.contains("smv distribution");

        if (asksLeastSmv || asksHighestSmv || asksAvgSmv) {
            Map<String, Object> smvStats = toolsService.getSmvAnalytics();
            if (asksLeastSmv) {
                StringBuilder sb = new StringBuilder();
                sb.append("### ⚡ Shortest / Least SMV Sewing Operations\n\n");
                sb.append(String.format("The **least standard SMV** recorded in the factory is **%.1f seconds** (%.2f minutes):\n\n",
                        ((Number) smvStats.get("minSmvSeconds")).doubleValue(), ((Number) smvStats.get("minSmvMinutes")).doubleValue()));

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> leastOps = (List<Map<String, Object>>) smvStats.get("leastSmvOperations");
                sb.append("| Op Code | Operation Name | Machine Type | Standard SMV |\n");
                sb.append("|---|---|---|---|\n");
                for (Map<String, Object> o : leastOps) {
                    sb.append(String.format("| **%s** | **%s** | %s | **%.1fs** (%.2fm) |\n",
                            o.get("operation_code"), o.get("name"), o.get("machine_type"),
                            ((Number) o.get("smv_seconds")).doubleValue(), ((Number) o.get("standard_smv")).doubleValue()));
                }

                sb.append(String.format("\n📊 **Factory SMV Spectrum**: Min = `%.1fs` | Avg = `%ss` | Max = `%.1fs` (*OP-007 Bottom Hem*)\n",
                        ((Number) smvStats.get("minSmvSeconds")).doubleValue(), smvStats.get("avgSmvSeconds"), ((Number) smvStats.get("maxSmvSeconds")).doubleValue()));

                return new AgentResult(sb.toString(), "SMV_ANALYTICS_MIN", "POSTGRESQL_LIVE", true, null,
                        List.of("What is the highest SMV?", "What is the standard SMV for Sleeve Attach?", "Show Master Data Overview"));
            } else if (asksHighestSmv) {
                StringBuilder sb = new StringBuilder();
                sb.append("### 🚨 Longest / Highest SMV Sewing Operations (Potential Bottlenecks)\n\n");
                sb.append(String.format("The **highest standard SMV** recorded in the factory is **%.1f seconds** (%.2f minutes):\n\n",
                        ((Number) smvStats.get("maxSmvSeconds")).doubleValue(), ((Number) smvStats.get("maxSmvMinutes")).doubleValue()));

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> allSorted = (List<Map<String, Object>>) smvStats.get("allOperationsSorted");
                List<Map<String, Object>> topLongest = allSorted.subList(Math.max(0, allSorted.size() - 5), allSorted.size());
                List<Map<String, Object>> reversed = new ArrayList<>(topLongest);
                Collections.reverse(reversed);

                sb.append("| Rank | Op Code | Operation Name | Machine Type | Standard SMV | IE Action |\n");
                sb.append("|---|---|---|---|---|---|\n");
                int rank = 1;
                for (Map<String, Object> o : reversed) {
                    sb.append(String.format("| `#%d` | **%s** | **%s** | %s | **%.1fs** (%.2fm) | %s |\n",
                            rank, o.get("operation_code"), o.get("name"), o.get("machine_type"),
                            ((Number) o.get("smv_seconds")).doubleValue(), ((Number) o.get("standard_smv")).doubleValue(),
                            rank == 1 ? "🔴 Primary Bottleneck" : "🟡 High Work Content"));
                    rank++;
                }

                sb.append("\n💡 *High SMV operations exceed typical line pitch time (15–20s) and require work-sharing or parallel operators.*");

                return new AgentResult(sb.toString(), "SMV_ANALYTICS_MAX", "POSTGRESQL_LIVE", true, null,
                        List.of("What is the least SMV?", "Calculate line balancing for 12 operators", "Show Operation Bulletin OB-POLO-800"));
            } else {
                StringBuilder sb = new StringBuilder();
                sb.append("### 📊 Factory Sewing Operations SMV Distribution\n\n");
                sb.append(String.format("- **Minimum SMV**: **%.1f sec** (%.2f min)\n", smvStats.get("minSmvSeconds"), smvStats.get("minSmvMinutes")));
                sb.append(String.format("- **Average SMV**: **%s sec** (%s min)\n", smvStats.get("avgSmvSeconds"), smvStats.get("avgSmvMinutes")));
                sb.append(String.format("- **Maximum SMV**: **%.1f sec** (%.2f min)\n\n", smvStats.get("maxSmvSeconds"), smvStats.get("maxSmvMinutes")));

                return new AgentResult(sb.toString(), "SMV_ANALYTICS_AVG", "POSTGRESQL_LIVE", true, null,
                        List.of("What is the least SMV?", "What is the highest SMV?", "List all 18 sewing operations"));
            }
        }

        // 8. DIRECT OPERATION & SMV LOOKUP (Sleeve Attach, Collar Make, OP-004, etc.)
        Matcher opCodeMatcher = Pattern.compile("op[-_]?(\\d+)", Pattern.CASE_INSENSITIVE).matcher(lower);
        String directOpCode = opCodeMatcher.find() ? "OP-" + String.format("%03d", Integer.parseInt(opCodeMatcher.group(1))) : null;

        String candidateOp = directOpCode;
        if (candidateOp == null) {
            String stripped = cleanMsg
                    .replaceAll("(?i)^(what is the standard smv for|what is the smv for|standard smv for|smv for|what is|tell me about|operation|sewing operation|details of|smv of)\\s+", "")
                    .replaceAll("[?!.]", "").trim();
            if (stripped.length() >= 3 && !stripped.equalsIgnoreCase("operation") && !stripped.equalsIgnoreCase("operations") && !stripped.equalsIgnoreCase("smv")) {
                candidateOp = stripped;
            }
        }

        if (candidateOp != null) {
            List<Map<String, Object>> matchedOpers = toolsService.searchOperations(candidateOp, null);
            if (!matchedOpers.isEmpty()) {
                if (matchedOpers.size() == 1 || directOpCode != null) {
                    String opCodeOrName = directOpCode != null ? directOpCode : String.valueOf(matchedOpers.get(0).get("operation_code"));
                    Map<String, Object> opDetails = toolsService.getOperationDetails(opCodeOrName);
                    if (Boolean.TRUE.equals(opDetails.get("found"))) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> op = (Map<String, Object>) opDetails.get("operation");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> certifiedOps = (List<Map<String, Object>>) opDetails.get("certifiedOperators");

                        StringBuilder sb = new StringBuilder();
                        sb.append(String.format("### ✂️ Operation Details: %s (%s)\n\n", op.get("name"), op.get("operation_code")));
                        sb.append(String.format("- **Standard SMV**: **%.1f seconds** (%.2f minutes)\n", opDetails.get("smvSeconds"), opDetails.get("smvMinutes")));
                        sb.append(String.format("- **Machine Required**: `%s`\n", op.get("machine_type")));
                        sb.append(String.format("- **Active Status**: %s\n\n", Boolean.TRUE.equals(op.get("active")) ? "🟢 Active Master Record" : "⚪ Inactive"));

                        sb.append("#### 🏆 Top Certified Operators for this Operation:\n\n");
                        if (certifiedOps != null && !certifiedOps.isEmpty()) {
                            sb.append("| EMP ID | Operator Name | Role | Department | Skill Rating | Cycle Time |\n");
                            sb.append("|---|---|---|---|---|---|\n");
                            for (Map<String, Object> co : certifiedOps) {
                                int rating = ((Number) co.get("rating")).intValue();
                                String stars = "⭐".repeat(rating);
                                sb.append(String.format("| **%s** | %s | `%s` | %s | **%d/5** %s | `%s sec` |\n",
                                        co.get("employee_id"), co.get("name"), co.get("role"), co.get("department"), rating, stars, co.get("cycle_time_seconds")));
                            }
                        } else {
                            sb.append("*No operators currently assessed for this operation.*\n");
                        }

                        return new AgentResult(sb.toString(), "OPERATION_DETAIL", "POSTGRESQL_LIVE", true, null,
                                List.of("Show Operation Bulletin OB-POLO-800", "List all 18 sewing operations", "Calculate Line Balancing for 12 operators"));
                    }
                } else {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("### ✂️ Found %d Sewing Operations matching \"%s\"\n\n", matchedOpers.size(), candidateOp));
                    sb.append("| Op Code | Operation Name | Machine Type | Standard SMV | Certified Operators |\n");
                    sb.append("|---|---|---|---|---|\n");
                    for (Map<String, Object> o : matchedOpers) {
                        double smv = o.get("standard_smv") != null ? ((Number) o.get("standard_smv")).doubleValue() : 0.5;
                        double sec = o.get("smv_seconds") != null ? ((Number) o.get("smv_seconds")).doubleValue() : (smv * 60.0);
                        sb.append(String.format("| **%s** | **%s** | %s | **%.1fs** (%.2fm) | `%s operators` |\n",
                                o.get("operation_code"), o.get("name"), o.get("machine_type"), sec, smv,
                                o.get("certified_operators_count")));
                    }
                    List<String> suggestions = new ArrayList<>();
                    for (Map<String, Object> o : matchedOpers.subList(0, Math.min(matchedOpers.size(), 3))) {
                        suggestions.add("Show details for " + o.get("operation_code") + " (" + o.get("name") + ")");
                    }
                    suggestions.add("Show Master Data Overview");
                    return new AgentResult(sb.toString(), "OPERATIONS_DISAMBIGUATION", "POSTGRESQL_LIVE", true, null, suggestions);
                }
            }
        }

        // 8. GENERAL SEWING OPERATIONS MASTER & SMVs
        if (lower.contains("operation") || lower.contains("smv") || lower.contains("sewing operation") || lower.contains("section")) {
            List<Map<String, Object>> opList = toolsService.searchOperations(null, null);
            StringBuilder sb = new StringBuilder();
            sb.append("### ✂️ Sewing Operations Master & Standard SMVs\n\n");
            sb.append("The system features **18 Industrial Sewing Operations** with verified standard SMVs:\n\n");
            sb.append("| Op Code | Operation Name | Machine Type | Standard SMV | Certified Operators |\n");
            sb.append("|---|---|---|---|---|\n");
            for (Map<String, Object> o : opList) {
                double smv = o.get("standard_smv") != null ? ((Number) o.get("standard_smv")).doubleValue() : 0.5;
                double sec = o.get("smv_seconds") != null ? ((Number) o.get("smv_seconds")).doubleValue() : (smv * 60.0);
                sb.append(String.format("| **%s** | %s | %s | **%.1fs** (%.2fm) | `%s operators` |\n",
                        o.get("operation_code"), o.get("name"), o.get("machine_type"), sec, smv,
                        o.get("certified_operators_count")));
            }

            return new AgentResult(sb.toString(), "OPERATIONS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("What is standard SMV for Sleeve Attach?", "Show details of OB-POLO-800", "Calculate Line Balancing for 10 operators"));
        }

        // 9. GARMENT STYLES & BUYER BRANDS (Nike, Zara, Uniqlo, Levi's, etc.)
        if (lower.contains("style") || lower.contains("buyer") || lower.contains("brand") || lower.contains("nike") || lower.contains("zara") || lower.contains("uniqlo") || lower.contains("levi") || lower.contains("sty-")) {
            String buyerFilter = lower.contains("nike") ? "Nike" : (lower.contains("zara") ? "Zara" : (lower.contains("uniqlo") ? "Uniqlo" : (lower.contains("levi") ? "Levi's" : null)));
            List<Map<String, Object>> styles = toolsService.searchStyles(buyerFilter != null ? null : cleanMsg, buyerFilter);
            if (styles.isEmpty()) {
                styles = toolsService.searchStyles(null, null);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 👕 Garment Styles Master Catalog (%d Styles Found)\n\n", styles.size()));
            sb.append("| Style No | Buyer / Brand | Category | Season | Bulletins | Orders | Status |\n");
            sb.append("|---|---|---|---|---|---|---|\n");
            for (Map<String, Object> r : styles) {
                sb.append(String.format("| **%s** | %s | %s | %s | `%s bulletin(s)` | `%s order(s)` | %s |\n",
                        r.get("style_no"), r.get("buyer"), r.get("product_type"), r.get("season"),
                        r.get("linked_bulletins"), r.get("active_orders"),
                        Boolean.TRUE.equals(r.get("active")) ? "🟢 Active" : "⚪ Inactive"));
            }

            return new AgentResult(sb.toString(), "STYLES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Operation Bulletins for Nike Polo", "List all production orders", "Master Data Overview"));
        }

        // 10. SEWING LINES MASTER (LINE-01 to LINE-06, Line 1, Line 4, etc.)
        if (lower.contains("line") || lower.contains("sewing line") || lower.contains("workstation") || lower.contains("bay") || lower.contains("hanger") || lower.contains("feeder")) {
            Matcher lineMatcher = Pattern.compile("(?:line[-_ ]?0?([1-6]))", Pattern.CASE_INSENSITIVE).matcher(lower);
            String lineTarget = lineMatcher.find() ? "LINE-0" + lineMatcher.group(1) : (lower.contains("line") && !lower.contains("lines") ? cleanMsg : null);

            List<Map<String, Object>> lines = toolsService.searchSewingLines(lineTarget);
            if (lines.isEmpty()) {
                lines = toolsService.searchSewingLines(null);
            }

            if (lines.size() == 1) {
                Map<String, Object> l = lines.get(0);
                StringBuilder sb = new StringBuilder();
                sb.append(String.format("### 🏭 Sewing Line Profile: %s (%s)\n\n", l.get("line_name"), l.get("line_code")));
                sb.append(String.format("- **Line Type**: `%s` | **Operational Status**: `%s`\n", l.get("line_type"), l.get("operational_status")));
                sb.append(String.format("- **Floor / Bay**: %s | **Department**: %s\n", l.get("floor"), l.get("department")));
                sb.append(String.format("- **Line Supervisor**: **%s** | **IE In-Charge**: **%s** | **QC Inspector**: **%s**\n", l.get("supervisor_name"), l.get("ie_in_charge"), l.get("qc_inspector")));
                sb.append(String.format("- **Workstations & Staffing**: `%s Workstations`, `%s Operators`, `%s Helpers`, `%s Dedicated Machines`\n",
                        l.get("workstation_count"), l.get("operator_count"), l.get("helper_count"), l.get("machine_count")));
                sb.append(String.format("- **Daily Capacity**: **%s pcs / 8-hr day** | **Target Efficiency**: **%s%%**\n", l.get("capacity_per_day"), l.get("target_efficiency_percent")));
                sb.append(String.format("- **Current Running Style**: `%s` (Bulletin: `%s`)\n", l.get("current_style"), l.get("current_bulletin")));

                return new AgentResult(sb.toString(), "LINE_DETAIL", "POSTGRESQL_LIVE", true, null,
                        List.of("Show all 6 sewing lines", "List all floater operators on Line 1", "Show Master Data Overview"));
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 🏭 Factory Sewing Lines Master (%d Lines Configured)\n\n", lines.size()));
            sb.append("| Line Code | Line Name | Line Type | Floor Location | Supervisor | Stations | Capacity/Day | Target Eff |\n");
            sb.append("|---|---|---|---|---|---|---|---|\n");
            for (Map<String, Object> l : lines) {
                sb.append(String.format("| **%s** | %s | `%s` | %s | %s | `%s stns` | **%s pcs** | %s%% |\n",
                        l.get("line_code"), l.get("line_name"), l.get("line_type"), l.get("floor"),
                        l.get("supervisor_name"), l.get("workstation_count"), l.get("capacity_per_day"), l.get("target_efficiency_percent")));
            }

            return new AgentResult(sb.toString(), "LINES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for Line 1", "Show details for Line 4", "Who is the supervisor for Line 2?"));
        }

        // 11. MACHINES INVENTORY MASTER (Juki, Brother, Jack, Pegasus, Siruba, Yamato, SNLS, Overlock)
        if (lower.contains("machine") || lower.contains("snls") || lower.contains("overlock") || lower.contains("flatlock") || lower.contains("button") || lower.contains("bartack") || lower.contains("feed off") || lower.contains("juki") || lower.contains("brother") || lower.contains("jack") || lower.contains("pegasus") || lower.contains("siruba") || lower.contains("yamato") || lower.contains("sn-001")) {
            List<Map<String, Object>> machines = toolsService.searchMachines(cleanMsg, null, null);
            if (machines.isEmpty()) {
                machines = toolsService.searchMachines(null, null, null);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 🧵 Machines Inventory Master (%d Machines Found)\n\n", machines.size()));
            sb.append("| Machine Code | Machine Type | Brand | Model | Assigned Line | Status |\n");
            sb.append("|---|---|---|---|---|---|\n");
            for (Map<String, Object> m : machines) {
                String statusBadge = "AVAILABLE".equals(m.get("status")) ? "🟢 Available" : ("IN_USE".equals(m.get("status")) ? "🔵 In Use" : "🟡 Under Maintenance");
                sb.append(String.format("| **%s** | %s | **%s** | %s | %s | %s |\n",
                        m.get("machine_code"), m.get("machine_type"), m.get("brand"), m.get("model"),
                        m.get("line_code") != null ? m.get("line_code") : "Unassigned Pool", statusBadge));
            }

            return new AgentResult(sb.toString(), "MACHINES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Master Data Overview", "List all 6 sewing lines", "Show Operation Bulletins"));
        }

        // 12. PRODUCTION ORDERS & PURCHASE ORDERS (PO-2026-001, etc.)
        if (lower.contains("order") || lower.contains("po-") || lower.contains("purchase order") || lower.contains("delivery") || lower.contains("quantity")) {
            List<Map<String, Object>> orders = toolsService.searchOrders(cleanMsg, null, null);
            if (orders.isEmpty()) {
                orders = toolsService.searchOrders(null, null, null);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 📦 Production Orders Master (%d Orders Found)\n\n", orders.size()));
            sb.append("| Order PO # | Buyer | Style No | Product Type | Color | Total Quantity | Delivery Date | Status |\n");
            sb.append("|---|---|---|---|---|---|---|---|\n");
            for (Map<String, Object> o : orders) {
                String statusBadge = "IN_PRODUCTION".equals(o.get("status")) ? "🔵 In Production" : ("COMPLETED".equals(o.get("status")) ? "🟢 Completed" : "⚪ Planned");
                sb.append(String.format("| **%s** | %s | **%s** | %s | %s | **%,d pcs** | %s | %s |\n",
                        o.get("order_no"), o.get("buyer"), o.get("style_no"), o.get("product_type"),
                        o.get("color"), ((Number) o.get("total_quantity")).intValue(), o.get("delivery_date"), statusBadge));
            }

            return new AgentResult(sb.toString(), "ORDERS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Operation Bulletins for Nike Polo", "Calculate Line Balancing for 12 operators", "Master Data Overview"));
        }

        // 13. WORKING SHIFTS MASTER
        if (lower.contains("shift") || lower.contains("timing") || lower.contains("break") || lower.contains("lunch")) {
            List<Map<String, Object>> shifts = toolsService.searchShifts(null);
            StringBuilder sb = new StringBuilder();
            sb.append("### ⏰ Working Shifts Master Schedule\n\n");
            sb.append("| Shift Code | Shift Name | Timings | Scheduled Breaks | Status |\n");
            sb.append("|---|---|---|---|---|\n");
            for (Map<String, Object> s : shifts) {
                sb.append(String.format("| **%s** | %s | `%s – %s` | ☕ **%s mins** (Lunch/Tea) | %s |\n",
                        s.get("shift_code"), s.get("shift_name"), s.get("start_time"), s.get("end_time"),
                        s.get("break_duration_minutes"),
                        Boolean.TRUE.equals(s.get("active")) ? "🟢 Active" : "⚪ Inactive"));
            }

            return new AgentResult(sb.toString(), "SHIFTS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Master Data Overview", "List all floater operators on Line 1", "Show details for Line 1"));
        }

        // 14. UNIVERSAL MULTI-TABLE KEYWORD GROUNDING FALLBACK
        Map<String, Object> multiMatches = toolsService.searchAllTables(cleanMsg);
        if (!multiMatches.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 🔍 Live Database Search Results for \"%s\"\n\n", cleanMsg));

            if (multiMatches.containsKey("operators")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> ops = (List<Map<String, Object>>) multiMatches.get("operators");
                sb.append(String.format("#### 👥 Matching Operators (%d found):\n", ops.size()));
                for (Map<String, Object> o : ops.subList(0, Math.min(ops.size(), 5))) {
                    sb.append(String.format("- **%s** (`%s`): %s in %s (⭐ %s avg rating)\n",
                            o.get("name"), o.get("employee_id"), o.get("role"), o.get("department"), o.get("avg_skill_rating")));
                }
                sb.append("\n");
            }

            if (multiMatches.containsKey("operations")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> opers = (List<Map<String, Object>>) multiMatches.get("operations");
                sb.append(String.format("#### ✂️ Matching Sewing Operations (%d found):\n", opers.size()));
                for (Map<String, Object> o : opers.subList(0, Math.min(opers.size(), 5))) {
                    sb.append(String.format("- **%s** (`%s`): SMV = **%.1fs** (%s)\n",
                            o.get("name"), o.get("operation_code"), ((Number) o.get("smv_seconds")).doubleValue(), o.get("machine_type")));
                }
                sb.append("\n");
            }

            if (multiMatches.containsKey("styles")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> styles = (List<Map<String, Object>>) multiMatches.get("styles");
                sb.append(String.format("#### 👕 Matching Garment Styles (%d found):\n", styles.size()));
                for (Map<String, Object> s : styles.subList(0, Math.min(styles.size(), 5))) {
                    sb.append(String.format("- **%s** (%s - %s): %s\n",
                            s.get("style_no"), s.get("buyer"), s.get("product_type"), s.get("season")));
                }
                sb.append("\n");
            }

            if (multiMatches.containsKey("lines")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> lines = (List<Map<String, Object>>) multiMatches.get("lines");
                sb.append(String.format("#### 🏭 Matching Sewing Lines (%d found):\n", lines.size()));
                for (Map<String, Object> l : lines.subList(0, Math.min(lines.size(), 5))) {
                    sb.append(String.format("- **%s** (%s): Supervisor %s, %s workstations, Capacity %s pcs/day\n",
                            l.get("line_name"), l.get("line_code"), l.get("supervisor_name"), l.get("workstation_count"), l.get("capacity_per_day")));
                }
                sb.append("\n");
            }

            if (multiMatches.containsKey("machines")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> machs = (List<Map<String, Object>>) multiMatches.get("machines");
                sb.append(String.format("#### 🧵 Matching Machines (%d found):\n", machs.size()));
                for (Map<String, Object> m : machs.subList(0, Math.min(machs.size(), 5))) {
                    sb.append(String.format("- **%s** (`%s`): %s %s (%s)\n",
                            m.get("machine_type"), m.get("machine_code"), m.get("brand"), m.get("model"), m.get("status")));
                }
                sb.append("\n");
            }

            if (multiMatches.containsKey("orders")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> ords = (List<Map<String, Object>>) multiMatches.get("orders");
                sb.append(String.format("#### 📦 Matching Orders (%d found):\n", ords.size()));
                for (Map<String, Object> o : ords.subList(0, Math.min(ords.size(), 5))) {
                    sb.append(String.format("- **%s** (%s): %s - %,d pcs (%s)\n",
                            o.get("order_no"), o.get("buyer"), o.get("style_no"), ((Number) o.get("total_quantity")).intValue(), o.get("status")));
                }
                sb.append("\n");
            }

            return new AgentResult(sb.toString(), "MULTI_SEARCH", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Master Data Overview", "List all 8 garment styles", "Show all 5 Operation Bulletins", "Calculate line balancing for 12 operators"));
        }

        // 15. DEFAULT GREETING / INSTRUCTION CARD
        return new AgentResult(
                String.format("""
                ### 🏭 SewNexa Manufacturing AI Assistant
                
                I am grounded in the complete live factory database with real-time access to:
                - **50 Garment Operators** (Pooja Deshmukh, Priya Sharma, Rajesh Kumar, floater operators, with verified 1–5 Skill Matrix ratings)
                - **18 Standard Sewing Operations** & Machine Types with SMVs
                - **8 Garment Styles** (Nike, Zara, Uniqlo, Levi's, etc.)
                - **6 Sewing Lines** (Modular U-Shape, UPS Hanger, Hybrid Lean, Feeder Cells)
                - **14 Sewing Machines** (Juki, Brother, Jack, Pegasus, Siruba, Yamato)
                - **5 Operation Bulletins** with WIP queue buffer limits
                - **Production Orders, Working Shifts, and Hourly Output Records**
                
                **Try asking:**
                - *"Show details for Pooja Deshmukh"*
                - *"List all floater operators on Line 1"*
                - *"What is the standard SMV for Sleeve Attach?"*
                - *"Show details for Operation Bulletin OB-POLO-800"*
                - *"Calculate line balancing for 12 operators"*
                """),
                "GENERAL_ASSIST", "SYSTEM_GROUNDED", true, null,
                List.of("Show details for Pooja Deshmukh", "What is standard SMV for Sleeve Attach?", "Show Master Data Overview", "Calculate line balancing for 12 operators")
        );
    }

    private List<String> generateDynamicSuggestedQuestions(String userMessage) {
        String lower = userMessage.toLowerCase();
        if (lower.contains("operator") || lower.contains("worker") || lower.contains("pooja") || lower.contains("priya")) {
            return List.of("Show details for Pooja Deshmukh", "Show floater operators on Line 1", "Master Data Overview");
        } else if (lower.contains("bulletin") || lower.contains("ob-")) {
            return List.of("Calculate line balancing for this bulletin", "Show WIP queue buffer limits", "List all 5 Operation Bulletins");
        } else if (lower.contains("style") || lower.contains("buyer")) {
            return List.of("Show Operation Bulletins for Nike Polo", "List all production orders", "Master Data Overview");
        }
        return List.of("Show Master Data Overview", "List all 8 garment styles", "Calculate line balancing for 10 operators", "Show all 5 Operation Bulletins");
    }
}
