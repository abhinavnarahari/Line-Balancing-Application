package com.qtech.linebalancing.allocation.service;

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
import java.util.List;
import java.util.Optional;

/**
 * Enterprise Garment Industrial Engineering Operator Performance Evaluation Service.
 * Does NOT treat skill rating as simplistic direct efficiency (e.g. Rating 5 is NOT 100%, Rating 3 is NOT 60%).
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
    public OperatorPerformanceEvaluation evaluate(
            Long operatorId,
            Long operationId,
            String machineType,
            double standardSmvMinutes,
            int requiredSkillLevel) {

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
        int reqSkill = requiredSkillLevel > 0 ? requiredSkillLevel : 3;

        // 1. Check Machine Qualification
        boolean machineQualified = true;
        int machineQualLevel = 3;
        if (machineType != null && !machineType.isBlank() && !"Manual".equalsIgnoreCase(machineType)) {
            Optional<OperatorMachineQualification> omq = machineQualificationRepository
                    .findByOperatorIdAndMachineTypeIgnoreCase(operatorId, machineType);
            if (omq.isPresent()) {
                machineQualLevel = omq.get().getQualificationLevel();
                machineQualified = machineQualLevel >= 2; // At least basic
            } else {
                // Not certified on this machine
                machineQualified = false;
                machineQualLevel = 1;
            }
        }

        // 2. Check Tier 1: Historical Performance Logs on this specific operation
        List<OperatorPerformanceLog> historicalLogs = performanceLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId);
        if (historicalLogs != null && !historicalLogs.isEmpty()) {
            // Average the last up to 5 logged actual cycle times
            double avgHistoricalSecs = historicalLogs.stream()
                    .mapToInt(OperatorPerformanceLog::getActualCycleTimeSeconds)
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
        Optional<SkillAssessment> assessmentOpt = skillAssessmentRepository.findCurrentByOperatorAndOperation(operatorId, operationId);
        if (assessmentOpt.isPresent()) {
            SkillAssessment sa = assessmentOpt.get();
            int rating = sa.getRating() != null ? sa.getRating() : 3;
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
                    .remarks("Calibrated skill matrix assessment rating " + rating + "/5")
                    .build();
        }

        // 4. Tier 3: Fallback Engineering Estimate
        // Fallback assumes baseline operator capability with skill gap degradation
        int fallbackSkill = 3; // Standard baseline
        double fallbackEff = 75.0; // 75% fallback
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

    /**
     * Standard IE Calibrated Rating Curve:
     * Rating 5 (Expert): ~110% efficiency (Cycle time = SMV / 1.10)
     * Rating 4 (Skilled): ~100% efficiency (Cycle time = SMV / 1.00)
     * Rating 3 (Standard): ~85% efficiency (Cycle time = SMV / 0.85)
     * Rating 2 (Basic): ~70% efficiency (Cycle time = SMV / 0.70)
     * Rating 1 (Trainee): ~55% efficiency (Cycle time = SMV / 0.55)
     */
    private double calculateCalibratedTimeFromRating(double baseSmvSecs, int rating) {
        double factor;
        switch (rating) {
            case 5 -> factor = 1.10;
            case 4 -> factor = 1.00;
            case 3 -> factor = 0.85;
            case 2 -> factor = 0.70;
            case 1 -> factor = 0.55;
            default -> factor = 0.80;
        }
        return round(baseSmvSecs / factor, 2);
    }

    private int deriveSkillFromEfficiency(double efficiency) {
        if (efficiency >= 105.0) return 5;
        if (efficiency >= 95.0) return 4;
        if (efficiency >= 80.0) return 3;
        if (efficiency >= 65.0) return 2;
        return 1;
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
