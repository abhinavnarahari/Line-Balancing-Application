package com.qtech.linebalancing.machine.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.machine.dto.MachineRequest;
import com.qtech.linebalancing.machine.dto.MachineResponse;
import com.qtech.linebalancing.machine.service.MachineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@RequiredArgsConstructor
public class MachineController {

    private final MachineService machineService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MachineResponse>>> getAll(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Long lineId,
            @RequestParam(required = false) String machineType) {
        return ResponseEntity.ok(ApiResponse.success(machineService.getAll(active, lineId, machineType)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MachineResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(machineService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MachineResponse>> create(@Valid @RequestBody MachineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Machine created successfully", machineService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MachineResponse>> update(
            @PathVariable Long id, @Valid @RequestBody MachineRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Machine updated successfully", machineService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<MachineResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Machine status updated", machineService.toggleStatus(id)));
    }
}
