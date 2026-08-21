package com.qtech.linebalancing.shift.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ShiftRequest {

    @NotBlank(message = "Shift code is required")
    @Size(max = 20, message = "Shift code must not exceed 20 characters")
    private String shiftCode;

    @NotBlank(message = "Shift name is required")
    @Size(max = 100, message = "Shift name must not exceed 100 characters")
    private String shiftName;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private boolean active = true;
}
