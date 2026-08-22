package com.qtech.linebalancing.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BiometricSyncRequest {
    @NotBlank
    private String employeeId;
    
    @NotNull
    private LocalDate attendanceDate;
    
    private LocalTime checkInTime;
    
    private LocalTime checkOutTime;
}
