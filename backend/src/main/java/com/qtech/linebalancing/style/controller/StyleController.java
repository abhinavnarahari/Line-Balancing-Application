package com.qtech.linebalancing.style.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.style.dto.StyleRequest;
import com.qtech.linebalancing.style.dto.StyleResponse;
import com.qtech.linebalancing.style.service.StyleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/styles")
@RequiredArgsConstructor
public class StyleController {

    private final StyleService styleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StyleResponse>>> getAll(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(styleService.getAll(active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StyleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(styleService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StyleResponse>> create(@Valid @RequestBody StyleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Style created", styleService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StyleResponse>> update(
            @PathVariable Long id, @Valid @RequestBody StyleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Style updated", styleService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<StyleResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Style status updated", styleService.toggleStatus(id)));
    }
}
