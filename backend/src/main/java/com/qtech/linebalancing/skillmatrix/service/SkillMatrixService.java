package com.qtech.linebalancing.skillmatrix.service;

import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.service.OperationService;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorService;
import com.qtech.linebalancing.skillmatrix.dto.PerformanceLogRequest;
import com.qtech.linebalancing.skillmatrix.dto.PerformanceLogResponse;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentRequest;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentResponse;
import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.entity.SkillMatrixHistoryLog;
import com.qtech.linebalancing.skillmatrix.repository.OperatorPerformanceLogRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillMatrixHistoryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class SkillMatrixService {

    private final SkillAssessmentRepository skillRepository;
    private final OperatorPerformanceLogRepository perfLogRepository;
    private final SkillMatrixHistoryLogRepository historyLogRepository;
    private final OperatorService operatorService;
    private final OperationService operationService;

    public List<SkillAssessmentResponse> getCurrentMatrix() {
        return skillRepository.findByIsCurrentTrueOrderByOperatorIdAscOperationIdAsc()
                .stream().map(this::toResponse).toList();
    }

    public List<SkillAssessmentResponse> getHistory(Long operatorId, Long operationId) {
        return skillRepository.findHistoryByOperatorAndOperation(operatorId, operationId)
                .stream().map(this::toResponse).toList();
    }

    public List<SkillAssessmentResponse> getByOperator(Long operatorId) {
        return skillRepository.findByOperatorIdOrderByOperationIdAscRevisionDesc(operatorId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public SkillAssessmentResponse addAssessment(SkillAssessmentRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());
        Operation operation = operationService.findEntityById(request.getOperationId());
        int maxRevision = skillRepository.findMaxRevision(operator.getId(), operation.getId());
        int nextRevision = maxRevision + 1;
        
        int oldRating = 0;
        var currentOpt = skillRepository.findCurrentByOperatorAndOperation(operator.getId(), operation.getId());
        if (currentOpt.isPresent()) {
            oldRating = currentOpt.get().getRating();
            skillRepository.markPreviousAsNotCurrent(operator.getId(), operation.getId());
        }
        SkillAssessment assessment = SkillAssessment.builder()
                .operator(operator).operation(operation)
                .rating(request.getRating()).cycleTimeSeconds(request.getCycleTimeSeconds())
                .revision(nextRevision).effectiveDate(request.getEffectiveDate())
                .isCurrent(true).notes(request.getNotes()).build();
        SkillAssessment saved = skillRepository.save(assessment);
        
        if (oldRating != request.getRating()) {
            SkillMatrixHistoryLog history = SkillMatrixHistoryLog.builder()
                    .operator(operator).operation(operation)
                    .oldRating(oldRating).newRating(request.getRating())
                    .updatedBy("Manager")
                    .build();
            historyLogRepository.save(history);
        }

        log.info("Created skill assessment rev={} for operator={} operation={}",
                nextRevision, operator.getEmployeeId(), operation.getOperationCode());
        return toResponse(saved);
    }

    @Transactional
    public PerformanceLogResponse addPerformanceLog(PerformanceLogRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());
        Operation operation = operationService.findEntityById(request.getOperationId());
        OperatorPerformanceLog entry = OperatorPerformanceLog.builder()
                .operator(operator).operation(operation)
                .logDate(request.getLogDate())
                .actualCycleTimeSeconds(request.getActualCycleTimeSeconds())
                .recordedBy(request.getRecordedBy()).notes(request.getNotes()).build();
        OperatorPerformanceLog saved = perfLogRepository.save(entry);
        log.info("Saved performance log for operator={} operation={} date={} time={}s",
                operator.getEmployeeId(), operation.getOperationCode(),
                request.getLogDate(), request.getActualCycleTimeSeconds());
        return toLogResponse(saved);
    }

    public List<PerformanceLogResponse> getPerformanceLogs(Long operatorId) {
        return perfLogRepository.findByOperatorIdOrderByLogDateDesc(operatorId)
                .stream().map(this::toLogResponse).toList();
    }

    @Transactional
    public List<SkillAssessmentResponse> autoUpdateSkillMatrix(Long operatorId) {
        Operator operator = operatorService.findEntityById(operatorId);
        List<Object[]> avgResults = perfLogRepository.findAvgCycleTimeByOperator(operatorId);
        if (avgResults.isEmpty()) return List.of();

        List<SkillAssessmentResponse> updated = new ArrayList<>();
        for (Object[] row : avgResults) {
            Long operationId = ((Number) row[0]).longValue();
            int avgCycleTime = (int) Math.round(((Number) row[1]).doubleValue());
            Operation operation = operationService.findEntityById(operationId);

            int derivedRating;
            var currentOpt = skillRepository.findCurrentByOperatorAndOperation(operatorId, operationId);
            if (currentOpt.isPresent()) {
                int baselineCycleTime = currentOpt.get().getCycleTimeSeconds();
                double efficiency = (double) baselineCycleTime / avgCycleTime * 100.0;
                derivedRating = efficiencyToRating(efficiency);
                if (derivedRating == currentOpt.get().getRating()) continue;
            } else {
                derivedRating = 3;
            }

            int maxRevision = skillRepository.findMaxRevision(operatorId, operationId);
            if (maxRevision > 0) skillRepository.markPreviousAsNotCurrent(operatorId, operationId);

            int logCount = perfLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId).size();
            SkillAssessment newAssessment = SkillAssessment.builder()
                    .operator(operator).operation(operation)
                    .rating(derivedRating).cycleTimeSeconds(avgCycleTime)
                    .revision(maxRevision + 1).effectiveDate(LocalDate.now())
                    .isCurrent(true)
                    .notes("Auto-updated from " + logCount + " performance log(s)")
                    .build();
            updated.add(toResponse(skillRepository.save(newAssessment)));
            
            int oldR = currentOpt.isPresent() ? currentOpt.get().getRating() : 0;
            SkillMatrixHistoryLog h = SkillMatrixHistoryLog.builder()
                    .operator(operator).operation(operation)
                    .oldRating(oldR).newRating(derivedRating)
                    .updatedBy("System Auto-Update")
                    .build();
            historyLogRepository.save(h);

            log.info("Auto-update: operator={} operation={} new rating={} avgTime={}s",
                    operator.getEmployeeId(), operation.getOperationCode(), derivedRating, avgCycleTime);
        }
        return updated;
    }

    private int efficiencyToRating(double e) {
        if (e >= 110) return 5;
        if (e >= 90)  return 4;
        if (e >= 75)  return 3;
        if (e >= 60)  return 2;
        return 1;
    }

    private SkillAssessmentResponse toResponse(SkillAssessment sa) {
        SkillAssessmentResponse r = new SkillAssessmentResponse();
        r.setId(sa.getId()); r.setOperatorId(sa.getOperator().getId());
        r.setOperatorName(sa.getOperator().getName()); r.setEmployeeId(sa.getOperator().getEmployeeId());
        r.setOperationId(sa.getOperation().getId()); r.setOperationName(sa.getOperation().getName());
        r.setOperationCode(sa.getOperation().getOperationCode()); r.setRating(sa.getRating());
        r.setCycleTimeSeconds(sa.getCycleTimeSeconds()); r.setRevision(sa.getRevision());
        r.setEffectiveDate(sa.getEffectiveDate()); r.setCurrent(sa.isCurrent());
        r.setNotes(sa.getNotes()); r.setCreatedAt(sa.getCreatedAt()); r.setUpdatedAt(sa.getUpdatedAt());
        return r;
    }

    private PerformanceLogResponse toLogResponse(OperatorPerformanceLog pl) {
        PerformanceLogResponse r = new PerformanceLogResponse();
        r.setId(pl.getId()); r.setOperatorId(pl.getOperator().getId());
        r.setOperatorName(pl.getOperator().getName()); r.setEmployeeId(pl.getOperator().getEmployeeId());
        r.setOperationId(pl.getOperation().getId()); r.setOperationName(pl.getOperation().getName());
        r.setOperationCode(pl.getOperation().getOperationCode()); r.setLogDate(pl.getLogDate());
        r.setActualCycleTimeSeconds(pl.getActualCycleTimeSeconds()); r.setRecordedBy(pl.getRecordedBy());
        r.setNotes(pl.getNotes()); r.setCreatedAt(pl.getCreatedAt());
        return r;
    }

    public List<com.qtech.linebalancing.skillmatrix.dto.SkillMatrixHistoryResponse> getAllHistoryLogs() {
        return historyLogRepository.findAllByOrderByUpdatedAtDesc().stream().map(h -> {
            var r = new com.qtech.linebalancing.skillmatrix.dto.SkillMatrixHistoryResponse();
            r.setId(h.getId());
            r.setOperatorId(h.getOperator().getId());
            r.setOperatorName(h.getOperator().getName());
            r.setEmployeeId(h.getOperator().getEmployeeId());
            r.setOperationId(h.getOperation().getId());
            r.setOperationName(h.getOperation().getName());
            r.setOperationCode(h.getOperation().getOperationCode());
            r.setOldRating(h.getOldRating());
            r.setNewRating(h.getNewRating());
            r.setUpdatedBy(h.getUpdatedBy());
            r.setUpdatedAt(h.getUpdatedAt());
            return r;
        }).toList();
    }
}
