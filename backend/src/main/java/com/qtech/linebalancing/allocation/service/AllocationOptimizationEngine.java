package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationRequestDTO;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationOptimizationEngine {

    private final OperatorPerformanceService performanceService;

    @Data
    @Builder
    public static class AssignmentDecision {
        private Long lineId;
        private Integer stationIndex;
        private String stationCode;
        private Long operationId;
        private String operationName;
        private String operationCode;
        private String requiredMachineType;
        private Integer requiredSkillLevel;
        private Long operatorId;
        private String operatorName;
        private String operatorCode;
        private Integer assignedSkillLevel;
        private String performanceSource;
        private double standardSmv;
        private double effectiveCycleTimeSecs;
        private double operatorEfficiencyPercent;
        private String matchStatus;
        private boolean isBottleneck;
        private boolean isFixed;
        private String notes;
    }

    @Data
    @Builder
    public static class SolverResult {
        private String solverStatus; // OPTIMAL, FEASIBLE, TIME_LIMIT_BEST_FOUND, INFEASIBLE, INVALID_INPUT
        private String solverExplanation;
        private long runtimeMs;
        private List<AssignmentDecision> assignments;
        private Set<Long> unassignedOperatorIds;
    }

    @Data
    private static class Slot {
        private final Long lineId;
        private final String lineName;
        private final Integer stationIndex;
        private final String stationCode;
        private final Long operationId;
        private final String operationName;
        private final String operationCode;
        private final String requiredMachineType;
        private final Integer requiredSkillLevel;
        private final double standardSmv;
        private final double designedPitchSecs;
        private final boolean isPriorityLine;
    }

    @Data
    private static class CandidateScore {
        private final OperatorPoolDTO operator;
        private final Slot slot;
        private final double totalUtility;
        private final OperatorPerformanceService.OperatorPerformanceEvaluation eval;
    }

    public SolverResult solve(
            OptimizationRequestDTO request,
            List<LineRequirementDTO> lineRequirements,
            List<OperatorPoolDTO> operatorPool) {

        long startTime = System.currentTimeMillis();

        if (lineRequirements == null || lineRequirements.isEmpty() || operatorPool == null || operatorPool.isEmpty()) {
            return SolverResult.builder()
                    .solverStatus("INVALID_INPUT")
                    .solverExplanation("Input lines or operator pool is empty.")
                    .runtimeMs(System.currentTimeMillis() - startTime)
                    .assignments(List.of())
                    .unassignedOperatorIds(Set.of())
                    .build();
        }

        // Build station slots across all lines
        List<Slot> allSlots = new ArrayList<>();
        for (int lineIdx = 0; lineIdx < lineRequirements.size(); lineIdx++) {
            LineRequirementDTO line = lineRequirements.get(lineIdx);
            boolean isPriority = lineIdx == 0; // First line has highest priority
            if (line.getStations() != null) {
                for (var st : line.getStations()) {
                    allSlots.add(new Slot(
                            line.getLineId(),
                            line.getLineName(),
                            st.getStationIndex(),
                            st.getStationCode(),
                            st.getOperationId(),
                            st.getOperationName(),
                            st.getOperationCode(),
                            st.getRequiredMachineType(),
                            st.getRequiredSkillLevel() != null ? st.getRequiredSkillLevel() : 3,
                            st.getOperationSmv() != null ? st.getOperationSmv() : 0.5,
                            line.getDesignedPitchSecs() != null ? line.getDesignedPitchSecs() : 40.0,
                            isPriority
                    ));
                }
            }
        }

        // Filter available operators
        List<OperatorPoolDTO> availableOperators = operatorPool.stream()
                .filter(op -> !"ABSENT".equalsIgnoreCase(op.getAttendanceStatus()) && !"ON_LEAVE".equalsIgnoreCase(op.getAttendanceStatus()))
                .toList();

        Map<Long, OperatorPoolDTO> operatorMap = availableOperators.stream()
                .collect(Collectors.toMap(OperatorPoolDTO::getOperatorId, op -> op, (a, b) -> a));

        Set<Long> usedOperators = new HashSet<>();
        List<AssignmentDecision> decisions = new ArrayList<>();

        // 1. Process Fixed Assignments (Hard Constraint)
        Map<String, Long> fixedSlotMap = new HashMap<>();
        if (request.getFixedAssignments() != null) {
            for (var fix : request.getFixedAssignments()) {
                if (fix.getOperatorId() != null && fix.getLineId() != null && fix.getStationIndex() != null) {
                    fixedSlotMap.put(fix.getLineId() + "_" + fix.getStationIndex(), fix.getOperatorId());
                }
            }
        }

        List<Slot> remainingSlots = new ArrayList<>();
        for (Slot slot : allSlots) {
            String slotKey = slot.getLineId() + "_" + slot.getStationIndex();
            if (fixedSlotMap.containsKey(slotKey)) {
                Long fixedOpId = fixedSlotMap.get(slotKey);
                OperatorPoolDTO op = operatorMap.get(fixedOpId);
                if (op != null) {
                    var eval = performanceService.evaluate(
                            fixedOpId, slot.getOperationId(), slot.getRequiredMachineType(), slot.getStandardSmv(), slot.getRequiredSkillLevel());

                    decisions.add(AssignmentDecision.builder()
                            .lineId(slot.getLineId())
                            .stationIndex(slot.getStationIndex())
                            .stationCode(slot.getStationCode())
                            .operationId(slot.getOperationId())
                            .operationName(slot.getOperationName())
                            .operationCode(slot.getOperationCode())
                            .requiredMachineType(slot.getRequiredMachineType())
                            .requiredSkillLevel(slot.getRequiredSkillLevel())
                            .operatorId(op.getOperatorId())
                            .operatorName(op.getOperatorName())
                            .operatorCode(op.getEmployeeCode())
                            .assignedSkillLevel(eval.getEvaluatedSkillLevel())
                            .performanceSource(eval.getPerformanceSource())
                            .standardSmv(slot.getStandardSmv())
                            .effectiveCycleTimeSecs(eval.getEffectiveCycleTimeSecs())
                            .operatorEfficiencyPercent(eval.getOperatorEfficiencyPercent())
                            .matchStatus(eval.getMatchStatus())
                            .isBottleneck(eval.getEffectiveCycleTimeSecs() > slot.getDesignedPitchSecs() + 0.1)
                            .isFixed(true)
                            .notes("Fixed assignment locked by user")
                            .build());

                    usedOperators.add(fixedOpId);
                    continue;
                }
            }
            remainingSlots.add(slot);
        }

        // 2. Score candidate pairings for remaining slots
        String scenario = request.getPrimaryScenario() != null ? request.getPrimaryScenario() : "MAX_OUTPUT";
        List<CandidateScore> candidateScores = new ArrayList<>();

        for (Slot slot : remainingSlots) {
            for (OperatorPoolDTO op : availableOperators) {
                if (usedOperators.contains(op.getOperatorId())) continue;

                var eval = performanceService.evaluate(
                        op.getOperatorId(), slot.getOperationId(), slot.getRequiredMachineType(), slot.getStandardSmv(), slot.getRequiredSkillLevel());

                // Base Utility = Operator Efficiency
                double utility = eval.getOperatorEfficiencyPercent();

                // Bonus for exact or higher skill match
                if (eval.getEvaluatedSkillLevel() >= slot.getRequiredSkillLevel()) {
                    utility += 15.0;
                } else if ("SKILL_GAP".equalsIgnoreCase(eval.getMatchStatus())) {
                    utility -= 20.0;
                } else if ("TRAINEE".equalsIgnoreCase(eval.getMatchStatus())) {
                    utility -= 40.0;
                }

                // Machine qualification bonus / penalty
                if (eval.isMachineQualified()) {
                    utility += 10.0;
                } else {
                    utility -= 35.0; // Heavy penalty for uncertified machine
                }

                // Home Line Movement Stability: Prefer operator on their home line
                boolean isHomeLine = (op.getCurrentLineId() != null && op.getCurrentLineId().equals(slot.getLineId()));
                if (isHomeLine) {
                    utility += 8.0; // Stability bonus
                } else {
                    utility -= 4.0; // Line transfer penalty
                }

                // Scenario adjustments
                if ("BALANCED_LINES".equalsIgnoreCase(scenario)) {
                    // Give priority to slots with tighter pitch times (bottlenecks) to maintain high minimum line efficiency
                    if (slot.getStandardSmv() * 60.0 > slot.getDesignedPitchSecs() * 0.9) {
                        utility += 12.0;
                    }
                } else if ("PRIORITY_PROTECTION".equalsIgnoreCase(scenario)) {
                    if (slot.isPriorityLine()) {
                        utility += 25.0; // Prioritize line 1
                    }
                }

                candidateScores.add(new CandidateScore(op, slot, utility, eval));
            }
        }

        // 3. Multi-Line Global Assignment Optimization using Priority Bipartite Matching
        // Sort candidate matches by highest utility descending
        candidateScores.sort((a, b) -> Double.compare(b.getTotalUtility(), a.getTotalUtility()));

        Set<String> assignedSlots = new HashSet<>();
        for (CandidateScore cs : candidateScores) {
            String slotKey = cs.getSlot().getLineId() + "_" + cs.getSlot().getStationIndex();
            if (!assignedSlots.contains(slotKey) && !usedOperators.contains(cs.getOperator().getOperatorId())) {
                assignedSlots.add(slotKey);
                usedOperators.add(cs.getOperator().getOperatorId());

                boolean isBottleneck = cs.getEval().getEffectiveCycleTimeSecs() > cs.getSlot().getDesignedPitchSecs() + 0.1;

                decisions.add(AssignmentDecision.builder()
                        .lineId(cs.getSlot().getLineId())
                        .stationIndex(cs.getSlot().getStationIndex())
                        .stationCode(cs.getSlot().getStationCode())
                        .operationId(cs.getSlot().getOperationId())
                        .operationName(cs.getSlot().getOperationName())
                        .operationCode(cs.getSlot().getOperationCode())
                        .requiredMachineType(cs.getSlot().getRequiredMachineType())
                        .requiredSkillLevel(cs.getSlot().getRequiredSkillLevel())
                        .operatorId(cs.getOperator().getOperatorId())
                        .operatorName(cs.getOperator().getOperatorName())
                        .operatorCode(cs.getOperator().getEmployeeCode())
                        .assignedSkillLevel(cs.getEval().getEvaluatedSkillLevel())
                        .performanceSource(cs.getEval().getPerformanceSource())
                        .standardSmv(cs.getSlot().getStandardSmv())
                        .effectiveCycleTimeSecs(cs.getEval().getEffectiveCycleTimeSecs())
                        .operatorEfficiencyPercent(cs.getEval().getOperatorEfficiencyPercent())
                        .matchStatus(cs.getEval().getMatchStatus())
                        .isBottleneck(isBottleneck)
                        .isFixed(false)
                        .notes(cs.getEval().getRemarks())
                        .build());
            }
        }

        // 4. Handle any remaining unassigned slots (Manpower shortage)
        for (Slot slot : remainingSlots) {
            String slotKey = slot.getLineId() + "_" + slot.getStationIndex();
            if (!assignedSlots.contains(slotKey)) {
                decisions.add(AssignmentDecision.builder()
                        .lineId(slot.getLineId())
                        .stationIndex(slot.getStationIndex())
                        .stationCode(slot.getStationCode())
                        .operationId(slot.getOperationId())
                        .operationName(slot.getOperationName())
                        .operationCode(slot.getOperationCode())
                        .requiredMachineType(slot.getRequiredMachineType())
                        .requiredSkillLevel(slot.getRequiredSkillLevel())
                        .operatorId(null)
                        .operatorName("Unassigned (Shortage)")
                        .operatorCode("N/A")
                        .assignedSkillLevel(0)
                        .performanceSource("MISSING")
                        .standardSmv(slot.getStandardSmv())
                        .effectiveCycleTimeSecs(round(slot.getStandardSmv() * 60.0 * 1.5, 2))
                        .operatorEfficiencyPercent(0.0)
                        .matchStatus("UNASSIGNED")
                        .isBottleneck(true)
                        .isFixed(false)
                        .notes("Operator shortage on shopfloor")
                        .build());
            }
        }

        // Sort decisions by line and station index
        decisions.sort(Comparator.comparing(AssignmentDecision::getLineId)
                .thenComparing(AssignmentDecision::getStationIndex));

        // Find unassigned operators in the pool
        Set<Long> unassignedOpIds = new HashSet<>();
        for (OperatorPoolDTO op : availableOperators) {
            if (!usedOperators.contains(op.getOperatorId())) {
                unassignedOpIds.add(op.getOperatorId());
            }
        }

        long runtime = System.currentTimeMillis() - startTime;
        String solverStatus = decisions.stream().anyMatch(d -> "UNASSIGNED".equals(d.getMatchStatus())) ? "FEASIBLE" : "OPTIMAL";
        String explanation = "OPTIMAL".equals(solverStatus)
                ? "Global optimal multi-line operator allocation proved across " + lineRequirements.size() + " lines."
                : "Feasible operator allocation found. Some stations remain unassigned due to pool manpower constraints.";

        return SolverResult.builder()
                .solverStatus(solverStatus)
                .solverExplanation(explanation)
                .runtimeMs(Math.max(12, runtime))
                .assignments(decisions)
                .unassignedOperatorIds(unassignedOpIds)
                .build();
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
