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

        // 1. HELP & SLASH COMMANDS MENU
        if (lower.equals("/help") || lower.equals("help") || lower.contains("what can you do") ||
            lower.contains("commands") || lower.contains("what questions can i ask") || lower.contains("how can you help")) {
            return new AgentResult("""
                ### 💡 SewNexa Enterprise AI Assistant Commands & Quick Guide
                
                I am your intelligent Industrial Engineering Copilot for garment factory line balancing and production floor management.
                
                #### 🚀 Quick Slash Commands:
                - **/guide**: Complete walkthrough of the SewNexa platform and end-to-end workflow
                - **/balance**: How to balance a line, formulas, and step-by-step optimization
                - **/operators**: How to add operators, manage roles, and review the workforce
                - **/skill**: 1–5 Star Skill Matrix grading criteria, assessment logs, and matrix views
                - **/bulletins**: Operation Bulletins, sequential SMVs, and WIP queue buffer limits
                - **/styles**: Garment styles catalog and purchase orders (PO) management
                - **/lines**: Factory sewing lines, daily capacities, and workstation setups
                - **/dashboard**: Overall Plant, Bay, and Line-level performance dashboards
                - **/immediate**: Real-time floater allocation and bottleneck intervention alerts
                - **/monitoring**: Live hourly production tracking and variance boards
                
                #### 🧭 Instant Module Navigation:
                - [Open Line Balancing](/line-balance)
                - [View Overall Dashboard](/overall-dashboard)
                - [Manage Operators Master](/settings/operators)
                - [Check 1–5 Skill Matrix](/skill-matrix)
                - [Operation Bulletins](/operation-bulletins)
                - [Capacity Planning](/capacity-planning)
                - [Immediate Floater Actions](/immediate-actions)
                - [Hourly Production Monitoring](/production-monitoring)
                """, "HELP_MENU", "APPLICATION_GUIDE", true, null,
                List.of("How does this application work?", "How do I balance a line?", "Show Master Data Overview", "Calculate line balancing for 10 operators"));
        }

        // 2. END-TO-END APPLICATION WORKFLOW & PLATFORM ARCHITECTURE GUIDE
        if (lower.equals("/guide") || lower.contains("how does this app") || lower.contains("how does the app") ||
            lower.contains("how does this application") || lower.contains("how to use this app") ||
            lower.contains("how to use sewnexa") || lower.contains("what is sewnexa") ||
            lower.contains("application overview") || lower.contains("system features") ||
            lower.contains("getting started") || lower.contains("features of sewnexa") ||
            lower.contains("walkthrough") || lower.contains("system workflow") || lower.contains("modules")) {
            return new AgentResult("""
                ### 🏭 SewNexa Platform: End-to-End Factory Workflow & Architecture
                
                SewNexa is a full-lifecycle Industrial Engineering & Line Balancing operating system designed specifically for apparel and garment factories.
                
                #### 🔄 The 6 Core Operational Phases:
                
                1. **Master Data Configuration (`/settings`)**
                   - Set up factory foundations: [Shifts](/settings/shifts), [Sewing Lines](/settings/lines), [Machine Inventory](/settings/machines), [Operators](/settings/operators), [Operations](/settings/operations), [Styles](/settings/styles), and [Sizes](/settings/sizes).
                
                2. **Engineering & Routing Specifications**
                   - Define [Operation Bulletins](/operation-bulletins) with sequential sewing operations, standard SMVs (seconds/minutes), machine types, and WIP buffer thresholds (15–25 pcs).
                   - Track customer [Production Orders](/orders) with delivery dates and style allocations.
                
                3. **Capacity Planning & Line Design**
                   - Plan factory capacity in [Capacity Planning](/capacity-planning) by balancing required SAM against plant working hours.
                   - Design conveyor and workstation layouts in [Line Design](/line-design).
                
                4. **Line Balancing & Bottleneck Optimization**
                   - Run [Line Balancing](/line-balance) in **Fixed Delivery Date** or **Fixed Shift Target** mode.
                   - Calculate **Pitch Time** and **Takt Time**, identify bottleneck operations, and assign parallel stations.
                
                5. **Workforce Allocation & Skill Matrix**
                   - Assess operators with verified 1–5 Star ratings in the [Skill Matrix](/skill-matrix).
                   - Place qualified operators onto line workstations in [Operator Placement](/operator-placement).
                   - Manage daily check-ins on [Attendance](/attendance) and floor rosters in [Shift Assignment](/shift-assignment).
                
                6. **Live Execution, Bottleneck Alerts & Dashboards**
                   - Intervene during WIP overflow by deploying floaters in [Immediate Actions](/immediate-actions).
                   - Log hourly piece counts and variance in [Production Monitoring](/production-monitoring).
                   - Monitor plant-wide KPIs on the [Overall Dashboard](/overall-dashboard) and [Line Dashboard](/line-dashboard).
                
                💡 *Click any module link above to navigate directly to that screen!*
                """, "APP_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("How do I balance a line?", "How do I add an operator?", "How does the Skill Matrix work?", "Show Master Data Overview"));
        }

        // 3. HOW TO BALANCE A LINE / LINE BALANCING PROCEDURE
        if (lower.equals("/balance") || lower.contains("how to balance a line") || lower.contains("how do i balance a line") ||
            lower.contains("how to use line balancing") || lower.contains("line balancing guide") ||
            lower.contains("steps to balance a line") || lower.contains("how does line balancing work") ||
            lower.contains("balance a line in this app")) {
            return new AgentResult("""
                ### ⚡ Step-by-Step Guide: How to Balance a Sewing Line in SewNexa
                
                Line Balancing distributes sequential sewing operations across workstations so work flows continuously without bottleneck pileups or operator starvation.
                
                #### 📋 Procedure in SewNexa:
                
                1. **Navigate to Line Balancing**: Open [Line Balancing Engine](/line-balance).
                
                2. **Select Your Balancing Mode**:
                   - **Fixed Delivery Date Mode**: Calculates required line speed (Takt Time) to hit a committed customer order deadline.
                   - **Fixed Shift Target Mode**: Optimizes for a constant target output per 8-hour shift (e.g., 1,000 pieces).
                
                3. **Select Style & Operation Bulletin**:
                   - Pick your running garment style (e.g., *STY-CREW-101* or *STY-POLO-201*). The system loads the complete sequential operation list and standard SMVs from [Operation Bulletins](/operation-bulletins).
                
                4. **Specify Manpower & Line Efficiency**:
                   - Input the number of available operators (e.g., **10 to 14 operators**).
                   - Set Target Line Efficiency % (standard industry baseline is **80% to 85%**).
                
                5. **Analyze Key Calculations**:
                   - **Pitch Time**: $\\text{Pitch Time} = \\frac{\\text{Total Bulletin SMV}}{\\text{Allocated Operators}}$ (target seconds per workstation).
                   - **Takt Time**: Customer demand rate based on available shift working seconds.
                   - **Balancing %**: Work content distribution efficiency score.
                
                6. **Resolve Bottleneck Operations**:
                   - Any operation where $\\text{Operation SMV} > \\text{Pitch Time}$ is flagged as a **Bottleneck** (🔴).
                   - *Actions*: Split operation across 2 parallel stations, pair with a helper, or assign a 5-Star Master Operator.
                
                7. **Deploy Operators**:
                   - Click [Operator Placement](/operator-placement) to assign specific operators from the [Skill Matrix](/skill-matrix) to line seats.
                
                💡 *Try asking: \"Calculate line balancing for 10 operators\" or \"Show details of OB-POLO-800\".*
                """, "LINE_BALANCE_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Calculate line balancing for 10 operators", "What is Pitch Time?", "Show details of OB-POLO-800", "Who are the floater operators?"));
        }

        // 4. HOW TO ADD & MANAGE OPERATORS
        if (lower.equals("/operators") || lower.contains("how to add operator") || lower.contains("how do i add an operator") ||
            lower.contains("how to create operator") || lower.contains("how to manage operator") ||
            lower.contains("add new operator") || lower.contains("add new worker") || lower.contains("how to add a worker")) {
            return new AgentResult("""
                ### 👥 Guide: Adding & Managing Operators in SewNexa
                
                Operators represent your sewing workforce. Their profiles store employee records, department assignments, and verified skill matrix assessments.
                
                #### 📝 Steps to Add an Operator:
                
                1. **Go to Operators Master**: Navigate to [Operators Master](/settings/operators).
                2. **Click "+ Add Operator"**: Click the primary action button located at the top right of the directory.
                3. **Fill in Operator Details**:
                   - **Employee ID**: Unique identifier (e.g., `EMP-051`).
                   - **Full Name**: Operator's complete legal name.
                   - **Role Selection**:
                     - `OPERATOR`: Dedicated workstation sewing operator.
                     - `FLOATER`: High-skill, multi-operation worker deployed to absorb bottleneck buffers.
                     - `QUALITY_CHECKER`: End-of-line or in-line inspection.
                     - `LINE_SUPERVISOR`: In-charge of line pacing and attendance.
                     - `HELPER`: Bundling, trimming, and material handling.
                   - **Department**: Assign to Line (e.g., *Sewing Line 1*, *Sewing Line 2*).
                   - **Gender & Age**: Demographics for factory ergonomics and reporting.
                4. **Save Profile**: Click **Save**. The operator is immediately available across floor rosters.
                5. **Rate Skills**: Navigate to [Skill Matrix](/skill-matrix) to assess and assign 1–5 Star proficiency ratings for this operator across operations.
                
                💡 *Direct link: [Open Operators Master](/settings/operators)*
                """, "OPERATOR_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Who are the floater operators?", "How do I use the Skill Matrix?", "Show Master Data Overview", "Who is Pooja Deshmukh?"));
        }

        // 5. SKILL MATRIX & GRADING GUIDE
        if (lower.equals("/skill") || (lower.contains("skill matrix") &&
            (lower.contains("how") || lower.contains("what is") || lower.contains("guide") ||
             lower.contains("explain") || lower.contains("use") || lower.contains("rate") || lower.contains("grading")))) {
            return new AgentResult("""
                ### ⭐ SewNexa 1–5 Star Skill Matrix Guide & Evaluation Standard
                
                The **Skill Matrix** is a multi-skill competency grid evaluating operator speed, quality, and cycle times against standard SMVs across all factory operations.
                
                #### 🌟 The 5-Star Skill Proficiency Hierarchy:
                
                | Grade | Level | Speed / Cycle Time | Quality & Autonomy | Industrial Engineering Action |
                |---|---|---|---|---|
                | ⭐ | **1 - Novice** | Cycle time > 150% SMV | Requires continuous supervision | Suitable for training line or helper tasks |
                | ⭐⭐ | **2 - Basic** | Cycle time 120–150% SMV | Works independently with basic defect checks | Assigned to simple single-needle joins |
                | ⭐⭐⭐ | **3 - Standard** | Cycle time = 100% SMV | Meets standard benchmark with consistent quality | Assigned to core line workstations |
                | ⭐⭐⭐⭐ | **4 - Advanced** | Cycle time 80–90% SMV | Exceeds target pace (110–125% efficiency) | Assigned to critical quality points |
                | ⭐⭐⭐⭐⭐ | **5 - Master** | Cycle time < 80% SMV | Zero defect rate; can train other workers | **Designated Floater / Bottleneck Absorber** |
                
                #### 🛠️ How to Record Skill Ratings in the App:
                1. Open the [Skill Matrix](/skill-matrix) screen.
                2. Select your target **Line** and **Operation**.
                3. Click an operator's cell to update their star grade (1 to 5) and measured cycle time in seconds.
                4. View the historical grade audit trail anytime on [Skill Matrix Logs](/skill-matrix/logs).
                
                💡 *Direct link: [Open Skill Matrix](/skill-matrix)*
                """, "SKILL_MATRIX_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Who is the highest rated operator for OP-001?", "Who are the floater operators?", "Show certified operators for Bottom Hem", "Master Data Overview"));
        }

        // 6. OPERATION BULLETINS & ROUTING GUIDE
        if (lower.equals("/bulletin") || lower.equals("/bulletins") ||
            ((lower.contains("bulletin") || lower.contains("operation bulletin")) &&
             (lower.contains("how") || lower.contains("what is") || lower.contains("create") ||
              lower.contains("import") || lower.contains("guide") || lower.contains("setup") || lower.contains("routing")))) {
            return new AgentResult("""
                ### 📋 Operation Bulletins (OB) & Sequential Routing Guide
                
                An **Operation Bulletin (OB)** is the master industrial engineering blueprint specifying the complete sequence of operations required to construct a garment style.
                
                #### 🧵 Key Components of a Bulletin:
                1. **Sequential Operation Routing**: Step-by-step assembly order (e.g., *Collar Make → Shoulder Join → Sleeve Attach → Side Seam → Bottom Hem*).
                2. **Standard Minute Value (SMV / SAM)**: Standard benchmark time in seconds and minutes for each operation.
                3. **Machine Class Specification**: Identifies the required machinery (e.g., *SNLS, 4-Thread Overlock, Flatlock, Bartack*).
                4. **WIP Buffer Threshold (Queue Limit)**: Maximum allowed bundled pieces between consecutive workstations (typically **15 to 25 pcs**).
                5. **Total Garment SMV**: Sum of all operations; used as the numerator for Pitch Time calculation.
                
                #### 🛠️ Managing Bulletins in SewNexa:
                - Navigate to [Operation Bulletins](/operation-bulletins) to review existing bulletins (*OB-POLO-800*, *OB-CREW-101*, *OB-SHIRT-920*).
                - Use each bulletin directly in the [Line Balancing Engine](/line-balance) to simulate pitch times and bottleneck splits.
                
                💡 *Direct link: [Open Operation Bulletins](/operation-bulletins)*
                """, "BULLETIN_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Show details of OB-POLO-800", "List all 5 Operation Bulletins", "What are the WIP buffer thresholds for Polo?", "Calculate line balancing for 10 operators"));
        }

        // 7. GARMENT STYLES & ORDERS GUIDE
        if (lower.equals("/styles") || lower.equals("/orders") ||
            ((lower.contains("style") || lower.contains("order") || lower.contains("po")) &&
             (lower.contains("how to create") || lower.contains("how to add") || lower.contains("how do i create") ||
              lower.contains("how do i add") || lower.contains("order guide") || lower.contains("styles guide")))) {
            return new AgentResult("""
                ### 👕 Garment Styles & Purchase Orders Management Guide
                
                In SewNexa, **Garment Styles** define the design specifications and brand buyers, while **Production Orders** represent live purchase orders (POs) committed for manufacturing.
                
                #### 👔 Managing Garment Styles:
                1. Navigate to [Garment Styles](/settings/styles).
                2. Add new styles by specifying **Style Number**, **Buyer / Brand** (e.g., *Nike, Tommy Hilfiger, Zara, Uniqlo*), **Product Category** (Polo, Crewneck, Shirt, Denim), and **Season**.
                3. Link each Style to its corresponding [Operation Bulletin](/operation-bulletins) and size breakdown on [Garment Sizes](/settings/sizes).
                
                #### 📦 Managing Production Orders:
                1. Navigate to [Production Orders](/orders).
                2. Create or view orders with PO Number, Buyer, Style No, Total Order Quantity, Color, and Target Delivery Date.
                3. The order delivery date directly feeds the **Fixed Delivery Date** calculation in [Line Balancing](/line-balance) to compute required daily Takt Time.
                
                💡 *Direct links: [Styles Master](/settings/styles) · [Production Orders](/orders)*
                """, "STYLES_ORDERS_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("List all 8 garment styles and buyers", "Show production orders", "Show Operation Bulletins", "Master Data Overview"));
        }

        // 8. DASHBOARDS GUIDE
        if (lower.equals("/dashboard") || lower.equals("/dashboards") ||
            (lower.contains("dashboard") && (lower.contains("tell me") || lower.contains("what is") ||
             lower.contains("how to use") || lower.contains("explain") || lower.contains("overall") ||
             lower.contains("plant") || lower.contains("line dashboard") || lower.contains("guide")))) {
            return new AgentResult("""
                ### 📊 SewNexa Multi-Tier Dashboard Architecture
                
                SewNexa provides three interconnected real-time visual dashboards tailored for factory executives, plant heads, and line supervisors:
                
                #### 1. 🌐 [Overall Dashboard](/overall-dashboard) (Executive Overview)
                - **Plant Balancing Efficiency %**: Average balancing score across active lines.
                - **Total Factory Output**: Real-time actual vs target piece count for the current shift.
                - **Active Line Status**: Overview of all 6 lines (PBS, Modular, UPS Hanger).
                - **Workforce Utilization**: Staffing ratio across operators, helpers, and floaters.
                
                #### 2. 🏭 [Plant Dashboard](/plant-dashboard) (Floor & Bay Management)
                - Visual floor map organized by bays (Bay A, Bay B).
                - Shift-wise throughput and bottleneck risk index per section.
                - Machine breakdown status and maintenance alerts.
                
                #### 3. 🎯 [Line Dashboard](/line-dashboard) (Workstation Deep-Dive)
                - Detailed workstation-by-workstation cycle time curve vs **Pitch Time Benchmark**.
                - Visual Bottleneck indicators (🔴 operations exceeding pitch time).
                - Live WIP buffer queues between consecutive stations.
                - Active operator seated at each workstation with skill ratings.
                
                💡 *Direct link: [Open Overall Dashboard](/overall-dashboard)*
                """, "DASHBOARD_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Show Master Data Overview", "Show details for Line 1", "Calculate line balancing for 10 operators", "Who are the floater operators?"));
        }

        // 9. IMMEDIATE ACTIONS & FLOATER MANAGEMENT GUIDE
        if (lower.equals("/immediate") || lower.contains("immediate action") || lower.contains("floater allocation") ||
            lower.contains("bottleneck alert") || lower.contains("wip alert") || lower.contains("deploy floater")) {
            return new AgentResult("""
                ### 🚨 Immediate Actions & Real-Time Floater Deployment Guide
                
                **Immediate Actions** is SewNexa's real-time line rebalancing console that alerts floor supervisors when production stations experience flow disruptions.
                
                #### ⚠️ The Two Trigger Conditions:
                1. **WIP Buffer Warning (Yellow Alert)**:
                   - Intermediate buffer queue reaches **80% of threshold limit** (e.g., 16 pieces in a 20-piece buffer).
                   - Indicates an emerging slowdown at the downstream station.
                2. **Critical Bottleneck (Red Alert)**:
                   - Intermediate buffer **exceeds 100% threshold limit** (e.g., > 20 pieces).
                   - Upstream station is starved or downstream station is overflowing.
                
                #### ⚡ Corrective Actions Available:
                - **Deploy Floater Operator**: Allocate a certified 4-Star or 5-Star multi-skilled floater to the bottleneck operation for temporary work-sharing.
                - **Re-allocate Absentee Replacement**: Instantly swap absent operators with available floor reserve staff from [Attendance](/attendance).
                - **Workstation Splitting**: Open a parallel standby machine from [Machines Master](/settings/machines).
                
                💡 *Direct link: [Open Immediate Actions](/immediate-actions)*
                """, "IMMEDIATE_ACTIONS_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Who are the floater operators?", "Show WIP queue buffer limits", "Show details of OB-POLO-800", "Calculate line balancing for 10 operators"));
        }

        // 10. PRODUCTION MONITORING & HOURLY BOARD GUIDE
        if (lower.equals("/monitoring") ||
            ((lower.contains("production monitoring") || lower.contains("hourly board") ||
              lower.contains("production log") || lower.contains("hourly output")) &&
             (lower.contains("how") || lower.contains("guide") || lower.contains("what is") ||
              lower.contains("explain") || lower.contains("view")))) {
            return new AgentResult("""
                ### 📈 Production Monitoring & Hourly Output Board Guide
                
                The **Production Monitoring** module tracks hour-by-hour output against hourly pitch targets throughout the 8-hour working shift.
                
                #### ⏱️ Key Features:
                - **Hour-by-Hour Tracker**: Logs actual finished pieces vs expected line target for each production hour (Hour 1 to Hour 8).
                - **Line Output Variance**: Visual positive/negative delta against target (e.g., `-18 pcs` in Hour 3).
                - **Downtime Reason Logging**: Records line stoppage causes: machine breakdown, needle break, fabric shade variation, or thread shortage.
                - **Defect & Rejection Rate**: Quality checkpoints log minor, major, and critical defects before packaging.
                
                💡 *Direct link: [Open Production Monitoring](/production-monitoring)*
                """, "MONITORING_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Show hourly production output & variance", "Show details for Line 1", "What are the working shifts & break hours?", "Show Master Data Overview"));
        }

        // 11. CAPACITY PLANNING & LINE DESIGN GUIDE
        if (lower.equals("/capacity") ||
            ((lower.contains("capacity planning") || lower.contains("line design")) &&
             (lower.contains("how") || lower.contains("what is") || lower.contains("guide") || lower.contains("explain")))) {
            return new AgentResult("""
                ### 🎯 Capacity Planning & Line Design Guide
                
                These modules provide strategic pre-production engineering before orders hit the factory sewing floor:
                
                #### 1. 📐 [Capacity Planning](/capacity-planning)
                - Computes total standard work content (SAM × Order Quantity) across committed purchase orders.
                - Compares required machine and operator hours against available plant capacity across working shifts.
                - Highlights potential delivery date bottlenecks before line loading.
                
                #### 2. 🏭 [Line Design](/line-design)
                - Configures physical layout types: **Progressive Bundle System (PBS)**, **Modular U-Shape Cells**, or **Unit Production System (UPS Hanger)**.
                - Optimizes conveyor speeds, workstation pitch intervals, and machine power drops.
                
                💡 *Direct links: [Capacity Planning](/capacity-planning) · [Line Design](/line-design)*
                """, "CAPACITY_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("Calculate line balancing for 10 operators", "Show machine inventory & maintenance status", "Show all 6 sewing lines", "Master Data Overview"));
        }

        // 12. WORKING SHIFTS & ATTENDANCE GUIDE
        if (lower.equals("/shifts") || lower.equals("/attendance") ||
            ((lower.contains("shift") || lower.contains("attendance")) &&
             (lower.contains("how to") || lower.contains("guide") || lower.contains("setup") ||
              lower.contains("assign") || lower.contains("roster")))) {
            return new AgentResult("""
                ### ⏰ Working Shifts & Attendance Management Guide
                
                Accurate shift schedules and real-time attendance ensure that line pitch time calculations reflect actual net available working minutes.
                
                #### 🕒 Managing Working Shifts:
                1. Navigate to [Shifts Master](/settings/shifts).
                2. Configure shift definitions: **Shift A** (Morning), **Shift B** (Evening), **Shift C** (Night), or **General Shift**.
                3. Define start/end timings and scheduled unpaid break durations (e.g., 45-minute lunch + two 15-minute tea breaks). Net working seconds are calculated automatically.
                
                #### 📋 Roster & Attendance:
                1. Assign operators to specific shifts and lines on [Shift Assignment](/shift-assignment).
                2. Record daily attendance and check-ins on [Attendance](/attendance).
                3. If an operator is marked absent, an alert is dispatched to [Immediate Actions](/immediate-actions) for replacement.
                
                💡 *Direct links: [Shifts Master](/settings/shifts) · [Attendance](/attendance)*
                """, "SHIFTS_ATTENDANCE_GUIDE", "APPLICATION_GUIDE", true, null,
                List.of("What are the working shifts & break hours?", "Who are the floater operators?", "Show details for Line 1", "Master Data Overview"));
        }

        // 13. MASTER DATA OVERVIEW & SYSTEM SUMMARY
        if (lower.equals("master") || lower.equals("masters") || lower.contains("master data") ||
            ((lower.contains("overview") || lower.contains("summary") || lower.contains("catalog") || lower.contains("database")) &&
             (lower.contains("system") || lower.contains("factory") || lower.contains("master") || lower.contains("all")))) {
            Map<String, Object> master = toolsService.getMasterOverview();
            StringBuilder sb = new StringBuilder();
            sb.append("### 🏭 SewNexa Master Data Overview\n\n");
            sb.append("Live factory configuration and master records active in PostgreSQL:\n\n");
            sb.append("| Master Category | Live Record Count | Direct App Link | Status |\n");
            sb.append("|---|---|---|---|\n");
            sb.append(String.format("| **Garment Operators** | `%d Operators` | [View Operators](/settings/operators) | ✅ Active (EMP-001 to EMP-050) |\n", master.get("operators")));
            sb.append(String.format("| **Sewing Operations** | `%d Operations` | [View Operations](/settings/operations) | ✅ Standard SMVs & Machines |\n", master.get("operations")));
            sb.append(String.format("| **Garment Styles** | `%d Styles` | [View Styles](/settings/styles) | ✅ Nike, Tommy Hilfiger, Zara |\n", master.get("styles")));
            sb.append(String.format("| **Sewing Lines** | `%d Lines` | [View Lines](/settings/lines) | ✅ PBS, Modular, Hanger Lines |\n", master.get("lines")));
            sb.append(String.format("| **Machine Inventory** | `%d Machines` | [View Machines](/settings/machines) | ✅ Juki, Brother, Jack, Pegasus |\n", master.get("machines")));
            sb.append(String.format("| **Working Shifts** | `%d Shifts` | [View Shifts](/settings/shifts) | ✅ Shift A, B, C, General |\n", master.get("shifts")));
            sb.append(String.format("| **Operation Bulletins** | `%d Bulletins` | [View Bulletins](/operation-bulletins) | ✅ Complete Routing & SMV Plans |\n", master.get("bulletins")));
            sb.append(String.format("| **Production Orders** | `%d Orders` | [View Orders](/orders) | ✅ Active Work Orders |\n", master.get("orders")));
            sb.append(String.format("| **Garment Sizes** | `%d Sizes` | [View Sizes](/settings/sizes) | ✅ XS to 2XL Standard Range |\n", master.get("sizes")));
            sb.append(String.format("| **Skill Matrix Ratings** | `%d Matrix Entries` | [View Skill Matrix](/skill-matrix) | ✅ Verified 1–5 Ratings |\n", master.get("skillRatingsRecorded")));

            sb.append("\n💡 *Try asking: \"Show details for Pooja Deshmukh\", \"What is the standard SMV for Sleeve Attach?\", \"Show details of OB-POLO-800\", or \"Calculate line balancing for 12 operators\".*");

            StructuredPayloadDto payload = StructuredPayloadDto.builder()
                    .type("METRIC")
                    .title("Master Data Inventory")
                    .metrics(master)
                    .build();

            return new AgentResult(sb.toString(), "MASTER_OVERVIEW", "POSTGRESQL_LIVE", true, payload,
                    List.of("Show details for Pooja Deshmukh", "What is standard SMV for Sleeve Attach?", "Show all 5 Operation Bulletins", "Calculate Line Balancing for 12 operators"));
        }

        // 14. INDUSTRIAL ENGINEERING KNOWLEDGE BASE & FAQS
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
                
                💡 *In SewNexa, standard SMVs are defined per operation in [Operations Master](/settings/operations) and mapped sequentially in [Operation Bulletins](/operation-bulletins).*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("What is Pitch Time?", "What is Line Balancing?", "What is the standard SMV for Sleeve Attach?", "Show Master Data Overview"));
        }

        if (lower.contains("what is pitch time") || lower.contains("pitch time formula") || lower.contains("how is pitch time calculated")) {
            return new AgentResult("""
                ### ⚡ Pitch Time in Garment Line Balancing
                
                **Pitch Time** is the average available cycle time allocated per operator to complete their portion of work on a garment style.
                
                #### 📐 Pitch Time Formula:
                $$\\text{Pitch Time (seconds)} = \\frac{\\text{Total Garment SMV (seconds)}}{\\text{Total Number of Operators Allocated}}$$
                $$\\text{Pitch Time (minutes)} = \\frac{\\text{Total Garment SMV (minutes)}}{\\text{Total Number of Operators Allocated}}$$
                
                #### 🏭 Industrial Application:
                - **Target Pace**: Sets the benchmark cycle time for each workstation along the line.
                - **Bottleneck Detection**: Any operation whose standard SMV **exceeds the Pitch Time** is a **Bottleneck** and requires work-sharing, parallel machines, or 2 operators.
                - **Hourly Target Output**: $\\text{Target Output (pcs/hr)} = \\frac{3600}{\\text{Pitch Time (sec)}} \\times \\text{Efficiency \\%}$.
                
                💡 *Run a live calculation in [Line Balancing](/line-balance) or ask: \"Calculate line balancing for 12 operators\".*
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
                
                💡 *Simulate both modes on [Line Balancing](/line-balance).*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Calculate line balancing for 12 operators", "What is Line Balancing?", "Show details of OB-POLO-800"));
        }

        if (lower.contains("what is line balancing") || lower.contains("line balancing concept")) {
            return new AgentResult("""
                ### 🪡 Garment Line Balancing
                
                **Line Balancing** is the industrial engineering process of distributing sewing operations evenly across workstations along a sewing line so that each operator's workload matches the **Pitch Time** as closely as possible.
                
                #### 🎯 Key Objectives:
                1. **Eliminate Bottlenecks**: Prevent upstream WIP buildup and downstream operator starvation.
                2. **Maximize Line Efficiency & Balancing Efficiency (Balancing % $\\ge 85\\%$)**.
                3. **Optimize Operator Skill Matching**: Assign operators with rating 4–5 to critical bottleneck operations.
                4. **Control WIP Buffers**: Enforce buffer threshold limits (typically 15–25 pcs) between consecutive stations.
                
                💡 *Open the [Line Balancing Engine](/line-balance) to configure and balance lines.*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("How do I balance a line?", "Calculate line balancing for 12 operators", "Show WIP queue buffer limits", "Who are the floater operators?"));
        }

        if (lower.contains("wip threshold") || lower.contains("wip buffer") || lower.contains("buffer limit")) {
            return new AgentResult("""
                ### 📦 Work-In-Progress (WIP) Buffer Thresholds
                
                In garment manufacturing, **WIP Buffers** represent intermediate bundled garments queued between consecutive sewing workstations.
                
                - **Standard Buffer Limit**: Typically **15 to 25 pieces** per workstation.
                - **Yellow Alert (Warning)**: Buffer reaches 80% of threshold limit $\\rightarrow$ indicates early stage flow imbalance.
                - **Red Alert (Critical Bottleneck)**: Buffer exceeds limit $\\rightarrow$ floater operators must be immediately deployed to absorb overflow.
                
                💡 *WIP buffers are monitored in real time on [Immediate Actions](/immediate-actions).*
                """, "IE_FAQ", "KNOWLEDGE_BASE", true, null,
                List.of("Show details of OB-POLO-800", "Who are the floater operators?", "Show Master Data Overview"));
        }

        // 15. DYNAMIC LINE BALANCING CALCULATIONS & IE ENGINE
        if (lower.contains("pitch") || lower.contains("takt") || (lower.contains("calculate") && (lower.contains("operator") || lower.contains("polo") || lower.contains("target") || lower.contains("line") || lower.contains("crew")))) {
            Matcher numMatcher = Pattern.compile("(\\d+)\\s*(?:operators?|ops?|workers?|persons?)?", Pattern.CASE_INSENSITIVE).matcher(lower);
            int ops = 10;
            if (numMatcher.find()) {
                int parsed = Integer.parseInt(numMatcher.group(1));
                if (parsed > 0 && parsed <= 100) ops = parsed;
            }

            Long bulId = 2L; // Default OB-POLO-800
            String bulletinName = "OB-POLO-800 (Polo T-Shirt)";
            if (lower.contains("ts-480") || lower.contains("tshirt") || lower.contains("t-shirt") || lower.contains("crew") || lower.contains("crewneck")) {
                bulId = 1L;
                bulletinName = "OB-CREW-101 (Crewneck T-Shirt)";
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

            sb.append("\n\n👉 [Open in Line Balancing Engine](/line-balance)");

            return new AgentResult(sb.toString(), "LINE_BALANCING_CALC", "IE_ENGINE", true, null,
                    List.of(String.format("Calculate for %d operators", ops + 2), "Show details of " + bulletinName.split(" ")[0], "Who are the floater operators?"));
        }

        // 16. OPERATION BULLETINS MASTER & ROUTING (OB-POLO-800, OB-CREW-101, etc.)
        if (lower.contains("bulletin") || lower.contains("ob-") || lower.contains("routing") || lower.contains("sequence")) {
            Matcher obMatcher = Pattern.compile("ob[-_]?[a-z0-9]+[-_]?[a-z0-9]*", Pattern.CASE_INSENSITIVE).matcher(lower);
            String obCode = obMatcher.find() ? obMatcher.group(0).toUpperCase() : (lower.contains("polo") ? "OB-POLO-800" : (lower.contains("crew") || lower.contains("t-shirt") || lower.contains("tshirt") ? "OB-CREW-101" : (lower.contains("shirt") ? "OB-SHIRT-920" : (lower.contains("jeans") ? "OB-JEANS-1100" : (lower.contains("hoodie") ? "OB-HOODIE-1250" : null)))));

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

                    sb.append("\n👉 [Open in Operation Bulletins](/operation-bulletins)");

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
            sb.append("| Bulletin Code | Bulletin Name | Operations | Total SMV | Status | Action |\n");
            sb.append("|---|---|---|---|---|---|\n");
            for (Map<String, Object> r : bRows) {
                sb.append(String.format("| **%s** | %s | `%s ops` | **%s sec** (%.2f min) | `%s` | [View Bulletin](/operation-bulletins) |\n",
                        r.get("bulletin_code"), r.get("name"), r.get("operation_count"),
                        r.get("total_smv_sec"), ((Number) r.get("total_smv")).doubleValue(), r.get("status")));
            }

            return new AgentResult(sb.toString(), "BULLETINS_LIST", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for Operation Bulletin OB-POLO-800", "Show details of OB-CREW-101", "Calculate line balancing for 12 operators"));
        }

        // 17. DIRECT OPERATOR LOOKUP & DISAMBIGUATION (Pooja Deshmukh, EMP-012, Priya, etc.)
        Matcher empCodeMatcher = Pattern.compile("emp[-_]?(\\d+)", Pattern.CASE_INSENSITIVE).matcher(lower);
        String directEmpCode = empCodeMatcher.find() ? "EMP-" + String.format("%03d", Integer.parseInt(empCodeMatcher.group(1))) : null;

        String candidateName = directEmpCode;
        if (candidateName == null && !lower.contains("operation") && !lower.contains("bulletin") && !lower.contains("machine") && !lower.contains("line") && !lower.contains("shift") && !lower.contains("order")) {
            String stripped = cleanMsg
                    .replaceAll("(?i)^(who is|tell me about|show details for|show profile of|show operator|details of|operator|worker|search for|about)\\s+", "")
                    .replaceAll("[?!.]", "").trim();
            if (stripped.length() >= 2 && !stripped.equalsIgnoreCase("operator") && !stripped.equalsIgnoreCase("floaters") && !stripped.equalsIgnoreCase("operators") && !stripped.equalsIgnoreCase("master") && !stripped.equalsIgnoreCase("add")) {
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

                        sb.append("\n👉 [Open in Operators Master](/settings/operators)");

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

        // 18. WORKFORCE / OPERATORS DIRECTORY FILTER (Floaters, Supervisors, Checkers, Helpers)
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

            sb.append("| EMP ID | Name | Role | Department | Rated Skills | Avg Rating | Action |\n");
            sb.append("|---|---|---|---|---|---|---|\n");
            for (Map<String, Object> o : ops.subList(0, Math.min(ops.size(), 20))) {
                sb.append(String.format("| **%s** | %s | `%s` | %s | `%s ops` | ⭐ %s | [View](/settings/operators) |\n",
                        o.get("employee_id"), o.get("name"), o.get("role"), o.get("department"),
                        o.get("rated_skills_count"), o.get("avg_skill_rating")));
            }
            if (ops.size() > 20) {
                sb.append(String.format("\n*...and %d more operators registered in the system.*\n", ops.size() - 20));
            }

            sb.append("\n👉 [Manage in Operators Master](/settings/operators)");

            return new AgentResult(sb.toString(), "OPERATORS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for EMP-001", "Show details for Pooja Deshmukh", "What is standard SMV for Sleeve Attach?"));
        }

        // 19. SMV ANALYTICS & EXTREMES (Least SMV, Highest SMV, Shortest/Longest operations)
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

                sb.append(String.format("\n📊 **Factory SMV Spectrum**: Min = `%.1fs` | Avg = `%ss` | Max = `%.1fs`\n",
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

        // 20. DIRECT OPERATION & SMV LOOKUP (Sleeve Attach, Collar Make, OP-004, etc.)
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

                        sb.append("\n👉 [View in Operations Master](/settings/operations)");

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

        // 21. GENERAL SEWING OPERATIONS MASTER & SMVs
        if (lower.contains("operation") || lower.contains("smv") || lower.contains("sewing operation") || lower.contains("section")) {
            List<Map<String, Object>> opList = toolsService.searchOperations(null, null);
            StringBuilder sb = new StringBuilder();
            sb.append("### ✂️ Sewing Operations Master & Standard SMVs\n\n");
            sb.append("The system features **18 Industrial Sewing Operations** with verified standard SMVs:\n\n");
            sb.append("| Op Code | Operation Name | Machine Type | Standard SMV | Certified Operators | Action |\n");
            sb.append("|---|---|---|---|---|---|\n");
            for (Map<String, Object> o : opList) {
                double smv = o.get("standard_smv") != null ? ((Number) o.get("standard_smv")).doubleValue() : 0.5;
                double sec = o.get("smv_seconds") != null ? ((Number) o.get("smv_seconds")).doubleValue() : (smv * 60.0);
                sb.append(String.format("| **%s** | %s | %s | **%.1fs** (%.2fm) | `%s operators` | [View](/settings/operations) |\n",
                        o.get("operation_code"), o.get("name"), o.get("machine_type"), sec, smv,
                        o.get("certified_operators_count")));
            }

            sb.append("\n👉 [Open Operations Master](/settings/operations)");

            return new AgentResult(sb.toString(), "OPERATIONS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("What is standard SMV for Sleeve Attach?", "Show details of OB-POLO-800", "Calculate Line Balancing for 10 operators"));
        }

        // 22. GARMENT STYLES & BUYER BRANDS (Nike, Tommy Hilfiger, Zara, etc.)
        if (lower.contains("style") || lower.contains("buyer") || lower.contains("brand") || lower.contains("nike") || lower.contains("tommy") || lower.contains("zara") || lower.contains("uniqlo") || lower.contains("levi") || lower.contains("sty-")) {
            String buyerFilter = lower.contains("nike") ? "Nike" : (lower.contains("tommy") ? "Tommy" : (lower.contains("zara") ? "Zara" : (lower.contains("uniqlo") ? "Uniqlo" : (lower.contains("levi") ? "Levi's" : null))));
            List<Map<String, Object>> styles = toolsService.searchStyles(buyerFilter != null ? null : cleanMsg, buyerFilter);
            if (styles.isEmpty()) {
                styles = toolsService.searchStyles(null, null);
            }

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("### 👕 Garment Styles Master Catalog (%d Styles Found)\n\n", styles.size()));
            sb.append("| Style No | Buyer / Brand | Category | Season | Bulletins | Orders | Status | Action |\n");
            sb.append("|---|---|---|---|---|---|---|---|\n");
            for (Map<String, Object> r : styles) {
                sb.append(String.format("| **%s** | %s | %s | %s | `%s bulletin(s)` | `%s order(s)` | %s | [View](/settings/styles) |\n",
                        r.get("style_no"), r.get("buyer"), r.get("product_type"), r.get("season"),
                        r.get("linked_bulletins"), r.get("active_orders"),
                        Boolean.TRUE.equals(r.get("active")) ? "🟢 Active" : "⚪ Inactive"));
            }

            sb.append("\n👉 [Open Styles Master](/settings/styles)");

            return new AgentResult(sb.toString(), "STYLES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Operation Bulletins for Nike Polo", "List all production orders", "Master Data Overview"));
        }

        // 23. SEWING LINES MASTER (LINE-01 to LINE-06, Line 1, Line 2, etc.)
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

                sb.append("\n👉 [Open Lines Master](/settings/lines) · [View Line Dashboard](/line-dashboard)");

                return new AgentResult(sb.toString(), "LINE_DETAIL", "POSTGRESQL_LIVE", true, null,
                        List.of("Show all sewing lines", "List all floater operators on Line 1", "Show Master Data Overview"));
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

            sb.append("\n👉 [Open Lines Master](/settings/lines)");

            return new AgentResult(sb.toString(), "LINES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show details for Line 1", "Show details for Line 2", "Who is the supervisor for Line 2?"));
        }

        // 24. MACHINES INVENTORY MASTER (Juki, Brother, Jack, Pegasus, Siruba, Yamato, SNLS, Overlock)
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

            sb.append("\n👉 [Open Machines Master](/settings/machines)");

            return new AgentResult(sb.toString(), "MACHINES_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Master Data Overview", "List all sewing lines", "Show Operation Bulletins"));
        }

        // 25. PRODUCTION ORDERS & PURCHASE ORDERS (PO-2026-001, etc.)
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

            sb.append("\n👉 [Open Production Orders](/orders)");

            return new AgentResult(sb.toString(), "ORDERS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Operation Bulletins for Nike Polo", "Calculate Line Balancing for 12 operators", "Master Data Overview"));
        }

        // 26. WORKING SHIFTS MASTER
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

            sb.append("\n👉 [Open Shifts Master](/settings/shifts)");

            return new AgentResult(sb.toString(), "SHIFTS_MASTER", "POSTGRESQL_LIVE", true, null,
                    List.of("Show Master Data Overview", "List all floater operators on Line 1", "Show details for Line 1"));
        }

        // 27. UNIVERSAL MULTI-TABLE KEYWORD GROUNDING FALLBACK
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

        // 28. DEFAULT WELCOME & ACTION CARD
        return new AgentResult(
                String.format("""
                ### 🏭 SewNexa Manufacturing AI Copilot
                
                I am your expert AI guide for factory operations, line balancing, and floor workforce management.
                
                #### ⚡ Quick Actions:
                - **[Open Line Balancing](/line-balance)**: Simulate pitch times, bottlenecks, and shift targets
                - **[Explore Master Data](/settings)**: Operators, Operations, Machines, Styles, Shifts
                - **[View 1–5 Skill Matrix](/skill-matrix)**: Verified operator competencies & certifications
                - **[Review Operation Bulletins](/operation-bulletins)**: Assembly routing & WIP buffer queues
                - **[Check Overall Dashboard](/overall-dashboard)**: Live plant efficiency and hourly output
                
                **Try asking:**
                - *"How does this application work?"*
                - *"How do I balance a line in this app?"*
                - *"How do I add an operator?"*
                - *"How do I use the Skill Matrix?"*
                - *"Calculate line balancing for 10 operators"*
                - *"Who is Pooja Deshmukh?"*
                - *"What is standard SMV for Sleeve Attach?"*
                """),
                "GENERAL_ASSIST", "SYSTEM_GROUNDED", true, null,
                List.of("How does this application work?", "How do I balance a line?", "How do I add an operator?", "Calculate line balancing for 10 operators")
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
