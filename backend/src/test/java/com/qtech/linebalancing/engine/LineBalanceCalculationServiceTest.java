package com.qtech.linebalancing.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LineBalanceCalculationServiceTest {

    private LineBalanceCalculationService service;

    @BeforeEach
    void setUp() {
        service = new LineBalanceCalculationService();
    }

    @Test
    @DisplayName("Should correctly calculate Line Balance Efficiency and Workstation Bottlenecks")
    void testLineBalanceMetrics() {
        // Station 1: 0.60 min (36s), 1 Op -> Effective 36s (<= 41.14s pitch)
        var st1 = LineBalanceCalculationService.WorkstationInput.builder()
                .stationIndex(1)
                .stationCode("S01")
                .primaryMachineType("SNLS")
                .allocatedOperators(1)
                .operations(List.of(
                        LineBalanceCalculationService.StationOperationInput.builder()
                                .operationId(1L)
                                .operationCode("OP-01")
                                .operationName("Front Pocket")
                                .operationSmvMinutes(0.60)
                                .splitRatio(1.0)
                                .build()
                ))
                .build();

        // Station 2: 0.80 min (48s), 1 Op -> Effective 48s (> 41.14s pitch) -> Bottleneck!
        var st2 = LineBalanceCalculationService.WorkstationInput.builder()
                .stationIndex(2)
                .stationCode("S02")
                .primaryMachineType("Overlock")
                .allocatedOperators(1)
                .operations(List.of(
                        LineBalanceCalculationService.StationOperationInput.builder()
                                .operationId(2L)
                                .operationCode("OP-02")
                                .operationName("Side Seam Overlock")
                                .operationSmvMinutes(0.80)
                                .splitRatio(1.0)
                                .build()
                ))
                .build();

        // Station 3: 0.70 min (42s), 2 Ops -> Effective 21s (<= 41.14s pitch) -> Balanced!
        var st3 = LineBalanceCalculationService.WorkstationInput.builder()
                .stationIndex(3)
                .stationCode("S03")
                .primaryMachineType("SNLS")
                .allocatedOperators(2)
                .operations(List.of(
                        LineBalanceCalculationService.StationOperationInput.builder()
                                .operationId(3L)
                                .operationCode("OP-03")
                                .operationName("Waistband Attach")
                                .operationSmvMinutes(0.70)
                                .splitRatio(1.0)
                                .build()
                ))
                .build();

        double customerTaktSecs = 51.43;
        double designedPitchSecs = 41.14;
        double requiredDesignCapacity = 87.5;
        double requiredHourlyTarget = 70.0;

        var result = service.calculate(
                List.of(st1, st2, st3),
                customerTaktSecs,
                designedPitchSecs,
                requiredDesignCapacity,
                requiredHourlyTarget
        );

        assertEquals(3, result.getTotalWorkstations());
        assertEquals(4, result.getTotalAllocatedOperators()); // 1 + 1 + 2

        // Check Station 2 Bottleneck
        var s2Result = result.getStations().get(1);
        assertTrue(s2Result.isBottleneck());
        assertEquals(48.0, s2Result.getEffectiveTimeSecs());
        assertTrue(s2Result.getCapacityPerHour() < requiredDesignCapacity);

        // Check Station 3 Multi-operator halving
        var s3Result = result.getStations().get(2);
        assertFalse(s3Result.isBottleneck());
        assertEquals(21.0, s3Result.getEffectiveTimeSecs());

        // Line Balance Efficiency check
        // Total SMV = 0.60 + 0.80 + 0.70 = 2.10 min = 126 secs
        // Max Station Cycle = 48s, Total Ops = 4 -> Denominator = 48 * 4 = 192s
        // LBE = 126 / 192 = 65.6%
        assertEquals(65.6, result.getLineBalanceEfficiencyPercent(), 0.5);
        assertEquals(1, result.getBottleneckCount());
    }
}
