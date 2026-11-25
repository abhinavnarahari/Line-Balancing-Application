package com.qtech.linebalancing.shiftassignment.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorService;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentRequest;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentResponse;
import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ShiftAssignmentService {

    private final ShiftAssignmentRepository assignmentRepository;
    private final OperatorService operatorService;
    private final ShiftRepository shiftRepository;

    public List<ShiftAssignmentResponse> getAll() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public List<ShiftAssignmentResponse> getByOperator(Long operatorId) {
        return assignmentRepository.findByOperatorIdOrderByEffectiveFromDesc(operatorId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ShiftAssignmentResponse assign(ShiftAssignmentRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());

        // Business Rule 1: Inactive operators cannot receive new assignments
        if (!operator.isActive()) {
            throw new BusinessRuleException(
                    "Operator '" + operator.getEmployeeId() + "' is inactive and cannot be assigned to a shift.");
        }

        // Business Rule 2: an operator works one shift at a time — assignment periods must not overlap
        if (request.getEffectiveTo() != null && request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
            throw new BusinessRuleException("End date cannot be before the effective from date.");
        }
        assertNoOverlap(operator, request.getEffectiveFrom(), request.getEffectiveTo(), null);

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShiftId()));

        ShiftAssignment assignment = ShiftAssignment.builder()
                .operator(operator)
                .shift(shift)
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .status(ShiftAssignment.Status.ACTIVE)
                .build();

        log.info("Assigning operator {} to shift {} from {}", operator.getEmployeeId(), shift.getShiftCode(), request.getEffectiveFrom());
        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public ShiftAssignmentResponse update(Long id, ShiftAssignmentRequest request) {
        ShiftAssignment assignment = findOrThrow(id);
        Operator operator = operatorService.findEntityById(request.getOperatorId());

        if (!operator.isActive()) {
            throw new BusinessRuleException(
                    "Operator '" + operator.getEmployeeId() + "' is inactive and cannot be assigned to a shift.");
        }
        if (request.getEffectiveTo() != null && request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
            throw new BusinessRuleException("End date cannot be before the effective from date.");
        }

        assertNoOverlap(operator, request.getEffectiveFrom(), request.getEffectiveTo(), id);

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShiftId()));

        assignment.setOperator(operator);
        assignment.setShift(shift);
        assignment.setEffectiveFrom(request.getEffectiveFrom());
        assignment.setEffectiveTo(request.getEffectiveTo());
        boolean ended = request.getEffectiveTo() != null && request.getEffectiveTo().isBefore(LocalDate.now());
        assignment.setStatus(ended ? ShiftAssignment.Status.COMPLETED : ShiftAssignment.Status.ACTIVE);

        log.info("Updated shift assignment {} for operator {}", id, operator.getEmployeeId());
        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public ShiftAssignmentResponse endAssignment(Long id, LocalDate endDate) {
        ShiftAssignment assignment = findOrThrow(id);
        if (endDate.isBefore(assignment.getEffectiveFrom())) {
            throw new BusinessRuleException("End date cannot be before the effective from date.");
        }
        assignment.setEffectiveTo(endDate);
        assignment.setStatus(ShiftAssignment.Status.COMPLETED);
        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void delete(Long id) {
        ShiftAssignment assignment = findOrThrow(id);
        assignmentRepository.delete(assignment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Rejects a period that overlaps any other assignment of the operator (null end = open-ended). */
    private void assertNoOverlap(Operator operator, LocalDate from, LocalDate to, Long ignoreId) {
        for (ShiftAssignment other : assignmentRepository.findByOperatorIdOrderByEffectiveFromDesc(operator.getId())) {
            if (ignoreId != null && other.getId().equals(ignoreId)) {
                continue;
            }
            boolean startsBeforeOtherEnds = other.getEffectiveTo() == null || !from.isAfter(other.getEffectiveTo());
            boolean endsAfterOtherStarts = to == null || !to.isBefore(other.getEffectiveFrom());
            if (startsBeforeOtherEnds && endsAfterOtherStarts) {
                throw new BusinessRuleException("Operator '" + operator.getEmployeeId() + "' is already assigned to shift "
                        + other.getShift().getShiftCode() + " from " + other.getEffectiveFrom()
                        + (other.getEffectiveTo() != null ? " to " + other.getEffectiveTo() : " (open-ended)")
                        + ". End or adjust that assignment first.");
            }
        }
    }

    private ShiftAssignment findOrThrow(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShiftAssignment", "id", id));
    }

    private ShiftAssignmentResponse toResponse(ShiftAssignment sa) {
        ShiftAssignmentResponse resp = new ShiftAssignmentResponse();
        resp.setId(sa.getId());
        resp.setOperatorId(sa.getOperator().getId());
        resp.setOperatorName(sa.getOperator().getName());
        resp.setEmployeeId(sa.getOperator().getEmployeeId());
        resp.setShiftId(sa.getShift().getId());
        resp.setShiftCode(sa.getShift().getShiftCode());
        resp.setShiftName(sa.getShift().getShiftName());
        resp.setEffectiveFrom(sa.getEffectiveFrom());
        resp.setEffectiveTo(sa.getEffectiveTo());
        resp.setStatus(sa.getStatus());
        resp.setCreatedAt(sa.getCreatedAt());
        resp.setUpdatedAt(sa.getUpdatedAt());
        return resp;
    }
}
