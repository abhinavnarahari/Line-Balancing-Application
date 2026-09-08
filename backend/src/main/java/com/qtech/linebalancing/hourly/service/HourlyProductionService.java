package com.qtech.linebalancing.hourly.service;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.hourly.dto.HourlyBoardResponse;
import com.qtech.linebalancing.hourly.dto.HourlyBoardResponse.HourCell;
import com.qtech.linebalancing.hourly.dto.HourlyBoardResponse.OperationRow;
import com.qtech.linebalancing.hourly.dto.HourlyEntryRequest;
import com.qtech.linebalancing.hourly.entity.HourlyProductionEntry;
import com.qtech.linebalancing.hourly.repository.HourlyProductionEntryRepository;
import com.qtech.linebalancing.lineplan.entity.LinePlan;
import com.qtech.linebalancing.lineplan.entity.LinePlanAssignment;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HourlyProductionService {

    private final LinePlanRepository linePlanRepository;
    private final HourlyProductionEntryRepository entryRepository;
    private final OperatorRepository operatorRepository;
    private final OperationRepository operationRepository;
    private final OrderRepository orderRepository;
    private final ShiftRepository shiftRepository;
    private final OperationBulletinRepository bulletinRepository;

    /**
     * Build the full operation x hour board for a given line plan or order and date.
     * If no LinePlan exists for the order, it auto-initializes one from the bulletin/operations
     * so the manager never encounters an empty or blocked board.
     */
    @Transactional
    public HourlyBoardResponse buildBoard(Long linePlanId, Long orderId, Long shiftId, LocalDate date) {
        LinePlan plan = resolveOrInitLinePlan(linePlanId, orderId, shiftId);

        LocalDate effectiveDate = date != null ? date : LocalDate.now();

        // All existing entries for this date
        List<HourlyProductionEntry> entries = entryRepository.findByLinePlanIdAndLogDate(plan.getId(), effectiveDate);

        // Index entries: (operationId, operatorId, shiftHour) -> entry
        Map<String, HourlyProductionEntry> entryMap = new HashMap<>();
        for (HourlyProductionEntry e : entries) {
            String key = e.getOperation().getId() + "_" + e.getOperator().getId() + "_" + e.getShiftHour();
            entryMap.put(key, e);
        }

        // Determine shift hours from the plan's shift
        String shiftStart = plan.getShift().getStartTime().toString();
        String shiftEnd   = plan.getShift().getEndTime().toString();
        List<String[]> hourSlots = buildHourSlots(shiftStart, shiftEnd);
        int totalHours = hourSlots.size();

        // Build rows from line plan assignments
        List<OperationRow> rows = new ArrayList<>();
        for (LinePlanAssignment assignment : plan.getAssignments()) {
            Operation op = assignment.getOperation();
            Operator operator = assignment.getOperator();

            BigDecimal sam = op.getStandardSmv();
            if (sam == null && assignment.getBulletinLine() != null && assignment.getBulletinLine().getSmv() != null) {
                sam = assignment.getBulletinLine().getSmv();
            }
            if (sam == null) sam = new BigDecimal("0.35");

            int hourlyTarget = sam.compareTo(BigDecimal.ZERO) > 0
                    ? (int) Math.floor(60.0 / sam.doubleValue())
                    : 0;

            Map<Integer, HourCell> hours = new LinkedHashMap<>();
            int totalActual = 0, totalGood = 0, totalReject = 0;

            for (int h = 0; h < hourSlots.size(); h++) {
                int slot = h + 1;
                String[] times = hourSlots.get(h);
                String key = operator != null ? (op.getId() + "_" + operator.getId() + "_" + slot) : "";
                HourlyProductionEntry entry = (!key.isEmpty()) ? entryMap.get(key) : null;

                HourCell cell = new HourCell();
                cell.setShiftHour(slot);
                cell.setStartTime(times[0]);
                cell.setEndTime(times[1]);
                cell.setTargetQty(hourlyTarget);

                if (entry != null) {
                    cell.setEntryId(entry.getId());
                    cell.setActualQty(entry.getActualQty());
                    cell.setGoodQty(entry.getGoodQty());
                    cell.setRejectQty(entry.getRejectQty());
                    double eff = hourlyTarget > 0
                            ? Math.round((entry.getActualQty() * 100.0 / hourlyTarget) * 10.0) / 10.0
                            : 0.0;
                    cell.setEfficiencyPercent(eff);
                    cell.setStatus(deriveStatus(eff));
                    totalActual += entry.getActualQty();
                    totalGood   += entry.getGoodQty();
                    totalReject += entry.getRejectQty();
                } else {
                    cell.setStatus("empty");
                }
                hours.put(slot, cell);
            }

            int totalTarget = hourlyTarget * totalHours;
            double rowEff = totalTarget > 0
                    ? Math.round((totalActual * 100.0 / totalTarget) * 10.0) / 10.0
                    : 0.0;

            OperationRow row = new OperationRow();
            row.setOperationId(op.getId());
            row.setOperationCode(op.getOperationCode());
            row.setOperationName(op.getName());
            row.setSequence(assignment.getBulletinLine() != null ? assignment.getBulletinLine().getSequence() : (op.getSequence() != null ? op.getSequence() : 0));
            row.setSamMinutes(sam);
            row.setHourlyTarget(hourlyTarget);

            if (operator != null) {
                row.setOperatorId(operator.getId());
                row.setOperatorEmployeeId(operator.getEmployeeId());
                row.setOperatorName(operator.getName());
            }

            row.setTotalActual(totalActual);
            row.setTotalGood(totalGood);
            row.setTotalReject(totalReject);
            row.setTotalTarget(totalTarget);
            row.setEfficiencyPercent(rowEff);
            row.setHours(hours);
            rows.add(row);
        }

        rows.sort(Comparator.comparingInt(OperationRow::getSequence));

        // Line-level KPIs
        int totalActualAll = rows.stream().mapToInt(OperationRow::getTotalActual).sum();
        int totalTargetAll = rows.stream().mapToInt(OperationRow::getTotalTarget).sum();
        double lineEff = totalTargetAll > 0
                ? Math.round((totalActualAll * 100.0 / totalTargetAll) * 10.0) / 10.0
                : 0.0;
        long onTarget = rows.stream().filter(r -> r.getTotalActual() >= r.getTotalTarget() && r.getTotalTarget() > 0).count();
        long behind   = rows.stream().filter(r -> r.getTotalActual() < r.getTotalTarget()).count();

        HourlyBoardResponse resp = new HourlyBoardResponse();
        resp.setLinePlanId(plan.getId());
        resp.setOrderNo(plan.getOrder().getOrderNo());
        resp.setShiftName(plan.getShift().getShiftName());
        resp.setLogDate(effectiveDate.toString());
        resp.setTotalShiftHours(totalHours);
        resp.setShiftStartTime(shiftStart.length() > 5 ? shiftStart.substring(0, 5) : shiftStart);
        resp.setShiftEndTime(shiftEnd.length() > 5 ? shiftEnd.substring(0, 5) : shiftEnd);
        resp.setLineEfficiencyPercent(lineEff);
        resp.setTotalActualOutput(totalActualAll);
        resp.setTotalTargetOutput(totalTargetAll);
        resp.setOperationsOnTarget(onTarget);
        resp.setOperationsBehind(behind);
        resp.setRows(rows);
        return resp;
    }

    /**
     * Resolves an existing LinePlan or auto-creates one with active operations & operators.
     */
    @Transactional
    public LinePlan resolveOrInitLinePlan(Long linePlanId, Long orderId, Long shiftId) {
        if (linePlanId != null) {
            return linePlanRepository.findById(linePlanId)
                    .orElseThrow(() -> new ResourceNotFoundException("LinePlan", "id", linePlanId));
        }

        final Long targetOrderId;
        if (orderId == null) {
            // Find first available order
            List<Order> orders = orderRepository.findAll();
            if (orders.isEmpty()) {
                throw new ResourceNotFoundException("No orders available to create line plan");
            }
            targetOrderId = orders.get(0).getId();
        } else {
            targetOrderId = orderId;
        }

        Order order = orderRepository.findById(targetOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", targetOrderId));

        Optional<LinePlan> existingOpt = linePlanRepository.findByOrderId(targetOrderId);
        if (existingOpt.isPresent() && !existingOpt.get().getAssignments().isEmpty()) {
            LinePlan plan = existingOpt.get();
            if (shiftId != null && !plan.getShift().getId().equals(shiftId)) {
                Shift newShift = shiftRepository.findById(shiftId)
                        .orElse(plan.getShift());
                plan.setShift(newShift);
                return linePlanRepository.save(plan);
            }
            return plan;
        }

        Shift shift = (shiftId != null)
                ? shiftRepository.findById(shiftId).orElse(null)
                : null;
        if (shift == null) {
            List<Shift> shifts = shiftRepository.findByActiveOrderByShiftCodeAsc(true);
            shift = !shifts.isEmpty() ? shifts.get(0) : shiftRepository.findAll().get(0);
        }

        LinePlan plan = existingOpt.orElse(new LinePlan());
        plan.setOrder(order);
        plan.setShift(shift);
        plan.setTargetOutput(order.getTotalQuantity() != null && order.getTotalQuantity() > 0 ? order.getTotalQuantity() : 100);
        plan.setAllowance(10);
        plan.setStatus("active");

        List<Operator> activeOperators = operatorRepository.findByActiveOrderByNameAsc(true);

        // 1. Try to populate from Order style's Operation Bulletin
        List<BulletinLine> bLines = findBulletinLinesForOrder(order);
        if (!bLines.isEmpty()) {
            int opIdx = 0;
            for (BulletinLine bl : bLines) {
                Operator op = (!activeOperators.isEmpty()) ? activeOperators.get(opIdx % activeOperators.size()) : null;
                LinePlanAssignment assign = LinePlanAssignment.builder()
                        .linePlan(plan)
                        .bulletinLine(bl)
                        .operation(bl.getOperation())
                        .operator(op)
                        .build();
                plan.addAssignment(assign);
                opIdx++;
            }
        } else {
            // 2. Fallback to Operation Master
            List<Operation> operations = operationRepository.findByActiveOrderBySequenceAsc(true);
            if (operations.isEmpty()) {
                operations = operationRepository.findAll();
            }
            int opIdx = 0;
            for (Operation opItem : operations) {
                Operator op = (!activeOperators.isEmpty()) ? activeOperators.get(opIdx % activeOperators.size()) : null;
                LinePlanAssignment assign = LinePlanAssignment.builder()
                        .linePlan(plan)
                        .operation(opItem)
                        .operator(op)
                        .build();
                plan.addAssignment(assign);
                opIdx++;
            }
        }

        return linePlanRepository.save(plan);
    }

    private List<BulletinLine> findBulletinLinesForOrder(Order order) {
        if (order.getStyle() == null) return Collections.emptyList();
        List<OperationBulletin> bulletins = bulletinRepository.findAll();
        for (OperationBulletin b : bulletins) {
            if (b.getStyles() != null && b.getStyles().contains(order.getStyle()) && !b.getLines().isEmpty()) {
                return b.getLines();
            }
        }
        if (!bulletins.isEmpty() && !bulletins.get(0).getLines().isEmpty()) {
            return bulletins.get(0).getLines();
        }
        return Collections.emptyList();
    }

    /**
     * Assign or reassign an operator to a specific operation on this line board.
     */
    @Transactional
    public void assignOperator(Long linePlanId, Long operationId, Long operatorId) {
        LinePlan plan = linePlanRepository.findById(linePlanId)
                .orElseThrow(() -> new ResourceNotFoundException("LinePlan", "id", linePlanId));
        Operator operator = (operatorId != null && operatorId > 0)
                ? operatorRepository.findById(operatorId).orElse(null)
                : null;

        boolean found = false;
        for (LinePlanAssignment assign : plan.getAssignments()) {
            if (assign.getOperation().getId().equals(operationId)) {
                assign.setOperator(operator);
                found = true;
                break;
            }
        }

        if (!found) {
            Operation op = operationRepository.findById(operationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", operationId));
            LinePlanAssignment assign = LinePlanAssignment.builder()
                    .linePlan(plan)
                    .operation(op)
                    .operator(operator)
                    .build();
            plan.addAssignment(assign);
        }

        linePlanRepository.save(plan);
    }

    /** Upsert a single hourly cell entry. */
    @Transactional
    public HourlyBoardResponse.HourCell saveEntry(HourlyEntryRequest req) {
        LinePlan plan = linePlanRepository.findById(req.getLinePlanId())
                .orElseThrow(() -> new ResourceNotFoundException("LinePlan", "id", req.getLinePlanId()));
        Operation op = operationRepository.findById(req.getOperationId())
                .orElseThrow(() -> new ResourceNotFoundException("Operation", "id", req.getOperationId()));
        Operator operator = operatorRepository.findById(req.getOperatorId())
                .orElseThrow(() -> new ResourceNotFoundException("Operator", "id", req.getOperatorId()));

        HourlyProductionEntry entry = entryRepository
                .findByKey(req.getLinePlanId(), req.getOperationId(), req.getOperatorId(),
                           req.getLogDate(), req.getShiftHour())
                .orElse(HourlyProductionEntry.builder()
                        .linePlan(plan)
                        .operation(op)
                        .operator(operator)
                        .build());

        entry.setLogDate(req.getLogDate());
        entry.setShiftHour(req.getShiftHour());
        if (req.getHourStartTime() != null && !req.getHourStartTime().isBlank())
            entry.setHourStartTime(LocalTime.parse(req.getHourStartTime().length() > 5 ? req.getHourStartTime().substring(0, 5) : req.getHourStartTime()));
        if (req.getHourEndTime() != null && !req.getHourEndTime().isBlank())
            entry.setHourEndTime(LocalTime.parse(req.getHourEndTime().length() > 5 ? req.getHourEndTime().substring(0, 5) : req.getHourEndTime()));
        entry.setTargetQty(req.getTargetQty() != null ? req.getTargetQty() : 0);
        entry.setActualQty(req.getActualQty() != null ? req.getActualQty() : 0);
        entry.setGoodQty(req.getGoodQty() != null ? req.getGoodQty() : 0);
        entry.setRejectQty(req.getRejectQty() != null ? req.getRejectQty() : 0);
        if (req.getSamMinutes() != null) entry.setSamMinutes(req.getSamMinutes());
        entry.setNotes(req.getNotes());

        HourlyProductionEntry saved = entryRepository.save(entry);

        int target = req.getTargetQty() != null ? req.getTargetQty() : 0;
        double eff = target > 0 ? Math.round((saved.getActualQty() * 100.0 / target) * 10.0) / 10.0 : 0.0;

        HourlyBoardResponse.HourCell cell = new HourlyBoardResponse.HourCell();
        cell.setEntryId(saved.getId());
        cell.setShiftHour(saved.getShiftHour());
        cell.setStartTime(req.getHourStartTime());
        cell.setEndTime(req.getHourEndTime());
        cell.setTargetQty(target);
        cell.setActualQty(saved.getActualQty());
        cell.setGoodQty(saved.getGoodQty());
        cell.setRejectQty(saved.getRejectQty());
        cell.setEfficiencyPercent(eff);
        cell.setStatus(deriveStatus(eff));
        return cell;
    }

    /** Bulk save multiple cells at once. */
    @Transactional
    public int bulkSave(List<HourlyEntryRequest> requests) {
        int saved = 0;
        for (HourlyEntryRequest req : requests) {
            saveEntry(req);
            saved++;
        }
        return saved;
    }

    // ---- helpers ----

    private String deriveStatus(double eff) {
        if (eff <= 0)  return "empty";
        if (eff >= 90) return "on_target";
        if (eff >= 75) return "warning";
        if (eff >= 50) return "behind";
        return "critical";
    }

    /**
     * Build list of [startTime, endTime] strings for each hour slot in the shift.
     */
    private List<String[]> buildHourSlots(String startStr, String endStr) {
        LocalTime start = LocalTime.parse(startStr.length() > 5 ? startStr.substring(0, 5) : startStr);
        LocalTime end   = LocalTime.parse(endStr.length()   > 5 ? endStr.substring(0, 5)   : endStr);
        List<String[]> slots = new ArrayList<>();
        LocalTime cur = start;
        int maxHours = 12;
        int count = 0;
        while (count < maxHours) {
            LocalTime next = cur.plusHours(1);
            slots.add(new String[]{
                    cur.format(DateTimeFormatter.ofPattern("HH:mm")),
                    next.format(DateTimeFormatter.ofPattern("HH:mm"))
            });
            cur = next;
            count++;
            if (!start.isAfter(end)) {
                if (!cur.isBefore(end)) break;
            } else {
                if (cur.equals(end) || (cur.compareTo(start) < 0 && !cur.isBefore(end))) break;
            }
        }
        return slots;
    }
}