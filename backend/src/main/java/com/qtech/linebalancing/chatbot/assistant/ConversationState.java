package com.qtech.linebalancing.chatbot.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;

import java.util.EnumMap;
import java.util.Map;

/**
 * What the previous answer was about (intent + resolved record ids), so follow-ups like "and LINE-02?" or
 * "what is its SMV?" can be understood. Stored as JSON on the assistant's chat message.
 */
public record ConversationState(Intent intent, Map<EntityType, String> entities) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public String toJson() {
        try {
            return MAPPER.writeValueAsString(Map.of("intent", intent.name(), "entities", entities));
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public static ConversationState fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            Map<String, Object> raw = MAPPER.readValue(json, Map.class);
            Map<EntityType, String> entities = new EnumMap<>(EntityType.class);
            ((Map<String, Object>) raw.getOrDefault("entities", Map.of())).forEach((k, v) -> entities.put(EntityType.valueOf(k), String.valueOf(v)));
            return new ConversationState(Intent.valueOf((String) raw.get("intent")), entities);
        } catch (Exception e) {
            return null;
        }
    }
}
