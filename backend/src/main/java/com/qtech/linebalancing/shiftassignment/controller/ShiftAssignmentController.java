package com.qtech.linebalancing.shiftassignment.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentRequest;
import com.qtech.linebalancing.shiftassignment.dto.ShiftAssignmentResponse;
import com.qtech.linebalancing.shiftassignment.service.ShiftAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/shift-assignments")
@RequiredArgsConstructor
public class ShiftAssignmentController {

    private final ShiftAssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShiftAssignmentResponse>>> getAll(
            @RequestParam(required = false) Long operatorId) {
        List<ShiftAssignmentResponse> data = (operatorId != null)
                ? assignmentService.getByOperator(operatorId)
                : assignmentService.getAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShiftAssignmentResponse>> assign(
            @Valid @RequestBody ShiftAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Shift assignment created", assignmentService.assign(request)));
    }

    @PatchMapping("/{id}/end")
    public ResponseEntity<ApiResponse<ShiftAssignmentResponse>> endAssignment(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success("Assignment ended", assignmentService.endAssignment(id, endDate)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        assignmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Assignment deleted"));
    }
}
