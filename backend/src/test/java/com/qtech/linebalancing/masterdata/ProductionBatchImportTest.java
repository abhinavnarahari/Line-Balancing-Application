package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.production.dto.PieceProductionLogRequest;
import com.qtech.linebalancing.production.service.PieceProductionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class ProductionBatchImportTest {

    @Autowired private PieceProductionService service;
    @Autowired private JdbcTemplate jdbc;

    private Long operatorId() {
        return jdbc.queryForObject("INSERT INTO operators (employee_id, name, gender, department, joining_date, active) "
                + "VALUES ('ZZ-PRD', 'Prod Test', 'Female', 'Sewing', CURRENT_DATE, true) RETURNING id", Long.class);
    }

    private PieceProductionLogRequest run(Long operatorId, String start, int good, int reject, int completed) {
        return PieceProductionLogRequest.builder()
                .operatorId(operatorId).operationName("ZZ op")
                .targetQty(0).goodQty(good).rejectQty(reject).completedQty(completed)
                .startTime(LocalTime.parse(start)).endTime(LocalTime.parse(start).plusHours(1))
                .logDate(LocalDate.of(2026, 1, 5)).build();
    }

    private int countFor(Long operatorId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM piece_production_logs WHERE operator_id = ?", Integer.class, operatorId);
    }

    @Test
    void validBatchRecordsEveryRun() {
        Long op = operatorId();
        var saved = service.recordPieceLogsBatch(List.of(run(op, "09:00", 100, 2, 102), run(op, "10:00", 90, 0, 90)));
        assertThat(saved).hasSize(2);
        assertThat(countFor(op)).isEqualTo(2);
    }

    @Test
    void oneBadRunRejectsTheBatchAndNamesIt() {
        Long op = operatorId();
        assertThatThrownBy(() -> service.recordPieceLogsBatch(List.of(run(op, "09:00", 100, 2, 102), run(op, "10:00", 90, 5, 90))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageStartingWith("Run 2:");
    }
}
