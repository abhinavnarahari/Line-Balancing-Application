package com.qtech.linebalancing.capacity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CapacityPlanRequest {

    private String planCode;

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private Long styleId;
    private Long bulletinId;
    private Long shiftId;

    @NotNull(message = "Order quantity is required")
    private Integer orderQuantity;

    private Integer availableDays = 1;
    private Integer targetHourlyOutput;
    private Double plannedEfficiency = 80.0;
    private String allowancePfd = "5,4,1";
    private Double totalSmvMinutes;
}
