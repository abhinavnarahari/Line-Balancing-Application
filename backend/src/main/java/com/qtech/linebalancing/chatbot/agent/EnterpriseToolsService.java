package com.qtech.linebalancing.chatbot.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnterpriseToolsService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private static final Pattern FORBIDDEN_SQL_PATTERN = Pattern.compile(
            "\\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|EXEC|EXECUTE|VACUUM)\\b",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Executes safe, read-only SQL queries against the PostgreSQL database.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> executeSafeQuery(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            return Map.of("error", "SQL query cannot be empty", "rows", List.of());
        }

        String cleanedSql = sql.trim();
        if (cleanedSql.endsWith(";")) {
            cleanedSql = cleanedSql.substring(0, cleanedSql.length() - 1).trim();
        }

        if (FORBIDDEN_SQL_PATTERN.matcher(cleanedSql).find()) {
            return Map.of("error", "Only read-only SELECT queries are allowed for security.", "rows", List.of());
        }

        if (!cleanedSql.toUpperCase().startsWith("SELECT") && !cleanedSql.toUpperCase().startsWith("WITH")) {
            return Map.of("error", "Query must be a SELECT statement.", "rows", List.of());
        }

        if (!cleanedSql.toUpperCase().contains("LIMIT")) {
            cleanedSql += " LIMIT 50";
        }

        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(cleanedSql);
            List<String> headers = new ArrayList<>();
            if (!rows.isEmpty()) {
                headers.addAll(rows.get(0).keySet());
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("rowCount", rows.size());
            result.put("headers", headers);
            result.put("rows", rows);
            result.put("sqlExecuted", cleanedSql);
            return result;
        } catch (Exception e) {
            log.warn("Safe SQL execution failed for [{}]: {}", cleanedSql, e.getMessage());
            return Map.of("error", "SQL Execution failed: " + e.getMessage(), "sql", cleanedSql, "rows", List.of());
        }
    }

    /**
     * Master Data Overview: summary counts and stats across all Master entities.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMasterOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();
        try {
            int operatorCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM operators WHERE active = true", Integer.class);
            int operationCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM operations WHERE active = true", Integer.class);
            int styleCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM styles WHERE active = true", Integer.class);
            int lineCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sewing_lines WHERE active = true", Integer.class);
            int machineCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM machines WHERE active = true", Integer.class);
            int shiftCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shifts WHERE active = true", Integer.class);
            int bulletinCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM operation_bulletins", Integer.class);
            int orderCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM orders", Integer.class);
            int sizeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM sizes WHERE active = true", Integer.class);
            int skillMatrixCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM skill_assessments WHERE is_current = true", Integer.class);

            overview.put("operators", operatorCount);
            overview.put("operations", operationCount);
            overview.put("styles", styleCount);
            overview.put("lines", lineCount);
            overview.put("machines", machineCount);
            overview.put("shifts", shiftCount);
            overview.put("bulletins", bulletinCount);
            overview.put("orders", orderCount);
            overview.put("sizes", sizeCount);
            overview.put("skillRatingsRecorded", skillMatrixCount);
        } catch (Exception e) {
            log.error("Failed to retrieve master overview", e);
            overview.put("error", e.getMessage());
        }
        return overview;
    }

    /**
     * Detailed Operator Search across workforce master.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchOperators(String query, String role, String department) {
        StringBuilder sql = new StringBuilder("""
            SELECT o.id, o.employee_id, o.name, o.age, o.gender, o.role, o.department, o.active,
                   COUNT(sa.id) as rated_skills_count,
                   COALESCE(ROUND(AVG(sa.rating), 1), 0) as avg_skill_rating
            FROM operators o
            LEFT JOIN skill_assessments sa ON o.id = sa.operator_id AND sa.is_current = true
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(o.name) LIKE ? OR LOWER(o.employee_id) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
        }
        if (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("ALL")) {
            sql.append(" AND o.role = ?");
            params.add(role.trim().toUpperCase());
        }
        if (department != null && !department.trim().isEmpty() && !department.equalsIgnoreCase("ALL")) {
            sql.append(" AND LOWER(o.department) LIKE ?");
            params.add("%" + department.trim().toLowerCase() + "%");
        }

        sql.append(" GROUP BY o.id, o.employee_id, o.name, o.age, o.gender, o.role, o.department, o.active ORDER BY o.employee_id ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Operator Complete Profile with all skill ratings, affinities, and attendance.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getOperatorProfile(String identifier) {
        Map<String, Object> profile = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> opRows;
            if (identifier.matches("^\\d+$")) {
                opRows = jdbcTemplate.queryForList("SELECT * FROM operators WHERE id = ?", Long.parseLong(identifier));
            } else {
                opRows = jdbcTemplate.queryForList(
                    "SELECT * FROM operators WHERE LOWER(employee_id) = ? OR LOWER(name) = ? OR LOWER(name) LIKE ? ORDER BY CASE WHEN LOWER(name) = ? THEN 0 ELSE 1 END LIMIT 1",
                    identifier.toLowerCase(), identifier.toLowerCase(), "%" + identifier.toLowerCase() + "%", identifier.toLowerCase()
                );
            }

            if (opRows.isEmpty()) {
                return Map.of("found", false, "message", "No operator found matching '" + identifier + "'");
            }

            Map<String, Object> operator = opRows.get(0);
            Long opId = ((Number) operator.get("id")).longValue();
            profile.put("found", true);
            profile.put("operator", operator);

            // Skills from skill_assessments
            List<Map<String, Object>> skills = jdbcTemplate.queryForList("""
                SELECT op.id as operation_id, op.operation_code, op.name as operation_name, op.standard_smv,
                       op.machine_type, sa.rating, sa.cycle_time_seconds, sa.effective_date
                FROM skill_assessments sa
                JOIN operations op ON sa.operation_id = op.id
                WHERE sa.operator_id = ? AND sa.is_current = true
                ORDER BY sa.rating DESC
            """, opId);
            profile.put("skills", skills);

            // Recent Attendance
            List<Map<String, Object>> attendance = jdbcTemplate.queryForList("""
                SELECT ar.attendance_date, ar.status, s.shift_name, ar.remarks
                FROM attendance_records ar
                LEFT JOIN shifts s ON ar.shift_id = s.id
                WHERE ar.operator_id = ?
                ORDER BY ar.attendance_date DESC LIMIT 7
            """, opId);
            profile.put("recentAttendance", attendance);

        } catch (Exception e) {
            log.error("Failed to load operator profile for {}: {}", identifier, e.getMessage());
            profile.put("found", false);
            profile.put("error", e.getMessage());
        }
        return profile;
    }

    /**
     * Search Operations Master with standard SMVs, machines, and certified operator counts.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchOperations(String query, String machineType) {
        StringBuilder sql = new StringBuilder("""
            SELECT o.id, o.operation_code, o.name, o.standard_smv,
                   ROUND(COALESCE(o.standard_smv, 0.5) * 60, 1) as smv_seconds,
                   o.machine_type, o.sequence,
                   COUNT(sa.id) as certified_operators_count
            FROM operations o
            LEFT JOIN skill_assessments sa ON o.id = sa.operation_id AND sa.is_current = true
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(o.name) LIKE ? OR LOWER(o.operation_code) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
        }
        if (machineType != null && !machineType.trim().isEmpty() && !machineType.equalsIgnoreCase("ALL")) {
            sql.append(" AND LOWER(o.machine_type) LIKE ?");
            params.add("%" + machineType.trim().toLowerCase() + "%");
        }

        sql.append(" GROUP BY o.id, o.operation_code, o.name, o.standard_smv, o.machine_type, o.sequence ORDER BY o.operation_code ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Operation Detailed Profile with certified operators and ratings.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getOperationDetails(String operationIdentifier) {
        Map<String, Object> details = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> opRows;
            if (operationIdentifier.matches("^\\d+$")) {
                opRows = jdbcTemplate.queryForList("SELECT * FROM operations WHERE id = ?", Long.parseLong(operationIdentifier));
            } else {
                opRows = jdbcTemplate.queryForList(
                    "SELECT * FROM operations WHERE LOWER(operation_code) = ? OR LOWER(name) LIKE ? ORDER BY CASE WHEN LOWER(operation_code) = ? THEN 0 ELSE 1 END LIMIT 1",
                    operationIdentifier.toLowerCase(), "%" + operationIdentifier.toLowerCase() + "%", operationIdentifier.toLowerCase()
                );
            }

            if (opRows.isEmpty()) {
                return Map.of("found", false, "message", "No operation found for '" + operationIdentifier + "'");
            }

            Map<String, Object> op = opRows.get(0);
            Long opId = ((Number) op.get("id")).longValue();
            details.put("found", true);
            details.put("operation", op);

            double smvMin = op.get("standard_smv") != null ? ((Number) op.get("standard_smv")).doubleValue() : 0.5;
            details.put("smvMinutes", smvMin);
            details.put("smvSeconds", Math.round(smvMin * 60.0 * 10.0) / 10.0);

            // Certified operators with 1-5 ratings
            List<Map<String, Object>> certifiedOps = jdbcTemplate.queryForList("""
                SELECT o.employee_id, o.name, o.role, o.department, sa.rating, sa.cycle_time_seconds
                FROM skill_assessments sa
                JOIN operators o ON sa.operator_id = o.id
                WHERE sa.operation_id = ? AND sa.is_current = true
                ORDER BY sa.rating DESC, sa.cycle_time_seconds ASC
                LIMIT 15
            """, opId);
            details.put("certifiedOperators", certifiedOps);

        } catch (Exception e) {
            log.error("Failed to load operation details for {}: {}", operationIdentifier, e.getMessage());
            details.put("found", false);
            details.put("error", e.getMessage());
        }
        return details;
    }

    /**
     * Analytical SMV breakdown: least SMV, highest SMV, and distribution statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSmvAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> ops = jdbcTemplate.queryForList("""
                SELECT o.id, o.operation_code, o.name, o.standard_smv,
                       ROUND(COALESCE(o.standard_smv, 0.5) * 60, 1) as smv_seconds,
                       o.machine_type
                FROM operations o
                WHERE o.active = true
                ORDER BY o.standard_smv ASC, o.operation_code ASC
            """);

            if (ops.isEmpty()) {
                return analytics;
            }

            double minSmv = ops.stream().mapToDouble(r -> ((Number) r.get("standard_smv")).doubleValue()).min().orElse(0.0);
            double maxSmv = ops.stream().mapToDouble(r -> ((Number) r.get("standard_smv")).doubleValue()).max().orElse(0.0);
            double avgSmv = ops.stream().mapToDouble(r -> ((Number) r.get("standard_smv")).doubleValue()).average().orElse(0.0);

            List<Map<String, Object>> leastOps = ops.stream()
                    .filter(r -> Math.abs(((Number) r.get("standard_smv")).doubleValue() - minSmv) < 0.001)
                    .toList();

            List<Map<String, Object>> highestOps = ops.stream()
                    .filter(r -> Math.abs(((Number) r.get("standard_smv")).doubleValue() - maxSmv) < 0.001)
                    .toList();

            analytics.put("minSmvMinutes", minSmv);
            analytics.put("minSmvSeconds", Math.round(minSmv * 60.0 * 10.0) / 10.0);
            analytics.put("maxSmvMinutes", maxSmv);
            analytics.put("maxSmvSeconds", Math.round(maxSmv * 60.0 * 10.0) / 10.0);
            analytics.put("avgSmvMinutes", BigDecimal.valueOf(avgSmv).setScale(2, RoundingMode.HALF_UP));
            analytics.put("avgSmvSeconds", BigDecimal.valueOf(avgSmv * 60.0).setScale(1, RoundingMode.HALF_UP));
            analytics.put("leastSmvOperations", leastOps);
            analytics.put("highestSmvOperations", highestOps);
            analytics.put("allOperationsSorted", ops);
        } catch (Exception e) {
            log.error("Failed to load SMV analytics", e);
            analytics.put("error", e.getMessage());
        }
        return analytics;
    }

    /**
     * Get Complete Operation Bulletin Details with Sequence, SMVs, Machines, and WIP thresholds.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBulletinDetails(String bulletinIdentifier) {
        Map<String, Object> bulletinData = new LinkedHashMap<>();
        try {
            List<Map<String, Object>> bRows;
            if (bulletinIdentifier.matches("^\\d+$")) {
                bRows = jdbcTemplate.queryForList("SELECT * FROM operation_bulletins WHERE id = ?", Long.parseLong(bulletinIdentifier));
            } else {
                bRows = jdbcTemplate.queryForList(
                    "SELECT * FROM operation_bulletins WHERE LOWER(bulletin_code) LIKE ? OR LOWER(name) LIKE ? ORDER BY CASE WHEN LOWER(bulletin_code) = ? THEN 0 ELSE 1 END LIMIT 1",
                    "%" + bulletinIdentifier.toLowerCase() + "%", "%" + bulletinIdentifier.toLowerCase() + "%", bulletinIdentifier.toLowerCase()
                );
            }

            if (bRows.isEmpty()) {
                bRows = jdbcTemplate.queryForList("SELECT * FROM operation_bulletins ORDER BY id ASC LIMIT 1");
                if (bRows.isEmpty()) {
                    return Map.of("found", false, "message", "No bulletin found for '" + bulletinIdentifier + "'");
                }
            }

            Map<String, Object> bulletin = bRows.get(0);
            Long bulId = ((Number) bulletin.get("id")).longValue();
            bulletinData.put("found", true);
            bulletinData.put("bulletin", bulletin);

            // Linked styles
            List<Map<String, Object>> styles = jdbcTemplate.queryForList("""
                SELECT s.id, s.style_no, s.buyer, s.product_type, s.season
                FROM bulletin_styles bs
                JOIN styles s ON bs.style_id = s.id
                WHERE bs.bulletin_id = ?
            """, bulId);
            bulletinData.put("linkedStyles", styles);

            // Lines / routing
            List<Map<String, Object>> lines = jdbcTemplate.queryForList("""
                SELECT bl.id, bl.sequence, bl.smv,
                       ROUND(bl.smv * 60, 1) as smv_seconds,
                       bl.machine_type, bl.skill_rating_required, bl.section,
                       bl.wip_threshold, bl.is_parallelizable, bl.split_allowed, bl.notes,
                       op.operation_code, op.name as operation_name
                FROM bulletin_lines bl
                JOIN operations op ON bl.operation_id = op.id
                WHERE bl.bulletin_id = ?
                ORDER BY bl.sequence ASC
            """, bulId);
            bulletinData.put("routing", lines);

            // Total SMV calculation
            double totalSmvMin = lines.stream().mapToDouble(r -> ((Number) r.get("smv")).doubleValue()).sum();
            bulletinData.put("totalSmvMinutes", BigDecimal.valueOf(totalSmvMin).setScale(3, RoundingMode.HALF_UP));
            bulletinData.put("totalSmvSeconds", BigDecimal.valueOf(totalSmvMin * 60).setScale(1, RoundingMode.HALF_UP));

        } catch (Exception e) {
            log.error("Failed to load bulletin details", e);
            bulletinData.put("found", false);
            bulletinData.put("error", e.getMessage());
        }
        return bulletinData;
    }

    /**
     * Search Garment Styles Master.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchStyles(String query, String buyer) {
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.style_no, s.buyer, s.product_type, s.season, s.active,
                   COUNT(DISTINCT bs.bulletin_id) as linked_bulletins,
                   COUNT(DISTINCT o.id) as active_orders
            FROM styles s
            LEFT JOIN bulletin_styles bs ON s.id = bs.style_id
            LEFT JOIN orders o ON s.id = o.style_id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(s.style_no) LIKE ? OR LOWER(s.product_type) LIKE ? OR LOWER(s.season) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
        }
        if (buyer != null && !buyer.trim().isEmpty() && !buyer.equalsIgnoreCase("ALL")) {
            sql.append(" AND LOWER(s.buyer) LIKE ?");
            params.add("%" + buyer.trim().toLowerCase() + "%");
        }

        sql.append(" GROUP BY s.id, s.style_no, s.buyer, s.product_type, s.season, s.active ORDER BY s.id ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Search Sewing Lines Master.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchSewingLines(String query) {
        StringBuilder sql = new StringBuilder("""
            SELECT l.id, l.line_code, l.line_name, l.line_type, l.floor, l.department,
                   l.supervisor_name, l.ie_in_charge, l.qc_inspector,
                   l.workstation_count, l.operator_count, l.helper_count, l.machine_count,
                   l.capacity_per_day, l.target_efficiency_percent, l.operational_status,
                   l.current_style, l.current_bulletin, l.active
            FROM sewing_lines l
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(l.line_code) LIKE ? OR LOWER(l.line_name) LIKE ? OR LOWER(l.supervisor_name) LIKE ? OR LOWER(l.floor) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        sql.append(" ORDER BY l.id ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Search Machines Inventory.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchMachines(String query, String machineType, String status) {
        StringBuilder sql = new StringBuilder("""
            SELECT m.id, m.machine_code, m.machine_type, m.brand, m.model, m.serial_no,
                   m.status, m.quantity, m.active,
                   l.line_code, l.line_name
            FROM machines m
            LEFT JOIN sewing_lines l ON m.line_id = l.id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(m.machine_code) LIKE ? OR LOWER(m.brand) LIKE ? OR LOWER(m.model) LIKE ? OR LOWER(m.machine_type) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }
        if (machineType != null && !machineType.trim().isEmpty() && !machineType.equalsIgnoreCase("ALL")) {
            sql.append(" AND LOWER(m.machine_type) LIKE ?");
            params.add("%" + machineType.trim().toLowerCase() + "%");
        }
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND m.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY m.id ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Search Production Orders.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchOrders(String query, String buyer, String status) {
        StringBuilder sql = new StringBuilder("""
            SELECT o.id, o.order_no, o.buyer, o.color, o.order_date, o.delivery_date,
                   o.status, o.total_quantity,
                   s.style_no, s.product_type
            FROM orders o
            LEFT JOIN styles s ON o.style_id = s.id
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(o.order_no) LIKE ? OR LOWER(o.buyer) LIKE ? OR LOWER(s.style_no) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
        }
        if (buyer != null && !buyer.trim().isEmpty() && !buyer.equalsIgnoreCase("ALL")) {
            sql.append(" AND LOWER(o.buyer) LIKE ?");
            params.add("%" + buyer.trim().toLowerCase() + "%");
        }
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            sql.append(" AND o.status = ?");
            params.add(status.trim().toUpperCase());
        }

        sql.append(" ORDER BY o.id ASC LIMIT 50");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Search Working Shifts.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchShifts(String query) {
        StringBuilder sql = new StringBuilder("""
            SELECT s.id, s.shift_code, s.shift_name, s.start_time, s.end_time,
                   s.break_duration_minutes, s.active
            FROM shifts s
            WHERE 1=1
        """);
        List<Object> params = new ArrayList<>();

        if (query != null && !query.trim().isEmpty()) {
            sql.append(" AND (LOWER(s.shift_code) LIKE ? OR LOWER(s.shift_name) LIKE ?)");
            String q = "%" + query.trim().toLowerCase() + "%";
            params.add(q);
            params.add(q);
        }

        sql.append(" ORDER BY s.id ASC");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * Line Balancing IE Engineering Calculation Tool.
     */
    public Map<String, Object> calculateLineBalancing(Long bulletinId, Integer operatorCount, Double targetPcsPerHour, Double efficiencyPct) {
        Map<String, Object> calc = new LinkedHashMap<>();
        try {
            Map<String, Object> bData = getBulletinDetails(bulletinId != null ? String.valueOf(bulletinId) : "OB-POLO-800");
            if (!Boolean.TRUE.equals(bData.get("found"))) {
                return bData;
            }

            double totalSmvMin = ((BigDecimal) bData.get("totalSmvMinutes")).doubleValue();
            double totalSmvSec = totalSmvMin * 60.0;
            int ops = operatorCount != null && operatorCount > 0 ? operatorCount : 10;
            double eff = efficiencyPct != null && efficiencyPct > 0 ? efficiencyPct : 85.0;

            // Pitch Time = Total SMV / Operators
            double pitchTimeSec = totalSmvSec / ops;
            double pitchTimeMin = totalSmvMin / ops;

            // Takt Time based on target pcs per hour
            Double taktTimeSec = null;
            if (targetPcsPerHour != null && targetPcsPerHour > 0) {
                taktTimeSec = 3600.0 / targetPcsPerHour;
            }

            // Theoretical Target Output per hour at 100% and expected efficiency
            double target100 = 3600.0 / pitchTimeSec;
            double targetExpected = target100 * (eff / 100.0);

            calc.put("bulletinId", bulletinId);
            calc.put("operatorCount", ops);
            calc.put("efficiencyPct", eff);
            calc.put("totalSmvMinutes", totalSmvMin);
            calc.put("totalSmvSeconds", totalSmvSec);
            calc.put("pitchTimeSeconds", BigDecimal.valueOf(pitchTimeSec).setScale(2, RoundingMode.HALF_UP));
            calc.put("pitchTimeMinutes", BigDecimal.valueOf(pitchTimeMin).setScale(3, RoundingMode.HALF_UP));
            calc.put("taktTimeSeconds", taktTimeSec != null ? BigDecimal.valueOf(taktTimeSec).setScale(2, RoundingMode.HALF_UP) : null);
            calc.put("targetPcsPerHour100Pct", (int) Math.round(target100));
            calc.put("targetPcsPerHourExpected", (int) Math.round(targetExpected));
            calc.put("shiftTarget8Hrs", (int) Math.round(targetExpected * 8.0));

            // Find bottleneck operations whose SMV exceeds pitch time
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routing = (List<Map<String, Object>>) bData.get("routing");
            List<Map<String, Object>> bottlenecks = new ArrayList<>();
            for (Map<String, Object> line : routing) {
                double smvSec = ((Number) line.get("smv_seconds")).doubleValue();
                if (smvSec > pitchTimeSec) {
                    Map<String, Object> bItem = new LinkedHashMap<>(line);
                    bItem.put("varianceSec", BigDecimal.valueOf(smvSec - pitchTimeSec).setScale(1, RoundingMode.HALF_UP));
                    bItem.put("recommendedOps", (int) Math.ceil(smvSec / pitchTimeSec));
                    bottlenecks.add(bItem);
                }
            }
            calc.put("bottleneckOperations", bottlenecks);
            calc.put("bottleneckCount", bottlenecks.size());

        } catch (Exception e) {
            log.error("Failed line balancing calculation", e);
            calc.put("error", e.getMessage());
        }
        return calc;
    }

    /**
     * Hourly Production & WIP Bottleneck Tracking.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getHourlyProductionStats(Long lineId, LocalDate date) {
        Map<String, Object> stats = new LinkedHashMap<>();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        Long targetLine = lineId != null ? lineId : 1L;

        try {
            List<Map<String, Object>> entries = jdbcTemplate.queryForList("""
                SELECT h.hour_slot, h.target_quantity, h.actual_quantity, h.variance,
                       h.efficiency_percentage, h.bottleneck_flag, h.bottleneck_reason,
                       op.name as operator_name, oper.operation_code, oper.name as operation_name
                FROM hourly_production_entries h
                LEFT JOIN operators op ON h.operator_id = op.id
                LEFT JOIN operations oper ON h.operation_id = oper.id
                WHERE h.entry_date = ?
                ORDER BY h.hour_slot ASC, h.id ASC
                LIMIT 50
            """, targetDate);

            if (entries.isEmpty()) {
                entries = jdbcTemplate.queryForList("""
                    SELECT h.entry_date, h.hour_slot, h.target_quantity, h.actual_quantity, h.variance,
                           h.efficiency_percentage, h.bottleneck_flag, h.bottleneck_reason,
                           op.name as operator_name, oper.operation_code
                    FROM hourly_production_entries h
                    LEFT JOIN operators op ON h.operator_id = op.id
                    LEFT JOIN operations oper ON h.operation_id = oper.id
                    ORDER BY h.entry_date DESC, h.hour_slot ASC
                    LIMIT 20
                """);
            }

            int totalActual = entries.stream().mapToInt(r -> r.get("actual_quantity") != null ? ((Number) r.get("actual_quantity")).intValue() : 0).sum();
            int totalTarget = entries.stream().mapToInt(r -> r.get("target_quantity") != null ? ((Number) r.get("target_quantity")).intValue() : 0).sum();
            double avgEff = entries.isEmpty() ? 0 : entries.stream().mapToDouble(r -> r.get("efficiency_percentage") != null ? ((Number) r.get("efficiency_percentage")).doubleValue() : 0.0).average().orElse(0.0);

            stats.put("date", targetDate);
            stats.put("lineId", targetLine);
            stats.put("totalActualPcs", totalActual);
            stats.put("totalTargetPcs", totalTarget);
            stats.put("averageEfficiencyPct", BigDecimal.valueOf(avgEff).setScale(1, RoundingMode.HALF_UP));
            stats.put("entriesCount", entries.size());
            stats.put("records", entries);

        } catch (Exception e) {
            log.error("Failed to load hourly stats", e);
            stats.put("error", e.getMessage());
        }
        return stats;
    }

    /**
     * Universal Multi-Table Keyword Search.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> searchAllTables(String query) {
        Map<String, Object> results = new LinkedHashMap<>();
        if (query == null || query.trim().length() < 2) {
            return results;
        }

        String q = query.trim().toLowerCase();
        // 1. Operators
        List<Map<String, Object>> ops = searchOperators(q, null, null);
        if (!ops.isEmpty()) results.put("operators", ops);

        // 2. Operations
        List<Map<String, Object>> opers = searchOperations(q, null);
        if (!opers.isEmpty()) results.put("operations", opers);

        // 3. Styles
        List<Map<String, Object>> styles = searchStyles(q, q);
        if (!styles.isEmpty()) results.put("styles", styles);

        // 4. Sewing Lines
        List<Map<String, Object>> lines = searchSewingLines(q);
        if (!lines.isEmpty()) results.put("lines", lines);

        // 5. Machines
        List<Map<String, Object>> machines = searchMachines(q, null, null);
        if (!machines.isEmpty()) results.put("machines", machines);

        // 6. Orders
        List<Map<String, Object>> orders = searchOrders(q, q, null);
        if (!orders.isEmpty()) results.put("orders", orders);

        return results;
    }

    /**
     * Database Schema Definition for Grounding / Text-to-SQL synthesis.
     */
    public String getSchemaCatalog() {
        return """
            TABLES IN DATABASE `qtech_linebalancing`:
            1. `operators` (id, employee_id, name, age, gender, department, role [OPERATOR, FLOATER, LINE_SUPERVISOR, QUALITY_CHECKER, HELPER], joining_date, active)
            2. `operations` (id, operation_code, name, standard_smv, machine_type, sequence, active)
            3. `operation_affinities` (id, primary_operation_id, alternative_operation_id, affinity_score, rating_downgrade, notes)
            4. `skill_assessments` (id, operator_id, operation_id, rating [1-5], cycle_time_seconds, revision, effective_date, is_current, notes)
            5. `styles` (id, style_no, buyer, description, season, product_type, active)
            6. `operation_bulletins` (id, bulletin_code, name, description, version, status [DRAFT, PUBLISHED, ARCHIVED], total_smv)
            7. `bulletin_styles` (id, bulletin_id, style_id)
            8. `bulletin_lines` (id, bulletin_id, operation_id, sequence, smv, machine_type, skill_rating_required, section, wip_threshold, is_parallelizable, split_allowed, split_type, notes)
            9. `orders` (id, order_no, buyer, style_id, color, order_date, delivery_date, planned_completion_date, status [PLANNED, IN_PRODUCTION, COMPLETED, ON_HOLD], total_quantity)
            10. `order_size_lines` (id, order_id, size_id, quantity)
            11. `sizes` (id, size_code, sequence_order, active)
            12. `shifts` (id, shift_code, shift_name, start_time, end_time, break_duration_minutes, active)
            13. `sewing_lines` (id, line_code, line_name, line_type, floor, department, supervisor_name, ie_in_charge, qc_inspector, workstation_count, operator_count, helper_count, machine_count, capacity_per_day, target_efficiency_percent, operational_status, current_style, current_bulletin, active)
            14. `machines` (id, machine_code, machine_type, brand, model, serial_no, line_id, status [AVAILABLE, IN_USE, UNDER_MAINTENANCE, IDLE], quantity, active)
            15. `shift_assignments` (id, shift_id, operator_id, assigned_date, status)
            16. `attendance_records` (id, shift_id, operator_id, attendance_date, status [PRESENT, ABSENT, HALF_DAY, ON_LEAVE], remarks)
            17. `hourly_production_entries` (id, line_plan_id, operator_id, operation_id, entry_date, hour_slot, target_quantity, actual_quantity, variance, efficiency_percentage, bottleneck_flag, bottleneck_reason)
            18. `line_plans` (id, shift_id, order_id, line_id, plan_date, planned_output, planned_efficiency, supervisor_name, qc_name, status)
            19. `capacity_plans` (id, style_id, shift_id, order_id, bulletin_id, target_output, total_operators_required, line_efficiency_target, calculated_pitch_time, calculated_takt_time)
            20. `line_designs` (id, shift_id, order_id, line_id, capacity_plan_id, bulletin_id, name, target_output_per_hour, planned_efficiency, strategy_mode, total_workstations, total_operators, pitch_time)
            """;
    }
}
