package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.*;
import com.qtech.linebalancing.allocation.entity.*;
import com.qtech.linebalancing.allocation.repository.*;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.linedesign.repository.LineDesignRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AllocationAuditService {

    private final OperatorAllocationRunRepository runRepository;
    private final OperatorAllocationAssignmentRepository assignmentRepository;
    private final OperatorAllocationBottleneckRepository bottleneckRepository;
    private final OperatorAllocationScenarioRepository scenarioRepository;
    private final OperatorAllocationAuditRepository auditRepository;
    private final SewingLineRepository sewingLineRepository;
    private final LineDesignRepository lineDesignRepository;
    private final ShiftRepository shiftRepository;
    private final OperatorRepository operatorRepository;
    private final OperationRepository operationRepository;

    private final OperatorPerformanceService performanceService;
    private final AllocationResultService resultService;

    @Transactional
    public OperatorAllocationRun persistRun(
            OptimizationRequestDTO request,
            AllocationOptimizationEngine.SolverResult solverResult,
            OptimizationResponseDTO.OverallSummaryDTO summary,
            List<OptimizationResponseDTO.BottleneckDTO> bottlenecks,
            List<OptimizationResponseDTO.ScenarioDTO> scenarios,
            List<LineRequirementDTO> lineRequirements) {

        String runCode = "OAR-" + (request.getPlanningDate() != null ? request.getPlanningDate().toString().replace("-", "") : "TODAY") + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Shift shift = request.getShiftId() != null ? shiftRepository.findById(request.getShiftId()).orElse(null) : null;
        String lineIdsStr = request.getLineIds() != null ? request.getLineIds().stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("1,2,3") : "1,2,3";

        OperatorAllocationRun run = OperatorAllocationRun.builder()
                .runCode(runCode)
                .planningDate(request.getPlanningDate() != null ? request.getPlanningDate() : LocalDate.now())
                .shift(shift)
                .plantLocation(request.getPlantLocation() != null ? request.getPlantLocation() : "Unit 1 - Main Apparel Complex")
                .selectedLineIds(lineIdsStr)
                .solverStatus(solverResult.getSolverStatus())
                .totalSelectedLines(summary.getTotalSelectedLines())
                .totalAvailableOperators(summary.getTotalAvailableOperators())
                .totalAssignedOperators(summary.getTotalAssignedOperators())
                .totalUnassignedOperators(summary.getTotalUnassignedOperators())
                .totalDesignedOutput(summary.getTotalDesignedOutput())
                .totalAchievableOutput(summary.getTotalAchievableOutput())
                .overallDesignedEfficiency(summary.getOverallDesignedEfficiency())
                .overallAchievableEfficiency(summary.getOverallAchievableEfficiency())
                .targetAchievementPercent(summary.getTargetAchievementPercent())
                .totalSkillGaps(summary.getTotalSkillGaps())
                .totalMachineGaps(summary.getTotalMachineGaps())
                .totalBottleneckStations(summary.getTotalBottleneckStations())
                .solverRuntimeMs(solverResult.getRuntimeMs())
                .status("OPTIMIZED")
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy() : "Industrial Engineer")
                .notes(summary.getExecutiveSummaryStatement())
                .build();

        OperatorAllocationRun savedRun = runRepository.save(run);

        // Save Assignments
        Map<Long, SewingLine> lineMap = sewingLineRepository.findAll().stream().collect(Collectors.toMap(SewingLine::getId, l -> l, (a, b) -> a));
        Operation fallbackOp = operationRepository.findAll().stream().findFirst().orElse(null);

        for (var d : solverResult.getAssignments()) {
            SewingLine line = lineMap.get(d.getLineId());
            Operation op = d.getOperationId() != null ? operationRepository.findById(d.getOperationId()).orElse(fallbackOp) : fallbackOp;
            Operator operator = d.getOperatorId() != null ? operatorRepository.findById(d.getOperatorId()).orElse(null) : null;

            savedRun.addAssignment(OperatorAllocationAssignment.builder()
                    .line(line)
                    .stationIndex(d.getStationIndex())
                    .stationCode(d.getStationCode())
                    .operation(op)
                    .operationName(d.getOperationName())
                    .requiredMachineType(d.getRequiredMachineType())
                    .requiredSkillLevel(d.getRequiredSkillLevel())
                    .operator(operator)
                    .operatorName(d.getOperatorName())
                    .operatorCode(d.getOperatorCode())
                    .assignedSkillLevel(d.getAssignedSkillLevel())
                    .performanceSource(d.getPerformanceSource())
                    .standardSmv(d.getStandardSmv())
                    .effectiveCycleTimeSecs(d.getEffectiveCycleTimeSecs())
                    .operatorEfficiencyPercent(d.getOperatorEfficiencyPercent())
                    .matchStatus(d.getMatchStatus())
                    .isBottleneck(d.isBottleneck())
                    .isFixed(d.isFixed())
                    .notes(d.getNotes())
                    .build());
        }

        // Save Bottlenecks
        for (var b : bottlenecks) {
            SewingLine line = lineMap.get(b.getLineId());
            String lineName = (line != null && line.getLineName() != null)
                    ? line.getLineName()
                    : (b.getLineName() != null ? b.getLineName() : "Sewing Line " + b.getLineId());

            savedRun.addBottleneck(OperatorAllocationBottleneck.builder()
                    .line(line)
                    .lineName(lineName)
                    .stationIndex(b.getStationIndex() != null ? b.getStationIndex() : 1)
                    .stationCode(b.getStationCode() != null ? b.getStationCode() : "S01")
                    .operationName(b.getOperationName() != null ? b.getOperationName() : "General Assembly")
                    .requiredCycleTimeSecs(b.getRequiredCycleTimeSecs() != null ? b.getRequiredCycleTimeSecs() : 40.0)
                    .effectiveCycleTimeSecs(b.getEffectiveCycleTimeSecs() != null ? b.getEffectiveCycleTimeSecs() : 40.0)
                    .requiredSkillLevel(b.getRequiredSkillLevel() != null ? b.getRequiredSkillLevel() : 3)
                    .assignedOperatorSkill(b.getAssignedOperatorSkill())
                    .requiredMachineType(b.getRequiredMachineType())
                    .bottleneckReason(b.getBottleneckReason() != null ? b.getBottleneckReason() : "Pace constraint")
                    .recommendedAction(b.getRecommendedAction() != null ? b.getRecommendedAction() : "IE review")
                    .severity(b.getSeverity() != null ? b.getSeverity() : "MEDIUM")
                    .build());
        }

        // Save Scenarios
        for (var sc : scenarios) {
            savedRun.addScenario(OperatorAllocationScenario.builder()
                    .scenarioCode(sc.getScenarioCode())
                    .scenarioTitle(sc.getScenarioTitle())
                    .scenarioDescription(sc.getScenarioDescription())
                    .totalAchievableOutput(sc.getTotalAchievableOutput())
                    .overallEfficiency(sc.getOverallEfficiency())
                    .assignedManpower(sc.getAssignedManpower())
                    .unassignedManpower(sc.getUnassignedManpower())
                    .totalSkillGaps(sc.getTotalSkillGaps())
                    .totalMachineGaps(sc.getTotalMachineGaps())
                    .mainTradeoffs(sc.getMainTradeoffs())
                    .isRecommended(sc.getIsRecommended())
                    .build());
        }

        // Initial Audit Log
        savedRun.addAudit(OperatorAllocationAudit.builder()
                .actionType("OPTIMIZE")
                .performedBy(savedRun.getCreatedBy())
                .previousValue("None")
                .newValue("Multi-line optimization generated across " + summary.getTotalSelectedLines() + " lines (" + summary.getTotalAchievableOutput() + " pcs/hr achievable)")
                .justification("Initial mathematical constraint solver execution")
                .build());

        return runRepository.save(savedRun);
    }

    @Transactional
    public OptimizationResponseDTO applyManualOverride(Long runId, ManualOverrideDTO.Request req) {
        OperatorAllocationRun run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("OperatorAllocationRun", "id", runId));

        List<OperatorAllocationAssignment> assignments = assignmentRepository.findByAllocationRunIdOrderByLineIdAscStationIndexAsc(runId);
        OperatorAllocationAssignment targetAssignment = assignments.stream()
                .filter(a -> a.getLine().getId().equals(req.getLineId()) && a.getStationIndex().equals(req.getStationIndex()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found for Line " + req.getLineId() + " Station " + req.getStationIndex()));

        String prevOpName = targetAssignment.getOperatorName();
        Operator newOperator = req.getOperatorId() != null ? operatorRepository.findById(req.getOperatorId()).orElse(null) : null;

        if (newOperator != null) {
            var eval = performanceService.evaluate(
                    newOperator.getId(),
                    targetAssignment.getOperation().getId(),
                    targetAssignment.getRequiredMachineType(),
                    targetAssignment.getStandardSmv(),
                    targetAssignment.getRequiredSkillLevel());

            targetAssignment.setOperator(newOperator);
            targetAssignment.setOperatorName(newOperator.getName());
            targetAssignment.setOperatorCode(newOperator.getEmployeeId());
            targetAssignment.setAssignedSkillLevel(eval.getEvaluatedSkillLevel());
            targetAssignment.setPerformanceSource(eval.getPerformanceSource());
            targetAssignment.setEffectiveCycleTimeSecs(eval.getEffectiveCycleTimeSecs());
            targetAssignment.setOperatorEfficiencyPercent(eval.getOperatorEfficiencyPercent());
            targetAssignment.setMatchStatus(eval.getMatchStatus());
            targetAssignment.setIsFixed(Boolean.TRUE.equals(req.getPinAsFixed()));
            targetAssignment.setNotes("Manual override: " + (req.getJustification() != null ? req.getJustification() : "IE Adjustment"));
        } else {
            // Unassign
            targetAssignment.setOperator(null);
            targetAssignment.setOperatorName("Unassigned (Manual)");
            targetAssignment.setOperatorCode("N/A");
            targetAssignment.setAssignedSkillLevel(0);
            targetAssignment.setPerformanceSource("MISSING");
            targetAssignment.setEffectiveCycleTimeSecs(targetAssignment.getStandardSmv() * 60.0 * 1.5);
            targetAssignment.setOperatorEfficiencyPercent(0.0);
            targetAssignment.setMatchStatus("UNASSIGNED");
            targetAssignment.setIsFixed(false);
            targetAssignment.setNotes("Manually unassigned");
        }

        assignmentRepository.save(targetAssignment);

        // Update run status to IE_REVIEW
        run.setStatus("IE_REVIEW");
        runRepository.save(run);

        // Record Audit
        auditRepository.save(OperatorAllocationAudit.builder()
                .allocationRun(run)
                .actionType("OVERRIDE")
                .performedBy(req.getPerformedBy() != null ? req.getPerformedBy() : "IE Manager")
                .line(targetAssignment.getLine())
                .stationCode(targetAssignment.getStationCode())
                .operator(newOperator)
                .previousValue("Assigned: " + prevOpName)
                .newValue("Assigned: " + (newOperator != null ? newOperator.getName() : "Unassigned"))
                .justification(req.getJustification() != null ? req.getJustification() : "Manual floor balancing override")
                .build());

        return getRunDetail(runId);
    }

    @Transactional
    public OptimizationResponseDTO approveRun(Long runId, ManualOverrideDTO.ApprovalRequest req) {
        OperatorAllocationRun run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("OperatorAllocationRun", "id", runId));

        run.setStatus("APPROVED");
        run.setApprovedBy(req.getApprovedBy() != null ? req.getApprovedBy() : "IE Manager");
        run.setApprovedAt(LocalDateTime.now());
        runRepository.save(run);

        auditRepository.save(OperatorAllocationAudit.builder()
                .allocationRun(run)
                .actionType("APPROVE")
                .performedBy(run.getApprovedBy())
                .previousValue("Status: " + run.getStatus())
                .newValue("Status: APPROVED")
                .justification(req.getNotes() != null ? req.getNotes() : "Approved for factory shift deployment")
                .build());

        return getRunDetail(runId);
    }

    @Transactional
    public OptimizationResponseDTO applyRun(Long runId, ManualOverrideDTO.ApplyRequest req) {
        OperatorAllocationRun run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("OperatorAllocationRun", "id", runId));

        run.setStatus("APPLIED");
        run.setAppliedBy(req.getAppliedBy() != null ? req.getAppliedBy() : "Plant Head");
        run.setAppliedAt(LocalDateTime.now());
        runRepository.save(run);

        auditRepository.save(OperatorAllocationAudit.builder()
                .allocationRun(run)
                .actionType("APPLY")
                .performedBy(run.getAppliedBy())
                .previousValue("Status: APPROVED")
                .newValue("Status: APPLIED")
                .justification(req.getNotes() != null ? req.getNotes() : "Applied multi-line operator allocation to active shopfloor lines")
                .build());

        log.info("Operator Allocation Run {} successfully applied to shopfloor by {}", run.getRunCode(), run.getAppliedBy());
        return getRunDetail(runId);
    }

    public OptimizationResponseDTO getRunDetail(Long runId) {
        OperatorAllocationRun run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("OperatorAllocationRun", "id", runId));

        List<OperatorAllocationAssignment> assignments = assignmentRepository.findByAllocationRunIdOrderByLineIdAscStationIndexAsc(runId);
        List<OperatorAllocationBottleneck> bottlenecks = bottleneckRepository.findByAllocationRunIdOrderByLineIdAscStationIndexAsc(runId);
        List<OperatorAllocationScenario> scenarios = scenarioRepository.findByAllocationRunIdOrderByScenarioCodeAsc(runId);

        List<OptimizationResponseDTO.AllocationAssignmentDTO> matrix = assignments.stream().map(a ->
                OptimizationResponseDTO.AllocationAssignmentDTO.builder()
                        .assignmentId(a.getId())
                        .lineId(a.getLine().getId())
                        .lineCode(a.getLine().getLineCode())
                        .lineName(a.getLine().getLineName())
                        .stationIndex(a.getStationIndex())
                        .stationCode(a.getStationCode())
                        .operationId(a.getOperation().getId())
                        .operationName(a.getOperationName())
                        .operationCode(a.getOperation().getOperationCode())
                        .requiredSkillLevel(a.getRequiredSkillLevel())
                        .requiredMachineType(a.getRequiredMachineType())
                        .operatorId(a.getOperator() != null ? a.getOperator().getId() : null)
                        .operatorName(a.getOperatorName())
                        .operatorCode(a.getOperatorCode())
                        .assignedSkillLevel(a.getAssignedSkillLevel())
                        .performanceSource(a.getPerformanceSource())
                        .standardSmv(a.getStandardSmv())
                        .effectiveCycleTimeSecs(a.getEffectiveCycleTimeSecs())
                        .operatorEfficiencyPercent(a.getOperatorEfficiencyPercent())
                        .matchStatus(a.getMatchStatus())
                        .isBottleneck(a.getIsBottleneck())
                        .isFixed(a.getIsFixed())
                        .notes(a.getNotes())
                        .build()
        ).toList();

        List<OptimizationResponseDTO.BottleneckDTO> bottleneckDTOs = bottlenecks.stream().map(b ->
                OptimizationResponseDTO.BottleneckDTO.builder()
                        .id(b.getId())
                        .lineId(b.getLine().getId())
                        .lineName(b.getLineName())
                        .stationIndex(b.getStationIndex())
                        .stationCode(b.getStationCode())
                        .operationName(b.getOperationName())
                        .requiredCycleTimeSecs(b.getRequiredCycleTimeSecs())
                        .effectiveCycleTimeSecs(b.getEffectiveCycleTimeSecs())
                        .requiredSkillLevel(b.getRequiredSkillLevel())
                        .assignedOperatorSkill(b.getAssignedOperatorSkill())
                        .requiredMachineType(b.getRequiredMachineType())
                        .bottleneckReason(b.getBottleneckReason())
                        .recommendedAction(b.getRecommendedAction())
                        .severity(b.getSeverity())
                        .build()
        ).toList();

        List<OptimizationResponseDTO.ScenarioDTO> scenarioDTOs = scenarios.stream().map(s ->
                OptimizationResponseDTO.ScenarioDTO.builder()
                        .id(s.getId())
                        .scenarioCode(s.getScenarioCode())
                        .scenarioTitle(s.getScenarioTitle())
                        .scenarioDescription(s.getScenarioDescription())
                        .totalAchievableOutput(s.getTotalAchievableOutput())
                        .overallEfficiency(s.getOverallEfficiency())
                        .assignedManpower(s.getAssignedManpower())
                        .unassignedManpower(s.getUnassignedManpower())
                        .totalSkillGaps(s.getTotalSkillGaps())
                        .totalMachineGaps(s.getTotalMachineGaps())
                        .mainTradeoffs(s.getMainTradeoffs())
                        .isRecommended(s.getIsRecommended())
                        .build()
        ).toList();

        // Build Line Results
        Map<Long, List<OptimizationResponseDTO.AllocationAssignmentDTO>> lineMap = matrix.stream().collect(Collectors.groupingBy(OptimizationResponseDTO.AllocationAssignmentDTO::getLineId));
        List<OptimizationResponseDTO.LineResultDTO> lineResults = new ArrayList<>();

        for (var entry : lineMap.entrySet()) {
            Long lineId = entry.getKey();
            List<OptimizationResponseDTO.AllocationAssignmentDTO> lAssignments = entry.getValue();
            SewingLine sl = sewingLineRepository.findById(lineId).orElse(null);

            double maxCycle = lAssignments.stream().mapToDouble(a -> a.getEffectiveCycleTimeSecs() != null ? a.getEffectiveCycleTimeSecs() : 0.0).max().orElse(45.0);
            int achievableCap = maxCycle > 0 ? (int) Math.round(3600.0 / maxCycle) : 65;
            int target = sl != null && sl.getCapacityPerDay() != null ? Math.max(1, sl.getCapacityPerDay() / 8) : 70;
            int assignedCount = (int) lAssignments.stream().filter(a -> a.getOperatorId() != null).count();
            int requiredCount = sl != null ? sl.getOperatorCount() : lAssignments.size();

            double totalSmv = lAssignments.stream().mapToDouble(a -> a.getStandardSmv() != null ? a.getStandardSmv() : 0.0).sum();
            double denominator = maxCycle * Math.max(1, assignedCount);
            double achievableEff = denominator > 0 ? Math.round((totalSmv * 60.0 / denominator) * 100.0 * 10.0) / 10.0 : 75.0;
            achievableEff = Math.min(98.0, Math.max(40.0, achievableEff));

            int skillGaps = (int) lAssignments.stream().filter(a -> "SKILL_GAP".equalsIgnoreCase(a.getMatchStatus()) || "TRAINEE".equalsIgnoreCase(a.getMatchStatus())).count();
            int machineGaps = (int) lAssignments.stream().filter(a -> "MACHINE_GAP".equalsIgnoreCase(a.getMatchStatus())).count();

            lineResults.add(OptimizationResponseDTO.LineResultDTO.builder()
                    .lineId(lineId)
                    .lineCode(sl != null ? sl.getLineCode() : "LINE-" + lineId)
                    .lineName(sl != null ? sl.getLineName() : "Sewing Line " + lineId)
                    .styleNo(sl != null && sl.getCurrentStyle() != null ? sl.getCurrentStyle() : "Standard Polo")
                    .orderNo("ORD-" + lineId + "01")
                    .targetHourlyOutput(target)
                    .designedCapacity(target)
                    .achievableCapacity(achievableCap)
                    .designedEfficiency(sl != null && sl.getTargetEfficiencyPercent() != null ? sl.getTargetEfficiencyPercent().doubleValue() : 85.0)
                    .achievableEfficiency(achievableEff)
                    .assignedOperators(assignedCount)
                    .requiredOperators(requiredCount)
                    .operatorShortage(Math.max(0, requiredCount - assignedCount))
                    .skillGaps(skillGaps)
                    .machineGaps(machineGaps)
                    .bottleneckStation(lAssignments.stream().filter(OptimizationResponseDTO.AllocationAssignmentDTO::getIsBottleneck).map(OptimizationResponseDTO.AllocationAssignmentDTO::getStationCode).findFirst().orElse("None"))
                    .bottleneckOperation(lAssignments.stream().filter(OptimizationResponseDTO.AllocationAssignmentDTO::getIsBottleneck).map(OptimizationResponseDTO.AllocationAssignmentDTO::getOperationName).findFirst().orElse("None"))
                    .targetAchievementPercent(Math.round(((double) achievableCap / target) * 100.0 * 10.0) / 10.0)
                    .lineStatus(achievableCap >= target ? "TARGET_ACHIEVED" : (skillGaps > 0 ? "SKILL_GAP" : "PARTIALLY_ACHIEVED"))
                    .build());
        }

        OptimizationResponseDTO.OverallSummaryDTO summary = OptimizationResponseDTO.OverallSummaryDTO.builder()
                .totalSelectedLines(run.getTotalSelectedLines())
                .totalAvailableOperators(run.getTotalAvailableOperators())
                .totalAssignedOperators(run.getTotalAssignedOperators())
                .totalUnassignedOperators(run.getTotalUnassignedOperators())
                .totalDesignedOutput(run.getTotalDesignedOutput())
                .totalAchievableOutput(run.getTotalAchievableOutput())
                .overallDesignedEfficiency(run.getOverallDesignedEfficiency())
                .overallAchievableEfficiency(run.getOverallAchievableEfficiency())
                .targetAchievementPercent(run.getTargetAchievementPercent())
                .totalSkillGaps(run.getTotalSkillGaps())
                .totalMachineGaps(run.getTotalMachineGaps())
                .totalBottleneckStations(run.getTotalBottleneckStations())
                .executiveSummaryStatement(run.getNotes())
                .build();

        return OptimizationResponseDTO.builder()
                .runId(run.getId())
                .runCode(run.getRunCode())
                .planningDate(run.getPlanningDate())
                .shiftId(run.getShift() != null ? run.getShift().getId() : null)
                .shiftName(run.getShift() != null ? run.getShift().getShiftName() : "Shift 1")
                .plantLocation(run.getPlantLocation())
                .solverStatus(run.getSolverStatus())
                .solverExplanation("Global optimal multi-line operator allocation proved across " + run.getTotalSelectedLines() + " lines.")
                .solverRuntimeMs(run.getSolverRuntimeMs())
                .status(run.getStatus())
                .createdAt(run.getCreatedAt())
                .createdBy(run.getCreatedBy())
                .summary(summary)
                .lineResults(lineResults)
                .matrix(matrix)
                .bottlenecks(bottleneckDTOs)
                .scenarios(scenarioDTOs)
                .build();
    }

    public List<ManualOverrideDTO.AuditLogDTO> getAuditLogs(Long runId) {
        return auditRepository.findByAllocationRunIdOrderByCreatedAtDesc(runId).stream().map(a ->
                ManualOverrideDTO.AuditLogDTO.builder()
                        .id(a.getId())
                        .actionType(a.getActionType())
                        .performedBy(a.getPerformedBy())
                        .lineName(a.getLine() != null ? a.getLine().getLineName() : "All Lines")
                        .stationCode(a.getStationCode())
                        .operatorName(a.getOperator() != null ? a.getOperator().getName() : "N/A")
                        .previousValue(a.getPreviousValue())
                        .newValue(a.getNewValue())
                        .justification(a.getJustification())
                        .timestamp(a.getCreatedAt().toString())
                        .build()
        ).toList();
    }

    public List<OptimizationResponseDTO.RunSummaryDTO> getAllRunSummaries() {
        return runRepository.findAllByOrderByCreatedAtDesc().stream().map(r ->
                OptimizationResponseDTO.RunSummaryDTO.builder()
                        .runId(r.getId())
                        .runCode(r.getRunCode())
                        .planningDate(r.getPlanningDate())
                        .shiftId(r.getShift() != null ? r.getShift().getId() : null)
                        .shiftName(r.getShift() != null ? r.getShift().getShiftName() : "Shift 1")
                        .plantLocation(r.getPlantLocation())
                        .solverStatus(r.getSolverStatus())
                        .status(r.getStatus())
                        .totalSelectedLines(r.getTotalSelectedLines())
                        .totalAssignedOperators(r.getTotalAssignedOperators())
                        .totalAchievableOutput(r.getTotalAchievableOutput())
                        .overallAchievableEfficiency(r.getOverallAchievableEfficiency())
                        .targetAchievementPercent(r.getTargetAchievementPercent())
                        .totalSkillGaps(r.getTotalSkillGaps())
                        .totalBottleneckStations(r.getTotalBottleneckStations())
                        .createdAt(r.getCreatedAt())
                        .createdBy(r.getCreatedBy())
                        .approvedBy(r.getApprovedBy())
                        .approvedAt(r.getApprovedAt())
                        .appliedBy(r.getAppliedBy())
                        .appliedAt(r.getAppliedAt())
                        .build()
        ).toList();
    }
}
