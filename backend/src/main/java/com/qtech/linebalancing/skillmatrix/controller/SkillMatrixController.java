package com.qtech.linebalancing.skillmatrix.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
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

    /** Get current (latest revision) skill matrix. */
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

    /** Add a new skill assessment (auto-bumps revision, preserves history). */
    @PostMapping
    public ResponseEntity<ApiResponse<SkillAssessmentResponse>> addAssessment(
            @Valid @RequestBody SkillAssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill assessment recorded", skillMatrixService.addAssessment(request)));
    }
}
