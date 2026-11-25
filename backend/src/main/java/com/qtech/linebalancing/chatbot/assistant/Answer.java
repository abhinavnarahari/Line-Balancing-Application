package com.qtech.linebalancing.chatbot.assistant;

import com.qtech.linebalancing.chatbot.dto.StructuredPayloadDto;

import java.util.List;
import java.util.Map;

/**
 * A grounded answer: markdown text whose every figure was computed from application data by a skill,
 * an optional table/metric/chart payload, the data sources used, and follow-up suggestions.
 */
public record Answer(
        String text,
        StructuredPayloadDto payload,
        List<String> sources,
        List<String> suggestions,
        boolean dataAvailable,
        Map<String, String> resolvedEntities) {

    public static Answer of(String text, List<String> sources, List<String> suggestions) {
        return new Answer(text, null, sources, suggestions, true, Map.of());
    }

    /** Honest "no data" / clarification / out-of-scope reply (never invents content). */
    public static Answer notAvailable(String text, List<String> suggestions) {
        return new Answer(text, null, List.of(), suggestions, false, Map.of());
    }

    public Answer withPayload(StructuredPayloadDto p) {
        return new Answer(text, p, sources, suggestions, dataAvailable, resolvedEntities);
    }

    public Answer withResolved(Map<String, String> resolved) {
        return new Answer(text, payload, sources, suggestions, dataAvailable, resolved);
    }
}
