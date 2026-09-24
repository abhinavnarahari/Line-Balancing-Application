package com.qtech.linebalancing.allocation;

import com.qtech.linebalancing.allocation.entity.OperatorMachineQualification;
import com.qtech.linebalancing.allocation.repository.OperatorMachineQualificationRepository;
import com.qtech.linebalancing.allocation.service.OperatorPerformanceService;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.repository.OperatorPerformanceLogRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperatorPerformanceServiceTest {

    @Mock
    private OperatorPerformanceLogRepository performanceLogRepository;
    @Mock
    private SkillAssessmentRepository skillAssessmentRepository;
    @Mock
    private OperatorMachineQualificationRepository machineQualificationRepository;

    private OperatorPerformanceService performanceService;

    @BeforeEach
    void setUp() {
        performanceService = new OperatorPerformanceService(
                performanceLogRepository,
                skillAssessmentRepository,
                machineQualificationRepository
        );
    }

    @Test
    @DisplayName("Tier 1: Should use observed historical performance logs when available")
    void testHistoricalPerformanceTier() {
        Long operatorId = 1L;
        Long operationId = 5L;
        String machineType = "Single Needle Lockstitch (SNLS)";

        when(machineQualificationRepository.findByOperatorIdAndMachineTypeIgnoreCase(operatorId, machineType))
                .thenReturn(Optional.of(OperatorMachineQualification.builder().qualificationLevel(4).build()));

        // Historical cycle time observed: 30 seconds (Standard SMV: 0.5 min = 30s) -> 100% efficiency
        when(performanceLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId))
                .thenReturn(List.of(
                        OperatorPerformanceLog.builder().actualCycleTimeSeconds(28).build(),
                        OperatorPerformanceLog.builder().actualCycleTimeSeconds(32).build()
                ));

        var eval = performanceService.evaluate(operatorId, operationId, machineType, 0.5, 3);

        assertEquals("HISTORICAL", eval.getPerformanceSource());
        assertEquals(30.0, eval.getEffectiveCycleTimeSecs());
        assertEquals(100.0, eval.getOperatorEfficiencyPercent());
        assertTrue(eval.isMachineQualified());
    }

    @Test
    @DisplayName("Tier 2: Should use calibrated skill assessment curve when no historical logs exist")
    void testCalibratedAssessmentTier() {
        Long operatorId = 2L;
        Long operationId = 6L;
        String machineType = "4-Thread Overlock";

        when(machineQualificationRepository.findByOperatorIdAndMachineTypeIgnoreCase(operatorId, machineType))
                .thenReturn(Optional.of(OperatorMachineQualification.builder().qualificationLevel(3).build()));

        when(performanceLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId))
                .thenReturn(List.of());

        // Rating 5 in assessment -> Calibrated efficiency ~ 110%
        when(skillAssessmentRepository.findCurrentByOperatorAndOperation(operatorId, operationId))
                .thenReturn(Optional.of(
                        SkillAssessment.builder()
                                .rating(5)
                                .cycleTimeSeconds(27)
                                .build()
                ));

        var eval = performanceService.evaluate(operatorId, operationId, machineType, 0.5, 4);

        assertEquals("CALIBRATED", eval.getPerformanceSource());
        assertEquals(27.0, eval.getEffectiveCycleTimeSecs());
        assertEquals("EXCELLENT", eval.getMatchStatus());
    }

    @Test
    @DisplayName("Tier 3: Should fallback to engineering estimate when no direct data exists and flag MACHINE_GAP if uncertified")
    void testFallbackEstimateWithMachineGap() {
        Long operatorId = 3L;
        Long operationId = 7L;
        String machineType = "Automatic Buttonhole Machine";

        // Not certified on buttonhole machine
        when(machineQualificationRepository.findByOperatorIdAndMachineTypeIgnoreCase(operatorId, machineType))
                .thenReturn(Optional.empty());

        when(performanceLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId))
                .thenReturn(List.of());

        when(skillAssessmentRepository.findCurrentByOperatorAndOperation(operatorId, operationId))
                .thenReturn(Optional.empty());

        var eval = performanceService.evaluate(operatorId, operationId, machineType, 0.5, 3);

        assertEquals("ESTIMATED", eval.getPerformanceSource());
        assertEquals("MACHINE_GAP", eval.getMatchStatus());
        assertFalse(eval.isMachineQualified());
    }
}
