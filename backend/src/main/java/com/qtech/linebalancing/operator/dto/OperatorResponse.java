package com.qtech.linebalancing.operator.dto;

import com.qtech.linebalancing.operator.entity.Operator;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class OperatorResponse {
    private Long id;
    private String employeeId;
    private String name;
    private Integer age;
    private Operator.Gender gender;
    private String department;
    private LocalDate joiningDate;
    private Operator.OperatorRole role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
