package com.qtech.linebalancing.shift.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class ShiftResponse {
    private Long id;
    private String shiftCode;
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean active;
    private boolean overnightShift;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
