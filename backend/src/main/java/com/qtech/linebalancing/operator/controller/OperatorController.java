package com.qtech.linebalancing.operator.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.operator.dto.OperatorPlacementResponse;
import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.dto.OperatorResponse;
import com.qtech.linebalancing.operator.service.OperatorPlacementService;
import com.qtech.linebalancing.operator.service.OperatorService;
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
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorController {

    private final OperatorService operatorService;
    private final OperatorPlacementService placementService;

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

    /** Lines (via saved line plans of open orders) and current shift the operator works on. */
    @GetMapping("/{id}/placement")
    public ResponseEntity<ApiResponse<OperatorPlacementResponse>> getPlacement(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(placementService.getPlacement(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OperatorResponse>> create(@Valid @RequestBody OperatorRequest request) {
        OperatorResponse created = operatorService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Operator registered successfully", created));
    }

    /** Excel import: all rows are created in one transaction, or none are (error names the row). */
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<OperatorResponse>>> createBatch(
            @RequestBody @Size(min = 1, max = 2000, message = "must contain between 1 and 2000 rows")
            List<@Valid OperatorRequest> requests) {
        List<OperatorResponse> created = operatorService.createBatch(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created.size() + " operators imported", created));
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
