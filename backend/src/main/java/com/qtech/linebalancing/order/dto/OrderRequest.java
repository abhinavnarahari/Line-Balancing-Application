package com.qtech.linebalancing.order.dto;

import com.qtech.linebalancing.order.entity.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class OrderRequest {

    /** Optional: when blank a number is generated (PO-<year>-<next number>). */
    @Size(max = 50, message = "Order number must not exceed 50 characters")
    private String orderNo;

    /** Optional. */
    @Size(max = 150, message = "Buyer name must not exceed 150 characters")
    private String buyer;

    @NotNull(message = "Style ID is required")
    private Long styleId;

    /** Single-colour orders: the colour (lines may leave theirs blank). Multi-colour orders: optional, each line has one. */
    @Size(max = 100, message = "Color must not exceed 100 characters")
    private String color;

    /** SINGLE_COLOR or MULTI_COLOR; blank = decided from the number of colours in the lines. */
    private Order.OrderType orderType;

    @NotNull(message = "Order date is required")
    private LocalDate orderDate;

    @NotNull(message = "Delivery date is required")
    private LocalDate deliveryDate;

    private LocalDate plannedCompletionDate;

    private Order.Status status = Order.Status.PLANNED;

    @NotEmpty(message = "At least one size quantity is required")
    @Valid
    private List<OrderSizeLineRequest> sizeLines;

    /** rowVersion the client loaded; a mismatch means someone else saved first (409). Optional. */
    private Long rowVersion;
}
