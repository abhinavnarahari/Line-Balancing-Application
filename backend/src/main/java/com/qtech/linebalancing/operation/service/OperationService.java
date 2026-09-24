package com.qtech.linebalancing.operation.service;

import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import com.qtech.linebalancing.capacity.repository.CapacityPlanRepository;
import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operation.dto.OperationRequest;
import com.qtech.linebalancing.operation.dto.OperationResponse;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.BulletinLineRepository;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OperationService {

    private final OperationRepository operationRepository;
    private final BulletinLineRepository bulletinLineRepository;
    private final OperationBulletinRepository operationBulletinRepository;
    private final CapacityPlanRepository capacityPlanRepository;

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
                .standardSmv(request.getStandardSmv())
                .machineType(request.getMachineType() != null && !request.getMachineType().isBlank() ? request.getMachineType().trim() : "Single Needle Lockstitch")
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
        op.setStandardSmv(request.getStandardSmv());
        if (request.getMachineType() != null) {
            op.setMachineType(request.getMachineType().trim());
        }
        Operation saved = operationRepository.save(op);

        // Synchronize updated SMV and Machine Type across all Operation Bulletin lines
        if (request.getStandardSmv() != null) {
            List<BulletinLine> lines = bulletinLineRepository.findByOperationId(id);
            if (lines != null && !lines.isEmpty()) {
                Set<OperationBulletin> affectedBulletins = new HashSet<>();
                for (BulletinLine line : lines) {
                    line.setSmv(request.getStandardSmv());
                    if (request.getMachineType() != null && !request.getMachineType().isBlank()) {
                        line.setMachineType(request.getMachineType().trim());
                    }
                    if (line.getBulletin() != null) {
                        affectedBulletins.add(line.getBulletin());
                    }
                }
                bulletinLineRepository.saveAll(lines);

                for (OperationBulletin b : affectedBulletins) {
                    List<BulletinLine> bLines = bulletinLineRepository.findByBulletinIdOrderBySequenceAsc(b.getId());
                    BigDecimal newTotal = bLines.stream()
                            .map(BulletinLine::getSmv)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    b.setTotalSmv(newTotal);
                    operationBulletinRepository.save(b);

                    // Also update Capacity Plans matching this bulletin
                    List<CapacityPlan> cPlans = capacityPlanRepository.findByBulletinId(b.getId());
                    if (cPlans != null && !cPlans.isEmpty()) {
                        for (CapacityPlan cp : cPlans) {
                            cp.setTotalSmvMinutes(newTotal.doubleValue());
                        }
                        capacityPlanRepository.saveAll(cPlans);
                    }
                }
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public OperationResponse toggleStatus(Long id) {
        Operation op = findOrThrow(id);
        op.setActive(!op.isActive());
        return toResponse(operationRepository.save(op));
    }

    @Transactional
    public void delete(Long id) {
        Operation op = findOrThrow(id);
        operationRepository.delete(op);
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
        resp.setStandardSmv(op.getStandardSmv());
        resp.setMachineType(op.getMachineType() != null ? op.getMachineType() : "Single Needle Lockstitch");
        resp.setCreatedAt(op.getCreatedAt());
        resp.setUpdatedAt(op.getUpdatedAt());
        return resp;
    }
}
