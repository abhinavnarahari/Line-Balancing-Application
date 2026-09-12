package com.qtech.linebalancing.linedesign.service;

import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import com.qtech.linebalancing.capacity.repository.CapacityPlanRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.linedesign.dto.LineDesignRequest;
import com.qtech.linebalancing.linedesign.dto.LineDesignResponse;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.linedesign.entity.LineDesignMachine;
import com.qtech.linebalancing.linedesign.repository.LineDesignMachineRepository;
import com.qtech.linebalancing.linedesign.repository.LineDesignRepository;
import com.qtech.linebalancing.machine.repository.MachineRepository;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LineDesignService {

    private final LineDesignRepository lineDesignRepository;
    private final LineDesignMachineRepository lineDesignMachineRepository;
    private final OrderRepository orderRepository;
    private final SewingLineRepository sewingLineRepository;
    private final ShiftRepository shiftRepository;
    private final OperationBulletinRepository bulletinRepository;
    private final CapacityPlanRepository capacityPlanRepository;
    private final MachineRepository machineRepository;

    public List<LineDesignResponse> getAll() {
        return lineDesignRepository.findAll().stream().map(this::toResponse).toList();
    }

    public LineDesignResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public List<LineDesignResponse> getByOrderId(Long orderId) {
        return lineDesignRepository.findByOrderId(orderId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public LineDesignResponse saveDesign(LineDesignRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        CapacityPlan capPlan = null;
        if (req.getCapacityPlanId() != null) {
            capPlan = capacityPlanRepository.findById(req.getCapacityPlanId()).orElse(null);
        }

        OperationBulletin bulletin = null;
        if (req.getBulletinId() != null) {
            bulletin = bulletinRepository.findById(req.getBulletinId()).orElse(null);
        }

        SewingLine line = null;
        if (req.getLineId() != null) {
            line = sewingLineRepository.findById(req.getLineId()).orElse(null);
        }

        Shift shift = null;
        if (req.getShiftId() != null) {
            shift = shiftRepository.findById(req.getShiftId()).orElse(null);
        }

        double eff = req.getPlannedEfficiency() != null && req.getPlannedEfficiency() > 0
                ? req.getPlannedEfficiency()
                : 80.0;
        int target = req.getTargetHourlyOutput() != null && req.getTargetHourlyOutput() > 0
                ? req.getTargetHourlyOutput()
                : 70;

        double reqCapacity = eff > 0 ? (target / (eff / 100.0)) : target;
        double designedPitch = reqCapacity > 0 ? (3600.0 / reqCapacity) : 41.14;

        String designCode = (req.getDesignCode() != null && !req.getDesignCode().isBlank())
                ? req.getDesignCode()
                : "LD-" + order.getOrderNo() + "-" + (line != null ? line.getLineCode() : "GEN") + "-" + (System.currentTimeMillis() % 10000);

        LineDesign design = LineDesign.builder()
                .designCode(designCode)
                .capacityPlan(capPlan)
                .order(order)
                .bulletin(bulletin)
                .line(line)
                .shift(shift)
                .totalWorkstations(req.getTotalWorkstations() != null ? req.getTotalWorkstations() : 1)
                .totalOperators(req.getTotalOperators() != null ? req.getTotalOperators() : 1)
                .totalHelpers(req.getTotalHelpers() != null ? req.getTotalHelpers() : 0)
                .totalQc(req.getTotalQc() != null ? req.getTotalQc() : 0)
                .totalMachines(req.getTotalMachines() != null ? req.getTotalMachines() : 0)
                .targetHourlyOutput(target)
                .plannedEfficiency(eff)
                .designedPitchSecs(req.getDesignedPitchSecs() != null ? req.getDesignedPitchSecs() : designedPitch)
                .lineBalanceEfficiency(req.getLineBalanceEfficiency() != null ? req.getLineBalanceEfficiency() : 0.0)
                .strategyName(req.getStrategyName())
                .stationAllocations(req.getStationAllocations())
                .workstationsJson(req.getWorkstationsJson())
                .status(req.getStatus() != null ? req.getStatus() : "DRAFT")
                .version(req.getVersion() != null ? req.getVersion() : 1)
                .createdBy(req.getCreatedBy())
                .approvedBy(req.getApprovedBy())
                .releasedBy(req.getReleasedBy())
                .build();

        // Process machine plan
        if (req.getMachines() != null) {
            for (LineDesignRequest.LineDesignMachineRequest mReq : req.getMachines()) {
                design.addMachine(LineDesignMachine.builder()
                        .machineType(mReq.getMachineType())
                        .requiredQty(mReq.getRequiredQty() != null ? mReq.getRequiredQty() : 1)
                        .availableQty(mReq.getAvailableQty() != null ? mReq.getAvailableQty() : 0)
                        .notes(mReq.getNotes())
                        .build());
            }
        }

        LineDesign saved = lineDesignRepository.save(design);
        log.info("Saved Line Design '{}' with status '{}'", saved.getDesignCode(), saved.getStatus());
        return toResponse(saved);
    }

    @Transactional
    public LineDesignResponse updateDesign(Long id, LineDesignRequest req) {
        LineDesign design = findOrThrow(id);

        if (req.getOrderId() != null) {
            Order order = orderRepository.findById(req.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));
            design.setOrder(order);
        }

        if (req.getCapacityPlanId() != null) {
            CapacityPlan capPlan = capacityPlanRepository.findById(req.getCapacityPlanId()).orElse(null);
            design.setCapacityPlan(capPlan);
        }

        if (req.getBulletinId() != null) {
            OperationBulletin bulletin = bulletinRepository.findById(req.getBulletinId()).orElse(null);
            design.setBulletin(bulletin);
        }

        if (req.getLineId() != null) {
            SewingLine line = sewingLineRepository.findById(req.getLineId()).orElse(null);
            design.setLine(line);
        }

        if (req.getShiftId() != null) {
            Shift shift = shiftRepository.findById(req.getShiftId()).orElse(null);
            design.setShift(shift);
        }

        if (req.getDesignCode() != null && !req.getDesignCode().isBlank()) {
            design.setDesignCode(req.getDesignCode());
        }

        if (req.getTotalWorkstations() != null) design.setTotalWorkstations(req.getTotalWorkstations());
        if (req.getTotalOperators() != null) design.setTotalOperators(req.getTotalOperators());
        if (req.getTotalHelpers() != null) design.setTotalHelpers(req.getTotalHelpers());
        if (req.getTotalQc() != null) design.setTotalQc(req.getTotalQc());
        if (req.getTotalMachines() != null) design.setTotalMachines(req.getTotalMachines());
        if (req.getTargetHourlyOutput() != null) design.setTargetHourlyOutput(req.getTargetHourlyOutput());
        if (req.getPlannedEfficiency() != null) design.setPlannedEfficiency(req.getPlannedEfficiency());
        if (req.getDesignedPitchSecs() != null) design.setDesignedPitchSecs(req.getDesignedPitchSecs());
        if (req.getLineBalanceEfficiency() != null) design.setLineBalanceEfficiency(req.getLineBalanceEfficiency());
        if (req.getStrategyName() != null) design.setStrategyName(req.getStrategyName());
        if (req.getStationAllocations() != null) design.setStationAllocations(req.getStationAllocations());
        if (req.getWorkstationsJson() != null) design.setWorkstationsJson(req.getWorkstationsJson());
        if (req.getStatus() != null) design.setStatus(req.getStatus());

        if (req.getMachines() != null) {
            design.getMachines().clear();
            for (LineDesignRequest.LineDesignMachineRequest mReq : req.getMachines()) {
                design.addMachine(LineDesignMachine.builder()
                        .machineType(mReq.getMachineType())
                        .requiredQty(mReq.getRequiredQty() != null ? mReq.getRequiredQty() : 1)
                        .availableQty(mReq.getAvailableQty() != null ? mReq.getAvailableQty() : 0)
                        .notes(mReq.getNotes())
                        .build());
            }
        }

        LineDesign updated = lineDesignRepository.save(design);
        log.info("Updated Line Design '{}' (ID: {})", updated.getDesignCode(), updated.getId());
        return toResponse(updated);
    }

    @Transactional
    public void deleteDesign(Long id) {
        LineDesign design = findOrThrow(id);
        lineDesignRepository.delete(design);
        log.info("Deleted Line Design with id: {}", id);
    }

    @Transactional
    public LineDesignResponse updateStatus(Long id, String newStatus, String user) {
        LineDesign design = findOrThrow(id);
        design.setStatus(newStatus);
        if ("APPROVED".equalsIgnoreCase(newStatus)) {
            design.setApprovedBy(user != null ? user : "IE Manager");
        } else if ("RELEASED".equalsIgnoreCase(newStatus) || "ACTIVE".equalsIgnoreCase(newStatus)) {
            design.setReleasedBy(user != null ? user : "Plant Head");
        }
        return toResponse(lineDesignRepository.save(design));
    }

    private LineDesign findOrThrow(Long id) {
        return lineDesignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LineDesign", "id", id));
    }

    private LineDesignResponse toResponse(LineDesign d) {
        LineDesignResponse r = new LineDesignResponse();
        r.setId(d.getId());
        r.setDesignCode(d.getDesignCode());
        if (d.getCapacityPlan() != null) {
            r.setCapacityPlanId(d.getCapacityPlan().getId());
        }
        r.setOrderId(d.getOrder().getId());
        r.setOrderNo(d.getOrder().getOrderNo());
        if (d.getOrder().getStyle() != null) {
            r.setStyleId(d.getOrder().getStyle().getId());
            r.setStyleNo(d.getOrder().getStyle().getStyleNo());
        }
        if (d.getBulletin() != null) {
            r.setBulletinId(d.getBulletin().getId());
            r.setBulletinCode(d.getBulletin().getBulletinCode());
        }
        if (d.getLine() != null) {
            r.setLineId(d.getLine().getId());
            r.setLineCode(d.getLine().getLineCode());
            r.setLineName(d.getLine().getLineName());
        }
        if (d.getShift() != null) {
            r.setShiftId(d.getShift().getId());
            r.setShiftName(d.getShift().getShiftName());
        }
        r.setTotalWorkstations(d.getTotalWorkstations());
        r.setTotalOperators(d.getTotalOperators());
        r.setTotalHelpers(d.getTotalHelpers());
        r.setTotalQc(d.getTotalQc());
        r.setTotalMachines(d.getTotalMachines());
        r.setTargetHourlyOutput(d.getTargetHourlyOutput());
        r.setPlannedEfficiency(d.getPlannedEfficiency());
        r.setDesignedPitchSecs(d.getDesignedPitchSecs());
        r.setLineBalanceEfficiency(d.getLineBalanceEfficiency());
        r.setStrategyName(d.getStrategyName());
        r.setStationAllocations(d.getStationAllocations());
        r.setWorkstationsJson(d.getWorkstationsJson());
        r.setStatus(d.getStatus());
        r.setVersion(d.getVersion());
        r.setCreatedBy(d.getCreatedBy());
        r.setApprovedBy(d.getApprovedBy());
        r.setReleasedBy(d.getReleasedBy());
        r.setCreatedAt(d.getCreatedAt());
        r.setUpdatedAt(d.getUpdatedAt());

        r.setMachines(d.getMachines().stream().map(m -> {
            LineDesignResponse.LineDesignMachineResponse mr = new LineDesignResponse.LineDesignMachineResponse();
            mr.setId(m.getId());
            mr.setMachineType(m.getMachineType());
            mr.setRequiredQty(m.getRequiredQty());
            mr.setAvailableQty(m.getAvailableQty());
            mr.setShortageQty(Math.max(0, m.getRequiredQty() - m.getAvailableQty()));
            mr.setNotes(m.getNotes());
            return mr;
        }).toList());

        return r;
    }
}
