package com.qtech.linebalancing.skillmatrix.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.skillmatrix.dto.PerformanceLogRequest;
import com.qtech.linebalancing.skillmatrix.dto.PerformanceLogResponse;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentRequest;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentResponse;
import com.qtech.linebalancing.skillmatrix.service.SkillMatrixService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skill-matrix")
@RequiredArgsConstructor
public class SkillMatrixController {

    private final SkillMatrixService skillMatrixService;

    @GetMapping("/history/logs")
    public ResponseEntity<ApiResponse<List<com.qtech.linebalancing.skillmatrix.dto.SkillMatrixHistoryResponse>>> getAllHistoryLogs() {
        return ResponseEntity.ok(ApiResponse.success(skillMatrixService.getAllHistoryLogs()));
    }

    /** Get current (latest revision) skill matrix. Optionally filter by operatorId. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SkillAssessmentResponse>>> getCurrent(
            @RequestParam(required = false) Long operatorId) {
        List<SkillAssessmentResponse> data = (operatorId != null)
                ? skillMatrixService.getByOperator(operatorId)
                : skillMatrixService.getCurrentMatrix();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /** Get full revision history for a specific operator+operation. */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SkillAssessmentResponse>>> getHistory(
            @RequestParam Long operatorId,
            @RequestParam Long operationId) {
        return ResponseEntity.ok(ApiResponse.success(
                skillMatrixService.getHistory(operatorId, operationId)));
    }

    /** Add a new skill assessment (manual override — auto-bumps revision, preserves history). */
    @PostMapping
    public ResponseEntity<ApiResponse<SkillAssessmentResponse>> addAssessment(
            @Valid @RequestBody SkillAssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill assessment recorded", skillMatrixService.addAssessment(request)));
    }

    // ── Performance Logs ──────────────────────────────────────────────────────

    /** Get all daily performance logs. Optionally filter by operatorId. */
    @GetMapping("/performance-logs")
    public ResponseEntity<ApiResponse<List<PerformanceLogResponse>>> getPerformanceLogs(
            @RequestParam(required = false) Long operatorId) {
        return ResponseEntity.ok(ApiResponse.success(skillMatrixService.getPerformanceLogs(operatorId)));
    }

    /** Upload a new daily performance log entry. */
    @PostMapping("/performance-logs")
    public ResponseEntity<ApiResponse<PerformanceLogResponse>> addPerformanceLog(
            @Valid @RequestBody PerformanceLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Performance log recorded", skillMatrixService.addPerformanceLog(request)));
    }

    /** Batch upload multiple performance logs (from multi-run test or Excel import). */
    @PostMapping("/performance-logs/batch")
    public ResponseEntity<ApiResponse<List<PerformanceLogResponse>>> batchAddPerformanceLogs(
            @RequestBody List<PerformanceLogRequest> requests) {
        List<PerformanceLogResponse> result = skillMatrixService.batchAddPerformanceLogs(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Batch performance logs recorded and skill ratings updated", result));
    }

    /** Submit a draft performance log entry (ERPNext submit workflow). */
    @PostMapping("/performance-logs/{id}/submit")
    public ResponseEntity<ApiResponse<PerformanceLogResponse>> submitPerformanceLog(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Performance test submitted and skill matrix updated", skillMatrixService.submitPerformanceLog(id)));
    }

    /** Submit multiple draft performance logs in batch. */
    @PostMapping("/performance-logs/submit-batch")
    public ResponseEntity<ApiResponse<List<PerformanceLogResponse>>> submitBatchPerformanceLogs(@RequestBody List<Long> ids) {
        return ResponseEntity.ok(ApiResponse.success("Performance tests submitted and skill matrix updated", skillMatrixService.submitBatchPerformanceLogs(ids)));
    }

    /** Delete a performance log entry. */
    @DeleteMapping("/performance-logs/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePerformanceLog(@PathVariable Long id) {
        skillMatrixService.deletePerformanceLog(id);
        return ResponseEntity.ok(ApiResponse.success("Performance log deleted", null));
    }

    /** Clear all skill assessments, performance test logs, and history for an operator. */
    @DeleteMapping("/operator/{operatorId}/clear")
    public ResponseEntity<ApiResponse<Void>> clearOperatorSkillData(@PathVariable Long operatorId) {
        skillMatrixService.clearOperatorSkillData(operatorId);
        return ResponseEntity.ok(ApiResponse.success("Operator skill matrix and test history cleared successfully", null));
    }

    /**
     * Auto-update the skill matrix for an operator based on average cycle time from logs.
     * Returns only the assessments that were actually changed.
     */
    @PostMapping("/auto-update")
    public ResponseEntity<ApiResponse<List<SkillAssessmentResponse>>> autoUpdate(
            @RequestParam Long operatorId) {
        List<SkillAssessmentResponse> updated = skillMatrixService.autoUpdateSkillMatrix(operatorId);
        String msg = updated.isEmpty()
                ? "No changes — ratings are already up to date"
                : updated.size() + " operation rating(s) updated from performance logs";
        return ResponseEntity.ok(ApiResponse.success(msg, updated));
    }
}
