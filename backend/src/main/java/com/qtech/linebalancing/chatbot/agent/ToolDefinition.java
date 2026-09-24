package com.qtech.linebalancing.chatbot.agent;

import java.util.List;
import java.util.Map;

public class ToolDefinition {

    public static List<Map<String, Object>> getOpenAITools() {
        return List.of(
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "execute_sql_query",
                    "description", "Execute a read-only PostgreSQL SELECT query to get exact facts, aggregations, counts, filters, or joins from any table in the manufacturing database.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "query", Map.of("type", "string", "description", "Read-only SQL query against the postgres database schema.")
                        ),
                        "required", List.of("query")
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "get_master_overview",
                    "description", "Get counts and summary status of all 8 Master entities (Operators, Operations, Styles, Lines, Machines, Shifts, Bulletins, Orders).",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of()
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "search_operators",
                    "description", "Search the 50 workforce operators by name, employee ID, role, or department.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "query", Map.of("type", "string", "description", "Search term for operator name or EMP-ID"),
                            "role", Map.of("type", "string", "description", "Role filter: OPERATOR, FLOATER, LINE_SUPERVISOR, QUALITY_CHECKER, HELPER"),
                            "department", Map.of("type", "string", "description", "Department filter: Sewing Line 1, Sewing Line 2, Quality Control, etc.")
                        )
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "get_operator_profile",
                    "description", "Retrieve detailed profile for an operator including all skill ratings (1-5), primary operations, and recent attendance.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "identifier", Map.of("type", "string", "description", "Operator ID (e.g. 1) or Employee ID (e.g. EMP-001) or Name (e.g. Priya Sharma)")
                        ),
                        "required", List.of("identifier")
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "search_operations",
                    "description", "Search operations master for standard SMVs, required machines, required skill ratings, and certified operators.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "query", Map.of("type", "string", "description", "Operation name or code (e.g. OP-001, Shoulder Join)"),
                            "machineType", Map.of("type", "string", "description", "Machine filter: Overlock, Single Needle Lockstitch, Flatlock, etc.")
                        )
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "get_bulletin_details",
                    "description", "Get full Operation Bulletin details: sequential routing, operations, SMVs, machine assignments, WIP buffer thresholds, and linked styles.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "bulletinCodeOrId", Map.of("type", "string", "description", "Bulletin Code (e.g. OB-POLO-800, OB-TS-480) or numeric ID")
                        ),
                        "required", List.of("bulletinCodeOrId")
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "calculate_line_balancing",
                    "description", "Perform industrial engineering calculations: pitch time, takt time, target output pcs/hr, theoretical efficiency, and bottleneck operations.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "bulletinId", Map.of("type", "integer", "description", "Bulletin ID (e.g. 2 for Polo, 1 for T-Shirt)"),
                            "operatorCount", Map.of("type", "integer", "description", "Number of operators assigned to the line"),
                            "targetPcsPerHour", Map.of("type", "number", "description", "Target output in pieces per hour"),
                            "efficiencyPct", Map.of("type", "number", "description", "Expected line efficiency percentage (e.g. 85.0)")
                        )
                    )
                )
            ),
            Map.of(
                "type", "function",
                "function", Map.of(
                    "name", "get_hourly_production_stats",
                    "description", "Get hourly production output, variance, efficiency percentages, and active bottleneck warnings.",
                    "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                            "lineId", Map.of("type", "integer", "description", "Sewing Line ID (e.g. 1)"),
                            "date", Map.of("type", "string", "description", "Date in YYYY-MM-DD format")
                        )
                    )
                )
            )
        );
    }
}
