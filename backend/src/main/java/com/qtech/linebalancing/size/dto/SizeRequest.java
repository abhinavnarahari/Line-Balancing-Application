package com.qtech.linebalancing.size.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SizeRequest {

    @NotBlank(message = "Size code is required")
    @Size(max = 10, message = "Size code must not exceed 10 characters")
    private String code;

    @NotBlank(message = "Label is required")
    @Size(max = 50, message = "Label must not exceed 50 characters")
    private String label;

    @Min(value = 0, message = "Sequence must be non-negative")
    private Integer sequence = 0;

    private boolean active = true;
}
