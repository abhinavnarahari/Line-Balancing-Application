package com.qtech.linebalancing.attendance.service;

import com.qtech.linebalancing.attendance.dto.AttendanceRequest;
import com.qtech.linebalancing.attendance.dto.AttendanceResponse;
import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import com.qtech.linebalancing.attendance.repository.AttendanceRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorService;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final OperatorService operatorService;
    private final ShiftRepository shiftRepository;
    private final com.qtech.linebalancing.notification.service.NotificationService notificationService;

    public List<AttendanceResponse> getAttendanceForDate(LocalDate date, Long shiftId) {
        List<AttendanceRecord> records = (shiftId != null)
                ? attendanceRepository.findByAttendanceDateAndShiftIdOrderByOperatorId(date, shiftId)
                : attendanceRepository.findByAttendanceDateOrderByOperatorId(date);
        return records.stream().map(this::toResponse).toList();
    }

    public List<AttendanceResponse> getByOperator(Long operatorId) {
        return attendanceRepository.findByOperatorIdOrderByAttendanceDateDesc(operatorId)
                .stream().map(this::toResponse).toList();
    }

    public List<AttendanceResponse> getAllHistory() {
        return attendanceRepository.findTop500ByOrderByAttendanceDateDesc()
                .stream().map(this::toResponse).toList();
    }

    /**
     * Upsert attendance: update if exists for same date+operator+shift, otherwise insert.
     * Automatically triggers a high-priority manager notification if check-in is late.
     */
    @Transactional
    public AttendanceResponse markAttendance(AttendanceRequest request) {
        Operator operator = operatorService.findEntityById(request.getOperatorId());
        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShiftId()));

        AttendanceRecord record = attendanceRepository
                .findByAttendanceDateAndOperatorIdAndShiftId(
                        request.getAttendanceDate(), operator.getId(), shift.getId())
                .orElse(AttendanceRecord.builder()
                        .attendanceDate(request.getAttendanceDate())
                        .operator(operator)
                        .shift(shift)
                        .build());

        LocalTime checkIn = request.getCheckInTime();
        LocalTime shiftStart = shift.getStartTime();
        boolean isLateArrival = false;
        long lateMins = 0;

        if (checkIn != null && shiftStart != null) {
            if (checkIn.isAfter(shiftStart)) {
                isLateArrival = true;
                lateMins = java.time.Duration.between(shiftStart, checkIn).toMinutes();
            }
        } else if (request.getStatus() == AttendanceRecord.Status.LATE) {
            isLateArrival = true;
            lateMins = 15;
        }

        if (isLateArrival && request.getStatus() != AttendanceRecord.Status.ABSENT && request.getStatus() != AttendanceRecord.Status.ON_LEAVE) {
            record.setStatus(AttendanceRecord.Status.LATE);
        } else {
            record.setStatus(request.getStatus());
        }

        record.setCheckInTime(request.getCheckInTime());
        record.setCheckOutTime(request.getCheckOutTime());
        record.setRemarks(request.getRemarks());

        AttendanceRecord saved = attendanceRepository.save(record);

        // Real-time dispatch to Manager Notification System
        if (isLateArrival || saved.getStatus() == AttendanceRecord.Status.LATE) {
            notificationService.createLateAttendanceNotification(
                    operator, shift, checkIn != null ? checkIn : LocalTime.now(), Math.max(1, lateMins), saved.getId()
            );
        }

        return toResponse(saved);
    }

    @Transactional
    public List<AttendanceResponse> syncBiometric(List<com.qtech.linebalancing.attendance.dto.BiometricSyncRequest> requests) {
        List<AttendanceResponse> responses = new java.util.ArrayList<>();
        com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository shiftAssignmentRepo = 
            com.qtech.linebalancing.common.BeanUtil.getBean(com.qtech.linebalancing.shiftassignment.repository.ShiftAssignmentRepository.class);
        com.qtech.linebalancing.operator.repository.OperatorRepository opRepo = 
            com.qtech.linebalancing.common.BeanUtil.getBean(com.qtech.linebalancing.operator.repository.OperatorRepository.class);

        for (com.qtech.linebalancing.attendance.dto.BiometricSyncRequest req : requests) {
            Operator operator = opRepo.findByEmployeeIdIgnoreCase(req.getEmployeeId()).orElse(null);
            
            if (operator == null) continue;

            com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment assignment = 
                shiftAssignmentRepo.findCurrentAssignment(operator.getId(), req.getAttendanceDate()).orElse(null);
            
            Shift shift = null;
            if (assignment != null) {
                shift = assignment.getShift();
            } else {
                // Fallback to default shift (ID 1) if no assignment exists
                shift = shiftRepository.findById(1L).orElse(null);
                if (shift == null) continue;
            }

            AttendanceRecord.Status status = AttendanceRecord.Status.PRESENT;
            boolean isLateArrival = false;
            long lateMins = 0;
            
            if (req.getCheckInTime() != null && shift.getStartTime() != null) {
                if (req.getCheckInTime().isAfter(shift.getStartTime())) {
                    status = AttendanceRecord.Status.LATE;
                    isLateArrival = true;
                    lateMins = java.time.Duration.between(shift.getStartTime(), req.getCheckInTime()).toMinutes();
                }
            } else if (req.getCheckInTime() == null) {
                status = AttendanceRecord.Status.ABSENT;
            }
            
            AttendanceRecord record = attendanceRepository
                    .findByAttendanceDateAndOperatorIdAndShiftId(
                            req.getAttendanceDate(), operator.getId(), shift.getId())
                    .orElse(AttendanceRecord.builder()
                            .attendanceDate(req.getAttendanceDate())
                            .operator(operator)
                            .shift(shift)
                            .build());

            // Do not override manual remarks unless empty
            if (record.getRemarks() == null) {
                record.setRemarks(isLateArrival ? "Late check-in via Biometric Sync" : "Synced from Biometric");
            }
            
            record.setStatus(status);
            if (req.getCheckInTime() != null) record.setCheckInTime(req.getCheckInTime());
            if (req.getCheckOutTime() != null) record.setCheckOutTime(req.getCheckOutTime());

            AttendanceRecord saved = attendanceRepository.save(record);

            if (isLateArrival) {
                notificationService.createLateAttendanceNotification(
                        operator, shift, req.getCheckInTime(), Math.max(1, lateMins), saved.getId()
                );
            }

            responses.add(toResponse(saved));
        }
        return responses;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private AttendanceResponse toResponse(AttendanceRecord r) {
        AttendanceResponse resp = new AttendanceResponse();
        resp.setId(r.getId());
        resp.setAttendanceDate(r.getAttendanceDate());
        resp.setOperatorId(r.getOperator().getId());
        resp.setOperatorName(r.getOperator().getName());
        resp.setEmployeeId(r.getOperator().getEmployeeId());
        resp.setShiftId(r.getShift().getId());
        resp.setShiftCode(r.getShift().getShiftCode());
        resp.setStatus(r.getStatus());
        resp.setCheckInTime(r.getCheckInTime());
        resp.setCheckOutTime(r.getCheckOutTime());
        resp.setRemarks(r.getRemarks());
        resp.setCreatedAt(r.getCreatedAt());
        resp.setUpdatedAt(r.getUpdatedAt());

        if (r.getShift() != null && r.getShift().getStartTime() != null) {
            resp.setScheduledStartTime(r.getShift().getStartTime());
            if (r.getCheckInTime() != null && r.getCheckInTime().isAfter(r.getShift().getStartTime())) {
                resp.setLateMinutes(java.time.Duration.between(r.getShift().getStartTime(), r.getCheckInTime()).toMinutes());
            } else {
                resp.setLateMinutes(0L);
            }
        } else if (r.getStatus() == AttendanceRecord.Status.LATE) {
            resp.setLateMinutes(15L);
        }

        return resp;
    }
}
