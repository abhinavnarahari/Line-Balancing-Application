package com.qtech.linebalancing.operationbulletin.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.operationbulletin.dto.BulletinRequest;
import com.qtech.linebalancing.operationbulletin.dto.BulletinResponse;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.service.OperationBulletinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operation-bulletins")
@RequiredArgsConstructor
public class OperationBulletinController {

    private final OperationBulletinService bulletinService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BulletinResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(bulletinService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BulletinResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bulletinService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BulletinResponse>> create(@Valid @RequestBody BulletinRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulletin created", bulletinService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BulletinResponse>> update(
            @PathVariable Long id, @Valid @RequestBody BulletinRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Bulletin updated", bulletinService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BulletinResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam OperationBulletin.Status status) {
        return ResponseEntity.ok(ApiResponse.success("Bulletin status updated", bulletinService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bulletinService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Bulletin deleted successfully", null));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<ApiResponse<BulletinResponse>> clone(
            @PathVariable Long id,
            @RequestParam(required = false) String newCode,
            @RequestParam(required = false) String newName) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulletin cloned successfully", bulletinService.cloneBulletin(id, newCode, newName)));
    }
}
