package com.qtech.linebalancing.shiftassignment.dto;

import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ShiftAssignmentResponse {
    private Long id;
    private Long operatorId;
    private String operatorName;
    private String employeeId;
    private Long shiftId;
    private String shiftCode;
    private String shiftName;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private ShiftAssignment.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
