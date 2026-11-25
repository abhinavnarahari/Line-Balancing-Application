package com.qtech.linebalancing.hourly;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.hourly.service.HourlyProductionService;
import com.qtech.linebalancing.lineplan.entity.LinePlan;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** FUNC-07. Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class HourlyBoardReadOnlyTest {

    @Autowired private HourlyProductionService service;
    @Autowired private LinePlanRepository linePlanRepository;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private EntityManager em;

    private LinePlan anyPlanWithOrder() {
        LinePlan plan = linePlanRepository.findAll().stream().filter(p -> p.getOrder() != null).findFirst().orElse(null);
        assumeThat(plan).as("needs a seeded line plan").isNotNull();
        return plan;
    }

    @Test
    void viewingWithAnotherShiftDoesNotChangeThePlan() {
        LinePlan plan = anyPlanWithOrder();
        Long originalShift = plan.getShift().getId();
        Shift other = shiftRepository.findAll().stream().filter(s -> !s.getId().equals(originalShift)).findFirst().orElse(null);
        assumeThat(other).isNotNull();

        var board = service.buildBoard(null, plan.getOrder().getId(), other.getId(), LocalDate.now());
        assertThat(board.getShiftName()).isEqualTo(other.getShiftName());

        em.flush();
        em.clear();
        assertThat(linePlanRepository.findById(plan.getId()).orElseThrow().getShift().getId()).isEqualTo(originalShift);
    }

    @Test
    void boardForOrderWithoutPlanIs404AndCreatesNothing_initCreatesExactlyOne() {
        LinePlan plan = anyPlanWithOrder();
        Long orderId = plan.getOrder().getId();
        linePlanRepository.delete(plan);
        em.flush();

        assertThatThrownBy(() -> service.buildBoard(null, orderId, null, LocalDate.now()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No line plan exists");
        assertThat(linePlanRepository.findFirstByOrderIdOrderByIdAsc(orderId)).isEmpty();

        LinePlan created = service.initLinePlan(orderId, null);
        assertThat(created.getAssignments()).isNotEmpty()
                .allMatch(a -> a.getOperator() == null && a.getBulletinLine() != null);
        assertThat(service.initLinePlan(orderId, null).getId()).isEqualTo(created.getId());
    }

    @Test
    void databaseRejectsASecondPlanForTheSameOrder() {
        LinePlan plan = anyPlanWithOrder();
        LinePlan duplicate = new LinePlan();
        duplicate.setOrder(plan.getOrder());
        duplicate.setShift(plan.getShift());
        duplicate.setTargetOutput(100);
        duplicate.setAllowance(10);
        duplicate.setStatus("draft");
        assertThatThrownBy(() -> {
            linePlanRepository.save(duplicate);
            em.flush();
        }).isInstanceOfAny(DataIntegrityViolationException.class, org.hibernate.exception.ConstraintViolationException.class);
    }
}
