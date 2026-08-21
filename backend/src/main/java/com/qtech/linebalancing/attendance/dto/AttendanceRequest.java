package com.qtech.linebalancing.attendance.dto;

import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceRequest {

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotNull(message = "Operator ID is required")
    private Long operatorId;

    @NotNull(message = "Shift ID is required")
    private Long shiftId;

    @NotNull(message = "Status is required")
    private AttendanceRecord.Status status;

    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String remarks;
}
