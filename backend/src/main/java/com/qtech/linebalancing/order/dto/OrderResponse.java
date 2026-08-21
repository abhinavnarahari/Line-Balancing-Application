package com.qtech.linebalancing.order.dto;

import com.qtech.linebalancing.order.entity.Order;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String orderNo;
    private String buyer;
    private Long styleId;
    private String styleNo;
    private String color;
    private LocalDate orderDate;
    private LocalDate deliveryDate;
    private Order.Status status;
    private Integer totalQuantity;
    private List<OrderSizeLineResponse> sizeLines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class OrderSizeLineResponse {
        private Long id;
        private Long sizeId;
        private String sizeCode;
        private String sizeLabel;
        private Integer quantity;
    }
}
