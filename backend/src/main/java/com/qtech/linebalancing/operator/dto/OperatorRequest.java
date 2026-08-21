package com.qtech.linebalancing.operator.dto;

import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OperatorRequest {

    @NotBlank(message = "Employee ID is required")
    @Size(max = 30, message = "Employee ID must not exceed 30 characters")
    private String employeeId;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @NotNull(message = "Age is required")
    @Min(value = 16, message = "Age must be at least 16")
    @Max(value = 70, message = "Age must not exceed 70")
    private Integer age;

    @NotNull(message = "Gender is required")
    private Operator.Gender gender;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;

    @NotNull(message = "Joining date is required")
    @PastOrPresent(message = "Joining date must be in the past or today")
    private LocalDate joiningDate;

    private boolean active = true;
}
