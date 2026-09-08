package com.qtech.linebalancing.production.service;

import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.production.dto.OperatorTimesheet24hResponse;
import com.qtech.linebalancing.production.dto.PieceProductionLogRequest;
import com.qtech.linebalancing.production.dto.PieceProductionLogResponse;
import com.qtech.linebalancing.production.entity.PieceProductionLog;
import com.qtech.linebalancing.production.repository.PieceProductionLogRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class PieceProductionService {

    private final PieceProductionLogRepository pieceLogRepository;
    private final OperatorRepository operatorRepository;
    private final OperationRepository operationRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public PieceProductionLogResponse updatePieceLog(Long id, PieceProductionLogRequest request) {
        PieceProductionLog entity = pieceLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PieceProductionLog", "id", id));

        if (request.getOperatorId() != null) {
            Operator operator = operatorRepository.findById(request.getOperatorId())
                    .orElseThrow(() -> new IllegalArgumentException("Operator not found with ID: " + request.getOperatorId()));
            entity.setOperator(operator);
        }

        if (request.getOperationId() != null) {
            Operation operation = operationRepository.findById(request.getOperationId()).orElse(null);
            entity.setOperation(operation);
        }

        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId()).orElse(null);
            entity.setOrder(order);
        }

        LocalTime start = request.getStartTime() != null ? request.getStartTime() : entity.getStartTime();
        LocalTime end = request.getEndTime() != null ? request.getEndTime() : entity.getEndTime();
        BigDecimal actualMins = calculateMinutes(start, end);

        BigDecimal sam = request.getSamMinutes();
        if (sam == null || sam.compareTo(BigDecimal.ZERO) <= 0) {
            sam = entity.getSamMinutes() != null ? entity.getSamMinutes() : new BigDecimal("0.35");
        }

        int target = request.getTargetQty() != null ? request.getTargetQty() : entity.getTargetQty();
        int completed = request.getCompletedQty() != null ? request.getCompletedQty() : entity.getCompletedQty();
        int good = request.getGoodQty() != null ? request.getGoodQty() : completed;
        int reject = request.getRejectQty() != null ? request.getRejectQty() : Math.max(0, completed - good);

        String opName = request.getOperationName();
        if ((opName == null || opName.isBlank()) && entity.getOperation() != null) {
            opName = entity.getOperation().getName();
        }

        LocalDate logDate = request.getLogDate() != null ? request.getLogDate() : entity.getLogDate();
        int hourSlot = start.getHour();

        entity.setTargetQty(target);
        entity.setCompletedQty(completed);
        entity.setGoodQty(good);
        entity.setRejectQty(reject);
        entity.setStartTime(start);
        entity.setEndTime(end);
        entity.setActualTimeMinutes(actualMins);
        entity.setSamMinutes(sam);
        entity.setOperationName(opName);
        if (request.getMachineCode() != null) entity.setMachineCode(request.getMachineCode());
        entity.setLogDate(logDate);
        entity.setHourSlot(hourSlot);
        if (request.getNotes() != null) entity.setNotes(request.getNotes());

        PieceProductionLog saved = pieceLogRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public PieceProductionLogResponse recordPieceLog(PieceProductionLogRequest request) {
        Operator operator = operatorRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new IllegalArgumentException("Operator not found with ID: " + request.getOperatorId()));

        Operation operation = null;
        if (request.getOperationId() != null) {
            operation = operationRepository.findById(request.getOperationId()).orElse(null);
        }

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId()).orElse(null);
        }

        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();
        BigDecimal actualMins = calculateMinutes(start, end);

        BigDecimal sam = request.getSamMinutes();
        if (sam == null || sam.compareTo(BigDecimal.ZERO) <= 0) {
            sam = new BigDecimal("0.35");
        }

        int target = request.getTargetQty() != null ? request.getTargetQty() : 0;
        int completed = request.getCompletedQty() != null ? request.getCompletedQty() : 0;
        int good = request.getGoodQty() != null ? request.getGoodQty() : completed;
        int reject = request.getRejectQty() != null ? request.getRejectQty() : Math.max(0, completed - good);

        String opName = request.getOperationName();
        if ((opName == null || opName.isBlank()) && operation != null) {
            opName = operation.getName();
        }

        LocalDate logDate = request.getLogDate() != null ? request.getLogDate() : LocalDate.now();
        int hourSlot = start.getHour();

        PieceProductionLog entity = PieceProductionLog.builder()
                .operator(operator)
                .operation(operation)
                .operationName(opName)
                .order(order)
                .targetQty(target)
                .completedQty(completed)
                .goodQty(good)
                .rejectQty(reject)
                .startTime(start)
                .endTime(end)
                .actualTimeMinutes(actualMins)
                .samMinutes(sam)
                .machineCode(request.getMachineCode() != null ? request.getMachineCode() : "M-001")
                .logDate(logDate)
                .hourSlot(hourSlot)
                .notes(request.getNotes())
                .build();

        PieceProductionLog saved = pieceLogRepository.save(entity);
        return toResponse(saved);
    }

    public List<PieceProductionLogResponse> getLogsByDate(LocalDate date) {
        List<PieceProductionLog> logs = (date != null)
                ? pieceLogRepository.findAllWithDetailsByLogDate(date)
                : pieceLogRepository.findAllWithDetails();
        return logs.stream().map(this::toResponse).toList();
    }

    public List<PieceProductionLogResponse> getLogsByOrderId(Long orderId) {
        if (orderId == null) {
            return Collections.emptyList();
        }
        return pieceLogRepository.findAllWithDetailsByOrderId(orderId)
                .stream().map(this::toResponse).toList();
    }

    public List<OperatorTimesheet24hResponse> get24hTimesheet(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<PieceProductionLog> logs = pieceLogRepository.findAllWithDetailsByLogDate(targetDate);
        List<Operator> operators = operatorRepository.findByActiveOrderByNameAsc(true);

        Map<Long, List<PieceProductionLog>> logsByOperator = logs.stream()
                .collect(Collectors.groupingBy(l -> l.getOperator().getId()));

        List<OperatorTimesheet24hResponse> result = new ArrayList<>();

        for (Operator op : operators) {
            List<PieceProductionLog> opLogs = logsByOperator.getOrDefault(op.getId(), Collections.emptyList());
            Map<Integer, OperatorTimesheet24hResponse.HourlySlotSummary> slots = new HashMap<>();

            // Initialize all 24 slots (Hour 0 to Hour 23)
            for (int h = 0; h < 24; h++) {
                String nextH = String.format("%02d:00", (h + 1) % 24);
                String currH = String.format("%02d:00", h);
                slots.put(h, OperatorTimesheet24hResponse.HourlySlotSummary.builder()
                        .hour(h)
                        .timeLabel(currH + " - " + nextH)
                        .targetQty(0)
                        .completedQty(0)
                        .goodQty(0)
                        .rejectQty(0)
                        .workMinutes(BigDecimal.ZERO)
                        .earnedMinutes(BigDecimal.ZERO)
                        .efficiencyPercent(BigDecimal.ZERO)
                        .operations("")
                        .machines("")
                        .entryCount(0)
                        .build());
            }

            int grandTarget = 0;
            int grandCompleted = 0;
            int grandGood = 0;
            int grandReject = 0;
            BigDecimal grandWorkMins = BigDecimal.ZERO;
            BigDecimal grandEarnedMins = BigDecimal.ZERO;
            String primaryMachine = "";

            for (PieceProductionLog logItem : opLogs) {
                int slotHour = logItem.getHourSlot() != null ? logItem.getHourSlot() : logItem.getStartTime().getHour();
                OperatorTimesheet24hResponse.HourlySlotSummary slot = slots.get(slotHour);

                if (slot != null) {
                    slot.setTargetQty(slot.getTargetQty() + logItem.getTargetQty());
                    slot.setCompletedQty(slot.getCompletedQty() + logItem.getCompletedQty());
                    slot.setGoodQty(slot.getGoodQty() + logItem.getGoodQty());
                    slot.setRejectQty(slot.getRejectQty() + logItem.getRejectQty());

                    BigDecimal slotWork = slot.getWorkMinutes().add(logItem.getActualTimeMinutes());
                    slot.setWorkMinutes(slotWork);

                    BigDecimal itemEarned = BigDecimal.valueOf(logItem.getGoodQty()).multiply(logItem.getSamMinutes());
                    BigDecimal slotEarned = slot.getEarnedMinutes().add(itemEarned);
                    slot.setEarnedMinutes(slotEarned);

                    if (slotWork.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal eff = slotEarned.divide(slotWork, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
                        slot.setEfficiencyPercent(eff);
                    }

                    if (logItem.getOperationName() != null && !logItem.getOperationName().isBlank()) {
                        String existing = slot.getOperations();
                        slot.setOperations(existing.isEmpty() ? logItem.getOperationName() : existing + ", " + logItem.getOperationName());
                    }

                    if (logItem.getMachineCode() != null && !logItem.getMachineCode().isBlank()) {
                        String existing = slot.getMachines();
                        slot.setMachines(existing.isEmpty() ? logItem.getMachineCode() : existing + ", " + logItem.getMachineCode());
                        if (primaryMachine.isEmpty()) primaryMachine = logItem.getMachineCode();
                    }

                    slot.setEntryCount(slot.getEntryCount() + 1);
                }

                grandTarget += logItem.getTargetQty();
                grandCompleted += logItem.getCompletedQty();
                grandGood += logItem.getGoodQty();
                grandReject += logItem.getRejectQty();
                grandWorkMins = grandWorkMins.add(logItem.getActualTimeMinutes());
                grandEarnedMins = grandEarnedMins.add(BigDecimal.valueOf(logItem.getGoodQty()).multiply(logItem.getSamMinutes()));
            }

            BigDecimal grandEfficiency = BigDecimal.ZERO;
            if (grandWorkMins.compareTo(BigDecimal.ZERO) > 0) {
                grandEfficiency = grandEarnedMins.divide(grandWorkMins, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
            }

            BigDecimal grandDefectRate = BigDecimal.ZERO;
            if (grandCompleted > 0) {
                grandDefectRate = BigDecimal.valueOf(grandReject).divide(BigDecimal.valueOf(grandCompleted), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
            }

            result.add(OperatorTimesheet24hResponse.builder()
                    .operatorId(op.getId())
                    .employeeId(op.getEmployeeId())
                    .operatorName(op.getName())
                    .department(op.getDepartment() != null ? op.getDepartment() : "Sewing")
                    .machineCode(!primaryMachine.isEmpty() ? primaryMachine : "M-001")
                    .hourlySlots(slots)
                    .totalTarget(grandTarget)
                    .totalCompleted(grandCompleted)
                    .totalGood(grandGood)
                    .totalReject(grandReject)
                    .totalWorkMinutes(grandWorkMins.setScale(1, RoundingMode.HALF_UP))
                    .totalEarnedMinutes(grandEarnedMins.setScale(2, RoundingMode.HALF_UP))
                    .efficiencyPercent(grandEfficiency)
                    .defectRatePercent(grandDefectRate)
                    .rawLogs(opLogs.stream().map(this::toResponse).toList())
                    .build());
        }

        return result;
    }

    @Transactional
    public void deletePieceLog(Long id) {
        pieceLogRepository.deleteById(id);
    }

    private BigDecimal calculateMinutes(LocalTime start, LocalTime end) {
        if (start == null || end == null) return BigDecimal.ONE;
        long secs = Duration.between(start, end).getSeconds();
        if (secs < 0) {
            secs += 24 * 3600; // crossed midnight
        }
        double mins = Math.max(1.0, secs / 60.0);
        return BigDecimal.valueOf(mins).setScale(2, RoundingMode.HALF_UP);
    }

    private PieceProductionLogResponse toResponse(PieceProductionLog p) {
        BigDecimal earned = BigDecimal.valueOf(p.getGoodQty()).multiply(p.getSamMinutes()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal eff = BigDecimal.ZERO;
        if (p.getActualTimeMinutes().compareTo(BigDecimal.ZERO) > 0) {
            eff = earned.divide(p.getActualTimeMinutes(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
        }
        BigDecimal defect = BigDecimal.ZERO;
        if (p.getCompletedQty() > 0) {
            defect = BigDecimal.valueOf(p.getRejectQty()).divide(BigDecimal.valueOf(p.getCompletedQty()), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP);
        }

        return PieceProductionLogResponse.builder()
                .id(p.getId())
                .operatorId(p.getOperator().getId())
                .operatorEmployeeId(p.getOperator().getEmployeeId())
                .operatorName(p.getOperator().getName())
                .department(p.getOperator().getDepartment())
                .operationId(p.getOperation() != null ? p.getOperation().getId() : null)
                .operationCode(p.getOperation() != null ? p.getOperation().getOperationCode() : null)
                .operationName(p.getOperationName() != null ? p.getOperationName() : (p.getOperation() != null ? p.getOperation().getName() : ""))
                .orderId(p.getOrder() != null ? p.getOrder().getId() : null)
                .orderNo(p.getOrder() != null ? p.getOrder().getOrderNo() : null)
                .targetQty(p.getTargetQty())
                .completedQty(p.getCompletedQty())
                .goodQty(p.getGoodQty())
                .rejectQty(p.getRejectQty())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .actualTimeMinutes(p.getActualTimeMinutes())
                .samMinutes(p.getSamMinutes())
                .machineCode(p.getMachineCode())
                .logDate(p.getLogDate())
                .hourSlot(p.getHourSlot())
                .notes(p.getNotes())
                .earnedMinutes(earned)
                .efficiencyPercent(eff)
                .defectRatePercent(defect)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
