package com.qtech.linebalancing.engine;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Centralized Industrial Engineering Capacity Calculation Service.
 * Provides transparent, single-source-of-truth mathematical formulas for
 * Takt Time, Required Design Capacity, Designed Pitch Time, and Manpower requirements.
 */
@Service
public class CapacityCalculationService {

    @Data
    @Builder
    public static class CapacityCalculationRequest {
        private Integer orderQuantity;
        private Integer availableDays;
        private Integer shiftHours;
        private Integer breakMinutes;
        private Integer targetHourlyOutput; // Optional if computing from delivery horizon
        private Double plannedEfficiency;  // Default 80.0
        private Double totalSmvMinutes;     // Total standard minute value of garment
        private String allowancePfd;        // Deprecated/ignored
    }

    @Data
    @Builder
    public static class CapacityCalculationResult {
        private int netWorkingMinutesPerShift;
        private int targetHourlyOutput;
        private int targetShiftOutput;
        private int targetDayOutput;
        private double plannedEfficiencyPercent;
        private double pfdAllowancePercent;
        private double totalLineSmvMinutes;
        private double totalLineSmvMinutesWithPfd;
        private double customerTaktSecs;
        private double requiredDesignCapacityPerHour;
        private double designedPitchSecs;
        private double theoreticalManpower;
        private double plannedManpower;
    }

    /**
     * Compute comprehensive garment line capacity metrics.
     */
    public CapacityCalculationResult calculate(CapacityCalculationRequest req) {
        int shiftHrs = req.getShiftHours() != null && req.getShiftHours() > 0 ? req.getShiftHours() : 8;
        int breakMins = req.getBreakMinutes() != null && req.getBreakMinutes() >= 0 ? req.getBreakMinutes() : 30;
        int netWorkingMins = Math.max(60, (shiftHrs * 60) - breakMins);
        double netWorkingHours = netWorkingMins / 60.0;

        double eff = req.getPlannedEfficiency() != null && req.getPlannedEfficiency() > 0
                ? req.getPlannedEfficiency()
                : 80.0;

        double baseSmv = req.getTotalSmvMinutes() != null && req.getTotalSmvMinutes() > 0
                ? req.getTotalSmvMinutes()
                : 15.0;

        int targetHourly;
        if (req.getTargetHourlyOutput() != null && req.getTargetHourlyOutput() > 0) {
            targetHourly = req.getTargetHourlyOutput();
        } else if (req.getOrderQuantity() != null && req.getOrderQuantity() > 0 && req.getAvailableDays() != null && req.getAvailableDays() > 0) {
            double reqPerDay = (double) req.getOrderQuantity() / req.getAvailableDays();
            targetHourly = Math.max(1, (int) Math.ceil(reqPerDay / netWorkingHours));
        } else {
            targetHourly = 70; // Sensible default
        }

        int targetShift = (int) Math.round(targetHourly * netWorkingHours);
        int targetDay = targetShift; // 1 shift default

        // Standard IE Formulations
        // 1. Customer Takt = 3600 / Target Output
        double customerTaktSecs = targetHourly > 0 ? round(3600.0 / targetHourly, 2) : 0.0;

        // 2. Required Design Capacity = Target Output / (Planned Efficiency / 100)
        double effFraction = eff / 100.0;
        double requiredDesignCapacity = effFraction > 0 ? round(targetHourly / effFraction, 2) : targetHourly;

        // 3. Designed Pitch Time = 3600 / Required Design Capacity = Customer Takt * (Planned Efficiency / 100)
        double designedPitchSecs = requiredDesignCapacity > 0 ? round(3600.0 / requiredDesignCapacity, 2) : customerTaktSecs;

        // 4. Manpower requirements based directly on Standard Garment SMV
        // Theoretical Min = (Total SMV in secs) / Customer Takt
        double totalSmvSecs = baseSmv * 60.0;
        double theoreticalManpower = customerTaktSecs > 0 ? round(totalSmvSecs / customerTaktSecs, 1) : 1.0;
        // Planned Manpower = (Total SMV in secs) / Designed Pitch Time
        double plannedManpower = designedPitchSecs > 0 ? round(totalSmvSecs / designedPitchSecs, 1) : theoreticalManpower;

        return CapacityCalculationResult.builder()
                .netWorkingMinutesPerShift(netWorkingMins)
                .targetHourlyOutput(targetHourly)
                .targetShiftOutput(targetShift)
                .targetDayOutput(targetDay)
                .plannedEfficiencyPercent(eff)
                .pfdAllowancePercent(0.0)
                .totalLineSmvMinutes(round(baseSmv, 3))
                .totalLineSmvMinutesWithPfd(round(baseSmv, 3))
                .customerTaktSecs(customerTaktSecs)
                .requiredDesignCapacityPerHour(requiredDesignCapacity)
                .designedPitchSecs(designedPitchSecs)
                .theoreticalManpower(theoreticalManpower)
                .plannedManpower(plannedManpower)
                .build();
    }

    private static double round(double val, int places) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
