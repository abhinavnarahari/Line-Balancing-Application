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
        return skillRepository.findByOperatorIdAndIsCurrentTrue(operatorId)
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

    public static int cycleTimeToRating(double seconds) {
        return cycleTimeToRating(seconds, null, null);
    }

    public static int cycleTimeToRating(double seconds, String operationName, Double standardSmv) {
        if (seconds <= 0) return 1;
        if (operationName != null) {
            String name = operationName.toLowerCase().trim();
            if (name.contains("shoulder")) {
                if (seconds <= 29.0) return 5;
                if (seconds <= 32.0) return 4;
                if (seconds <= 37.0) return 3;
                if (seconds <= 42.0) return 2;
                return 1;
            } else if (name.contains("neck rib")) {
                if (seconds <= 41.0) return 5;
                if (seconds <= 45.0) return 4;
                if (seconds <= 52.0) return 3;
                if (seconds <= 60.0) return 2;
                return 1;
            } else if (name.contains("neck top") || name.contains("top stitch")) {
                if (seconds <= 35.0) return 5;
                if (seconds <= 38.0) return 4;
                if (seconds <= 44.0) return 3;
                if (seconds <= 51.0) return 2;
                return 1;
            } else if (name.contains("sleeve attach")) {
                if (seconds <= 37.0) return 5;
                if (seconds <= 41.0) return 4;
                if (seconds <= 47.0) return 3;
                if (seconds <= 54.0) return 2;
                return 1;
            } else if (name.contains("side seam")) {
                if (seconds <= 33.0) return 5;
                if (seconds <= 36.0) return 4;
                if (seconds <= 41.0) return 3;
                if (seconds <= 47.0) return 2;
                return 1;
            } else if (name.contains("bottom hem")) {
                if (seconds <= 47.0) return 5;
                if (seconds <= 52.0) return 4;
                if (seconds <= 59.0) return 3;
                if (seconds <= 69.0) return 2;
                return 1;
            } else if (name.contains("sleeve hem")) {
                if (seconds <= 44.0) return 5;
                if (seconds <= 48.0) return 4;
                if (seconds <= 55.0) return 3;
                if (seconds <= 64.0) return 2;
                return 1;
            } else if (name.contains("label attach") || name.contains("label")) {
                if (seconds <= 26.0) return 5;
                if (seconds <= 28.0) return 4;
                if (seconds <= 32.0) return 3;
                if (seconds <= 37.0) return 2;
                return 1;
            } else if (name.contains("trim check")) {
                if (seconds <= 27.0) return 5;
                if (seconds <= 30.0) return 4;
                if (seconds <= 34.0) return 3;
                if (seconds <= 40.0) return 2;
                return 1;
            } else if (name.contains("thread trimming") || name.contains("trimming")) {
                if (seconds <= 32.0) return 5;
                if (seconds <= 35.0) return 4;
                if (seconds <= 40.0) return 3;
                if (seconds <= 46.0) return 2;
                return 1;
            } else if (name.contains("initial inspection")) {
                if (seconds <= 38.0) return 5;
                if (seconds <= 42.0) return 4;
                if (seconds <= 48.0) return 3;
                if (seconds <= 55.0) return 2;
                return 1;
            } else if (name.contains("spot cleaning") || name.contains("cleaning")) {
                if (seconds <= 45.0) return 5;
                if (seconds <= 50.0) return 4;
                if (seconds <= 57.0) return 3;
                if (seconds <= 65.0) return 2;
                return 1;
            } else if (name.contains("final measurement") || name.contains("measurement")) {
                if (seconds <= 40.0) return 5;
                if (seconds <= 44.0) return 4;
                if (seconds <= 50.0) return 3;
                if (seconds <= 57.0) return 2;
                return 1;
            } else if (name.contains("final inspection")) {
                if (seconds <= 42.0) return 5;
                if (seconds <= 46.0) return 4;
                if (seconds <= 52.0) return 3;
                if (seconds <= 60.0) return 2;
                return 1;
            } else if (name.contains("folding")) {
                if (seconds <= 31.0) return 5;
                if (seconds <= 34.0) return 4;
                if (seconds <= 39.0) return 3;
                if (seconds <= 44.0) return 2;
                return 1;
            }
        }
        if (standardSmv != null && standardSmv > 0) {
            double smvSec = standardSmv * 60;
            if (seconds <= smvSec * 0.9) return 5;
            if (seconds <= smvSec * 1.0) return 4;
            if (seconds <= smvSec * 1.18) return 3;
            if (seconds <= smvSec * 1.38) return 2;
            return 1;
        }
        if (seconds <= 28.0) return 5;
        if (seconds <= 35.0) return 4;
        if (seconds <= 44.0) return 3;
        if (seconds <= 55.0) return 2;
        return 1;
    }

    @Transactional
    public PerformanceLogResponse addPerformanceLog(PerformanceLogRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());
        Operation operation = operationService.findEntityById(request.getOperationId());
        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().toUpperCase()
                : "DRAFT";

        OperatorPerformanceLog entry = OperatorPerformanceLog.builder()
                .operator(operator).operation(operation)
                .logDate(request.getLogDate() != null ? request.getLogDate() : LocalDate.now())
                .actualCycleTimeSeconds(request.getActualCycleTimeSeconds())
                .recordedBy(request.getRecordedBy() != null ? request.getRecordedBy() : "Manager")
                .status(status)
                .notes(request.getNotes()).build();
        OperatorPerformanceLog saved = perfLogRepository.save(entry);
        log.info("Saved performance log for operator={} operation={} date={} time={}s status={}",
                operator.getEmployeeId(), operation.getOperationCode(),
                entry.getLogDate(), request.getActualCycleTimeSeconds(), status);

        // If submitted, automatically recalculate and update skill matrix rating
        if ("SUBMITTED".equalsIgnoreCase(status)) {
            syncSkillRatingFromPerformanceLogs(operator.getId(), operation.getId());
        }

        return toLogResponse(saved);
    }

    @Transactional
    public List<PerformanceLogResponse> batchAddPerformanceLogs(List<PerformanceLogRequest> requests) {
        if (requests == null || requests.isEmpty()) return List.of();
        
        List<PerformanceLogResponse> savedLogs = new ArrayList<>();
        java.util.Set<String> touchedSubmittedPairs = new java.util.HashSet<>();

        for (PerformanceLogRequest req : requests) {
            Operator operator = operatorService.findEntityById(req.getOperatorId());
            Operation operation = operationService.findEntityById(req.getOperationId());
            String status = (req.getStatus() != null && !req.getStatus().isBlank())
                    ? req.getStatus().toUpperCase()
                    : "DRAFT";

            OperatorPerformanceLog entry = OperatorPerformanceLog.builder()
                    .operator(operator).operation(operation)
                    .logDate(req.getLogDate() != null ? req.getLogDate() : LocalDate.now())
                    .actualCycleTimeSeconds(req.getActualCycleTimeSeconds())
                    .recordedBy(req.getRecordedBy() != null ? req.getRecordedBy() : "Manager")
                    .status(status)
                    .notes(req.getNotes()).build();
            OperatorPerformanceLog saved = perfLogRepository.save(entry);
            savedLogs.add(toLogResponse(saved));

            if ("SUBMITTED".equalsIgnoreCase(status)) {
                touchedSubmittedPairs.add(operator.getId() + ":" + operation.getId());
            }
        }

        // Auto-update rating for all affected submitted operator-operation pairs
        for (String pair : touchedSubmittedPairs) {
            String[] parts = pair.split(":");
            Long opId = Long.parseLong(parts[0]);
            Long operId = Long.parseLong(parts[1]);
            syncSkillRatingFromPerformanceLogs(opId, operId);
        }

        return savedLogs;
    }

    @Transactional
    public PerformanceLogResponse submitPerformanceLog(Long id) {
        OperatorPerformanceLog entry = perfLogRepository.findById(id)
                .orElseThrow(() -> new com.qtech.linebalancing.common.exception.ResourceNotFoundException("PerformanceLog", "id", id));
        entry.setStatus("SUBMITTED");
        OperatorPerformanceLog saved = perfLogRepository.save(entry);
        syncSkillRatingFromPerformanceLogs(saved.getOperator().getId(), saved.getOperation().getId());
        return toLogResponse(saved);
    }

    @Transactional
    public List<PerformanceLogResponse> submitBatchPerformanceLogs(List<Long> logIds) {
        if (logIds == null || logIds.isEmpty()) return List.of();
        List<PerformanceLogResponse> submitted = new ArrayList<>();
        java.util.Set<String> touchedPairs = new java.util.HashSet<>();

        for (Long id : logIds) {
            var opt = perfLogRepository.findById(id);
            if (opt.isPresent()) {
                OperatorPerformanceLog entry = opt.get();
                entry.setStatus("SUBMITTED");
                OperatorPerformanceLog saved = perfLogRepository.save(entry);
                submitted.add(toLogResponse(saved));
                touchedPairs.add(saved.getOperator().getId() + ":" + saved.getOperation().getId());
            }
        }

        for (String pair : touchedPairs) {
            String[] parts = pair.split(":");
            syncSkillRatingFromPerformanceLogs(Long.parseLong(parts[0]), Long.parseLong(parts[1]));
        }
        return submitted;
    }

    @Transactional
    public void deletePerformanceLog(Long id) {
        OperatorPerformanceLog entry = perfLogRepository.findById(id)
                .orElseThrow(() -> new com.qtech.linebalancing.common.exception.ResourceNotFoundException("PerformanceLog", "id", id));
        Long opId = entry.getOperator().getId();
        Long operId = entry.getOperation().getId();
        String oldStatus = entry.getStatus();

        perfLogRepository.delete(entry);
        perfLogRepository.flush();

        if (oldStatus == null || "SUBMITTED".equalsIgnoreCase(oldStatus)) {
            syncSkillRatingFromPerformanceLogs(opId, operId);
        }
    }

    @Transactional
    public void syncSkillRatingFromPerformanceLogs(Long operatorId, Long operationId) {
        Operator operator = operatorService.findEntityById(operatorId);
        Operation operation = operationService.findEntityById(operationId);

        List<OperatorPerformanceLog> allLogs = perfLogRepository.findByOperatorIdAndOperationIdOrderByLogDateDesc(operatorId, operationId);
        // Only compute ratings from SUBMITTED performance tests (ERPNext DocType flow)
        List<OperatorPerformanceLog> submittedLogs = allLogs.stream()
                .filter(l -> l.getStatus() == null || "SUBMITTED".equalsIgnoreCase(l.getStatus()))
                .toList();

        if (submittedLogs.isEmpty()) return;

        double avgCycleTime = submittedLogs.stream()
                .mapToInt(OperatorPerformanceLog::getActualCycleTimeSeconds)
                .average()
                .orElse(0.0);
        Double stdSmv = operation.getStandardSmv() != null ? operation.getStandardSmv().doubleValue() : null;
        int derivedRating = cycleTimeToRating(avgCycleTime, operation.getName(), stdSmv);
        int roundedTime = (int) Math.round(avgCycleTime);

        int maxRevision = skillRepository.findMaxRevision(operatorId, operationId);
        int oldRating = 0;
        var currentOpt = skillRepository.findCurrentByOperatorAndOperation(operatorId, operationId);
        if (currentOpt.isPresent()) {
            oldRating = currentOpt.get().getRating();
            skillRepository.markPreviousAsNotCurrent(operatorId, operationId);
        }

        SkillAssessment newAssessment = SkillAssessment.builder()
                .operator(operator)
                .operation(operation)
                .rating(derivedRating)
                .cycleTimeSeconds(roundedTime)
                .revision(maxRevision + 1)
                .effectiveDate(LocalDate.now())
                .isCurrent(true)
                .notes("Auto-calculated from " + submittedLogs.size() + " submitted test(s) (Avg: " + String.format("%.1fs", avgCycleTime) + ")")
                .build();
        skillRepository.save(newAssessment);

        if (oldRating != derivedRating) {
            SkillMatrixHistoryLog h = SkillMatrixHistoryLog.builder()
                    .operator(operator)
                    .operation(operation)
                    .oldRating(oldRating)
                    .newRating(derivedRating)
                    .updatedBy("Submitted Performance Test Auto-Calculation")
                    .build();
            historyLogRepository.save(h);
        }
    }

    public List<PerformanceLogResponse> getPerformanceLogs(Long operatorId) {
        List<OperatorPerformanceLog> logs = (operatorId != null)
                ? perfLogRepository.findByOperatorIdOrderByLogDateDesc(operatorId)
                : perfLogRepository.findAllByOrderByLogDateDesc();
        return logs.stream().map(this::toLogResponse).toList();
    }

    @Transactional
    public void clearOperatorSkillData(Long operatorId) {
        List<SkillAssessment> assessments = skillRepository.findByOperatorIdOrderByOperationIdAscRevisionDesc(operatorId);
        skillRepository.deleteAll(assessments);

        List<OperatorPerformanceLog> perfLogs = perfLogRepository.findByOperatorIdOrderByLogDateDesc(operatorId);
        perfLogRepository.deleteAll(perfLogs);

        List<SkillMatrixHistoryLog> history = historyLogRepository.findByOperatorId(operatorId);
        historyLogRepository.deleteAll(history);
    }

    @Transactional
    public List<SkillAssessmentResponse> autoUpdateSkillMatrix(Long operatorId) {
        Operator operator = operatorService.findEntityById(operatorId);
        List<Object[]> avgResults = perfLogRepository.findAvgCycleTimeByOperator(operatorId);
        if (avgResults.isEmpty()) return List.of();

        List<SkillAssessmentResponse> updated = new ArrayList<>();
        for (Object[] row : avgResults) {
            Long operationId = ((Number) row[0]).longValue();
            syncSkillRatingFromPerformanceLogs(operatorId, operationId);
            skillRepository.findCurrentByOperatorAndOperation(operatorId, operationId)
                    .ifPresent(sa -> updated.add(toResponse(sa)));
        }
        return updated;
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
        r.setStatus(pl.getStatus() != null ? pl.getStatus() : "DRAFT");
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
