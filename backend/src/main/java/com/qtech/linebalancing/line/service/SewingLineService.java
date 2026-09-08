package com.qtech.linebalancing.line.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.line.dto.SewingLineRequest;
import com.qtech.linebalancing.line.dto.SewingLineResponse;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SewingLineService {

    private final SewingLineRepository sewingLineRepository;

    @Transactional(readOnly = true)
    public List<SewingLineResponse> getAll(Boolean active) {
        List<SewingLine> lines = active != null 
                ? sewingLineRepository.findByActive(active) 
                : sewingLineRepository.findAll();
        return lines.stream().map(SewingLineResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public SewingLineResponse getById(Long id) {
        return SewingLineResponse.fromEntity(findEntityById(id));
    }

    @Transactional(readOnly = true)
    public String getNextLineCode() {
        List<SewingLine> all = sewingLineRepository.findAll();
        int maxNum = 0;
        for (SewingLine line : all) {
            String code = line.getLineCode();
            if (code != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(code);
                while (m.find()) {
                    try {
                        int val = Integer.parseInt(m.group());
                        if (val > maxNum) {
                            maxNum = val;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return String.format("LINE-%02d", maxNum + 1);
    }

    @Transactional
    public SewingLineResponse create(SewingLineRequest request) {
        String lineCode = request.getLineCode();
        if (lineCode == null || lineCode.trim().isEmpty()) {
            lineCode = getNextLineCode();
        } else {
            lineCode = lineCode.trim();
        }

        if (sewingLineRepository.existsByLineCode(lineCode)) {
            throw new BusinessRuleException("Sewing Line with code '" + lineCode + "' already exists");
        }

        SewingLine line = SewingLine.builder()
                .lineCode(lineCode)
                .lineName(request.getLineName().trim())
                .floor(request.getFloor())
                .supervisorName(request.getSupervisorName())
                .operatorCount(request.getOperatorCount() != null ? request.getOperatorCount() : 20)
                .machineCount(request.getMachineCount() != null ? request.getMachineCount() : 22)
                .workingHours(request.getWorkingHours() != null ? request.getWorkingHours() : new BigDecimal("8.00"))
                .capacityPerDay(request.getCapacityPerDay() != null ? request.getCapacityPerDay() : 1000)
                .targetEfficiencyPercent(request.getTargetEfficiencyPercent() != null 
                        ? request.getTargetEfficiencyPercent() 
                        : new BigDecimal("85.00"))
                .active(request.getActive() == null || request.getActive())
                .build();

        return SewingLineResponse.fromEntity(sewingLineRepository.save(line));
    }

    @Transactional
    public SewingLineResponse update(Long id, SewingLineRequest request) {
        SewingLine line = findEntityById(id);

        String lineCode = request.getLineCode() != null && !request.getLineCode().trim().isEmpty() 
                ? request.getLineCode().trim() 
                : line.getLineCode();

        if (sewingLineRepository.existsByLineCodeAndIdNot(lineCode, id)) {
            throw new BusinessRuleException("Sewing Line with code '" + lineCode + "' already exists");
        }

        line.setLineCode(lineCode);
        line.setLineName(request.getLineName().trim());
        line.setFloor(request.getFloor());
        line.setSupervisorName(request.getSupervisorName());
        if (request.getOperatorCount() != null) {
            line.setOperatorCount(request.getOperatorCount());
        }
        if (request.getMachineCount() != null) {
            line.setMachineCount(request.getMachineCount());
        }
        if (request.getWorkingHours() != null) {
            line.setWorkingHours(request.getWorkingHours());
        }
        if (request.getCapacityPerDay() != null) {
            line.setCapacityPerDay(request.getCapacityPerDay());
        }
        if (request.getTargetEfficiencyPercent() != null) {
            line.setTargetEfficiencyPercent(request.getTargetEfficiencyPercent());
        }
        if (request.getActive() != null) {
            line.setActive(request.getActive());
        }

        return SewingLineResponse.fromEntity(sewingLineRepository.save(line));
    }

    @Transactional
    public SewingLineResponse toggleStatus(Long id) {
        SewingLine line = findEntityById(id);
        line.setActive(!line.isActive());
        return SewingLineResponse.fromEntity(sewingLineRepository.save(line));
    }

    @Transactional
    public void delete(Long id) {
        SewingLine line = findEntityById(id);
        sewingLineRepository.delete(line);
    }

    public SewingLine findEntityById(Long id) {
        return sewingLineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sewing Line not found with id: " + id));
    }
}
