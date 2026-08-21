package com.qtech.linebalancing.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OrderSizeLineRequest {

    @NotNull(message = "Size ID is required")
    private Long sizeId;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be non-negative")
    private Integer quantity;
}
