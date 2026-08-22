package com.qtech.linebalancing.attendance.controller;

import com.qtech.linebalancing.attendance.dto.AttendanceRequest;
import com.qtech.linebalancing.attendance.dto.AttendanceResponse;
import com.qtech.linebalancing.attendance.service.AttendanceService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long shiftId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAttendanceForDate(date, shiftId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getHistory() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAllHistory()));
    }

    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getByOperator(
            @PathVariable Long operatorId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getByOperator(operatorId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AttendanceResponse>> markAttendance(
            @Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Attendance recorded", attendanceService.markAttendance(request)));
    }

    @PostMapping("/biometric-sync")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> syncBiometric(
            @Valid @RequestBody List<com.qtech.linebalancing.attendance.dto.BiometricSyncRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success("Biometric data synced", attendanceService.syncBiometric(requests)));
    }
}
