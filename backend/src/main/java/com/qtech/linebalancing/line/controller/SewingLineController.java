package com.qtech.linebalancing.line.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.line.dto.SewingLineRequest;
import com.qtech.linebalancing.line.dto.SewingLineResponse;
import com.qtech.linebalancing.line.service.SewingLineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lines")
@RequiredArgsConstructor
public class SewingLineController {

    private final SewingLineService sewingLineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SewingLineResponse>>> getAll(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(sewingLineService.getAll(active)));
    }

    @GetMapping("/next-code")
    public ResponseEntity<ApiResponse<String>> getNextLineCode() {
        return ResponseEntity.ok(ApiResponse.success("Next line code generated", sewingLineService.getNextLineCode()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SewingLineResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sewingLineService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SewingLineResponse>> create(@Valid @RequestBody SewingLineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sewing Line created successfully", sewingLineService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SewingLineResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SewingLineRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Sewing Line updated successfully", sewingLineService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<SewingLineResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Sewing Line status updated", sewingLineService.toggleStatus(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        sewingLineService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Sewing Line deleted successfully", null));
    }
}
