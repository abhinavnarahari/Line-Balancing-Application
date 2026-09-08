package com.qtech.linebalancing.shift.service;

import com.qtech.linebalancing.common.audit.AuditLog;
import com.qtech.linebalancing.common.audit.AuditLogRepository;
import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.shift.dto.ShiftRequest;
import com.qtech.linebalancing.shift.dto.ShiftResponse;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final AuditLogRepository auditLogRepository;

    public List<ShiftResponse> getAllShifts(Boolean active) {
        List<Shift> shifts = (active != null)
                ? shiftRepository.findByActiveOrderByShiftCodeAsc(active)
                : shiftRepository.findAllByOrderByShiftCodeAsc();
        return shifts.stream().map(this::toResponse).toList();
    }

    public ShiftResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ShiftResponse create(ShiftRequest request) {
        if (shiftRepository.existsByShiftCodeIgnoreCase(request.getShiftCode())) {
            throw new BusinessRuleException(
                    "A shift with code '" + request.getShiftCode() + "' already exists.");
        }
        Shift shift = Shift.builder()
                .shiftCode(request.getShiftCode().toUpperCase())
                .shiftName(request.getShiftName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakDurationMinutes(request.getBreakDurationMinutes() != null ? request.getBreakDurationMinutes() : 60)
                .active(request.isActive())
                .build();
        Shift saved = shiftRepository.save(shift);

        try {
            auditLogRepository.save(AuditLog.builder()
                    .entityName("Shift")
                    .entityId(String.valueOf(saved.getId()))
                    .action("CREATED")
                    .details("Created Shift #" + saved.getId() + " (" + saved.getShiftName() + ") timing " + saved.getStartTime() + "–" + saved.getEndTime())
                    .performedBy("Admin")
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Transactional
    public ShiftResponse update(Long id, ShiftRequest request) {
        Shift shift = findOrThrow(id);
        if (shiftRepository.existsByShiftCodeIgnoreCaseAndIdNot(request.getShiftCode(), id)) {
            throw new BusinessRuleException(
                    "A shift with code '" + request.getShiftCode() + "' already exists.");
        }
        LocalTime oldStart = shift.getStartTime();
        LocalTime oldEnd = shift.getEndTime();

        shift.setShiftCode(request.getShiftCode().toUpperCase());
        shift.setShiftName(request.getShiftName());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        if (request.getBreakDurationMinutes() != null) {
            shift.setBreakDurationMinutes(request.getBreakDurationMinutes());
        }
        shift.setActive(request.isActive());
        Shift updated = shiftRepository.save(shift);

        try {
            String details;
            if (!oldStart.equals(request.getStartTime()) || !oldEnd.equals(request.getEndTime())) {
                details = "Updated Shift #" + id + " timing from " + oldStart + "–" + oldEnd + " to " + request.getStartTime() + "–" + request.getEndTime();
            } else {
                details = "Updated Shift #" + id + " (" + updated.getShiftName() + ")";
            }

            auditLogRepository.save(AuditLog.builder()
                    .entityName("Shift")
                    .entityId(String.valueOf(id))
                    .action("UPDATED")
                    .details(details)
                    .performedBy("Admin")
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (Exception ignored) {}

        return toResponse(updated);
    }

    @Transactional
    public ShiftResponse toggleStatus(Long id) {
        Shift shift = findOrThrow(id);
        shift.setActive(!shift.isActive());
        Shift saved = shiftRepository.save(shift);
        log.info("Shift '{}' status toggled to active={}", shift.getShiftCode(), shift.isActive());

        try {
            auditLogRepository.save(AuditLog.builder()
                    .entityName("Shift")
                    .entityId(String.valueOf(id))
                    .action("UPDATED")
                    .details((saved.isActive() ? "Activated" : "Paused") + " Shift #" + id + " (" + saved.getShiftName() + ")")
                    .performedBy("Admin")
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Shift shift = findOrThrow(id);
        String name = shift.getShiftName();
        try {
            shiftRepository.delete(shift);
            shiftRepository.flush();
            log.info("Shift '{}' deleted", shift.getShiftCode());

            auditLogRepository.save(AuditLog.builder()
                    .entityName("Shift")
                    .entityId(String.valueOf(id))
                    .action("DELETED")
                    .details("Deleted Shift #" + id + " (" + name + ")")
                    .performedBy("Admin")
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Failed to delete shift: ", e);
            throw e;
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Shift findOrThrow(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", id));
    }

    private ShiftResponse toResponse(Shift shift) {
        ShiftResponse resp = new ShiftResponse();
        resp.setId(shift.getId());
        resp.setShiftCode(shift.getShiftCode());
        resp.setShiftName(shift.getShiftName());
        resp.setStartTime(shift.getStartTime());
        resp.setEndTime(shift.getEndTime());
        resp.setBreakDurationMinutes(shift.getBreakDurationMinutes() != null ? shift.getBreakDurationMinutes() : 60);
        resp.setActive(shift.isActive());
        resp.setOvernightShift(shift.isOvernightShift());
        resp.setCreatedAt(shift.getCreatedAt());
        resp.setUpdatedAt(shift.getUpdatedAt());
        return resp;
    }
}
