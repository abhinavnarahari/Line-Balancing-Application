package com.qtech.linebalancing.allocation.dto;

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
