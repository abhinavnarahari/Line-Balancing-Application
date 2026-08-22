package com.qtech.linebalancing.shift.service;

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

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ShiftService {

    private final ShiftRepository shiftRepository;

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
                .active(request.isActive())
                .build();
        return toResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse update(Long id, ShiftRequest request) {
        Shift shift = findOrThrow(id);
        if (shiftRepository.existsByShiftCodeIgnoreCaseAndIdNot(request.getShiftCode(), id)) {
            throw new BusinessRuleException(
                    "A shift with code '" + request.getShiftCode() + "' already exists.");
        }
        shift.setShiftCode(request.getShiftCode().toUpperCase());
        shift.setShiftName(request.getShiftName());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setActive(request.isActive());
        return toResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse toggleStatus(Long id) {
        Shift shift = findOrThrow(id);
        shift.setActive(!shift.isActive());
        log.info("Shift '{}' status toggled to active={}", shift.getShiftCode(), shift.isActive());
        return toResponse(shiftRepository.save(shift));
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
        resp.setActive(shift.isActive());
        resp.setOvernightShift(shift.isOvernightShift());
        resp.setCreatedAt(shift.getCreatedAt());
        resp.setUpdatedAt(shift.getUpdatedAt());
        return resp;
    }
}
