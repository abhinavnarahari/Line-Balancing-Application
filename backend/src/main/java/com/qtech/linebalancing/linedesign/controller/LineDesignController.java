package com.qtech.linebalancing.linedesign.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.linedesign.dto.LineDesignRequest;
import com.qtech.linebalancing.linedesign.dto.LineDesignResponse;
import com.qtech.linebalancing.linedesign.service.LineDesignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/line-designs")
@RequiredArgsConstructor
public class LineDesignController {

    private final LineDesignService lineDesignService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LineDesignResponse>>> getAll(@RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return ResponseEntity.ok(ApiResponse.success(lineDesignService.getByOrderId(orderId)));
        }
        return ResponseEntity.ok(ApiResponse.success(lineDesignService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LineDesignResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(lineDesignService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LineDesignResponse>> saveDesign(@Valid @RequestBody LineDesignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Line Design saved successfully", lineDesignService.saveDesign(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LineDesignResponse>> updateDesign(
            @PathVariable Long id,
            @Valid @RequestBody LineDesignRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Line Design updated successfully", lineDesignService.updateDesign(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDesign(@PathVariable Long id) {
        lineDesignService.deleteDesign(id);
        return ResponseEntity.ok(ApiResponse.success("Line Design deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<LineDesignResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String user) {
        return ResponseEntity.ok(ApiResponse.success("Line Design status updated", lineDesignService.updateStatus(id, status, user)));
    }
}
