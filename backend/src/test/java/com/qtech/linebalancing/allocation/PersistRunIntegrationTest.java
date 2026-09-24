package com.qtech.linebalancing.allocation;

import com.qtech.linebalancing.allocation.dto.OptimizationRequestDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationResponseDTO;
import com.qtech.linebalancing.allocation.service.AllocationAuditService;
import com.qtech.linebalancing.allocation.service.AllocationOptimizationEngine;
import com.qtech.linebalancing.allocation.service.AllocationResultService;
import com.qtech.linebalancing.allocation.service.AllocationScenarioService;
import com.qtech.linebalancing.allocation.service.LineRequirementService;
import com.qtech.linebalancing.allocation.service.OperatorPoolService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class PersistRunIntegrationTest {

    @Autowired
    private LineRequirementService lineRequirementService;
    @Autowired
    private OperatorPoolService operatorPoolService;
    @Autowired
    private AllocationOptimizationEngine optimizationEngine;
    @Autowired
    private AllocationResultService resultService;
    @Autowired
    private AllocationScenarioService scenarioService;
    @Autowired
    private AllocationAuditService auditService;

    @Test
    public void testOptimizeAndPersistAll6Lines() {
        OptimizationRequestDTO req = OptimizationRequestDTO.builder()
                .planningDate(LocalDate.now())
                .shiftId(1L)
                .lineIds(List.of(1L, 7L, 8L, 9L, 10L, 11L))
                .primaryScenario("MAX_OUTPUT")
                .allowCrossLineTransfers(true)
                .allowTraineesOnSimpleOps(true)
                .createdBy("Industrial Engineer")
                .build();

        var lineReqs = lineRequirementService.getLineRequirements(req.getLineIds());
        var pool = operatorPoolService.getOperatorPool(req.getPlanningDate(), req.getShiftId());

        var solverResult = optimizationEngine.solve(req, lineReqs, pool);

        var matrix = solverResult.getAssignments().stream().map(a ->
                OptimizationResponseDTO.AllocationAssignmentDTO.builder()
                        .lineId(a.getLineId())
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
                        .build()
        ).toList();

        var lineResults = resultService.computeLineResults(lineReqs, matrix);
        var summary = resultService.computeOverallSummary(lineResults, matrix, pool.size(), lineReqs.size());
        var bottlenecks = resultService.generateBottlenecks(lineReqs, matrix);
        var scenarios = scenarioService.generateScenarios(summary, lineResults, pool.size());

        try {
            var savedRun = auditService.persistRun(req, solverResult, summary, bottlenecks, scenarios, lineReqs);
            assertNotNull(savedRun);
            System.out.println("SUCCESSFULLY PERSISTED RUN ID: " + savedRun.getId());
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
