package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationResponseDTO;
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
public class AllocationResultService {

    public OptimizationResponseDTO.OverallSummaryDTO computeOverallSummary(
            List<OptimizationResponseDTO.LineResultDTO> lineResults,
            List<OptimizationResponseDTO.AllocationAssignmentDTO> matrix,
            int totalAvailableOperators,
            int totalSelectedLines) {

        int totalDesignedOutput = lineResults.stream().mapToInt(OptimizationResponseDTO.LineResultDTO::getDesignedCapacity).sum();
        int totalAchievableOutput = lineResults.stream().mapToInt(OptimizationResponseDTO.LineResultDTO::getAchievableCapacity).sum();

        double avgDesignedEff = lineResults.stream().mapToDouble(OptimizationResponseDTO.LineResultDTO::getDesignedEfficiency).average().orElse(80.0);
        double avgAchievableEff = lineResults.stream().mapToDouble(OptimizationResponseDTO.LineResultDTO::getAchievableEfficiency).average().orElse(75.0);

        int totalAssigned = (int) matrix.stream().filter(m -> m.getOperatorId() != null).map(OptimizationResponseDTO.AllocationAssignmentDTO::getOperatorId).distinct().count();
        int totalUnassigned = Math.max(0, totalAvailableOperators - totalAssigned);

        int totalSkillGaps = lineResults.stream().mapToInt(OptimizationResponseDTO.LineResultDTO::getSkillGaps).sum();
        int totalMachineGaps = lineResults.stream().mapToInt(OptimizationResponseDTO.LineResultDTO::getMachineGaps).sum();
        int totalBottlenecks = (int) matrix.stream().filter(m -> Boolean.TRUE.equals(m.getIsBottleneck())).count();

        double targetAchievement = totalDesignedOutput > 0 ? round(((double) totalAchievableOutput / totalDesignedOutput) * 100.0, 1) : 0.0;

        String statement = "The available operator pool achieves " + Math.round(targetAchievement) + "% (" + totalAchievableOutput + " pcs/hr) of the combined designed output (" + totalDesignedOutput + " pcs/hr) across " + totalSelectedLines + " line(s).";

        return OptimizationResponseDTO.OverallSummaryDTO.builder()
                .totalSelectedLines(totalSelectedLines)
                .totalAvailableOperators(totalAvailableOperators)
                .totalAssignedOperators(totalAssigned)
                .totalUnassignedOperators(totalUnassigned)
                .totalDesignedOutput(totalDesignedOutput)
                .totalAchievableOutput(totalAchievableOutput)
                .overallDesignedEfficiency(round(avgDesignedEff, 1))
                .overallAchievableEfficiency(round(avgAchievableEff, 1))
                .targetAchievementPercent(targetAchievement)
                .totalSkillGaps(totalSkillGaps)
                .totalMachineGaps(totalMachineGaps)
                .totalBottleneckStations(totalBottlenecks)
                .executiveSummaryStatement(statement)
                .build();
    }

    public List<OptimizationResponseDTO.LineResultDTO> computeLineResults(
            List<LineRequirementDTO> lineRequirements,
            List<OptimizationResponseDTO.AllocationAssignmentDTO> assignments) {

        Map<Long, List<OptimizationResponseDTO.AllocationAssignmentDTO>> lineAssignments = assignments.stream()
                .collect(Collectors.groupingBy(OptimizationResponseDTO.AllocationAssignmentDTO::getLineId));

        List<OptimizationResponseDTO.LineResultDTO> results = new ArrayList<>();

        for (LineRequirementDTO line : lineRequirements) {
            List<OptimizationResponseDTO.AllocationAssignmentDTO> stationAssignments = lineAssignments.getOrDefault(line.getLineId(), List.of());

            int requiredOps = line.getDesignedManpower();
            int assignedOps = (int) stationAssignments.stream().filter(a -> a.getOperatorId() != null).count();
            int shortage = Math.max(0, requiredOps - assignedOps);

            int skillGaps = (int) stationAssignments.stream().filter(a -> "SKILL_GAP".equalsIgnoreCase(a.getMatchStatus()) || "TRAINEE".equalsIgnoreCase(a.getMatchStatus())).count();
            int machineGaps = (int) stationAssignments.stream().filter(a -> "MACHINE_GAP".equalsIgnoreCase(a.getMatchStatus())).count();

            // Find line bottleneck (station with max effective cycle time)
            double maxStationCycle = 0.0;
            String bottleneckStation = "None";
            String bottleneckOp = "None";
            double totalSmvMinutes = line.getTotalSmvMinutes() != null ? line.getTotalSmvMinutes() : 0.0;

            for (var a : stationAssignments) {
                double time = a.getEffectiveCycleTimeSecs() != null ? a.getEffectiveCycleTimeSecs() : 0.0;
                if (time > maxStationCycle) {
                    maxStationCycle = time;
                    bottleneckStation = a.getStationCode();
                    bottleneckOp = a.getOperationName();
                }
            }

            int targetHourly = line.getTargetPiecesPerHour() != null ? line.getTargetPiecesPerHour() : 70;
            int designedCapacity = targetHourly; // baseline
            int achievableCapacity = maxStationCycle > 0 ? (int) Math.round(3600.0 / maxStationCycle) : (int) Math.round(targetHourly * 0.85);

            // Calculate Achievable Line Efficiency % Formula:
            // Achievable Eff = (Total SMV in seconds) / (Max Station Cycle Time * Assigned Operators) * 100
            double totalSmvSecs = totalSmvMinutes * 60.0;
            double denominator = maxStationCycle * Math.max(1, assignedOps);
            double achievableEff = denominator > 0 ? round((totalSmvSecs / denominator) * 100.0, 1) : 0.0;
            achievableEff = Math.min(98.0, Math.max(40.0, achievableEff));

            double targetAchieved = targetHourly > 0 ? round(((double) achievableCapacity / targetHourly) * 100.0, 1) : 0.0;

            String status;
            if (targetAchieved >= 98.0) {
                status = "TARGET_ACHIEVED";
            } else if (shortage > 0) {
                status = "OPERATOR_SHORTAGE";
            } else if (machineGaps > 0) {
                status = "MACHINE_SHORTAGE";
            } else if (skillGaps > 0) {
                status = "SKILL_GAP";
            } else if (targetAchieved >= 80.0) {
                status = "PARTIALLY_ACHIEVED";
            } else {
                status = "REQUIRES_IE_REVIEW";
            }

            results.add(OptimizationResponseDTO.LineResultDTO.builder()
                    .lineId(line.getLineId())
                    .lineCode(line.getLineCode())
                    .lineName(line.getLineName())
                    .styleNo(line.getStyleNo())
                    .orderNo(line.getOrderNo())
                    .targetHourlyOutput(targetHourly)
                    .designedCapacity(designedCapacity)
                    .achievableCapacity(achievableCapacity)
                    .designedEfficiency(line.getPlannedLineEfficiency() != null ? line.getPlannedLineEfficiency() : 80.0)
                    .achievableEfficiency(achievableEff)
                    .assignedOperators(assignedOps)
                    .requiredOperators(requiredOps)
                    .operatorShortage(shortage)
                    .skillGaps(skillGaps)
                    .machineGaps(machineGaps)
                    .bottleneckStation(bottleneckStation)
                    .bottleneckOperation(bottleneckOp)
                    .targetAchievementPercent(targetAchieved)
                    .lineStatus(status)
                    .build());
        }

        return results;
    }

    public List<OptimizationResponseDTO.BottleneckDTO> generateBottlenecks(
            List<LineRequirementDTO> lineRequirements,
            List<OptimizationResponseDTO.AllocationAssignmentDTO> assignments) {

        List<OptimizationResponseDTO.BottleneckDTO> bottlenecks = new ArrayList<>();
        Map<Long, LineRequirementDTO> lineMap = lineRequirements.stream().collect(Collectors.toMap(LineRequirementDTO::getLineId, l -> l));

        long counter = 1;
        for (var a : assignments) {
            if (Boolean.TRUE.equals(a.getIsBottleneck())) {
                LineRequirementDTO line = lineMap.get(a.getLineId());
                double pitch = line != null && line.getDesignedPitchSecs() != null ? line.getDesignedPitchSecs() : 40.0;
                String lineName = line != null && line.getLineName() != null ? line.getLineName() : (a.getLineName() != null ? a.getLineName() : "Sewing Line " + a.getLineId());

                String reason;
                String recommendation;
                String severity;

                if ("UNASSIGNED".equalsIgnoreCase(a.getMatchStatus())) {
                    reason = "No operator assigned due to workforce pool shortage.";
                    recommendation = "Reassign floater from prep cell or cross-train a helper.";
                    severity = "CRITICAL";
                } else if ("MACHINE_GAP".equalsIgnoreCase(a.getMatchStatus())) {
                    reason = "Assigned operator is not certified on '" + a.getRequiredMachineType() + "'.";
                    recommendation = "Swap with certified operator or conduct on-line qualification.";
                    severity = "HIGH";
                } else if ("SKILL_GAP".equalsIgnoreCase(a.getMatchStatus()) || "TRAINEE".equalsIgnoreCase(a.getMatchStatus())) {
                    reason = "Operator skill rating (" + a.getAssignedSkillLevel() + ") is lower than required (" + a.getRequiredSkillLevel() + ").";
                    recommendation = "Assign higher-rated operator (Rating 4+) from less critical line or pair with inline mentor.";
                    severity = "MEDIUM";
                } else {
                    reason = "Operation standard SMV (" + a.getStandardSmv() + " min / " + a.getEffectiveCycleTimeSecs() + "s) exceeds Designed Pitch of " + round(pitch, 1) + "s.";
                    recommendation = "Add parallel workstation/operator or split sub-elements into sequential stations.";
                    severity = "MEDIUM";
                }

                bottlenecks.add(OptimizationResponseDTO.BottleneckDTO.builder()
                        .id(counter++)
                        .lineId(a.getLineId())
                        .lineName(lineName)
                        .stationIndex(a.getStationIndex())
                        .stationCode(a.getStationCode())
                        .operationName(a.getOperationName())
                        .requiredCycleTimeSecs(round(pitch, 1))
                        .effectiveCycleTimeSecs(a.getEffectiveCycleTimeSecs())
                        .requiredSkillLevel(a.getRequiredSkillLevel())
                        .assignedOperatorSkill(a.getAssignedSkillLevel())
                        .requiredMachineType(a.getRequiredMachineType())
                        .bottleneckReason(reason)
                        .recommendedAction(recommendation)
                        .severity(severity)
                        .build());
            }
        }

        return bottlenecks;
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
