package com.qtech.linebalancing.capacity.service;

import com.qtech.linebalancing.capacity.dto.CapacityPlanRequest;
import com.qtech.linebalancing.capacity.dto.CapacityPlanResponse;
import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import com.qtech.linebalancing.capacity.repository.CapacityPlanRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.engine.CapacityCalculationService;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.linedesign.repository.LineDesignRepository;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.style.entity.Style;
import com.qtech.linebalancing.style.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CapacityPlanService {

    private final CapacityPlanRepository capacityPlanRepository;
    private final LineDesignRepository lineDesignRepository;
    private final OrderRepository orderRepository;
    private final StyleRepository styleRepository;
    private final OperationBulletinRepository bulletinRepository;
    private final ShiftRepository shiftRepository;
    private final CapacityCalculationService calculationService;

    public List<CapacityPlanResponse> getAll() {
        return capacityPlanRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CapacityPlanResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public List<CapacityPlanResponse> getByOrderId(Long orderId) {
        return capacityPlanRepository.findByOrderId(orderId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CapacityPlanResponse savePlan(CapacityPlanRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        Style style = null;
        if (req.getStyleId() != null) {
            style = styleRepository.findById(req.getStyleId()).orElse(null);
        } else if (order.getStyle() != null) {
            style = order.getStyle();
        }

        OperationBulletin bulletin = null;
        if (req.getBulletinId() != null) {
            bulletin = bulletinRepository.findById(req.getBulletinId()).orElse(null);
        }

        Shift shift = null;
        if (req.getShiftId() != null) {
            shift = shiftRepository.findById(req.getShiftId()).orElse(null);
        }

        double totalSmv = req.getTotalSmvMinutes() != null && req.getTotalSmvMinutes() > 0
                ? req.getTotalSmvMinutes()
                : (bulletin != null ? bulletin.getTotalSmv().doubleValue() : 15.0);

        int shiftHours = 8;
        int breakMins = (shift != null && shift.getBreakDurationMinutes() != null) ? shift.getBreakDurationMinutes() : 30;
        if (shift != null && shift.getStartTime() != null && shift.getEndTime() != null) {
            long mins = java.time.Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
            if (mins < 0) mins += 1440; // overnight
            shiftHours = (int) Math.max(1, mins / 60);
        }

        var calcResult = calculationService.calculate(CapacityCalculationService.CapacityCalculationRequest.builder()
                .orderQuantity(req.getOrderQuantity() != null ? req.getOrderQuantity() : order.getTotalQuantity())
                .availableDays(req.getAvailableDays() != null ? req.getAvailableDays() : 1)
                .shiftHours(shiftHours)
                .breakMinutes(breakMins)
                .targetHourlyOutput(req.getTargetHourlyOutput())
                .plannedEfficiency(req.getPlannedEfficiency())
                .totalSmvMinutes(totalSmv)
                .allowancePfd(req.getAllowancePfd())
                .build());

        String planCode = (req.getPlanCode() != null && !req.getPlanCode().isBlank())
                ? req.getPlanCode()
                : "CAP-" + order.getOrderNo() + "-" + (System.currentTimeMillis() % 10000);

        CapacityPlan plan = CapacityPlan.builder()
                .planCode(planCode)
                .order(order)
                .style(style)
                .bulletin(bulletin)
                .shift(shift)
                .orderQuantity(req.getOrderQuantity() != null ? req.getOrderQuantity() : order.getTotalQuantity())
                .availableDays(req.getAvailableDays() != null ? req.getAvailableDays() : 1)
                .targetHourlyOutput(calcResult.getTargetHourlyOutput())
                .plannedEfficiency(calcResult.getPlannedEfficiencyPercent())
                .allowancePfd(req.getAllowancePfd() != null ? req.getAllowancePfd() : "5,4,1")
                .totalSmvMinutes(calcResult.getTotalLineSmvMinutesWithPfd())
                .customerTaktSecs(calcResult.getCustomerTaktSecs())
                .requiredDesignCapacity(calcResult.getRequiredDesignCapacityPerHour())
                .designedPitchSecs(calcResult.getDesignedPitchSecs())
                .theoreticalManpower(calcResult.getTheoreticalManpower())
                .plannedManpower(calcResult.getPlannedManpower())
                .status("ACTIVE")
                .build();

        CapacityPlan saved = capacityPlanRepository.save(plan);
        log.info("Saved capacity plan '{}' for order '{}'", saved.getPlanCode(), order.getOrderNo());
        return toResponse(saved);
    }

    @Transactional
    public CapacityPlanResponse updatePlan(Long id, CapacityPlanRequest req) {
        CapacityPlan plan = findOrThrow(id);

        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", req.getOrderId()));

        Style style = null;
        if (req.getStyleId() != null) {
            style = styleRepository.findById(req.getStyleId()).orElse(null);
        } else if (order.getStyle() != null) {
            style = order.getStyle();
        }

        OperationBulletin bulletin = null;
        if (req.getBulletinId() != null) {
            bulletin = bulletinRepository.findById(req.getBulletinId()).orElse(null);
        }

        Shift shift = null;
        if (req.getShiftId() != null) {
            shift = shiftRepository.findById(req.getShiftId()).orElse(null);
        }

        double totalSmv = req.getTotalSmvMinutes() != null && req.getTotalSmvMinutes() > 0
                ? req.getTotalSmvMinutes()
                : (bulletin != null ? bulletin.getTotalSmv().doubleValue() : (plan.getTotalSmvMinutes() > 0 ? plan.getTotalSmvMinutes() : 15.0));

        int shiftHours = 8;
        int breakMins = (shift != null && shift.getBreakDurationMinutes() != null) ? shift.getBreakDurationMinutes() : 30;
        if (shift != null && shift.getStartTime() != null && shift.getEndTime() != null) {
            long mins = java.time.Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
            if (mins < 0) mins += 1440; // overnight
            shiftHours = (int) Math.max(1, mins / 60);
        }

        var calcResult = calculationService.calculate(CapacityCalculationService.CapacityCalculationRequest.builder()
                .orderQuantity(req.getOrderQuantity() != null ? req.getOrderQuantity() : order.getTotalQuantity())
                .availableDays(req.getAvailableDays() != null ? req.getAvailableDays() : 1)
                .shiftHours(shiftHours)
                .breakMinutes(breakMins)
                .targetHourlyOutput(req.getTargetHourlyOutput())
                .plannedEfficiency(req.getPlannedEfficiency())
                .totalSmvMinutes(totalSmv)
                .allowancePfd(req.getAllowancePfd())
                .build());

        plan.setOrder(order);
        plan.setStyle(style);
        plan.setBulletin(bulletin);
        plan.setShift(shift);
        plan.setOrderQuantity(req.getOrderQuantity() != null ? req.getOrderQuantity() : order.getTotalQuantity());
        plan.setAvailableDays(req.getAvailableDays() != null ? req.getAvailableDays() : 1);
        plan.setTargetHourlyOutput(calcResult.getTargetHourlyOutput());
        plan.setPlannedEfficiency(calcResult.getPlannedEfficiencyPercent());
        plan.setAllowancePfd(req.getAllowancePfd() != null ? req.getAllowancePfd() : "5,4,1");
        plan.setTotalSmvMinutes(calcResult.getTotalLineSmvMinutesWithPfd());
        plan.setCustomerTaktSecs(calcResult.getCustomerTaktSecs());
        plan.setRequiredDesignCapacity(calcResult.getRequiredDesignCapacityPerHour());
        plan.setDesignedPitchSecs(calcResult.getDesignedPitchSecs());
        plan.setTheoreticalManpower(calcResult.getTheoreticalManpower());
        plan.setPlannedManpower(calcResult.getPlannedManpower());

        CapacityPlan saved = capacityPlanRepository.save(plan);
        log.info("Updated capacity plan '{}' (id={})", saved.getPlanCode(), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public void deletePlan(Long id) {
        CapacityPlan plan = findOrThrow(id);
        List<LineDesign> designs = lineDesignRepository.findByCapacityPlanId(id);
        if (designs != null && !designs.isEmpty()) {
            for (LineDesign d : designs) {
                d.setCapacityPlan(null);
                lineDesignRepository.save(d);
            }
        }
        capacityPlanRepository.delete(plan);
        log.info("Deleted capacity plan '{}' (id={})", plan.getPlanCode(), id);
    }

    private CapacityPlan findOrThrow(Long id) {
        return capacityPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CapacityPlan", "id", id));
    }

    private CapacityPlanResponse toResponse(CapacityPlan p) {
        CapacityPlanResponse r = new CapacityPlanResponse();
        r.setId(p.getId());
        r.setPlanCode(p.getPlanCode());
        r.setOrderId(p.getOrder().getId());
        r.setOrderNo(p.getOrder().getOrderNo());
        if (p.getStyle() != null) {
            r.setStyleId(p.getStyle().getId());
            r.setStyleNo(p.getStyle().getStyleNo());
        }
        if (p.getBulletin() != null) {
            r.setBulletinId(p.getBulletin().getId());
            r.setBulletinCode(p.getBulletin().getBulletinCode());
        }
        if (p.getShift() != null) {
            r.setShiftId(p.getShift().getId());
            r.setShiftName(p.getShift().getShiftName());
        }
        r.setOrderQuantity(p.getOrderQuantity());
        r.setAvailableDays(p.getAvailableDays());
        r.setTargetHourlyOutput(p.getTargetHourlyOutput());
        r.setPlannedEfficiency(p.getPlannedEfficiency());
        r.setAllowancePfd(p.getAllowancePfd());
        r.setTotalSmvMinutes(p.getTotalSmvMinutes());
        r.setCustomerTaktSecs(p.getCustomerTaktSecs());
        r.setRequiredDesignCapacity(p.getRequiredDesignCapacity());
        r.setDesignedPitchSecs(p.getDesignedPitchSecs());
        r.setTheoreticalManpower(p.getTheoreticalManpower());
        r.setPlannedManpower(p.getPlannedManpower());
        r.setStatus(p.getStatus());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
