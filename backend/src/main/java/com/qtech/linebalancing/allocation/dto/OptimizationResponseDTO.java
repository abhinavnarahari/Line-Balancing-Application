package com.qtech.linebalancing.allocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResponseDTO {

    private Long runId;
    private String runCode;
    private LocalDate planningDate;
    private Long shiftId;
    private String shiftName;
    private String plantLocation;
    private String solverStatus; // OPTIMAL, FEASIBLE, TIME_LIMIT_BEST_FOUND, INFEASIBLE, INVALID_INPUT
    private String solverExplanation;
    private Long solverRuntimeMs;
    private String status; // DRAFT, VALIDATED, OPTIMIZED, IE_REVIEW, APPROVED, APPLIED
    private LocalDateTime createdAt;
    private String createdBy;

    // Executive Summary
    private OverallSummaryDTO summary;

    // Line Results
    private List<LineResultDTO> lineResults;

    // Allocation Matrix
    private List<AllocationAssignmentDTO> matrix;

    // Bottlenecks & Recommendations
    private List<BottleneckDTO> bottlenecks;

    // Alternative Scenarios
    private List<ScenarioDTO> scenarios;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallSummaryDTO {
        private int totalSelectedLines;
        private int totalAvailableOperators;
        private int totalAssignedOperators;
        private int totalUnassignedOperators;
        private int totalDesignedOutput;
        private int totalAchievableOutput;
        private double overallDesignedEfficiency;
        private double overallAchievableEfficiency;
        private double targetAchievementPercent;
        private int totalSkillGaps;
        private int totalMachineGaps;
        private int totalBottleneckStations;
        private String executiveSummaryStatement;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineResultDTO {
        private Long lineId;
        private String lineCode;
        private String lineName;
        private String styleNo;
        private String orderNo;
        private Integer targetHourlyOutput;
        private Integer designedCapacity;
        private Integer achievableCapacity;
        private Double designedEfficiency;
        private Double achievableEfficiency;
        private Integer assignedOperators;
        private Integer requiredOperators;
        private Integer operatorShortage;
        private Integer skillGaps;
        private Integer machineGaps;
        private String bottleneckStation;
        private String bottleneckOperation;
        private Double targetAchievementPercent;
        private String lineStatus; // TARGET_ACHIEVED, PARTIALLY_ACHIEVED, OPERATOR_SHORTAGE, SKILL_GAP, MACHINE_SHORTAGE, INFEASIBLE, REQUIRES_IE_REVIEW
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationAssignmentDTO {
        private Long assignmentId;
        private Long lineId;
        private String lineCode;
        private String lineName;
        private Integer stationIndex;
        private String stationCode;
        private Long operationId;
        private String operationName;
        private String operationCode;
        private Integer requiredSkillLevel;
        private String requiredMachineType;
        private Long operatorId;
        private String operatorName;
        private String operatorCode;
        private Integer assignedSkillLevel;
        private String performanceSource; // HISTORICAL, CALIBRATED, ESTIMATED, MISSING
        private Double standardSmv;
        private Double effectiveCycleTimeSecs;
        private Double operatorEfficiencyPercent;
        private String matchStatus; // EXCELLENT, MATCH, SKILL_GAP, MACHINE_GAP, TRAINEE, UNASSIGNED
        private Boolean isBottleneck;
        private Boolean isFixed;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BottleneckDTO {
        private Long id;
        private Long lineId;
        private String lineName;
        private Integer stationIndex;
        private String stationCode;
        private String operationName;
        private Double requiredCycleTimeSecs;
        private Double effectiveCycleTimeSecs;
        private Integer requiredSkillLevel;
        private Integer assignedOperatorSkill;
        private String requiredMachineType;
        private String bottleneckReason;
        private String recommendedAction;
        private String severity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScenarioDTO {
        private Long id;
        private String scenarioCode;
        private String scenarioTitle;
        private String scenarioDescription;
        private Integer totalAchievableOutput;
        private Double overallEfficiency;
        private Integer assignedManpower;
        private Integer unassignedManpower;
        private Integer totalSkillGaps;
        private Integer totalMachineGaps;
        private String mainTradeoffs;
        private Boolean isRecommended;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RunSummaryDTO {
        private Long runId;
        private String runCode;
        private LocalDate planningDate;
        private Long shiftId;
        private String shiftName;
        private String plantLocation;
        private String solverStatus;
        private String status;
        private Integer totalSelectedLines;
        private Integer totalAssignedOperators;
        private Integer totalAchievableOutput;
        private Double overallAchievableEfficiency;
        private Double targetAchievementPercent;
        private Integer totalSkillGaps;
        private Integer totalBottleneckStations;
        private LocalDateTime createdAt;
        private String createdBy;
        private String approvedBy;
        private LocalDateTime approvedAt;
        private String appliedBy;
        private LocalDateTime appliedAt;
    }
}
