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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final OperatorService operatorService;
    private final ShiftRepository shiftRepository;

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

    /**
     * Upsert attendance: update if exists for same date+operator+shift, otherwise insert.
     * This is the correct pattern for daily attendance marking.
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

        record.setStatus(request.getStatus());
        record.setCheckInTime(request.getCheckInTime());
        record.setCheckOutTime(request.getCheckOutTime());
        record.setRemarks(request.getRemarks());

        return toResponse(attendanceRepository.save(record));
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
        return resp;
    }
}
