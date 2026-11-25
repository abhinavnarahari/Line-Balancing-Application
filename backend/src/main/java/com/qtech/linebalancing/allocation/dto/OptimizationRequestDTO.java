package com.qtech.linebalancing.allocation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationRequestDTO {

    private String plantLocation;
    private LocalDate planningDate;
    private Long shiftId;
    private List<Long> lineIds;
    private String primaryScenario; // MAX_OUTPUT, BALANCED_LINES, PRIORITY_PROTECTION, MIN_MANPOWER
    private List<FixedAssignmentItem> fixedAssignments;
    private Boolean allowCrossLineTransfers;
    private Boolean allowTraineesOnSimpleOps;
    private String createdBy;

    /** Optional solver weights (0-100) from the UI sliders; null keeps the scenario's built-in scoring. */
    @Valid
    private SolverWeights weights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SolverWeights {
        @Min(0) @Max(100) private Integer efficiencyWeight;
        @Min(0) @Max(100) private Integer lineBalanceWeight;
        @Min(0) @Max(100) private Integer skillMatchWeight;
        @Min(0) @Max(100) private Integer machineCompatWeight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FixedAssignmentItem {
        private Long lineId;
        private Integer stationIndex;
        private Long operatorId;
        private String justification;
    }
}
