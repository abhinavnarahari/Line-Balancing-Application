package com.qtech.linebalancing.skillmatrix.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PerformanceLogRequest {

    @NotNull(message = "Operator ID is required")
    private Long operatorId;

    @NotNull(message = "Operation ID is required")
    private Long operationId;

    @NotNull(message = "Log date is required")
    private LocalDate logDate;

    @NotNull(message = "Actual cycle time is required")
    @Min(value = 1, message = "Cycle time must be at least 1 second")
    private Integer actualCycleTimeSeconds;

    private String recordedBy;

    private String notes;
}
