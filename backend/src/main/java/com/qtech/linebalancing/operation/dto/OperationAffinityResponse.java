package com.qtech.linebalancing.operation.dto;

import com.qtech.linebalancing.operation.entity.OperationAffinity.AffinityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationAffinityResponse {

    private Long id;

    private Long primaryOperationId;
    private String primaryOperationCode;
    private String primaryOperationName;
    private String primaryMachineType;

    private Long alternativeOperationId;
    private String alternativeOperationCode;
    private String alternativeOperationName;
    private String alternativeMachineType;
    private BigDecimal alternativeStandardSmv;

    private AffinityLevel affinityLevel;
    private BigDecimal efficiencyTransferPct;
    private Integer ratingDowngrade;
    private boolean machineCompatible;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
