package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorPlacementService;
import com.qtech.linebalancing.operator.service.OperatorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class OperatorPlacementTest {

    @Autowired private OperatorService operatorService;
    @Autowired private OperatorPlacementService placementService;
    @Autowired private JdbcTemplate jdbc;

    private Long newOperator() {
        OperatorRequest req = new OperatorRequest();
        req.setEmployeeId("ZZ-PLACE");
        req.setName("Placement Test");
        req.setGender(Operator.Gender.Female);
        req.setDepartment("Sewing");
        req.setJoiningDate(LocalDate.now());
        return operatorService.create(req).getId();
    }

    @Test
    void unplacedOperatorHasNoLinesAndNoShift() {
        var placement = placementService.getPlacement(newOperator());
        assertThat(placement.lines()).isEmpty();
        assertThat(placement.currentShift()).isNull();
    }

    @Test
    void currentShiftComesFromTodaysShiftAssignment() {
        Long operatorId = newOperator();
        Long shiftId = jdbc.queryForObject("INSERT INTO shifts (shift_code, shift_name, start_time, end_time, break_duration_minutes, active) "
                + "VALUES ('ZZP', 'ZZ Placement Shift', ?, ?, 60, true) RETURNING id", Long.class, LocalTime.of(8, 0), LocalTime.of(17, 0));
        jdbc.update("INSERT INTO shift_assignments (operator_id, shift_id, effective_from) VALUES (?, ?, ?)",
                operatorId, shiftId, LocalDate.now().minusDays(3));

        assertThat(placementService.getPlacement(operatorId).currentShift()).isEqualTo("ZZ Placement Shift");
    }

    @Test
    void unknownOperatorIsNotFound() {
        assertThatThrownBy(() -> placementService.getPlacement(-1L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
