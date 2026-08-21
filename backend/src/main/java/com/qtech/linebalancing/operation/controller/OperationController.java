package com.qtech.linebalancing.operation.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.operation.dto.OperationRequest;
import com.qtech.linebalancing.operation.dto.OperationResponse;
import com.qtech.linebalancing.operation.service.OperationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operations")
@RequiredArgsConstructor
public class OperationController {

    private final OperationService operationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OperationResponse>>> getAll(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(operationService.getAll(active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OperationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(operationService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OperationResponse>> create(@Valid @RequestBody OperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Operation created", operationService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OperationResponse>> update(
            @PathVariable Long id, @Valid @RequestBody OperationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Operation updated", operationService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<OperationResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Operation status updated", operationService.toggleStatus(id)));
    }
}
