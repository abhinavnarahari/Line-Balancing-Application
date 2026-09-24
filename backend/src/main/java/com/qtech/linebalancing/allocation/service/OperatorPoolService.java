package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.entity.OperatorMachineQualification;
import com.qtech.linebalancing.allocation.repository.OperatorMachineQualificationRepository;
import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import com.qtech.linebalancing.attendance.repository.AttendanceRepository;
import com.qtech.linebalancing.attendance.service.AttendanceService;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository;
import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import com.qtech.linebalancing.skillmatrix.repository.OperatorPerformanceLogRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OperatorPoolService {

    private final OperatorRepository operatorRepository;
    private final SkillAssessmentRepository skillAssessmentRepository;
    private final OperatorPerformanceLogRepository performanceLogRepository;
    private final OperatorMachineQualificationRepository machineQualificationRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceService attendanceService;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final SewingLineRepository sewingLineRepository;

    /**
     * Retrieves the comprehensive operator pool for a specific planning date and shift.
     */
    @Transactional
    public List<OperatorPoolDTO> getOperatorPool(LocalDate planningDate, Long shiftId) {
        LocalDate date = planningDate != null ? planningDate : LocalDate.now();
        List<Operator> operators = operatorRepository.findByActiveOrderByNameAsc(true);

        // Load attendances for this date
        Map<Long, AttendanceRecord> attendanceMap = new HashMap<>();
        List<AttendanceRecord> attendances = attendanceRepository.findByAttendanceDateOrderByOperatorId(date);
        if (attendances.isEmpty()) {
            attendances = attendanceService.initializeBaselineAttendanceForDate(date, shiftId);
        }
        for (AttendanceRecord att : attendances) {
            if (shiftId == null || att.getShift() == null || (att.getShift() != null && att.getShift().getId().equals(shiftId))) {
                attendanceMap.put(att.getOperator().getId(), att);
            }
        }

        // Load shift assignments
        Map<Long, ShiftAssignment> shiftAssignmentMap = new HashMap<>();
        List<ShiftAssignment> assignments = shiftAssignmentRepository.findAllByOrderByCreatedAtDesc();
        for (ShiftAssignment sa : assignments) {
            if (sa.getStatus() == ShiftAssignment.Status.ACTIVE && (shiftId == null || (sa.getShift() != null && sa.getShift().getId().equals(shiftId)))) {
                shiftAssignmentMap.put(sa.getOperator().getId(), sa);
            }
        }

        // Preload sewing lines for home-line mapping
        List<SewingLine> lines = sewingLineRepository.findAll();
        Map<Long, SewingLine> lineMap = lines.stream().collect(Collectors.toMap(SewingLine::getId, l -> l, (a, b) -> a));

        List<OperatorPoolDTO> result = new ArrayList<>();

        for (Operator op : operators) {
            // Determine attendance status
            AttendanceRecord att = attendanceMap.get(op.getId());
            String attendanceStatus = "NOT_REPORTED";
            if (att != null && att.getStatus() != null) {
                attendanceStatus = att.getStatus().name();
            } else {
                // If shift assigned, default to PRESENT for simulation if no negative mark
                if (shiftAssignmentMap.containsKey(op.getId())) {
                    attendanceStatus = "PRESENT";
                }
            }

            boolean isAvailable = "PRESENT".equalsIgnoreCase(attendanceStatus) || "LATE".equalsIgnoreCase(attendanceStatus);

            // Load skill assessments
            List<SkillAssessment> assessments = skillAssessmentRepository.findByOperatorIdAndIsCurrentTrue(op.getId());
            List<OperatorPoolDTO.QualifiedOperationItem> qualifiedOps = new ArrayList<>();
            int totalRating = 0;
            for (SkillAssessment sa : assessments) {
                int r;
                if (sa.getCycleTimeSeconds() != null && sa.getCycleTimeSeconds() > 0) {
                    Double stdSmv = sa.getOperation().getStandardSmv() != null ? sa.getOperation().getStandardSmv().doubleValue() : null;
                    r = com.qtech.linebalancing.skillmatrix.service.SkillMatrixService.cycleTimeToRating(
                            sa.getCycleTimeSeconds(),
                            sa.getOperation().getName(),
                            stdSmv
                    );
                } else {
                    r = sa.getRating() != null ? sa.getRating() : 3;
                }
                totalRating += r;
                qualifiedOps.add(OperatorPoolDTO.QualifiedOperationItem.builder()
                        .operationId(sa.getOperation().getId())
                        .operationCode(sa.getOperation().getOperationCode())
                        .operationName(sa.getOperation().getName())
                        .rating(r)
                        .cycleTimeSeconds(sa.getCycleTimeSeconds())
                        .build());
            }
            double avgRating = !assessments.isEmpty()
                    ? Math.round(((double) totalRating / assessments.size()) * 10.0) / 10.0
                    : 3.0;

            // Load machine qualifications
            List<OperatorMachineQualification> machineQuals = machineQualificationRepository.findByOperatorId(op.getId());
            List<OperatorPoolDTO.QualifiedMachineItem> qualifiedMachines = new ArrayList<>();
            for (OperatorMachineQualification omq : machineQuals) {
                qualifiedMachines.add(OperatorPoolDTO.QualifiedMachineItem.builder()
                        .machineType(omq.getMachineType())
                        .qualificationLevel(omq.getQualificationLevel())
                        .experienceMonths(omq.getExperienceMonths())
                        .isPrimary(omq.getIsPrimaryQualification())
                        .build());
            }

            // Historical average efficiency
            List<OperatorPerformanceLog> perfLogs = performanceLogRepository.findByOperatorIdOrderByLogDateDesc(op.getId());
            double histEfficiency = 85.0; // standard default
            if (!perfLogs.isEmpty()) {
                double avgTime = perfLogs.stream().mapToInt(OperatorPerformanceLog::getActualCycleTimeSeconds).filter(t -> t > 0).average().orElse(45.0);
                histEfficiency = Math.min(125.0, Math.max(50.0, Math.round((40.0 / avgTime) * 100.0 * 10.0) / 10.0));
            }

            // Determine home line based on modular operator distribution
            Long homeLineId = null;
            String homeLineName = null;
            if (!lines.isEmpty()) {
                int lineIdx = (int) (op.getId() % lines.size());
                SewingLine hl = lines.get(lineIdx);
                homeLineId = hl.getId();
                homeLineName = hl.getLineName();
            }

            String availabilityStatus = isAvailable ? "AVAILABLE" : ("ON_LEAVE".equalsIgnoreCase(attendanceStatus) ? "ON_LEAVE" : "ABSENT");

            result.add(OperatorPoolDTO.builder()
                    .operatorId(op.getId())
                    .employeeCode(op.getEmployeeId())
                    .operatorName(op.getName())
                    .age(op.getAge())
                    .gender(op.getGender() != null ? op.getGender().name() : "Other")
                    .department(op.getDepartment())
                    .role(op.getRole() != null ? op.getRole().name() : "OPERATOR")
                    .currentLineId(homeLineId)
                    .currentLineName(homeLineName)
                    .averageSkillRating(avgRating)
                    .qualifiedOperations(qualifiedOps)
                    .qualifiedMachines(qualifiedMachines)
                    .shiftAvailability(isAvailable ? "FULL_SHIFT" : "NOT_AVAILABLE")
                    .attendanceStatus(attendanceStatus)
                    .historicalEfficiency(histEfficiency)
                    .historicalQualityRate(98.2)
                    .availabilityStatus(availabilityStatus)
                    .isAssigned(false)
                    .build());
        }

        return result;
    }
}
