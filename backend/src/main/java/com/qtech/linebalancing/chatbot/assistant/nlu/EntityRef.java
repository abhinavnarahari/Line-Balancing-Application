package com.qtech.linebalancing.chatbot.assistant.nlu;

/**
 * A record of the application recognised in a question. {@code key} is the database id, or the exact value for
 * value-only entities (buyer name, machine type).
 */
public record EntityRef(EntityType type, String key, String display) {

    public Long id() {
        return Long.valueOf(key);
    }
}
