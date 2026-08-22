package com.qtech.linebalancing.skillmatrix.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PerformanceLogResponse {
    private Long id;
    private Long operatorId;
    private String operatorName;
    private String employeeId;
    private Long operationId;
    private String operationName;
    private String operationCode;
    private LocalDate logDate;
    private Integer actualCycleTimeSeconds;
    private String recordedBy;
    private String notes;
    private LocalDateTime createdAt;
}
