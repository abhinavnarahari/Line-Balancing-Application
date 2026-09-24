package com.qtech.linebalancing.allocation.controller;

import com.qtech.linebalancing.allocation.dto.*;
import com.qtech.linebalancing.allocation.entity.OperatorAllocationRun;
import com.qtech.linebalancing.allocation.repository.OperatorAllocationRunRepository;
import com.qtech.linebalancing.allocation.service.*;
import com.qtech.linebalancing.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/operator-allocation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OperatorAllocationController {

    private final OperatorPoolService operatorPoolService;
    private final LineRequirementService lineRequirementService;
    private final AllocationConstraintValidator validator;
    private final AllocationOptimizationEngine optimizationEngine;
    private final AllocationResultService resultService;
    private final AllocationScenarioService scenarioService;
    private final AllocationAuditService auditService;
    private final OperatorAllocationRunRepository runRepository;

    @GetMapping("/planning-context")
    public ApiResponse<PlanningContextDTO.Response> getPlanningContext(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long shiftId,
            @RequestParam(required = false) List<Long> lineIds) {
        return ApiResponse.success(lineRequirementService.getPlanningContext(date, shiftId, lineIds));
    }

    @GetMapping("/operator-pool")
    public ApiResponse<List<OperatorPoolDTO>> getOperatorPool(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long shiftId) {
        return ApiResponse.success(operatorPoolService.getOperatorPool(date, shiftId));
    }

    @GetMapping("/line-requirements")
    public ApiResponse<List<LineRequirementDTO>> getLineRequirements(
            @RequestParam(required = false) List<Long> lineIds) {
        return ApiResponse.success(lineRequirementService.getLineRequirements(lineIds));
    }

    @PostMapping("/validate")
    public ApiResponse<PreflightValidationDTO> validate(@RequestBody OptimizationRequestDTO request) {
        List<LineRequirementDTO> lineReqs = lineRequirementService.getLineRequirements(request.getLineIds());
        List<OperatorPoolDTO> pool = operatorPoolService.getOperatorPool(request.getPlanningDate(), request.getShiftId());
        return ApiResponse.success(validator.validate(request, lineReqs, pool));
    }

    @PostMapping("/optimize")
    public ApiResponse<OptimizationResponseDTO> optimize(@RequestBody OptimizationRequestDTO request) {
        log.info("Running Multi-Line Operator Allocation Optimizer for {} lines on date {}",
                request.getLineIds() != null ? request.getLineIds().size() : "default", request.getPlanningDate());

        List<LineRequirementDTO> lineReqs = lineRequirementService.getLineRequirements(request.getLineIds());
        List<OperatorPoolDTO> pool = operatorPoolService.getOperatorPool(request.getPlanningDate(), request.getShiftId());

        // Run multi-line constraint solver
        var solverResult = optimizationEngine.solve(request, lineReqs, pool);

        // Convert decisions to assignment DTOs
        Map<Long, LineRequirementDTO> reqMap = lineReqs.stream().collect(Collectors.toMap(LineRequirementDTO::getLineId, l -> l, (x, y) -> x));
        List<OptimizationResponseDTO.AllocationAssignmentDTO> matrix = solverResult.getAssignments().stream().map(a -> {
            LineRequirementDTO lr = reqMap.get(a.getLineId());
            String lineCode = lr != null ? lr.getLineCode() : "LINE-" + a.getLineId();
            String lineName = lr != null ? lr.getLineName() : "Sewing Line " + a.getLineId();
            return OptimizationResponseDTO.AllocationAssignmentDTO.builder()
                    .lineId(a.getLineId())
                    .lineCode(lineCode)
                    .lineName(lineName)
                    .stationIndex(a.getStationIndex())
                    .stationCode(a.getStationCode())
                    .operationId(a.getOperationId())
                    .operationName(a.getOperationName())
                    .operationCode(a.getOperationCode())
                    .requiredSkillLevel(a.getRequiredSkillLevel())
                    .requiredMachineType(a.getRequiredMachineType())
                    .operatorId(a.getOperatorId())
                    .operatorName(a.getOperatorName())
                    .operatorCode(a.getOperatorCode())
                    .assignedSkillLevel(a.getAssignedSkillLevel())
                    .performanceSource(a.getPerformanceSource())
                    .standardSmv(a.getStandardSmv())
                    .effectiveCycleTimeSecs(a.getEffectiveCycleTimeSecs())
                    .operatorEfficiencyPercent(a.getOperatorEfficiencyPercent())
                    .matchStatus(a.getMatchStatus())
                    .isBottleneck(a.isBottleneck())
                    .isFixed(a.isFixed())
                    .notes(a.getNotes())
                    .build();
        }).toList();

        // Calculate line metrics
        List<OptimizationResponseDTO.LineResultDTO> lineResults = resultService.computeLineResults(lineReqs, matrix);

        // Calculate overall summary
        OptimizationResponseDTO.OverallSummaryDTO summary = resultService.computeOverallSummary(
                lineResults, matrix, pool.size(), lineReqs.size());

        // Diagnose bottlenecks & recommendations
        List<OptimizationResponseDTO.BottleneckDTO> bottlenecks = resultService.generateBottlenecks(lineReqs, matrix);

        // Generate alternative scenarios
        List<OptimizationResponseDTO.ScenarioDTO> scenarios = scenarioService.generateScenarios(
                summary, lineResults, pool.size());

        // Persist run snapshot
        OperatorAllocationRun savedRun = auditService.persistRun(
                request, solverResult, summary, bottlenecks, scenarios, lineReqs);

        return ApiResponse.success("Multi-line operator allocation optimization completed successfully",
                auditService.getRunDetail(savedRun.getId()));
    }

    @GetMapping("/runs/{runId}")
    public ApiResponse<OptimizationResponseDTO> getRunDetail(@PathVariable Long runId) {
        return ApiResponse.success(auditService.getRunDetail(runId));
    }

    @PostMapping("/runs/{runId}/override")
    public ApiResponse<OptimizationResponseDTO> overrideAssignment(
            @PathVariable Long runId,
            @RequestBody ManualOverrideDTO.Request request) {
        return ApiResponse.success("Manual operator override applied successfully",
                auditService.applyManualOverride(runId, request));
    }

    @PostMapping("/runs/{runId}/approve")
    public ApiResponse<OptimizationResponseDTO> approveRun(
            @PathVariable Long runId,
            @RequestBody ManualOverrideDTO.ApprovalRequest request) {
        return ApiResponse.success("Operator allocation plan approved successfully",
                auditService.approveRun(runId, request));
    }

    @PostMapping("/runs/{runId}/apply")
    public ApiResponse<OptimizationResponseDTO> applyRun(
            @PathVariable Long runId,
            @RequestBody ManualOverrideDTO.ApplyRequest request) {
        return ApiResponse.success("Operator allocation successfully applied to shopfloor lines",
                auditService.applyRun(runId, request));
    }

    @GetMapping("/runs/{runId}/audits")
    public ApiResponse<List<ManualOverrideDTO.AuditLogDTO>> getAuditLogs(@PathVariable Long runId) {
        return ApiResponse.success(auditService.getAuditLogs(runId));
    }

    @GetMapping("/runs")
    public ApiResponse<List<OptimizationResponseDTO.RunSummaryDTO>> getAllRuns() {
        return ApiResponse.success(auditService.getAllRunSummaries());
    }
}
