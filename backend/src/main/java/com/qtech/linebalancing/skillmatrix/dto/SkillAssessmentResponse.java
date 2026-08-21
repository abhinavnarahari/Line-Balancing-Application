package com.qtech.linebalancing.skillmatrix.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SkillAssessmentResponse {
    private Long id;
    private Long operatorId;
    private String operatorName;
    private String employeeId;
    private Long operationId;
    private String operationName;
    private String operationCode;
    private Integer rating;
    private Integer cycleTimeSeconds;
    private Integer revision;
    private LocalDate effectiveDate;
    private boolean current;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
