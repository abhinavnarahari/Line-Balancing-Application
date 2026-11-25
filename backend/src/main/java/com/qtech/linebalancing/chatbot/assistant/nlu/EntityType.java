package com.qtech.linebalancing.chatbot.assistant.nlu;

/** Kinds of application records the assistant can recognise in a question. */
public enum EntityType {
    OPERATOR("operator"),
    OPERATION("operation"),
    STYLE("style"),
    BUYER("buyer"),
    LINE("sewing line"),
    ORDER("order"),
    BULLETIN("operation bulletin"),
    SHIFT("shift"),
    MACHINE_TYPE("machine type");

    private final String label;

    EntityType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
