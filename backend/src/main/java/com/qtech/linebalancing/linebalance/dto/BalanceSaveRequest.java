package com.qtech.linebalancing.linebalance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BalanceSaveRequest {

    @NotNull(message = "Line Design ID is required")
    private Long lineDesignId;

    private List<WorkstationSaveDTO> workstations;
    private List<OperatorPlacementSaveDTO> operatorPlacements;

    @Data
    public static class WorkstationSaveDTO {
        private Integer stationIndex;
        private String stationCode;
        private String primaryMachineType;
        private Integer allocatedOperators;
        private Double effectiveTimeSecs;
        private Double capacityPerHour;
        private Double workloadPercent;
        private Boolean isBottleneck;
        private List<StationOperationSaveDTO> operations;
    }

    @Data
    public static class StationOperationSaveDTO {
        private Long operationId;
        private Long bulletinLineId;
        private Integer sequence;
        private Double operationSmv;
        private String machineType;
        private Boolean isSplit;
        private Double splitRatio;
        private Boolean isQcCheckpoint;
    }

    @Data
    public static class OperatorPlacementSaveDTO {
        private Integer stationIndex;
        private Long operatorId;
        private Integer requiredSkillLevel;
        private Integer actualSkillLevel;
        private String matchStatus;
        private String notes;
    }
}
