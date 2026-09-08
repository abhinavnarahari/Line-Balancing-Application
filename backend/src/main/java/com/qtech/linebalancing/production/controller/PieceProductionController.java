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

    @GetMapping("/logs")
    public ResponseEntity<List<PieceProductionLogResponse>> getLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(pieceProductionService.getLogsByDate(date));
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
