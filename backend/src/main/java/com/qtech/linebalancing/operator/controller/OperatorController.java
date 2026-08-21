package com.qtech.linebalancing.operator.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.dto.OperatorResponse;
import com.qtech.linebalancing.operator.service.OperatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorController {

    private final OperatorService operatorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OperatorResponse>>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(operatorService.getAll(search, active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OperatorResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(operatorService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OperatorResponse>> create(@Valid @RequestBody OperatorRequest request) {
        OperatorResponse created = operatorService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Operator registered successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OperatorResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody OperatorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Operator updated successfully", operatorService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<OperatorResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Operator status updated", operatorService.toggleStatus(id)));
    }
}
