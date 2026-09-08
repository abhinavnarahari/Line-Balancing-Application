package com.qtech.linebalancing.line.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SewingLineRequest {

    private String lineCode;

    @NotBlank(message = "Line name is required")
    private String lineName;

    private String floor;
    private String supervisorName;

    @NotNull(message = "Number of operators is required")
    @Min(value = 1, message = "Operator count must be at least 1")
    private Integer operatorCount;

    @NotNull(message = "Number of machines is required")
    @Min(value = 1, message = "Machine count must be at least 1")
    private Integer machineCount;

    @NotNull(message = "Working hours is required")
    @DecimalMin(value = "0.5", message = "Working hours must be at least 0.5")
    @DecimalMax(value = "24.0", message = "Working hours cannot exceed 24")
    private BigDecimal workingHours;

    @NotNull(message = "Capacity per day is required")
    @Min(value = 1, message = "Capacity per day must be at least 1")
    private Integer capacityPerDay;

    @DecimalMin(value = "0.00", message = "Target efficiency must be >= 0")
    @DecimalMax(value = "100.00", message = "Target efficiency must be <= 100")
    private BigDecimal targetEfficiencyPercent;

    private Boolean active;
}
