package com.qtech.linebalancing.operator.service;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operator.dto.OperatorPlacementResponse;
import com.qtech.linebalancing.operator.dto.OperatorPlacementResponse.LinePlacement;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Read-only view of an operator's placement, built from saved line plans and shift assignments. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperatorPlacementService {

    private final JdbcTemplate jdbc;
    private final OperatorRepository operatorRepository;

    public OperatorPlacementResponse getPlacement(Long operatorId) {
        if (!operatorRepository.existsById(operatorId)) {
            throw new ResourceNotFoundException("Operator", "id", operatorId);
        }

        // Stations the operator holds in plans of orders that are not finished
        Map<Long, LinePlacement> byPlan = new LinkedHashMap<>();
        jdbc.query("""
                SELECT lp.id AS plan_id, sl.id AS line_id, sl.line_code, sl.line_name,
                       o.id AS order_id, o.order_no, o.status AS order_status, s.shift_name, op.name AS operation_name
                  FROM line_plan_assignments a
                  JOIN line_plans lp ON lp.id = a.line_plan_id
                  JOIN orders o ON o.id = lp.order_id
                  LEFT JOIN sewing_lines sl ON sl.id = lp.line_id
                  LEFT JOIN shifts s ON s.id = lp.shift_id
                  LEFT JOIN operations op ON op.id = a.operation_id
                 WHERE a.operator_id = ? AND o.status <> 'COMPLETED'
                 ORDER BY o.delivery_date NULLS LAST, lp.id, a.id
                """, rs -> {
            long planId = rs.getLong("plan_id");
            LinePlacement p = byPlan.computeIfAbsent(planId, k -> {
                try {
                    Long lineId = rs.getObject("line_id") == null ? null : rs.getLong("line_id");
                    return new LinePlacement(lineId, rs.getString("line_code"), rs.getString("line_name"),
                            rs.getLong("order_id"), rs.getString("order_no"), rs.getString("order_status"),
                            rs.getString("shift_name"), new ArrayList<>());
                } catch (java.sql.SQLException e) {
                    throw new IllegalStateException(e);
                }
            });
            String operation = rs.getString("operation_name");
            if (operation != null && !p.operations().contains(operation)) p.operations().add(operation);
        }, operatorId);

        LocalDate today = LocalDate.now();
        List<String> shifts = jdbc.queryForList("""
                SELECT s.shift_name
                  FROM shift_assignments sa JOIN shifts s ON s.id = sa.shift_id
                 WHERE sa.operator_id = ? AND sa.effective_from <= ? AND (sa.effective_to IS NULL OR sa.effective_to >= ?)
                 ORDER BY sa.effective_from DESC
                 LIMIT 1
                """, String.class, operatorId, today, today);

        return new OperatorPlacementResponse(List.copyOf(byPlan.values()), shifts.isEmpty() ? null : shifts.get(0));
    }
}
