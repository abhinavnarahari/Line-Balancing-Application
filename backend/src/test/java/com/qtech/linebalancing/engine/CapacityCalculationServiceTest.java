package com.qtech.linebalancing.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CapacityCalculationServiceTest {

    private CapacityCalculationService service;

    @BeforeEach
    void setUp() {
        service = new CapacityCalculationService();
    }

    @Test
    @DisplayName("Should correctly calculate Capacity and Pitch for 70 pcs/hr @ 80% efficiency")
    void testStandardCapacityCalculation() {
        CapacityCalculationService.CapacityCalculationRequest req = CapacityCalculationService.CapacityCalculationRequest.builder()
                .targetHourlyOutput(70)
                .plannedEfficiency(80.0)
                .shiftHours(8)
                .breakMinutes(30)
                .totalSmvMinutes(15.0)
                .allowancePfd("5,4,1")
                .build();

        CapacityCalculationService.CapacityCalculationResult result = service.calculate(req);

        // Assertions
        assertEquals(70, result.getTargetHourlyOutput());
        assertEquals(80.0, result.getPlannedEfficiencyPercent());
        assertEquals(0.0, result.getPfdAllowancePercent());
        
        // Customer Takt = 3600 / 70 = 51.43s
        assertEquals(51.43, result.getCustomerTaktSecs(), 0.05);

        // Required Design Capacity = 70 / 0.80 = 87.5 pcs/hr
        assertEquals(87.5, result.getRequiredDesignCapacityPerHour(), 0.1);

        // Designed Pitch Time = 3600 / 87.5 = 41.14s (or 51.43 * 0.80)
        assertEquals(41.14, result.getDesignedPitchSecs(), 0.1);

        // Total SMV = 15.0 mins = 900 secs
        assertEquals(15.0, result.getTotalLineSmvMinutes(), 0.05);

        // Theoretical Manpower = 900s / 51.43s = 17.5 ops
        // Planned Manpower = 900s / 41.14s = 21.9 ops
        assertTrue(result.getPlannedManpower() > result.getTheoreticalManpower());
        assertEquals(21.9, result.getPlannedManpower(), 0.2);
    }

    @Test
    @DisplayName("Should calculate hourly target from order quantity and available days")
    void testOrderHorizonTarget() {
        // 12000 pcs in 20 days -> 600 pcs/day -> 8h shift - 30min break = 7.5h -> 600 / 7.5 = 80 pcs/hr
        CapacityCalculationService.CapacityCalculationRequest req = CapacityCalculationService.CapacityCalculationRequest.builder()
                .orderQuantity(12000)
                .availableDays(20)
                .shiftHours(8)
                .breakMinutes(30)
                .plannedEfficiency(85.0)
                .totalSmvMinutes(20.0)
                .build();

        CapacityCalculationService.CapacityCalculationResult result = service.calculate(req);

        assertEquals(80, result.getTargetHourlyOutput());
        assertEquals(45.0, result.getCustomerTaktSecs(), 0.05); // 3600 / 80
        assertEquals(94.12, result.getRequiredDesignCapacityPerHour(), 0.1); // 80 / 0.85
        assertEquals(38.25, result.getDesignedPitchSecs(), 0.1); // 45.0 * 0.85
    }
}
