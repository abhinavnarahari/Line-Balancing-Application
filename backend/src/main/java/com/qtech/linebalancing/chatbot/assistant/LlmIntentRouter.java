package com.qtech.linebalancing.chatbot.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityCatalog;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityRef;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.chatbot.assistant.nlu.Text;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Optional LLM assist for questions the rule-based analyzer could not route. The LLM only <em>classifies</em>:
 * it must pick one intent from our fixed list and quote the names it saw. Names are then resolved against the
 * {@link EntityCatalog}, and the answer itself is still computed by a skill from the database — the LLM never
 * writes the facts, so it cannot introduce invented numbers or records. Disabled unless LLM_API_KEY is set.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LlmIntentRouter {

    private final EntityCatalog catalog;
    private final ObjectMapper objectMapper;

    @Value("${llm.api-key:}")
    private String apiKey;

    @Value("${llm.base-url:https://generativelanguage.googleapis.com/v1beta/openai/}")
    private String baseUrl;

    @Value("${llm.model:gemini-3.8-flash}")
    private String model;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.contains("YOUR_") && !apiKey.equalsIgnoreCase("mock");
    }

    public Optional<AnalyzedQuestion> route(AnalyzedQuestion q) {
        if (!isEnabled()) return Optional.empty();
        try {
            SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
            rf.setConnectTimeout(4000);
            rf.setReadTimeout(10000);
            RestClient client = RestClient.builder().requestFactory(rf).baseUrl(baseUrl)
                    .defaultHeader("Authorization", "Bearer " + apiKey.trim()).build();

            String intents = Arrays.stream(Intent.values()).filter(i -> i != Intent.UNKNOWN)
                    .map(i -> "- " + i.name() + ": " + i.description()).collect(Collectors.joining("\n"));
            String system = """
                    You route questions for SewNexa, a garment-factory line-balancing application. Classify the user's question
                    into exactly one intent from this list (use OUT_OF_SCOPE if it is not about this application or its data):
                    %s
                    Reply with JSON only: {"intent": "<INTENT>", "mentions": ["<names/codes of operators, operations, styles,
                    orders, lines, bulletins, shifts, buyers or machine types exactly as written>"], "operatorCount": <int|null>,
                    "targetPerHour": <int|null>, "efficiencyPct": <number|null>}. Do not answer the question.""".formatted(intents);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("temperature", 0);
            body.put("response_format", Map.of("type", "json_object"));
            body.put("messages", List.of(Map.of("role", "system", "content", system), Map.of("role", "user", "content", q.original())));

            String raw = client.post().uri("/chat/completions").contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(String.class);
            String content = objectMapper.readTree(raw).path("choices").path(0).path("message").path("content").asText("");
            JsonNode json = objectMapper.readTree(content.replaceAll("(?s)^```(?:json)?|```$", "").trim());

            Intent intent = Intent.valueOf(json.path("intent").asText("UNKNOWN"));
            if (intent == Intent.UNKNOWN) return Optional.empty();

            Map<EntityType, List<EntityRef>> entities = new EnumMap<>(EntityType.class);
            entities.putAll(q.entities());
            for (JsonNode m : json.path("mentions")) {
                for (EntityCatalog.Mention match : catalog.match(Text.normalize(m.asText()))) {
                    if (match.candidates().size() == 1) {
                        EntityRef ref = match.candidates().get(0);
                        entities.computeIfAbsent(ref.type(), k -> new ArrayList<>()).add(ref);
                    }
                }
            }
            AnalyzedQuestion.Params p = q.params();
            AnalyzedQuestion.Params params = new AnalyzedQuestion.Params(
                    p.operatorCount() != null ? p.operatorCount() : intOrNull(json, "operatorCount"),
                    p.efficiencyPct() != null ? p.efficiencyPct() : (json.path("efficiencyPct").isNumber() ? json.path("efficiencyPct").asDouble() : null),
                    p.targetPerHour() != null ? p.targetPerHour() : intOrNull(json, "targetPerHour"),
                    p.date(), p.role(), p.orderStatus());
            return Optional.of(new AnalyzedQuestion(q.original(), q.normalized(), intent, 0.6, entities, q.ambiguous(), q.unresolved(), params, false));
        } catch (Exception e) {
            log.warn("LLM routing unavailable ({}); using rule-based result", e.getMessage());
            return Optional.empty();
        }
    }

    private static Integer intOrNull(JsonNode json, String field) {
        return json.path(field).isNumber() ? json.path(field).asInt() : null;
    }
}
