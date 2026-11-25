package com.qtech.linebalancing.production.controller;

import com.qtech.linebalancing.production.dto.OperatorTimesheet24hResponse;
import com.qtech.linebalancing.production.dto.PieceProductionLogRequest;
import com.qtech.linebalancing.production.dto.PieceProductionLogResponse;
import com.qtech.linebalancing.production.service.PieceProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@org.springframework.validation.annotation.Validated
@RestController
@RequestMapping("/api/piece-production")
@RequiredArgsConstructor
public class PieceProductionController {

    private final PieceProductionService pieceProductionService;

    @PostMapping("/record")
    public ResponseEntity<PieceProductionLogResponse> recordPieceLog(@Valid @RequestBody PieceProductionLogRequest request) {
        PieceProductionLogResponse response = pieceProductionService.recordPieceLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Excel import: all runs are recorded together, or none are. */
    @PostMapping("/batch")
    public ResponseEntity<List<PieceProductionLogResponse>> recordPieceLogsBatch(
            @RequestBody @jakarta.validation.constraints.Size(min = 1, max = 5000, message = "must contain between 1 and 5000 runs")
            List<@Valid PieceProductionLogRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pieceProductionService.recordPieceLogsBatch(requests));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<PieceProductionLogResponse>> getLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(pieceProductionService.getLogsByDate(date));
    }

    /** Days with production recorded: [{date, runs, goodQty}] */
    @GetMapping("/days")
    public ResponseEntity<List<java.util.Map<String, Object>>> getProductionDays() {
        return ResponseEntity.ok(pieceProductionService.getProductionDays());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PieceProductionLogResponse>> getLogsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(pieceProductionService.getLogsByOrderId(orderId));
    }

    @GetMapping("/timesheet-24h")
    public ResponseEntity<List<OperatorTimesheet24hResponse>> get24hTimesheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(pieceProductionService.get24hTimesheet(date));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PieceProductionLogResponse> updateLog(
            @PathVariable Long id,
            @Valid @RequestBody PieceProductionLogRequest request) {
        return ResponseEntity.ok(pieceProductionService.updatePieceLog(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        pieceProductionService.deletePieceLog(id);
        return ResponseEntity.noContent().build();
    }
}
