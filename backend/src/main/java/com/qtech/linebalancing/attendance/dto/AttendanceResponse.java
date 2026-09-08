package com.qtech.linebalancing.attendance.dto;

import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class AttendanceResponse {
    private Long id;
    private LocalDate attendanceDate;
    private Long operatorId;
    private String operatorName;
    private String employeeId;
    private Long shiftId;
    private String shiftCode;
    private AttendanceRecord.Status status;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private LocalTime scheduledStartTime;
    private Long lateMinutes;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
