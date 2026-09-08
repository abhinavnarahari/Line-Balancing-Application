package com.qtech.linebalancing.operation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OperationRequest {

    @NotBlank(message = "Operation code is required")
    @Size(max = 20, message = "Operation code must not exceed 20 characters")
    private String operationCode;

    @NotBlank(message = "Name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    private String description;

    @Min(value = 0, message = "Sequence must be non-negative")
    private Integer sequence = 0;

    private boolean active = true;

    @DecimalMin(value = "0.0", inclusive = false, message = "SMV must be greater than 0")
    private BigDecimal standardSmv;

    @Size(max = 100, message = "Machine type must not exceed 100 characters")
    private String machineType;
}
