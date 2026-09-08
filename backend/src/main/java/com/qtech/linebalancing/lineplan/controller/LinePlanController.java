package com.qtech.linebalancing.lineplan.controller;

import com.qtech.linebalancing.lineplan.dto.LinePlanRequest;
import com.qtech.linebalancing.lineplan.dto.LinePlanResponse;
import com.qtech.linebalancing.lineplan.service.LinePlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/line-plans")
@RequiredArgsConstructor
public class LinePlanController {

    private final LinePlanService linePlanService;

    @GetMapping
    public ResponseEntity<?> getPlans(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            LinePlanResponse response = linePlanService.getPlanForOrder(orderId);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.ok(linePlanService.getAllPlans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LinePlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(linePlanService.getPlanById(id));
    }

    @PostMapping
    public ResponseEntity<LinePlanResponse> savePlan(@Valid @RequestBody LinePlanRequest request) {
        return ResponseEntity.ok(linePlanService.savePlan(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        linePlanService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deletePlanByOrderId(@RequestParam Long orderId) {
        linePlanService.deletePlanByOrderId(orderId);
        return ResponseEntity.noContent().build();
    }
}
