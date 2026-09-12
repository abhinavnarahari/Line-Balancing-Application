package com.qtech.linebalancing.machine.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.machine.dto.MachineRequest;
import com.qtech.linebalancing.machine.dto.MachineResponse;
import com.qtech.linebalancing.machine.entity.Machine;
import com.qtech.linebalancing.machine.entity.Machine.MachineStatus;
import com.qtech.linebalancing.machine.repository.MachineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MachineService {

    private final MachineRepository machineRepository;
    private final SewingLineRepository sewingLineRepository;

    @Transactional(readOnly = true)
    public List<MachineResponse> getAll(Boolean active, Long lineId, String machineType) {
        List<Machine> list;
        if (lineId != null) {
            list = machineRepository.findByLineId(lineId);
        } else if (machineType != null && !machineType.isBlank()) {
            list = machineRepository.findByMachineType(machineType);
        } else if (active != null) {
            list = machineRepository.findByActive(active);
        } else {
            list = machineRepository.findAll();
        }
        return list.stream().map(MachineResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public MachineResponse getById(Long id) {
        return MachineResponse.fromEntity(findEntityById(id));
    }

    @Transactional
    public MachineResponse create(MachineRequest request) {
        if (machineRepository.existsByMachineCode(request.getMachineCode())) {
            throw new BusinessRuleException("Machine with code '" + request.getMachineCode() + "' already exists");
        }

        SewingLine line = null;
        if (request.getLineId() != null) {
            line = sewingLineRepository.findById(request.getLineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sewing Line not found with id: " + request.getLineId()));
        }

        Machine machine = Machine.builder()
                .machineCode(request.getMachineCode().trim())
                .machineType(request.getMachineType().trim())
                .brand(request.getBrand())
                .model(request.getModel())
                .serialNo(request.getSerialNo())
                .line(line)
                .status(request.getStatus() != null ? request.getStatus() : MachineStatus.AVAILABLE)
                .quantity(request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1)
                .active(request.getActive() == null || request.getActive())
                .build();

        return MachineResponse.fromEntity(machineRepository.save(machine));
    }

    @Transactional
    public MachineResponse update(Long id, MachineRequest request) {
        Machine machine = findEntityById(id);

        if (machineRepository.existsByMachineCodeAndIdNot(request.getMachineCode(), id)) {
            throw new BusinessRuleException("Machine with code '" + request.getMachineCode() + "' already exists");
        }

        SewingLine line = null;
        if (request.getLineId() != null) {
            line = sewingLineRepository.findById(request.getLineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sewing Line not found with id: " + request.getLineId()));
        }

        machine.setMachineCode(request.getMachineCode().trim());
        machine.setMachineType(request.getMachineType().trim());
        machine.setBrand(request.getBrand());
        machine.setModel(request.getModel());
        machine.setSerialNo(request.getSerialNo());
        machine.setLine(line);
        if (request.getQuantity() != null && request.getQuantity() > 0) {
            machine.setQuantity(request.getQuantity());
        }
        if (request.getStatus() != null) {
            machine.setStatus(request.getStatus());
        }
        if (request.getActive() != null) {
            machine.setActive(request.getActive());
        }

        return MachineResponse.fromEntity(machineRepository.save(machine));
    }

    @Transactional
    public MachineResponse toggleStatus(Long id) {
        Machine machine = findEntityById(id);
        machine.setActive(!machine.isActive());
        return MachineResponse.fromEntity(machineRepository.save(machine));
    }

    public Machine findEntityById(Long id) {
        return machineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Machine not found with id: " + id));
    }
}
