package com.qtech.linebalancing.order.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.order.dto.OrderRequest;
import com.qtech.linebalancing.order.dto.OrderResponse;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created", orderService.create(request)));
    }

    /** Excel import: every order is created in one transaction, or none are. */
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> createBatch(
            @RequestBody @Size(min = 1, max = 2000, message = "must contain between 1 and 2000 orders")
            List<@Valid OrderRequest> requests) {
        List<OrderResponse> created = orderService.createBatch(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created.size() + " orders imported", created));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam Order.Status status) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.updateStatus(id, status)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order updated", orderService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Order deleted", null));
    }
}
