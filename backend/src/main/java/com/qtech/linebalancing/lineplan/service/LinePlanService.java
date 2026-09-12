package com.qtech.linebalancing.lineplan.service;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.lineplan.dto.LinePlanRequest;
import com.qtech.linebalancing.lineplan.dto.LinePlanResponse;
import com.qtech.linebalancing.lineplan.entity.LinePlan;
import com.qtech.linebalancing.lineplan.entity.LinePlanAssignment;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.repository.BulletinLineRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class LinePlanService {

    private final LinePlanRepository linePlanRepository;
    private final OrderRepository orderRepository;
    private final ShiftRepository shiftRepository;
    private final com.qtech.linebalancing.line.repository.SewingLineRepository sewingLineRepository;
    private final OperationRepository operationRepository;
    private final OperatorRepository operatorRepository;
    private final BulletinLineRepository bulletinLineRepository;

    public List<LinePlanResponse> getAllPlans() {
        return linePlanRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LinePlanResponse getPlanById(Long id) {
        return linePlanRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Line plan not found with id: " + id));
    }

    public LinePlanResponse getPlanForOrder(Long orderId) {
        return linePlanRepository.findByOrderId(orderId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional
    public LinePlanResponse savePlan(LinePlanRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));
        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found with id: " + request.getShiftId()));

        com.qtech.linebalancing.line.entity.SewingLine line = null;
        if (request.getLineId() != null) {
            line = sewingLineRepository.findById(request.getLineId()).orElse(null);
        }

        LinePlan plan = linePlanRepository.findByOrderId(order.getId()).orElse(new LinePlan());
        
        plan.setOrder(order);
        plan.setShift(shift);
        plan.setLine(line);
        plan.setAllowance(request.getAllowance() != null ? request.getAllowance() : 10);
        if (request.getAllowancePfd() != null && !request.getAllowancePfd().isBlank()) {
            plan.setAllowancePfd(request.getAllowancePfd());
        }
        if (request.getPlannedEfficiency() != null && request.getPlannedEfficiency() > 0) {
            plan.setPlannedEfficiency(request.getPlannedEfficiency());
        }
        plan.setTargetOutput(request.getTargetOutput() != null && request.getTargetOutput() > 0 
                ? request.getTargetOutput() 
                : (order.getTotalQuantity() != null && order.getTotalQuantity() > 0 ? order.getTotalQuantity() : 480));
        plan.setStatus("active");
        
        // Clear existing assignments to replace with new ones
        plan.getAssignments().clear();

        if (request.getAssignments() != null) {
            for (LinePlanRequest.LinePlanAssignmentRequest assignReq : request.getAssignments()) {
                LinePlanAssignment assignment = new LinePlanAssignment();
                
                if (assignReq.getBulletinLineId() != null) {
                    BulletinLine bLine = bulletinLineRepository.findById(assignReq.getBulletinLineId()).orElse(null);
                    assignment.setBulletinLine(bLine);
                }

                Operation op = operationRepository.findById(assignReq.getOperationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Operation not found with id: " + assignReq.getOperationId()));
                assignment.setOperation(op);

                if (assignReq.getOperatorId() != null && assignReq.getOperatorId() > 0) {
                    Operator operator = operatorRepository.findById(assignReq.getOperatorId()).orElse(null);
                    assignment.setOperator(operator);
                }

                assignment.setIsQcCheckpoint(assignReq.getIsQcCheckpoint() != null && assignReq.getIsQcCheckpoint());

                plan.addAssignment(assignment);
            }
        }

        LinePlan savedPlan = linePlanRepository.save(plan);
        return mapToResponse(savedPlan);
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!linePlanRepository.existsById(id)) {
            throw new ResourceNotFoundException("Line plan not found with id: " + id);
        }
        linePlanRepository.deleteById(id);
    }

    @Transactional
    public void deletePlanByOrderId(Long orderId) {
        linePlanRepository.deleteByOrderId(orderId);
    }

    private LinePlanResponse mapToResponse(LinePlan plan) {
        LinePlanResponse response = new LinePlanResponse();
        response.setId(plan.getId());
        response.setOrderId(plan.getOrder() != null ? plan.getOrder().getId() : null);
        response.setShiftId(plan.getShift() != null ? plan.getShift().getId() : null);
        response.setLineId(plan.getLine() != null ? plan.getLine().getId() : null);
        response.setLineCode(plan.getLine() != null ? plan.getLine().getLineCode() : null);
        response.setLineName(plan.getLine() != null ? plan.getLine().getLineName() : null);
        response.setTargetOutput(plan.getTargetOutput());
        response.setAllowance(plan.getAllowance());
        response.setAllowancePfd(plan.getAllowancePfd());
        response.setPlannedEfficiency(plan.getPlannedEfficiency());
        response.setStatus(plan.getStatus());
        
        List<LinePlanResponse.LinePlanAssignmentResponse> assignResps = plan.getAssignments().stream()
                .map(a -> {
                    LinePlanResponse.LinePlanAssignmentResponse ar = new LinePlanResponse.LinePlanAssignmentResponse();
                    ar.setBulletinLineId(a.getBulletinLine() != null ? a.getBulletinLine().getId() : null);
                    ar.setOperationId(a.getOperation() != null ? a.getOperation().getId() : null);
                    ar.setOperatorId(a.getOperator() != null ? a.getOperator().getId() : null);
                    ar.setIsQcCheckpoint(a.getIsQcCheckpoint() != null && a.getIsQcCheckpoint());
                    return ar;
                }).collect(Collectors.toList());
                
        response.setAssignments(assignResps);
        return response;
    }
}
