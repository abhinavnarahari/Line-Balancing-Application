package com.qtech.linebalancing.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Line Balancing Calculation Service.
 * Provides transparent computation of workstation cycle times, capacity,
 * workload percentages, bottleneck detection, and Line Balance Efficiency %.
 */
@Service
public class LineBalanceCalculationService {

    @Data
    @Builder
    public static class StationOperationInput {
        private Long operationId;
        private String operationCode;
        private String operationName;
        private String machineType;
        private double operationSmvMinutes; // e.g. 0.35 min
        private double splitRatio;          // e.g. 1.0 (or 0.5 if split)
        private boolean isQcCheckpoint;
    }

    @Data
    @Builder
    public static class WorkstationInput {
        private int stationIndex;
        private String stationCode;
        private String primaryMachineType;
        private int allocatedOperators; // 1, 2, etc.
        private List<StationOperationInput> operations;
    }

    @Data
    @Builder
    public static class WorkstationMetricResult {
        private int stationIndex;
        private String stationCode;
        private String primaryMachineType;
        private int allocatedOperators;
        private double rawWorkloadSecs;
        private double effectiveTimeSecs;
        private double capacityPerHour;
        private double workloadPercent;
        private boolean isBottleneck;
        private double deficitPerHour;
        private int operationCount;
    }

    @Data
    @Builder
    public static class LineBalanceResult {
        private double totalLineSmvMinutes;
        private double totalLineSmvSeconds;
        private double customerTaktSecs;
        private double designedPitchSecs;
        private double requiredDesignCapacity;
        private double requiredHourlyTarget;
        private int totalWorkstations;
        private int totalAllocatedOperators;
        private double maxStationCycleTimeSecs;
        private double minStationCycleTimeSecs;
        private double averagePitchSecs;
        private double lineBalanceEfficiencyPercent;
        private double balanceLossPercent;
        private int bottleneckCount;
        private List<WorkstationMetricResult> stations;
    }

    /**
     * Compute comprehensive line balance metrics across all workstations.
     */
    public LineBalanceResult calculate(
            List<WorkstationInput> stations,
            double customerTaktSecs,
            double designedPitchSecs,
            double requiredDesignCapacity,
            double requiredHourlyTarget) {

        if (stations == null || stations.isEmpty()) {
            return LineBalanceResult.builder()
                    .customerTaktSecs(customerTaktSecs)
                    .designedPitchSecs(designedPitchSecs)
                    .requiredDesignCapacity(requiredDesignCapacity)
                    .requiredHourlyTarget(requiredHourlyTarget)
                    .stations(List.of())
                    .build();
        }

        double totalSmvMinutes = 0.0;
        int totalOps = 0;
        List<WorkstationMetricResult> stationMetrics = new ArrayList<>();

        double maxCycleTime = 0.0;
        double minCycleTime = Double.MAX_VALUE;

        for (WorkstationInput st : stations) {
            int opsCount = Math.max(1, st.getAllocatedOperators());
            totalOps += opsCount;

            double stSmvMins = 0.0;
            if (st.getOperations() != null) {
                for (StationOperationInput op : st.getOperations()) {
                    double ratio = op.getSplitRatio() > 0 ? op.getSplitRatio() : 1.0;
                    stSmvMins += (op.getOperationSmvMinutes() * ratio);
                }
            }
            totalSmvMinutes += stSmvMins;

            double rawWorkloadSecs = round(stSmvMins * 60.0, 2);
            // Effective cycle time per operator: rawWorkloadSecs / allocatedOperators
            double effectiveTimeSecs = round(rawWorkloadSecs / opsCount, 2);

            if (effectiveTimeSecs > maxCycleTime) {
                maxCycleTime = effectiveTimeSecs;
            }
            if (effectiveTimeSecs < minCycleTime) {
                minCycleTime = effectiveTimeSecs;
            }

            // Station capacity = (3600 / effectiveTimeSecs)
            double stationCapacity = effectiveTimeSecs > 0 ? round(3600.0 / effectiveTimeSecs, 1) : 0.0;

            // Workload % against Designed Pitch Time
            double workloadPercent = designedPitchSecs > 0 ? round((effectiveTimeSecs / designedPitchSecs) * 100.0, 1) : 100.0;

            // Bottleneck flag
            boolean isBottleneck = (effectiveTimeSecs > designedPitchSecs + 0.05) || (stationCapacity < (requiredDesignCapacity - 0.5));
            double deficitPerHour = Math.max(0.0, round(requiredDesignCapacity - stationCapacity, 1));

            stationMetrics.add(WorkstationMetricResult.builder()
                    .stationIndex(st.getStationIndex())
                    .stationCode(st.getStationCode() != null ? st.getStationCode() : "S" + String.format("%02d", st.getStationIndex()))
                    .primaryMachineType(st.getPrimaryMachineType())
                    .allocatedOperators(opsCount)
                    .rawWorkloadSecs(rawWorkloadSecs)
                    .effectiveTimeSecs(effectiveTimeSecs)
                    .capacityPerHour(stationCapacity)
                    .workloadPercent(workloadPercent)
                    .isBottleneck(isBottleneck)
                    .deficitPerHour(deficitPerHour)
                    .operationCount(st.getOperations() != null ? st.getOperations().size() : 0)
                    .build());
        }

        if (minCycleTime == Double.MAX_VALUE) minCycleTime = 0.0;
        double totalSmvSecs = round(totalSmvMinutes * 60.0, 2);
        int bottleneckCount = (int) stationMetrics.stream().filter(WorkstationMetricResult::isBottleneck).count();

        // Line Balance Efficiency % Formula:
        // LBE = (Total Line SMV in secs) / (Max Station Effective Cycle Time * Total Allocated Operators) * 100
        double denominator = maxCycleTime * totalOps;
        double lineBalanceEfficiency = denominator > 0 ? round((totalSmvSecs / denominator) * 100.0, 1) : 0.0;
        lineBalanceEfficiency = Math.min(100.0, Math.max(0.0, lineBalanceEfficiency));
        double balanceLossPercent = round(100.0 - lineBalanceEfficiency, 1);

        double averagePitch = stations.size() > 0 ? round(totalSmvSecs / stations.size(), 2) : 0.0;

        return LineBalanceResult.builder()
                .totalLineSmvMinutes(round(totalSmvMinutes, 3))
                .totalLineSmvSeconds(totalSmvSecs)
                .customerTaktSecs(customerTaktSecs)
                .designedPitchSecs(designedPitchSecs)
                .requiredDesignCapacity(requiredDesignCapacity)
                .requiredHourlyTarget(requiredHourlyTarget)
                .totalWorkstations(stations.size())
                .totalAllocatedOperators(totalOps)
                .maxStationCycleTimeSecs(round(maxCycleTime, 2))
                .minStationCycleTimeSecs(round(minCycleTime, 2))
                .averagePitchSecs(averagePitch)
                .lineBalanceEfficiencyPercent(lineBalanceEfficiency)
                .balanceLossPercent(balanceLossPercent)
                .bottleneckCount(bottleneckCount)
                .stations(stationMetrics)
                .build();
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
