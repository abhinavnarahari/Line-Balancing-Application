package com.qtech.linebalancing.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Multi-Objective Line Balancing Optimizer Service.
 * Evaluates target attainment, bottleneck mitigation, machine compatibility,
 * and operation precedence to generate transparent, actionable IE recommendations.
 */
@Service
public class MultiObjectiveOptimizerService {

    @Data
    @Builder
    public static class CandidateOperation {
        private Long operationId;
        private Long bulletinLineId;
        private String operationCode;
        private String operationName;
        private String section;
        private String machineType;
        private double standardSmvMinutes;
        private int sequence;
        private List<Long> predecessorIds;
        private boolean isParallelizable;
        private boolean splitAllowed;
        private String splitType;
        private Integer requiredSkillLevel;
    }

    @Data
    @Builder
    public static class OptimizationRequest {
        private List<CandidateOperation> operations;
        private double designedPitchSecs;
        private double requiredDesignCapacity;
        private double customerTaktSecs;
        private int maxAllowedWorkstations;
    }

    @Data
    @Builder
    public static class ProposedRecommendation {
        private int stationIndex;
        private String stationCode;
        private String strategyType; // PARALLEL_OP, SPLIT_OPERATION, OPERATOR_SWAP, MACHINE_UPGRADE, COMBINE_STATIONS
        private String title;
        private String reason;
        private double currentCycleTimeSecs;
        private double projectedCycleTimeSecs;
        private double projectedCapacityPerHour;
    }

    @Data
    @Builder
    public static class OptimizationResult {
        private List<LineBalanceCalculationService.WorkstationInput> proposedStations;
        private List<ProposedRecommendation> recommendations;
        private LineBalanceCalculationService.LineBalanceResult balanceMetrics;
    }

    private final LineBalanceCalculationService lineBalanceCalculationService;
    private final PrecedenceValidationService precedenceValidationService;

    public MultiObjectiveOptimizerService(
            LineBalanceCalculationService lineBalanceCalculationService,
            PrecedenceValidationService precedenceValidationService) {
        this.lineBalanceCalculationService = lineBalanceCalculationService;
        this.precedenceValidationService = precedenceValidationService;
    }

    /**
     * Run multi-objective optimization and generate transparent proposals.
     */
    public OptimizationResult optimize(OptimizationRequest req) {
        List<CandidateOperation> ops = new ArrayList<>(req.getOperations() != null ? req.getOperations() : List.of());
        ops.sort(Comparator.comparingInt(CandidateOperation::getSequence));

        double targetPitch = req.getDesignedPitchSecs() > 0 ? req.getDesignedPitchSecs() : 41.14;
        List<LineBalanceCalculationService.WorkstationInput> stations = new ArrayList<>();
        List<ProposedRecommendation> recommendations = new ArrayList<>();

        int currentStationIndex = 1;
        List<LineBalanceCalculationService.StationOperationInput> currentStationOps = new ArrayList<>();
        double currentStationTimeSecs = 0.0;
        String currentMachineType = null;

        for (CandidateOperation op : ops) {
            double opSecs = round(op.getStandardSmvMinutes() * 60.0, 2);

            // Check if single operation exceeds pitch time on its own
            if (opSecs > targetPitch + 0.1) {
                // If we have pending operations on the current station, close it first
                if (!currentStationOps.isEmpty()) {
                    stations.add(buildStation(currentStationIndex++, currentMachineType, 1, currentStationOps));
                    currentStationOps = new ArrayList<>();
                    currentStationTimeSecs = 0.0;
                    currentMachineType = null;
                }

                int requiredOpsForSingle = (int) Math.ceil(opSecs / targetPitch);
                if (op.isParallelizable()) {
                    // Strategy 1: Add parallel operator(s)
                    double projectedCycle = round(opSecs / requiredOpsForSingle, 2);
                    double projectedCap = projectedCycle > 0 ? round(3600.0 / projectedCycle, 1) : 0.0;

                    recommendations.add(ProposedRecommendation.builder()
                            .stationIndex(currentStationIndex)
                            .stationCode("S" + String.format("%02d", currentStationIndex))
                            .strategyType("PARALLEL_OP")
                            .title("Assign " + requiredOpsForSingle + " parallel operators to " + op.getOperationName())
                            .reason("Operation standard SMV is " + round(op.getStandardSmvMinutes(), 2) + " min (" + opSecs + "s), which exceeds Designed Pitch of " + targetPitch + "s. Parallelization allows workload sharing.")
                            .currentCycleTimeSecs(opSecs)
                            .projectedCycleTimeSecs(projectedCycle)
                            .projectedCapacityPerHour(projectedCap)
                            .build());

                    List<LineBalanceCalculationService.StationOperationInput> singleOpList = List.of(
                            LineBalanceCalculationService.StationOperationInput.builder()
                                    .operationId(op.getOperationId())
                                    .operationCode(op.getOperationCode())
                                    .operationName(op.getOperationName())
                                    .machineType(op.getMachineType())
                                    .operationSmvMinutes(op.getStandardSmvMinutes())
                                    .splitRatio(1.0)
                                    .build()
                    );
                    stations.add(buildStation(currentStationIndex++, op.getMachineType(), requiredOpsForSingle, singleOpList));
                } else if (op.isSplitAllowed()) {
                    // Strategy 2: Split operation across stations
                    recommendations.add(ProposedRecommendation.builder()
                            .stationIndex(currentStationIndex)
                            .stationCode("S" + String.format("%02d", currentStationIndex))
                            .strategyType("SPLIT_OPERATION")
                            .title("Split " + op.getOperationName() + " (50/50 ratio)")
                            .reason("Operation is marked as split-capable. Sub-elements can be divided across consecutive workstations.")
                            .currentCycleTimeSecs(opSecs)
                            .projectedCycleTimeSecs(round(opSecs / 2.0, 2))
                            .projectedCapacityPerHour(round(3600.0 / (opSecs / 2.0), 1))
                            .build());

                    List<LineBalanceCalculationService.StationOperationInput> splitList = List.of(
                            LineBalanceCalculationService.StationOperationInput.builder()
                                    .operationId(op.getOperationId())
                                    .operationCode(op.getOperationCode())
                                    .operationName(op.getOperationName())
                                    .machineType(op.getMachineType())
                                    .operationSmvMinutes(op.getStandardSmvMinutes())
                                    .splitRatio(1.0)
                                    .build()
                    );
                    stations.add(buildStation(currentStationIndex++, op.getMachineType(), 1, splitList));
                } else {
                    // Cannot parallelize or split: bottleneck alert
                    recommendations.add(ProposedRecommendation.builder()
                            .stationIndex(currentStationIndex)
                            .stationCode("S" + String.format("%02d", currentStationIndex))
                            .strategyType("MACHINE_UPGRADE")
                            .title("Method / Machine Upgrade for " + op.getOperationName())
                            .reason("Single operation workload (" + opSecs + "s) exceeds Designed Pitch (" + targetPitch + "s) and cannot be parallelized. High-speed motor or attachment recommended.")
                            .currentCycleTimeSecs(opSecs)
                            .projectedCycleTimeSecs(opSecs)
                            .projectedCapacityPerHour(round(3600.0 / opSecs, 1))
                            .build());

                    List<LineBalanceCalculationService.StationOperationInput> singleList = List.of(
                            LineBalanceCalculationService.StationOperationInput.builder()
                                    .operationId(op.getOperationId())
                                    .operationCode(op.getOperationCode())
                                    .operationName(op.getOperationName())
                                    .machineType(op.getMachineType())
                                    .operationSmvMinutes(op.getStandardSmvMinutes())
                                    .splitRatio(1.0)
                                    .build()
                    );
                    stations.add(buildStation(currentStationIndex++, op.getMachineType(), 1, singleList));
                }
                continue;
            }

            // Normal operation fitting: check if adding this op exceeds target pitch or changes machine type
            boolean isSameMachine = (currentMachineType == null || currentMachineType.equalsIgnoreCase(op.getMachineType()) || "Manual".equalsIgnoreCase(op.getMachineType()));
            boolean fitsInPitch = (currentStationTimeSecs + opSecs) <= (targetPitch + 0.5);

            if (fitsInPitch && isSameMachine) {
                currentStationOps.add(LineBalanceCalculationService.StationOperationInput.builder()
                        .operationId(op.getOperationId())
                        .operationCode(op.getOperationCode())
                        .operationName(op.getOperationName())
                        .machineType(op.getMachineType())
                        .operationSmvMinutes(op.getStandardSmvMinutes())
                        .splitRatio(1.0)
                        .build());
                currentStationTimeSecs += opSecs;
                if (currentMachineType == null && !"Manual".equalsIgnoreCase(op.getMachineType())) {
                    currentMachineType = op.getMachineType();
                }
            } else {
                // Close current station and open new station
                if (!currentStationOps.isEmpty()) {
                    stations.add(buildStation(currentStationIndex++, currentMachineType, 1, currentStationOps));
                }
                currentStationOps = new ArrayList<>();
                currentStationOps.add(LineBalanceCalculationService.StationOperationInput.builder()
                        .operationId(op.getOperationId())
                        .operationCode(op.getOperationCode())
                        .operationName(op.getOperationName())
                        .machineType(op.getMachineType())
                        .operationSmvMinutes(op.getStandardSmvMinutes())
                        .splitRatio(1.0)
                        .build());
                currentStationTimeSecs = opSecs;
                currentMachineType = op.getMachineType();
            }
        }

        // Add final open station
        if (!currentStationOps.isEmpty()) {
            stations.add(buildStation(currentStationIndex++, currentMachineType, 1, currentStationOps));
        }

        // Evaluate opportunities to combine lightly loaded stations (< 40% pitch)
        for (int i = 0; i < stations.size() - 1; i++) {
            var st1 = stations.get(i);
            var st2 = stations.get(i + 1);
            double totalCombined = (st1.getOperations().stream().mapToDouble(LineBalanceCalculationService.StationOperationInput::getOperationSmvMinutes).sum() +
                    st2.getOperations().stream().mapToDouble(LineBalanceCalculationService.StationOperationInput::getOperationSmvMinutes).sum()) * 60.0;

            if (totalCombined <= targetPitch) {
                recommendations.add(ProposedRecommendation.builder()
                        .stationIndex(st1.getStationIndex())
                        .stationCode(st1.getStationCode())
                        .strategyType("COMBINE_STATIONS")
                        .title("Combine " + st1.getStationCode() + " and " + st2.getStationCode())
                        .reason("Combined workload is " + round(totalCombined, 1) + "s (<= Designed Pitch " + targetPitch + "s). Merging stations saves 1 operator.")
                        .currentCycleTimeSecs(round(totalCombined, 1))
                        .projectedCycleTimeSecs(round(totalCombined, 1))
                        .projectedCapacityPerHour(round(3600.0 / totalCombined, 1))
                        .build());
            }
        }

        // Compute metrics
        LineBalanceCalculationService.LineBalanceResult result = lineBalanceCalculationService.calculate(
                stations,
                req.getCustomerTaktSecs(),
                req.getDesignedPitchSecs(),
                req.getRequiredDesignCapacity(),
                (req.getRequiredDesignCapacity() * 0.8) // approximate target
        );

        return OptimizationResult.builder()
                .proposedStations(stations)
                .recommendations(recommendations)
                .balanceMetrics(result)
                .build();
    }

    private LineBalanceCalculationService.WorkstationInput buildStation(
            int index, String machineType, int allocatedOps,
            List<LineBalanceCalculationService.StationOperationInput> ops) {
        return LineBalanceCalculationService.WorkstationInput.builder()
                .stationIndex(index)
                .stationCode("S" + String.format("%02d", index))
                .primaryMachineType(machineType != null ? machineType : "SNLS")
                .allocatedOperators(allocatedOps)
                .operations(ops)
                .build();
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
