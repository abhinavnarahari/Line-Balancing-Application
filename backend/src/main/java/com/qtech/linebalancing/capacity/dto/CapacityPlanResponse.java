package com.qtech.linebalancing.capacity.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CapacityPlanResponse {
    private Long id;
    private String planCode;
    private Long orderId;
    private String orderNo;
    private Long styleId;
    private String styleNo;
    private Long bulletinId;
    private String bulletinCode;
    private Long shiftId;
    private String shiftName;
    private Integer orderQuantity;
    private Integer availableDays;
    private Integer targetHourlyOutput;
    private Double plannedEfficiency;
    private String allowancePfd;
    private Double totalSmvMinutes;
    private Double customerTaktSecs;
    private Double requiredDesignCapacity;
    private Double designedPitchSecs;
    private Double theoreticalManpower;
    private Double plannedManpower;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
