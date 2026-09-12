package com.qtech.linebalancing.capacity.controller;

import com.qtech.linebalancing.capacity.dto.CapacityPlanRequest;
import com.qtech.linebalancing.capacity.dto.CapacityPlanResponse;
import com.qtech.linebalancing.capacity.service.CapacityPlanService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/capacity-plans")
@RequiredArgsConstructor
public class CapacityPlanController {

    private final CapacityPlanService capacityPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CapacityPlanResponse>>> getAll(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return ResponseEntity.ok(ApiResponse.success(capacityPlanService.getByOrderId(orderId)));
        }
        return ResponseEntity.ok(ApiResponse.success(capacityPlanService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CapacityPlanResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(capacityPlanService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CapacityPlanResponse>> savePlan(@Valid @RequestBody CapacityPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Capacity plan saved successfully", capacityPlanService.savePlan(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CapacityPlanResponse>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody CapacityPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Capacity plan updated successfully", capacityPlanService.updatePlan(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        capacityPlanService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Capacity plan deleted successfully", null));
    }
}
