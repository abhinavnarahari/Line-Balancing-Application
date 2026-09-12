package com.qtech.linebalancing.linebalance.dto;

import com.qtech.linebalancing.engine.LineBalanceCalculationService;
import lombok.Data;

import java.util.List;

@Data
public class BalanceDetailResponse {
    private Long lineDesignId;
    private String designCode;
    private String orderNo;
    private String styleNo;
    private String lineName;
    private String shiftName;
    private Integer targetHourlyOutput;
    private Double plannedEfficiency;
    private Double customerTaktSecs;
    private Double designedPitchSecs;
    private Double lineBalanceEfficiency;
    private Integer totalWorkstations;
    private Integer totalOperators;
    private Integer bottleneckCount;

    private List<WorkstationDetailDTO> workstations;
    private List<OperatorPlacementDetailDTO> operatorPlacements;
    private List<OptimizationRecommendationDTO> recommendations;

    @Data
    public static class WorkstationDetailDTO {
        private Long id;
        private Integer stationIndex;
        private String stationCode;
        private String primaryMachineType;
        private Integer allocatedOperators;
        private Double effectiveTimeSecs;
        private Double capacityPerHour;
        private Double workloadPercent;
        private Boolean isBottleneck;
        private List<StationOperationDetailDTO> operations;
    }

    @Data
    public static class StationOperationDetailDTO {
        private Long id;
        private Long operationId;
        private String operationCode;
        private String operationName;
        private Long bulletinLineId;
        private Integer sequence;
        private Double operationSmv;
        private String machineType;
        private Boolean isSplit;
        private Double splitRatio;
        private Boolean isQcCheckpoint;
    }

    @Data
    public static class OperatorPlacementDetailDTO {
        private Long id;
        private Integer stationIndex;
        private String stationCode;
        private Long operatorId;
        private String operatorName;
        private String operatorCode;
        private Integer requiredSkillLevel;
        private Integer actualSkillLevel;
        private String matchStatus;
        private String notes;
    }

    @Data
    public static class OptimizationRecommendationDTO {
        private Long id;
        private Integer stationIndex;
        private String strategyType;
        private String title;
        private String reason;
        private Double currentCycleTimeSecs;
        private Double projectedCycleTimeSecs;
        private Double projectedCapacityPerHour;
        private String status;
    }
}
