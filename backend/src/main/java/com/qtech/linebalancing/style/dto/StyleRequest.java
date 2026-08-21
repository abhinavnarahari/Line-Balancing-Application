package com.qtech.linebalancing.style.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StyleRequest {

    @NotBlank(message = "Style number is required")
    @Size(max = 50, message = "Style number must not exceed 50 characters")
    private String styleNo;

    @NotBlank(message = "Buyer is required")
    @Size(max = 150, message = "Buyer name must not exceed 150 characters")
    private String buyer;

    private String description;

    @Size(max = 50, message = "Season must not exceed 50 characters")
    private String season;

    @Size(max = 100, message = "Product type must not exceed 100 characters")
    private String productType;

    private boolean active = true;
}
