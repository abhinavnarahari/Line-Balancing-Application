package com.qtech.linebalancing.operation.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operation.dto.OperationAffinityRequest;
import com.qtech.linebalancing.operation.dto.OperationAffinityResponse;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.entity.OperationAffinity;
import com.qtech.linebalancing.operation.repository.OperationAffinityRepository;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OperationAffinityService {

    private final OperationAffinityRepository affinityRepository;
    private final OperationRepository operationRepository;

    public List<OperationAffinityResponse> getAffinitiesForOperation(Long operationId) {
        if (!operationRepository.existsById(operationId)) {
            throw new ResourceNotFoundException("Operation", "id", operationId);
        }
        return affinityRepository.findByPrimaryOperationId(operationId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<OperationAffinityResponse> getAllAffinities() {
        return affinityRepository.findAllWithOperations()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OperationAffinityResponse createOrUpdateAffinity(Long primaryOpId, OperationAffinityRequest request) {
        if (Objects.equals(primaryOpId, request.getAlternativeOperationId())) {
            throw new BusinessRuleException("An operation cannot be affinitized with itself.");
        }

        Operation primaryOp = operationRepository.findById(primaryOpId)
                .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", primaryOpId));

        Operation altOp = operationRepository.findById(request.getAlternativeOperationId())
                .orElseThrow(() -> new ResourceNotFoundException("Alternative Operation", "id", request.getAlternativeOperationId()));

        boolean machineComp = request.getMachineCompatible() != null
                ? request.getMachineCompatible()
                : isMachineCompatible(primaryOp.getMachineType(), altOp.getMachineType());

        BigDecimal transferPct = request.getEfficiencyTransferPct() != null
                ? request.getEfficiencyTransferPct()
                : getDefaultTransferPct(request.getAffinityLevel());

        Integer downgrade = request.getRatingDowngrade() != null
                ? request.getRatingDowngrade()
                : getDefaultRatingDowngrade(request.getAffinityLevel());

        OperationAffinity affinity = affinityRepository
                .findByPrimaryOperationIdAndAlternativeOperationId(primaryOpId, altOp.getId())
                .orElse(OperationAffinity.builder()
                        .primaryOperation(primaryOp)
                        .alternativeOperation(altOp)
                        .build());

        affinity.setAffinityLevel(request.getAffinityLevel());
        affinity.setEfficiencyTransferPct(transferPct);
        affinity.setRatingDowngrade(downgrade);
        affinity.setMachineCompatible(machineComp);
        affinity.setNotes(request.getNotes());

        OperationAffinity saved = affinityRepository.save(affinity);

        // Optionally create symmetric reverse relationship
        if (Boolean.TRUE.equals(request.getCreateSymmetric())) {
            OperationAffinity reverse = affinityRepository
                    .findByPrimaryOperationIdAndAlternativeOperationId(altOp.getId(), primaryOpId)
                    .orElse(OperationAffinity.builder()
                            .primaryOperation(altOp)
                            .alternativeOperation(primaryOp)
                            .build());

            reverse.setAffinityLevel(request.getAffinityLevel());
            reverse.setEfficiencyTransferPct(transferPct);
            reverse.setRatingDowngrade(downgrade);
            reverse.setMachineCompatible(machineComp);
            reverse.setNotes(request.getNotes());
            affinityRepository.save(reverse);
        }

        return toResponse(saved);
    }

    @Transactional
    public void deleteAffinity(Long affinityId) {
        OperationAffinity affinity = affinityRepository.findById(affinityId)
                .orElseThrow(() -> new ResourceNotFoundException("OperationAffinity", "id", affinityId));
        affinityRepository.delete(affinity);
    }

    @Transactional
    public void deleteAffinityPair(Long primaryOpId, Long altOpId) {
        affinityRepository.findByPrimaryOperationIdAndAlternativeOperationId(primaryOpId, altOpId)
                .ifPresent(affinityRepository::delete);
        affinityRepository.findByPrimaryOperationIdAndAlternativeOperationId(altOpId, primaryOpId)
                .ifPresent(affinityRepository::delete);
    }

    private boolean isMachineCompatible(String m1, String m2) {
        if (m1 == null || m2 == null) return true;
        return m1.trim().equalsIgnoreCase(m2.trim());
    }

    private BigDecimal getDefaultTransferPct(OperationAffinity.AffinityLevel level) {
        if (level == null) return new BigDecimal("90.00");
        return switch (level) {
            case DIRECT_SUBSTITUTE -> new BigDecimal("95.00");
            case SIMILAR_TECHNIQUE -> new BigDecimal("85.00");
            case BASIC_COMPATIBLE -> new BigDecimal("70.00");
        };
    }

    private Integer getDefaultRatingDowngrade(OperationAffinity.AffinityLevel level) {
        return 0;
    }

    private OperationAffinityResponse toResponse(OperationAffinity a) {
        return OperationAffinityResponse.builder()
                .id(a.getId())
                .primaryOperationId(a.getPrimaryOperation().getId())
                .primaryOperationCode(a.getPrimaryOperation().getOperationCode())
                .primaryOperationName(a.getPrimaryOperation().getName())
                .primaryMachineType(a.getPrimaryOperation().getMachineType())
                .alternativeOperationId(a.getAlternativeOperation().getId())
                .alternativeOperationCode(a.getAlternativeOperation().getOperationCode())
                .alternativeOperationName(a.getAlternativeOperation().getName())
                .alternativeMachineType(a.getAlternativeOperation().getMachineType())
                .alternativeStandardSmv(a.getAlternativeOperation().getStandardSmv())
                .affinityLevel(a.getAffinityLevel())
                .efficiencyTransferPct(a.getEfficiencyTransferPct())
                .ratingDowngrade(a.getRatingDowngrade())
                .machineCompatible(a.isMachineCompatible())
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
