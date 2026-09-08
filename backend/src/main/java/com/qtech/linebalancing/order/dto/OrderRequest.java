package com.qtech.linebalancing.order.dto;

import com.qtech.linebalancing.order.entity.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class OrderRequest {

    @NotBlank(message = "Order number is required")
    @Size(max = 50, message = "Order number must not exceed 50 characters")
    private String orderNo;

    @NotBlank(message = "Buyer is required")
    @Size(max = 150, message = "Buyer name must not exceed 150 characters")
    private String buyer;

    @NotNull(message = "Style ID is required")
    private Long styleId;

    @NotBlank(message = "Color is required")
    @Size(max = 100, message = "Color must not exceed 100 characters")
    private String color;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    @NotNull(message = "Delivery date is required")
    private LocalDate deliveryDate;

    private LocalDate plannedCompletionDate;

    private Order.Status status = Order.Status.PLANNED;

    @NotEmpty(message = "At least one size quantity is required")
    @Valid
    private List<OrderSizeLineRequest> sizeLines;
}
