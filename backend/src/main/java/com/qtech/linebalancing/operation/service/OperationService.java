package com.qtech.linebalancing.operation.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operation.dto.OperationRequest;
import com.qtech.linebalancing.operation.dto.OperationResponse;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationService {

    private final OperationRepository operationRepository;

    public List<OperationResponse> getAll(Boolean active) {
        List<Operation> ops = (active != null)
                ? operationRepository.findByActiveOrderBySequenceAsc(active)
                : operationRepository.findAllByOrderBySequenceAsc();
        return ops.stream().map(this::toResponse).toList();
    }

    public OperationResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public OperationResponse create(OperationRequest request) {
        validateUniqueness(request.getOperationCode(), request.getName(), null);
        Operation op = Operation.builder()
                .operationCode(request.getOperationCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .sequence(request.getSequence())
                .active(request.isActive())
                .build();
        return toResponse(operationRepository.save(op));
    }

    @Transactional
    public OperationResponse update(Long id, OperationRequest request) {
        Operation op = findOrThrow(id);
        validateUniqueness(request.getOperationCode(), request.getName(), id);
        op.setOperationCode(request.getOperationCode().toUpperCase());
        op.setName(request.getName());
        op.setDescription(request.getDescription());
        op.setSequence(request.getSequence());
        op.setActive(request.isActive());
        return toResponse(operationRepository.save(op));
    }

    @Transactional
    public OperationResponse toggleStatus(Long id) {
        Operation op = findOrThrow(id);
        op.setActive(!op.isActive());
        return toResponse(operationRepository.save(op));
    }

    public Operation findEntityById(Long id) {
        return findOrThrow(id);
    }

    private void validateUniqueness(String code, String name, Long excludeId) {
        boolean codeExists = (excludeId == null)
                ? operationRepository.existsByOperationCodeIgnoreCase(code)
                : operationRepository.existsByOperationCodeIgnoreCaseAndIdNot(code, excludeId);
        if (codeExists) throw new BusinessRuleException("Operation code '" + code + "' already exists.");

        boolean nameExists = (excludeId == null)
                ? operationRepository.existsByNameIgnoreCase(name)
                : operationRepository.existsByNameIgnoreCaseAndIdNot(name, excludeId);
        if (nameExists) throw new BusinessRuleException("Operation name '" + name + "' already exists.");
    }

    private Operation findOrThrow(Long id) {
        return operationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", id));
    }

    private OperationResponse toResponse(Operation op) {
        OperationResponse resp = new OperationResponse();
        resp.setId(op.getId());
        resp.setOperationCode(op.getOperationCode());
        resp.setName(op.getName());
        resp.setDescription(op.getDescription());
        resp.setSequence(op.getSequence());
        resp.setActive(op.isActive());
        resp.setCreatedAt(op.getCreatedAt());
        resp.setUpdatedAt(op.getUpdatedAt());
        return resp;
    }
}
