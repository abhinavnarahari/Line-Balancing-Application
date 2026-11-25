package com.qtech.linebalancing.shiftassignment;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentRequest;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentResponse;
import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import com.qtech.linebalancing.shiftassignment.service.ShiftAssignmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class ShiftAssignmentUpdateTest {

    @Autowired private ShiftAssignmentService service;
    @Autowired private OperatorRepository operatorRepository;
    @Autowired private ShiftRepository shiftRepository;

    @Test
    void updateChangesDatesAndDerivesStatus() {
        Operator op = operatorRepository.findAll().stream().filter(Operator::isActive).findFirst().orElse(null);
        Shift shift = shiftRepository.findAll().stream().findFirst().orElse(null);
        assumeThat(op).isNotNull();
        assumeThat(shift).isNotNull();

        ShiftAssignmentRequest req = new ShiftAssignmentRequest();
        req.setOperatorId(op.getId());
        req.setShiftId(shift.getId());
        req.setEffectiveFrom(LocalDate.now().plusDays(10));
        req.setEffectiveTo(LocalDate.now().plusDays(20));
        ShiftAssignmentResponse created = service.assign(req);

        req.setEffectiveFrom(LocalDate.now().minusDays(30));
        req.setEffectiveTo(LocalDate.now().minusDays(1));
        ShiftAssignmentResponse updated = service.update(created.getId(), req);
        assertThat(updated.getEffectiveFrom()).isEqualTo(LocalDate.now().minusDays(30));
        assertThat(updated.getStatus()).isEqualTo(ShiftAssignment.Status.COMPLETED);

        req.setEffectiveTo(LocalDate.now().minusDays(40));
        assertThatThrownBy(() -> service.update(created.getId(), req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("End date");
    }
}
