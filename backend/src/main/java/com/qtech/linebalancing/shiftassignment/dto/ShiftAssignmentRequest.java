package com.qtech.linebalancing.shiftassignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ShiftAssignmentRequest {

    @NotNull(message = "Operator ID is required")
    private Long operatorId;

    @NotNull(message = "Shift ID is required")
    private Long shiftId;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;  // null = indefinitely active
}
