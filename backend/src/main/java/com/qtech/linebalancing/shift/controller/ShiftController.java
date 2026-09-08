package com.qtech.linebalancing.shift.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.shift.dto.ShiftRequest;
import com.qtech.linebalancing.shift.dto.ShiftResponse;
import com.qtech.linebalancing.shift.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftService shiftService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getAll(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getAllShifts(active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShiftResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShiftResponse>> create(@Valid @RequestBody ShiftRequest request) {
        ShiftResponse created = shiftService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Shift created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShiftResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ShiftRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Shift updated successfully", shiftService.update(id, request)));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<ShiftResponse>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Shift status updated", shiftService.toggleStatus(id)));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            shiftService.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Shift deleted successfully", null));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new com.qtech.linebalancing.common.exception.BusinessRuleException("Cannot delete shift. It is in use.");
        } catch (Exception e) {
            throw new com.qtech.linebalancing.common.exception.BusinessRuleException("Delete failed: " + e.getMessage() + " " + e.getClass().getName());
        }
    }
}
