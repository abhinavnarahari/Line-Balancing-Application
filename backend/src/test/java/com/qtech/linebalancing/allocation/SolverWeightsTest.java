package com.qtech.linebalancing.allocation;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationRequestDTO;
import com.qtech.linebalancing.allocation.service.AllocationOptimizationEngine;
import com.qtech.linebalancing.allocation.service.OperatorPerformanceService;
import com.qtech.linebalancing.allocation.service.OperatorPerformanceService.OperatorPerformanceEvaluation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;

/** FUNC-08: the UI solver weights must influence which operator the optimizer picks. */
@ExtendWith(MockitoExtension.class)
class SolverWeightsTest {

    private static final long FAST_BUT_UNSKILLED = 1L;   // efficiency 90, skill gap, machine qualified
    private static final long SKILLED_NO_MACHINE = 2L;   // efficiency 70, skilled, not machine qualified

    @Mock private OperatorPerformanceService performanceService;
    private AllocationOptimizationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new AllocationOptimizationEngine(performanceService);
        lenient().when(performanceService.evaluate(any(), eq(FAST_BUT_UNSKILLED), any(), any(), anyDouble(), anyInt()))
                .thenReturn(eval(90, 2, "SKILL_GAP", true));
        lenient().when(performanceService.evaluate(any(), eq(SKILLED_NO_MACHINE), any(), any(), anyDouble(), anyInt()))
                .thenReturn(eval(70, 4, "MACHINE_GAP", false));
    }

    private static OperatorPerformanceEvaluation eval(double eff, int skill, String match, boolean machine) {
        return OperatorPerformanceEvaluation.builder()
                .operatorEfficiencyPercent(eff).evaluatedSkillLevel(skill).matchStatus(match)
                .isMachineQualified(machine).effectiveCycleTimeSecs(30).performanceSource("CALIBRATED").build();
    }

    private Long chosenOperator(OptimizationRequestDTO.SolverWeights weights) {
        LineRequirementDTO line = LineRequirementDTO.builder()
                .lineId(1L).lineName("Line 01").designedPitchSecs(40.0).designedManpower(1).totalSmvMinutes(0.5)
                .stations(List.of(LineRequirementDTO.StationRequirementItem.builder()
                        .stationIndex(1).stationCode("S01").operationId(10L).operationName("Collar Attach")
                        .operationSmv(0.5).requiredSkillLevel(3).requiredMachineType("SNLS").build()))
                .build();
        List<OperatorPoolDTO> pool = List.of(
                OperatorPoolDTO.builder().operatorId(FAST_BUT_UNSKILLED).operatorName("A").attendanceStatus("PRESENT").availabilityStatus("AVAILABLE").build(),
                OperatorPoolDTO.builder().operatorId(SKILLED_NO_MACHINE).operatorName("B").attendanceStatus("PRESENT").availabilityStatus("AVAILABLE").build());
        OptimizationRequestDTO req = OptimizationRequestDTO.builder()
                .planningDate(LocalDate.now()).primaryScenario("MAX_OUTPUT").lineIds(List.of(1L)).weights(weights).build();
        return engine.solve(req, List.of(line), pool).getAssignments().get(0).getOperatorId();
    }

    @Test
    void withoutWeightsTheBuiltInScoringIsUnchanged() {
        // A: 90 - 20 + 10 = 80 ; B: 70 + 15 - 35 = 50
        assertThat(chosenOperator(null)).isEqualTo(FAST_BUT_UNSKILLED);
    }

    @Test
    void emphasisingSkillOverMachineChangesTheChoice() {
        var skillFirst = OptimizationRequestDTO.SolverWeights.builder()
                .efficiencyWeight(50).skillMatchWeight(100).machineCompatWeight(0).lineBalanceWeight(50).build();
        // A: 90 - 40 + 0 = 50 ; B: 70 + 30 - 0 = 100
        assertThat(chosenOperator(skillFirst)).isEqualTo(SKILLED_NO_MACHINE);
    }

    @Test
    void weightFactorMapping() {
        assertThat(AllocationOptimizationEngine.factor(null)).isEqualTo(1.0);
        assertThat(AllocationOptimizationEngine.factor(50)).isEqualTo(1.0);
        assertThat(AllocationOptimizationEngine.factor(100)).isEqualTo(2.0);
        assertThat(AllocationOptimizationEngine.factor(0)).isEqualTo(0.0);
        assertThat(AllocationOptimizationEngine.factor(150)).isEqualTo(2.0);
    }
}
