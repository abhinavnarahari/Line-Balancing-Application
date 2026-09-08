package com.qtech.linebalancing.operator.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.dto.OperatorResponse;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OperatorService {

    private final OperatorRepository operatorRepository;

    public List<OperatorResponse> getAll(String search, Boolean active) {
        return operatorRepository.searchOperators(search, active)
                .stream().map(this::toResponse).toList();
    }

    public OperatorResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public OperatorResponse create(OperatorRequest request) {
        if (operatorRepository.existsByEmployeeIdIgnoreCase(request.getEmployeeId())) {
            throw new BusinessRuleException(
                    "Operator with Employee ID '" + request.getEmployeeId() + "' already exists.");
        }
        Operator operator = Operator.builder()
                .employeeId(request.getEmployeeId().toUpperCase())
                .name(request.getName())
                .age(request.getAge())
                .gender(request.getGender())
                .department(request.getDepartment())
                .joiningDate(request.getJoiningDate())
                .role(request.getRole() != null ? request.getRole() : Operator.OperatorRole.OPERATOR)
                .active(request.isActive())
                .build();
        log.info("Creating operator: {}", operator.getEmployeeId());
        return toResponse(operatorRepository.save(operator));
    }

    @Transactional
    public OperatorResponse update(Long id, OperatorRequest request) {
        Operator operator = findOrThrow(id);
        if (operatorRepository.existsByEmployeeIdIgnoreCaseAndIdNot(request.getEmployeeId(), id)) {
            throw new BusinessRuleException(
                    "Operator with Employee ID '" + request.getEmployeeId() + "' already exists.");
        }
        operator.setEmployeeId(request.getEmployeeId().toUpperCase());
        operator.setName(request.getName());
        operator.setAge(request.getAge());
        operator.setGender(request.getGender());
        operator.setDepartment(request.getDepartment());
        operator.setJoiningDate(request.getJoiningDate());
        if (request.getRole() != null) {
            operator.setRole(request.getRole());
        }
        operator.setActive(request.isActive());
        return toResponse(operatorRepository.save(operator));
    }

    @Transactional
    public OperatorResponse toggleStatus(Long id) {
        Operator operator = findOrThrow(id);
        operator.setActive(!operator.isActive());
        log.info("Operator '{}' status toggled to active={}", operator.getEmployeeId(), operator.isActive());
        return toResponse(operatorRepository.save(operator));
    }

    // ── Used by other services ──────────────────────────────────────────────────

    public Operator findEntityById(Long id) {
        return findOrThrow(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private Operator findOrThrow(Long id) {
        return operatorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operator", "id", id));
    }

    private OperatorResponse toResponse(Operator op) {
        OperatorResponse resp = new OperatorResponse();
        resp.setId(op.getId());
        resp.setEmployeeId(op.getEmployeeId());
        resp.setName(op.getName());
        resp.setAge(op.getAge());
        resp.setGender(op.getGender());
        resp.setDepartment(op.getDepartment());
        resp.setJoiningDate(op.getJoiningDate());
        resp.setRole(op.getRole() != null ? op.getRole() : Operator.OperatorRole.OPERATOR);
        resp.setActive(op.isActive());
        resp.setCreatedAt(op.getCreatedAt());
        resp.setUpdatedAt(op.getUpdatedAt());
        return resp;
    }
}
