package com.qtech.linebalancing.chatbot.assistant.nlu;

/**
 * Everything the assistant can answer. Each intent is served by one skill that reads application data;
 * descriptions are also given to the optional LLM router so it can only choose from this list.
 */
public enum Intent {
    // Workforce
    OPERATOR_COUNT("How many operators/workers there are, optionally by role or department"),
    OPERATOR_LIST("List operators, optionally filtered by role (helper, floater, quality checker, supervisor) or department/line"),
    OPERATOR_PROFILE("Details of one operator: role, department, shift, today's attendance, top skills", EntityType.OPERATOR),
    TOP_OPERATORS_FOR_OPERATION("Best / most skilled operators for a given operation (skill matrix)", EntityType.OPERATION),
    ATTENDANCE_SUMMARY("Attendance for a day: present, absent, late, on leave"),

    // Master data
    OPERATION_DETAILS("SMV, machine type and code of one operation", EntityType.OPERATION),
    OPERATION_LIST("List operations with their SMVs, optionally for a machine type"),
    STYLE_DETAILS("Buyer, season, product type, bulletin and orders of a style", EntityType.STYLE),
    STYLE_LIST("List styles, optionally for a buyer"),
    LINE_DETAILS("Details of one sewing line: capacity, staffing, current style, plan", EntityType.LINE),
    LINE_LIST("List / count sewing lines"),
    MACHINE_INVENTORY("Machine counts by type, status or line"),
    SHIFT_INFO("Shift timings, breaks and working hours"),

    // Engineering
    BULLETIN_DETAILS("Operation bulletin: status, total SMV and operation sequence", EntityType.BULLETIN),
    BULLETIN_LIST("List operation bulletins"),
    LINE_BALANCE_CALC("Line balancing calculation: pitch time, output, bottlenecks or required operators for a bulletin/style"),
    CAPACITY_PLAN("Capacity plan of an order: takt time, pitch time, target output, manpower"),
    FORMULA_EXPLAIN("Explain an industrial-engineering term or formula (SMV, takt, pitch, efficiency, line balance)"),

    // Orders & production
    ORDER_STATUS("Status, progress, quantity and delivery date of one order", EntityType.ORDER),
    ORDER_LIST("List orders, optionally by status or buyer"),
    PRODUCTION_SUMMARY("Production output, rejects and efficiency for a day (optionally an order or line)"),
    ALERTS("Recent notifications and alerts (bottlenecks, late attendance)"),
    OVERVIEW("Overall counts of the application's data"),

    // Meta
    HOW_TO("How to do something in the SewNexa application"),
    GREETING("Greeting or asking what the assistant can do"),
    OUT_OF_SCOPE("Not about this application or its data"),
    UNKNOWN("Could not be understood");

    private final String description;
    private final EntityType primaryEntity;

    Intent(String description) {
        this(description, null);
    }

    Intent(String description, EntityType primaryEntity) {
        this.description = description;
        this.primaryEntity = primaryEntity;
    }

    public String description() {
        return description;
    }

    /** Entity the intent is about; when missing the assistant asks for it (or uses the conversation context). */
    public EntityType primaryEntity() {
        return primaryEntity;
    }
}
