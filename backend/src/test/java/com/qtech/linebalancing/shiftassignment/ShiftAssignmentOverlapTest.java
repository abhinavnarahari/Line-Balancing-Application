package com.qtech.linebalancing.shiftassignment;

import com.qtech.linebalancing.allocation.service.OperatorPoolService;
import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentRequest;
import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository;
import com.qtech.linebalancing.shiftassignment.service.ShiftAssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** REL-03. Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class ShiftAssignmentOverlapTest {

    private static final LocalDate BASE = LocalDate.of(2032, 3, 1);

    @Autowired private ShiftAssignmentService service;
    @Autowired private ShiftAssignmentRepository repository;
    @Autowired private OperatorRepository operatorRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private OperatorPoolService poolService;

    private Operator operator;
    private List<Shift> shifts;

    @BeforeEach
    void setUp() {
        operator = operatorRepository.findAll().stream().filter(Operator::isActive).findFirst().orElse(null);
        shifts = shiftRepository.findAll();
        assumeThat(operator).isNotNull();
        assumeThat(shifts.size()).isGreaterThanOrEqualTo(2);
    }

    private ShiftAssignmentRequest req(Shift shift, LocalDate from, LocalDate to) {
        ShiftAssignmentRequest r = new ShiftAssignmentRequest();
        r.setOperatorId(operator.getId());
        r.setShiftId(shift.getId());
        r.setEffectiveFrom(from);
        r.setEffectiveTo(to);
        return r;
    }

    @Test
    void overlappingBoundedPeriodsAreRejectedButAdjacentOnesAreAllowed() {
        service.assign(req(shifts.get(0), BASE, BASE.plusDays(9)));
        assertThatThrownBy(() -> service.assign(req(shifts.get(1), BASE.plusDays(5), BASE.plusDays(20))))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("already assigned");
        assertThat(service.assign(req(shifts.get(1), BASE.plusDays(10), null)).getId()).isNotNull();
    }

    @Test
    void legacyOverlapsDoNotBreakLookupsAndMostRecentWins() {
        // Bypass the service to simulate overlapping rows created before the rule existed
        repository.save(ShiftAssignment.builder().operator(operator).shift(shifts.get(0))
                .effectiveFrom(BASE).status(ShiftAssignment.Status.ACTIVE).build());
        ShiftAssignment newer = repository.save(ShiftAssignment.builder().operator(operator).shift(shifts.get(1))
                .effectiveFrom(BASE.plusDays(3)).status(ShiftAssignment.Status.ACTIVE).build());

        assertThat(repository.findCurrentAssignment(operator.getId(), BASE.plusDays(5)))
                .get().extracting(ShiftAssignment::getId).isEqualTo(newer.getId());

        var poolEntry = poolService.getOperatorPool(BASE.plusDays(5), shifts.get(1).getId()).stream()
                .filter(p -> p.getOperatorId().equals(operator.getId())).findFirst();
        assertThat(poolEntry).isPresent();
    }
}
