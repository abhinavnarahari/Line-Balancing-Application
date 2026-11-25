package com.qtech.linebalancing.chatbot.assistant.nlu;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Structured understanding of one question: what is asked (intent), about which records (entities) and with which
 * parameters. Built by {@link QuestionAnalyzer}; may be completed from the conversation (follow-ups) or the page.
 */
public record AnalyzedQuestion(
        String original,
        String normalized,
        Intent intent,
        double confidence,
        Map<EntityType, List<EntityRef>> entities,
        List<EntityCatalog.Mention> ambiguous,
        Unresolved unresolved,
        Params params,
        boolean followUp) {

    /** A name the user gave for a record that does not exist (e.g. "operator Ramesh"). */
    public record Unresolved(EntityType type, String text) {
    }

    /** Numeric/date/filter parameters found in the question. */
    public record Params(Integer operatorCount, Double efficiencyPct, Integer targetPerHour, LocalDate date,
                         String role, String orderStatus) {
        public static Params none() {
            return new Params(null, null, null, null, null, null);
        }
    }

    public Optional<EntityRef> first(EntityType type) {
        List<EntityRef> refs = entities.get(type);
        return refs == null || refs.isEmpty() ? Optional.empty() : Optional.of(refs.get(0));
    }

    public List<EntityRef> all(EntityType type) {
        return entities.getOrDefault(type, List.of());
    }

    public boolean has(EntityType type) {
        return first(type).isPresent();
    }

    public boolean mentions(String phrase) {
        return Text.hasPhrase(normalized, phrase);
    }

    public AnalyzedQuestion withIntent(Intent newIntent, boolean asFollowUp) {
        return new AnalyzedQuestion(original, normalized, newIntent, confidence, entities, ambiguous, unresolved, params, asFollowUp);
    }

    public AnalyzedQuestion withEntity(EntityRef ref) {
        Map<EntityType, List<EntityRef>> copy = new EnumMap<>(EntityType.class);
        copy.putAll(entities);
        copy.put(ref.type(), List.of(ref));
        return new AnalyzedQuestion(original, normalized, intent, confidence, copy, ambiguous, unresolved, params, followUp);
    }
}
