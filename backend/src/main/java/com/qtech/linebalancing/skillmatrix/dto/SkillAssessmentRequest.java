package com.qtech.linebalancing.skillmatrix.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SkillAssessmentRequest {

    @NotNull(message = "Operator ID is required")
    private Long operatorId;

    @NotNull(message = "Operation ID is required")
    private Long operationId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    @NotNull(message = "Cycle time is required")
    @Min(value = 1, message = "Cycle time must be at least 1 second")
    private Integer cycleTimeSeconds;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    private String notes;
}
