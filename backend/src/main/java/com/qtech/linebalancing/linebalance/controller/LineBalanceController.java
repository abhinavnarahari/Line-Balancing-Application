package com.qtech.linebalancing.linebalance.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.linebalance.dto.BalanceDetailResponse;
import com.qtech.linebalancing.linebalance.dto.BalanceSaveRequest;
import com.qtech.linebalancing.linebalance.service.LineBalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/line-balances")
@RequiredArgsConstructor
public class LineBalanceController {

    private final LineBalanceService lineBalanceService;

    @GetMapping("/{lineDesignId}")
    public ResponseEntity<ApiResponse<BalanceDetailResponse>> getBalance(@PathVariable Long lineDesignId) {
        return ResponseEntity.ok(ApiResponse.success(lineBalanceService.getBalanceByDesignId(lineDesignId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BalanceDetailResponse>> saveBalance(@Valid @RequestBody BalanceSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Line balance saved successfully", lineBalanceService.saveBalance(request)));
    }

    @PostMapping("/{lineDesignId}/optimize")
    public ResponseEntity<ApiResponse<BalanceDetailResponse>> optimize(@PathVariable Long lineDesignId) {
        return ResponseEntity.ok(ApiResponse.success("Multi-objective optimization executed", lineBalanceService.runOptimization(lineDesignId)));
    }
}
