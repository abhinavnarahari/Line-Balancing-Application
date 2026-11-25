package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.common.skill.SkillScale;

import com.qtech.linebalancing.allocation.entity.OperatorMachineQualification;
import com.qtech.linebalancing.allocation.repository.OperatorMachineQualificationRepository;
import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.repository.OperatorPerformanceLogRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;
import java.util.List;
import java.util.Optional;

/**
 * Enterprise Garment Industrial Engineering Operator Performance Evaluation Service.
 * Skill levels follow the factory 4-level scale (SkillScale); each level maps to a planning efficiency.
 * Uses a rigorous 3-Tier Performance Hierarchy:
 * Tier 1: Historical Observations (from shop floor performance logs)
 * Tier 2: Calibrated Assessment Curve (from skill assessment rating & cycle times)
 * Tier 3: Fallback Engineering Estimate (based on skill level gap and machine compatibility)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OperatorPerformanceService {

    private final OperatorPerformanceLogRepository performanceLogRepository;
    private final SkillAssessmentRepository skillAssessmentRepository;
    private final OperatorMachineQualificationRepository machineQualificationRepository;

    @Data
    @Builder
    public static class OperatorPerformanceEvaluation {
        private String performanceSource; // HISTORICAL, CALIBRATED, ESTIMATED, MISSING
        private double effectiveCycleTimeSecs;
        private double operatorEfficiencyPercent;
        private int evaluatedSkillLevel;
        private String matchStatus; // EXCELLENT, MATCH, SKILL_GAP, MACHINE_GAP, TRAINEE, UNASSIGNED
        private boolean isMachineQualified;
        private String remarks;
    }

    /**
     * Evaluates the realistic effective cycle time and efficiency of an operator on a specific operation and machine.
     */
    /**
     * Pre-loaded performance data for one optimizer run: three bulk queries instead of up to three
     * queries per (slot x operator) pair.
     */
    public static final class PerformanceSnapshot {
        private final Map<Long, Map<String, Integer>> machineLevels = new HashMap<>();
        private final Map<String, List<Integer>> cycleTimes = new HashMap<>();
        private final Map<String, SkillAssessment> assessments = new HashMap<>();

        private static String key(Long operatorId, Long operationId) {
            return operatorId + ":" + operationId;
        }
    }

    public PerformanceSnapshot loadSnapshot(Collection<Long> operatorIds, Collection<Long> operationIds) {
        PerformanceSnapshot snap = new PerformanceSnapshot();
        List<Long> ops = operatorIds.stream().filter(Objects::nonNull).distinct().toList();
        List<Long> opns = operationIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ops.isEmpty()) {
            return snap;
        }
        for (Object[] row : machineQualificationRepository.findLevelsForOperators(ops)) {
            snap.machineLevels.computeIfAbsent((Long) row[0], k -> new HashMap<>())
                    .put((String) row[1], row[2] != null ? ((Number) row[2]).intValue() : 3);
        }
        if (!opns.isEmpty()) {
            for (Object[] row : performanceLogRepository.findCycleTimes(ops, opns)) {
                if (row[2] != null) {
                    snap.cycleTimes.computeIfAbsent(PerformanceSnapshot.key((Long) row[0], (Long) row[1]), k -> new ArrayList<>())
                            .add(((Number) row[2]).intValue());
                }
            }
            for (SkillAssessment sa : skillAssessmentRepository.findCurrentFor(ops, opns)) {
                snap.assessments.put(PerformanceSnapshot.key(sa.getOperator().getId(), sa.getOperation().getId()), sa);
            }
        }
        return snap;
    }

    /** Same result as {@link #evaluate(Long, Long, String, double, int)} but served from a pre-loaded snapshot. */
    public OperatorPerformanceEvaluation evaluate(PerformanceSnapshot snapshot, Long operatorId, Long operationId,
                                                  String machineType, double standardSmvMinutes, int requiredSkillLevel) {
        if (snapshot == null) {
            return evaluate(operatorId, operationId, machineType, standardSmvMinutes, requiredSkillLevel);
        }
        String key = PerformanceSnapshot.key(operatorId, operationId);
        return evaluateCore(operatorId, machineType, standardSmvMinutes, requiredSkillLevel,
                () -> Optional.ofNullable(snapshot.machineLevels.getOrDefault(operatorId, Map.of())
                        .get(machineType == null ? "" : machineType.toLowerCase())),
                () -> snapshot.cycleTimes.getOrDefault(key, List.of()),
                () -> Optional.ofNullable(snapshot.assessments.get(key)));
    }

    public OperatorPerformanceEvaluation evaluate(
            Long operatorId,
            Long operationId,
            String machineType,
            double standardSmvMinutes,
            int requiredSkillLevel) {
        return evaluateCore(operatorId, machineType, standardSmvMinutes, requiredSkillLevel,
                () -> machineQualificationRepository.findByOperatorIdAndMachineTypeIgnoreCase(operatorId, machineType)
                        .map(OperatorMachineQualification::getQualificationLevel),
                () -> performanceLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId)
                        .stream().map(OperatorPerformanceLog::getActualCycleTimeSeconds).filter(Objects::nonNull).toList(),
                () -> skillAssessmentRepository.findCurrentByOperatorAndOperation(operatorId, operationId));
    }

    private OperatorPerformanceEvaluation evaluateCore(
            Long operatorId,
            String machineType,
            double standardSmvMinutes,
            int requiredSkillLevel,
            Supplier<Optional<Integer>> machineLevelLookup,
            Supplier<List<Integer>> cycleTimesLookup,
            Supplier<Optional<SkillAssessment>> assessmentLookup) {

        if (operatorId == null) {
            return OperatorPerformanceEvaluation.builder()
                    .performanceSource("MISSING")
                    .effectiveCycleTimeSecs(round(standardSmvMinutes * 60.0, 2))
                    .operatorEfficiencyPercent(0.0)
                    .evaluatedSkillLevel(0)
                    .matchStatus("UNASSIGNED")
                    .isMachineQualified(false)
                    .remarks("No operator assigned")
                    .build();
        }

        double baseSmvSecs = standardSmvMinutes > 0 ? standardSmvMinutes * 60.0 : 45.0;
        int reqSkill = requiredSkillLevel > 0 ? SkillScale.clamp(requiredSkillLevel) : SkillScale.DEFAULT_REQUIRED;

        // 1. Check Machine Qualification
        boolean machineQualified = true;
        int machineQualLevel = 3;
        if (machineType != null && !machineType.isBlank() && !"Manual".equalsIgnoreCase(machineType)) {
            Optional<Integer> omq = machineLevelLookup.get();
            if (omq.isPresent()) {
                machineQualLevel = omq.get();
                machineQualified = machineQualLevel >= 2; // At least basic
            } else {
                // Not certified on this machine
                machineQualified = false;
                machineQualLevel = 1;
            }
        }

        // 2. Check Tier 1: Historical Performance Logs on this specific operation
        List<Integer> historicalLogs = cycleTimesLookup.get();
        if (historicalLogs != null && !historicalLogs.isEmpty()) {
            // Average of all logged actual cycle times for this operator on this operation
            double avgHistoricalSecs = historicalLogs.stream()
                    .mapToInt(Integer::intValue)
                    .filter(sec -> sec > 0)
                    .average()
                    .orElse(0.0);

            if (avgHistoricalSecs > 5.0) {
                // Calculate historical efficiency %: (Standard SMV secs / Historical actual cycle time secs) * 100
                double histEfficiency = round((baseSmvSecs / avgHistoricalSecs) * 100.0, 1);
                int derivedSkill = deriveSkillFromEfficiency(histEfficiency);
                String match = determineMatchStatus(derivedSkill, reqSkill, machineQualified);

                return OperatorPerformanceEvaluation.builder()
                        .performanceSource("HISTORICAL")
                        .effectiveCycleTimeSecs(round(avgHistoricalSecs, 2))
                        .operatorEfficiencyPercent(histEfficiency)
                        .evaluatedSkillLevel(derivedSkill)
                        .matchStatus(match)
                        .isMachineQualified(machineQualified)
                        .remarks("Observed floor cycle time average from " + historicalLogs.size() + " records")
                        .build();
            }
        }

        // 3. Check Tier 2: Calibrated Assessment Curve
        Optional<SkillAssessment> assessmentOpt = assessmentLookup.get();
        if (assessmentOpt.isPresent()) {
            SkillAssessment sa = assessmentOpt.get();
            int rating = sa.getRating() != null ? SkillScale.clamp(sa.getRating()) : SkillScale.DEFAULT_REQUIRED;
            double assessedSecs = sa.getCycleTimeSeconds() != null && sa.getCycleTimeSeconds() > 0
                    ? sa.getCycleTimeSeconds().doubleValue()
                    : calculateCalibratedTimeFromRating(baseSmvSecs, rating);

            double calEfficiency = assessedSecs > 0 ? round((baseSmvSecs / assessedSecs) * 100.0, 1) : 80.0;
            String match = determineMatchStatus(rating, reqSkill, machineQualified);

            return OperatorPerformanceEvaluation.builder()
                    .performanceSource("CALIBRATED")
                    .effectiveCycleTimeSecs(round(assessedSecs, 2))
                    .operatorEfficiencyPercent(calEfficiency)
                    .evaluatedSkillLevel(rating)
                    .matchStatus(match)
                    .isMachineQualified(machineQualified)
                    .remarks("Skill matrix level " + rating + "/" + SkillScale.MAX + " (" + SkillScale.label(rating) + ")")
                    .build();
        }

        // 4. Tier 3: Fallback Engineering Estimate
        // Fallback assumes baseline operator capability with skill gap degradation
        int fallbackSkill = SkillScale.INDEPENDENT; // Standard baseline
        double fallbackEff = SkillScale.planningEfficiency(fallbackSkill) * 100.0;
        if (!machineQualified) {
            fallbackEff *= 0.80; // 20% penalty for unfamiliar machine
        }

        double estCycleSecs = round(baseSmvSecs / (fallbackEff / 100.0), 2);
        String match = determineMatchStatus(fallbackSkill, reqSkill, machineQualified);

        return OperatorPerformanceEvaluation.builder()
                .performanceSource("ESTIMATED")
                .effectiveCycleTimeSecs(estCycleSecs)
                .operatorEfficiencyPercent(round(fallbackEff, 1))
                .evaluatedSkillLevel(fallbackSkill)
                .matchStatus(match)
                .isMachineQualified(machineQualified)
                .remarks("Standard industrial fallback estimate (no direct history)")
                .build();
    }

    /** Expected cycle time at a skill level: standard time / planning efficiency of that level (see SkillScale). */
    private double calculateCalibratedTimeFromRating(double baseSmvSecs, int rating) {
        return round(baseSmvSecs / SkillScale.planningEfficiency(rating), 2);
    }

    /** efficiency is a percentage here (e.g. 72.5). */
    private int deriveSkillFromEfficiency(double efficiency) {
        return SkillScale.ratingForEfficiency(efficiency / 100.0);
    }

    private String determineMatchStatus(int operatorSkill, int requiredSkill, boolean isMachineQualified) {
        if (!isMachineQualified) {
            return "MACHINE_GAP";
        }
        if (operatorSkill >= requiredSkill + 1) {
            return "EXCELLENT";
        }
        if (operatorSkill >= requiredSkill) {
            return "MATCH";
        }
        if (operatorSkill == requiredSkill - 1) {
            return "SKILL_GAP";
        }
        return "TRAINEE";
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
