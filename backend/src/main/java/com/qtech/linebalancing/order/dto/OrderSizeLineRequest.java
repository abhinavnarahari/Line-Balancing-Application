package com.qtech.linebalancing.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderSizeLineRequest {

    @NotNull(message = "Size ID is required")
    private Long sizeId;

    /** Colour of this line; blank = the order's colour (single-colour orders). */
    @Size(max = 100, message = "Colour must not exceed 100 characters")
    private String color;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be non-negative")
    private Integer quantity;
}
