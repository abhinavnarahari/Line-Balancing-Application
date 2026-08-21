package com.qtech.linebalancing.size.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.size.dto.SizeRequest;
import com.qtech.linebalancing.size.dto.SizeResponse;
import com.qtech.linebalancing.size.service.SizeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sizes")
@RequiredArgsConstructor
public class SizeController {

    private final SizeService sizeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SizeResponse>>> getAll(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(sizeService.getAll(active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SizeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sizeService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SizeResponse>> create(@Valid @RequestBody SizeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Size created", sizeService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SizeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SizeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Size updated", sizeService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<SizeResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Size status updated", sizeService.toggleStatus(id)));
    }
}
