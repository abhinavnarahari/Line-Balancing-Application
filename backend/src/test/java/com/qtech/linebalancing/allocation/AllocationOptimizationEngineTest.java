package com.qtech.linebalancing.allocation;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.dto.OptimizationRequestDTO;
import com.qtech.linebalancing.allocation.repository.OperatorMachineQualificationRepository;
import com.qtech.linebalancing.allocation.service.AllocationOptimizationEngine;
import com.qtech.linebalancing.allocation.service.OperatorPerformanceService;
import com.qtech.linebalancing.skillmatrix.repository.OperatorPerformanceLogRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AllocationOptimizationEngineTest {

    @Mock
    private OperatorPerformanceLogRepository performanceLogRepository;
    @Mock
    private SkillAssessmentRepository skillAssessmentRepository;
    @Mock
    private OperatorMachineQualificationRepository machineQualificationRepository;

    private OperatorPerformanceService performanceService;
    private AllocationOptimizationEngine engine;

    @BeforeEach
    void setUp() {
        performanceService = new OperatorPerformanceService(
                performanceLogRepository,
                skillAssessmentRepository,
                machineQualificationRepository
        );
        engine = new AllocationOptimizationEngine(performanceService);
    }

    @Test
    @DisplayName("Should successfully allocate operators across 3 sewing lines without duplicate assignments")
    void testMultiLineAllocationConstraintSatisfaction() {
        // Setup 3 Lines with 5 stations each
        List<LineRequirementDTO> lineReqs = new ArrayList<>();
        for (long lineId = 1; lineId <= 3; lineId++) {
            List<LineRequirementDTO.StationRequirementItem> stations = new ArrayList<>();
            for (int st = 1; st <= 5; st++) {
                stations.add(LineRequirementDTO.StationRequirementItem.builder()
                        .stationIndex(st)
                        .stationCode("S0" + st)
                        .operationId((long) st)
                        .operationName("Operation " + st)
                        .operationCode("OP-0" + st)
                        .requiredMachineType("Single Needle Lockstitch (SNLS)")
                        .requiredSkillLevel(3)
                        .operationSmv(0.45)
                        .isParallelizable(true)
                        .splitAllowed(false)
                        .build());
            }

            lineReqs.add(LineRequirementDTO.builder()
                    .lineId(lineId)
                    .lineCode("LINE-0" + lineId)
                    .lineName("Line 0" + lineId)
                    .styleNo("STYLE-0" + lineId)
                    .targetPiecesPerHour(80)
                    .designedPitchSecs(40.0)
                    .designedManpower(5)
                    .totalSmvMinutes(2.25)
                    .stations(stations)
                    .build());
        }

        // Setup 25 operators in pool
        List<OperatorPoolDTO> pool = new ArrayList<>();
        for (long opId = 1; opId <= 25; opId++) {
            pool.add(OperatorPoolDTO.builder()
                    .operatorId(opId)
                    .employeeCode("EMP-" + opId)
                    .operatorName("Operator " + opId)
                    .attendanceStatus("PRESENT")
                    .availabilityStatus("AVAILABLE")
                    .averageSkillRating((double) ((opId % 5) + 1))
                    .currentLineId((opId % 3) + 1)
                    .qualifiedMachines(List.of(
                            OperatorPoolDTO.QualifiedMachineItem.builder()
                                    .machineType("Single Needle Lockstitch (SNLS)")
                                    .qualificationLevel(4)
                                    .build()
                    ))
                    .build());
        }

        OptimizationRequestDTO req = OptimizationRequestDTO.builder()
                .planningDate(LocalDate.now())
                .primaryScenario("MAX_OUTPUT")
                .lineIds(List.of(1L, 2L, 3L))
                .build();

        var result = engine.solve(req, lineReqs, pool);

        assertNotNull(result);
        assertEquals("OPTIMAL", result.getSolverStatus());
        assertEquals(15, result.getAssignments().size());

        // Verify No operator is assigned to more than 1 station
        List<Long> assignedOpIds = result.getAssignments().stream()
                .map(AllocationOptimizationEngine.AssignmentDecision::getOperatorId)
                .filter(java.util.Objects::nonNull)
                .toList();

        assertEquals(15, assignedOpIds.size());
        assertEquals(15, new java.util.HashSet<>(assignedOpIds).size(), "Each operator must be unique across all 3 lines");
    }

    @Test
    @DisplayName("Should lock fixed operator assignments and prevent reassignment")
    void testFixedAssignmentLocking() {
        List<LineRequirementDTO> lineReqs = List.of(
                LineRequirementDTO.builder()
                        .lineId(1L)
                        .lineName("Line 01")
                        .designedPitchSecs(40.0)
                        .designedManpower(2)
                        .totalSmvMinutes(1.0)
                        .stations(List.of(
                                LineRequirementDTO.StationRequirementItem.builder()
                                        .stationIndex(1)
                                        .stationCode("S01")
                                        .operationId(10L)
                                        .operationName("Collar Attach")
                                        .operationSmv(0.5)
                                        .requiredSkillLevel(4)
                                        .build(),
                                LineRequirementDTO.StationRequirementItem.builder()
                                        .stationIndex(2)
                                        .stationCode("S02")
                                        .operationId(11L)
                                        .operationName("Side Seam")
                                        .operationSmv(0.5)
                                        .requiredSkillLevel(3)
                                        .build()
                        ))
                        .build()
        );

        List<OperatorPoolDTO> pool = List.of(
                OperatorPoolDTO.builder().operatorId(101L).operatorName("Rahim").employeeCode("EMP-101").attendanceStatus("PRESENT").availabilityStatus("AVAILABLE").build(),
                OperatorPoolDTO.builder().operatorId(102L).operatorName("Priya").employeeCode("EMP-102").attendanceStatus("PRESENT").availabilityStatus("AVAILABLE").build()
        );

        // Lock Operator 101 to Station 1
        OptimizationRequestDTO req = OptimizationRequestDTO.builder()
                .planningDate(LocalDate.now())
                .lineIds(List.of(1L))
                .fixedAssignments(List.of(
                        OptimizationRequestDTO.FixedAssignmentItem.builder()
                                .lineId(1L)
                                .stationIndex(1)
                                .operatorId(101L)
                                .justification("Supervisory key lock")
                                .build()
                ))
                .build();

        var result = engine.solve(req, lineReqs, pool);

        var st1 = result.getAssignments().stream().filter(a -> a.getStationIndex() == 1).findFirst().orElseThrow();
        assertEquals(101L, st1.getOperatorId());
        assertTrue(st1.isFixed());

        var st2 = result.getAssignments().stream().filter(a -> a.getStationIndex() == 2).findFirst().orElseThrow();
        assertEquals(102L, st2.getOperatorId());
        assertFalse(st2.isFixed());
    }
}
