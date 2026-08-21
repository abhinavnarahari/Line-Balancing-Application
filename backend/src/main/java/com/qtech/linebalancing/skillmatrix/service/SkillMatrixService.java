package com.qtech.linebalancing.skillmatrix.service;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.service.OperationService;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorService;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentRequest;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentResponse;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SkillMatrixService {

    private final SkillAssessmentRepository skillRepository;
    private final OperatorService operatorService;
    private final OperationService operationService;

    /** Returns only the current (latest revision) skill for each operator+operation. */
    public List<SkillAssessmentResponse> getCurrentMatrix() {
        return skillRepository.findByIsCurrentTrueOrderByOperatorIdAscOperationIdAsc()
                .stream().map(this::toResponse).toList();
    }

    /** Returns full revision history for an operator+operation pair. */
    public List<SkillAssessmentResponse> getHistory(Long operatorId, Long operationId) {
        return skillRepository.findHistoryByOperatorAndOperation(operatorId, operationId)
                .stream().map(this::toResponse).toList();
    }

    /** All assessments (current + history) for a given operator. */
    public List<SkillAssessmentResponse> getByOperator(Long operatorId) {
        return skillRepository.findByOperatorIdOrderByOperationIdAscRevisionDesc(operatorId)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Add a new skill assessment.
     * <p>
     * CRITICAL BUSINESS RULE: The previous revision is marked as is_current=false.
     * The new revision gets is_current=true. Historical data is NEVER deleted.
     * </p>
     */
    @Transactional
    public SkillAssessmentResponse addAssessment(SkillAssessmentRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());
        Operation operation = operationService.findEntityById(request.getOperationId());

        // Determine next revision number
        int maxRevision = skillRepository.findMaxRevision(operator.getId(), operation.getId());
        int nextRevision = maxRevision + 1;

        // Mark all previous revisions for this operator+operation as not current
        if (maxRevision > 0) {
            skillRepository.markPreviousAsNotCurrent(operator.getId(), operation.getId());
            log.info("Skill matrix: marked previous revisions as not current for operator={} operation={}",
                    operator.getEmployeeId(), operation.getOperationCode());
        }

        SkillAssessment assessment = SkillAssessment.builder()
                .operator(operator)
                .operation(operation)
                .rating(request.getRating())
                .cycleTimeSeconds(request.getCycleTimeSeconds())
                .revision(nextRevision)
                .effectiveDate(request.getEffectiveDate())
                .isCurrent(true)
                .notes(request.getNotes())
                .build();

        SkillAssessment saved = skillRepository.save(assessment);
        log.info("Created skill assessment rev={} for operator={} operation={}",
                nextRevision, operator.getEmployeeId(), operation.getOperationCode());
        return toResponse(saved);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private SkillAssessmentResponse toResponse(SkillAssessment sa) {
        SkillAssessmentResponse resp = new SkillAssessmentResponse();
        resp.setId(sa.getId());
        resp.setOperatorId(sa.getOperator().getId());
        resp.setOperatorName(sa.getOperator().getName());
        resp.setEmployeeId(sa.getOperator().getEmployeeId());
        resp.setOperationId(sa.getOperation().getId());
        resp.setOperationName(sa.getOperation().getName());
        resp.setOperationCode(sa.getOperation().getOperationCode());
        resp.setRating(sa.getRating());
        resp.setCycleTimeSeconds(sa.getCycleTimeSeconds());
        resp.setRevision(sa.getRevision());
        resp.setEffectiveDate(sa.getEffectiveDate());
        resp.setCurrent(sa.isCurrent());
        resp.setNotes(sa.getNotes());
        resp.setCreatedAt(sa.getCreatedAt());
        resp.setUpdatedAt(sa.getUpdatedAt());
        return resp;
    }
}
