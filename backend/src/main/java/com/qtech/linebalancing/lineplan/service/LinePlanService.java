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
    private final OperationRepository operationRepository;
    private final OperatorRepository operatorRepository;
    // Assuming we have EntityManager or we just use references.
    // Assuming we have EntityManager or we just use references. Let's use JpaRepository reference resolving via getReferenceById for simplicity if we don't validate strictly, or just save IDs.
    // For strict validation, we would need OperationBulletinLineRepository.
    
    // To keep it simple and performant, we'll use findById on Order and Shift.
    // For assignments, we'll map them.

    public LinePlanResponse getPlanForOrder(Long orderId) {
        return linePlanRepository.findByOrderId(orderId)
                .map(this::mapToResponse)
                .orElse(null); // Return null (or empty response) if not found, frontend expects null for 404/not found.
    }

    @Transactional
    public LinePlanResponse savePlan(LinePlanRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        LinePlan plan = linePlanRepository.findByOrderId(order.getId()).orElse(new LinePlan());
        
        plan.setOrder(order);
        plan.setShift(shift);
        plan.setAllowance(request.getAllowance());
        plan.setTargetOutput(order.getTotalQuantity()); // Or pass from request if it can be overridden
        plan.setStatus("active");
        
        // Clear existing assignments to replace with new ones
        plan.getAssignments().clear();

        if (request.getAssignments() != null) {
            for (LinePlanRequest.LinePlanAssignmentRequest assignReq : request.getAssignments()) {
                LinePlanAssignment assignment = new LinePlanAssignment();
                
                // For performance, we can use proxy objects if we don't need to load the full entity
                BulletinLine bLine = new BulletinLine();
                bLine.setId(assignReq.getBulletinLineId());
                assignment.setBulletinLine(bLine);

                Operation op = operationRepository.findById(assignReq.getOperationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Operation not found"));
                assignment.setOperation(op);

                if (assignReq.getOperatorId() != null) {
                    Operator operator = operatorRepository.findById(assignReq.getOperatorId())
                            .orElseThrow(() -> new ResourceNotFoundException("Operator not found"));
                    assignment.setOperator(operator);
                }

                plan.addAssignment(assignment);
            }
        }

        LinePlan savedPlan = linePlanRepository.save(plan);
        return mapToResponse(savedPlan);
    }

    private LinePlanResponse mapToResponse(LinePlan plan) {
        LinePlanResponse response = new LinePlanResponse();
        response.setId(plan.getId());
        response.setOrderId(plan.getOrder().getId());
        response.setShiftId(plan.getShift().getId());
        response.setTargetOutput(plan.getTargetOutput());
        response.setAllowance(plan.getAllowance());
        response.setStatus(plan.getStatus());
        
        List<LinePlanResponse.LinePlanAssignmentResponse> assignResps = plan.getAssignments().stream()
                .map(a -> {
                    LinePlanResponse.LinePlanAssignmentResponse ar = new LinePlanResponse.LinePlanAssignmentResponse();
                    ar.setBulletinLineId(a.getBulletinLine().getId());
                    ar.setOperationId(a.getOperation().getId());
                    ar.setOperatorId(a.getOperator() != null ? a.getOperator().getId() : null);
                    return ar;
                }).collect(Collectors.toList());
                
        response.setAssignments(assignResps);
        return response;
    }
}
