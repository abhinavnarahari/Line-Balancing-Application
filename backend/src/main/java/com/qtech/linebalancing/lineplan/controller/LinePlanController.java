package com.qtech.linebalancing.lineplan.controller;

import com.qtech.linebalancing.lineplan.dto.LinePlanRequest;
import com.qtech.linebalancing.lineplan.dto.LinePlanResponse;
import com.qtech.linebalancing.lineplan.service.LinePlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/line-plans")
@RequiredArgsConstructor
public class LinePlanController {

    private final LinePlanService linePlanService;

    @GetMapping
    public ResponseEntity<LinePlanResponse> getPlanForOrder(@RequestParam Long orderId) {
        LinePlanResponse response = linePlanService.getPlanForOrder(orderId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<LinePlanResponse> savePlan(@Valid @RequestBody LinePlanRequest request) {
        return ResponseEntity.ok(linePlanService.savePlan(request));
    }
}
