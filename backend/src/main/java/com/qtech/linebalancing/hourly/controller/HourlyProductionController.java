package com.qtech.linebalancing.hourly.controller;

import com.qtech.linebalancing.hourly.dto.HourlyBoardResponse;
import com.qtech.linebalancing.hourly.dto.HourlyEntryRequest;
import com.qtech.linebalancing.hourly.service.HourlyProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hourly-production")
@RequiredArgsConstructor
public class HourlyProductionController {

    private final HourlyProductionService hourlyProductionService;

    @GetMapping("/board")
    public ResponseEntity<HourlyBoardResponse> getBoard(
            @RequestParam(required = false) Long linePlanId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long shiftId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(hourlyProductionService.buildBoard(linePlanId, orderId, shiftId, effectiveDate));
    }

    @PatchMapping("/assign")
    public ResponseEntity<Void> assignOperator(
            @RequestParam Long linePlanId,
            @RequestParam Long operationId,
            @RequestParam(required = false) Long operatorId) {
        hourlyProductionService.assignOperator(linePlanId, operationId, operatorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/entry")
    public ResponseEntity<HourlyBoardResponse.HourCell> saveEntry(
            @Valid @RequestBody HourlyEntryRequest request) {
        return ResponseEntity.ok(hourlyProductionService.saveEntry(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Integer> bulkSave(
            @RequestBody List<@Valid HourlyEntryRequest> requests) {
        return ResponseEntity.ok(hourlyProductionService.bulkSave(requests));
    }
}