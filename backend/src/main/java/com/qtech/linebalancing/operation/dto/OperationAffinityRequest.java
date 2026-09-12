package com.qtech.linebalancing.operation.dto;

import com.qtech.linebalancing.operation.entity.OperationAffinity.AffinityLevel;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationAffinityRequest {

    @NotNull(message = "Alternative operation ID is required")
    private Long alternativeOperationId;

    @Builder.Default
    private AffinityLevel affinityLevel = AffinityLevel.DIRECT_SUBSTITUTE;

    @Builder.Default
    private BigDecimal efficiencyTransferPct = new BigDecimal("90.00");

    @Builder.Default
    private Integer ratingDowngrade = 0;

    @Builder.Default
    private Boolean machineCompatible = true;

    private String notes;

    /**
     * If true, also automatically creates/updates the symmetric reverse affinity mapping.
     */
    @Builder.Default
    private Boolean createSymmetric = true;
}
