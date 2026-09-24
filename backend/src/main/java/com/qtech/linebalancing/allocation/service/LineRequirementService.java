package com.qtech.linebalancing.allocation.service;

import com.qtech.linebalancing.allocation.dto.LineRequirementDTO;
import com.qtech.linebalancing.allocation.dto.PlanningContextDTO;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.linebalance.entity.BalanceWorkstation;
import com.qtech.linebalancing.linebalance.repository.BalanceWorkstationRepository;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.linedesign.entity.LineDesignMachine;
import com.qtech.linebalancing.linedesign.repository.LineDesignRepository;
import com.qtech.linebalancing.machine.entity.Machine;
import com.qtech.linebalancing.machine.repository.MachineRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
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

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LineRequirementService {

    private final SewingLineRepository sewingLineRepository;
    private final OrderRepository orderRepository;
    private final OperationBulletinRepository bulletinRepository;
    private final LineDesignRepository lineDesignRepository;
    private final BalanceWorkstationRepository balanceWorkstationRepository;
    private final ShiftRepository shiftRepository;
    private final MachineRepository machineRepository;

    public PlanningContextDTO.Response getPlanningContext(LocalDate date, Long shiftId, List<Long> lineIds) {
        LocalDate planningDate = date != null ? date : LocalDate.now();
        List<Shift> shifts = shiftRepository.findByActiveOrderByShiftCodeAsc(true);
        Shift selectedShift = null;
        if (shiftId != null) {
            selectedShift = shiftRepository.findById(shiftId).orElse(null);
        }
        if (selectedShift == null && !shifts.isEmpty()) {
            selectedShift = shifts.get(0);
        }

        List<SewingLine> allLines = new ArrayList<>(sewingLineRepository.findByActive(true));
        allLines.sort(Comparator.comparing(SewingLine::getLineCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));

        List<Order> activeOrders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<Machine> machines = machineRepository.findByActive(true);
        List<OperationBulletin> allBulletins = bulletinRepository.findAllByOrderByCreatedAtDesc();

        int totalTargetHourly = 0;
        int totalDesignedManpower = 0;
        List<PlanningContextDTO.LineSummaryItem> lineSummaries = new ArrayList<>();

        for (SewingLine line : allLines) {
            // Find latest line design or active order for this line
            List<LineDesign> designs = lineDesignRepository.findByLineId(line.getId());
            LineDesign design = designs.stream().findFirst().orElse(null);

            Order lineOrder = design != null ? design.getOrder() : null;
            if (lineOrder == null && !activeOrders.isEmpty()) {
                lineOrder = activeOrders.get((int) (line.getId() % activeOrders.size()));
            }

            OperationBulletin bulletin = null;
            if (line.getCurrentBulletin() != null) {
                bulletin = allBulletins.stream().filter(b -> b.getBulletinCode().equalsIgnoreCase(line.getCurrentBulletin())).findFirst().orElse(null);
            }
            if (bulletin == null && design != null) {
                bulletin = design.getBulletin();
            }
            if (bulletin == null && lineOrder != null && lineOrder.getStyle() != null) {
                final Long sId = lineOrder.getStyle().getId();
                bulletin = allBulletins.stream().filter(b -> b.getStyles() != null && b.getStyles().stream().anyMatch(s -> s.getId().equals(sId))).findFirst().orElse(null);
            }

            int targetHourly = design != null ? design.getTargetHourlyOutput() : (line.getTargetEfficiencyPercent() != null ? (int) Math.round(line.getTargetEfficiencyPercent().doubleValue() * 0.9) : 70);
            double eff = design != null ? design.getPlannedEfficiency() : (line.getTargetEfficiencyPercent() != null ? line.getTargetEfficiencyPercent().doubleValue() : 80.0);
            int manpower = design != null ? design.getTotalOperators() : (line.getOperatorCount() > 0 ? line.getOperatorCount() : 10);

            boolean isIncludedInTotals = (lineIds == null || lineIds.isEmpty() || lineIds.contains(line.getId()));
            if (isIncludedInTotals) {
                totalTargetHourly += targetHourly;
                totalDesignedManpower += manpower;
            }

            lineSummaries.add(PlanningContextDTO.LineSummaryItem.builder()
                    .lineId(line.getId())
                    .lineCode(line.getLineCode())
                    .lineName(line.getLineName())
                    .lineType(line.getLineType())
                    .currentStyle(line.getCurrentStyle())
                    .currentBulletin(bulletin != null ? bulletin.getBulletinCode() : line.getCurrentBulletin())
                    .orderId(lineOrder != null ? lineOrder.getId() : null)
                    .orderNo(lineOrder != null ? lineOrder.getOrderNo() : "N/A")
                    .bulletinId(bulletin != null ? bulletin.getId() : null)
                    .bulletinCode(bulletin != null ? bulletin.getBulletinCode() : "N/A")
                    .revisionNumber(bulletin != null ? bulletin.getRevisionNumber() : 1)
                    .targetHourlyOutput(targetHourly)
                    .plannedEfficiency(eff)
                    .designedManpower(manpower)
                    .machineCount(line.getMachineCount())
                    .lineDesignId(design != null ? design.getId() : null)
                    .designCode(design != null ? design.getDesignCode() : null)
                    .build());
        }

        List<PlanningContextDTO.OrderSummaryItem> orderSummaries = activeOrders.stream().map(o -> {
            OperationBulletin b = null;
            if (o.getStyle() != null) {
                final Long sId = o.getStyle().getId();
                b = allBulletins.stream().filter(bu -> bu.getStyles() != null && bu.getStyles().stream().anyMatch(st -> st.getId().equals(sId))).findFirst().orElse(null);
            }
            return PlanningContextDTO.OrderSummaryItem.builder()
                    .orderId(o.getId())
                    .orderNo(o.getOrderNo())
                    .styleNo(o.getStyle() != null ? o.getStyle().getStyleNo() : "N/A")
                    .customerName(o.getBuyer() != null ? o.getBuyer() : "Universal Apparel")
                    .orderQuantity(o.getTotalQuantity())
                    .bulletinId(b != null ? b.getId() : null)
                    .bulletinCode(b != null ? b.getBulletinCode() : "N/A")
                    .bulletinRevision(b != null ? b.getRevisionNumber() : 1)
                    .build();
        }).toList();

        int availMachines = machines.stream().mapToInt(Machine::getQuantity).sum();

        int shiftHours = 8;
        if (selectedShift != null && selectedShift.getStartTime() != null && selectedShift.getEndTime() != null) {
            int dur = selectedShift.getEndTime().getHour() - selectedShift.getStartTime().getHour();
            if (dur <= 0) dur += 24;
            shiftHours = dur;
        }

        return PlanningContextDTO.Response.builder()
                .plantLocation("Unit 1 - Main Apparel Complex")
                .planningDate(planningDate)
                .shiftId(selectedShift != null ? selectedShift.getId() : null)
                .shiftName(selectedShift != null ? selectedShift.getShiftName() : "Shift 1 (General Morning)")
                .shiftWorkingHours(shiftHours)
                .selectedLines(lineSummaries)
                .activeOrders(orderSummaries)
                .totalTargetHourlyOutput(totalTargetHourly)
                .totalDesignedManpower(totalDesignedManpower)
                .totalAvailableOperators(50) // Baseline pool
                .totalPresentOperators(46)
                .totalAbsentOperators(4)
                .totalAvailableMachines(availMachines)
                .totalRequiredMachines(lineSummaries.stream().mapToInt(PlanningContextDTO.LineSummaryItem::getMachineCount).sum())
                .build();
    }

    public List<LineRequirementDTO> getLineRequirements(List<Long> lineIds) {
        List<SewingLine> lines;
        if (lineIds != null && !lineIds.isEmpty()) {
            lines = new ArrayList<>(sewingLineRepository.findAllById(lineIds));
        } else {
            lines = new ArrayList<>(sewingLineRepository.findByActive(true));
        }
        lines.sort(Comparator.comparing(SewingLine::getLineCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));

        List<LineRequirementDTO> results = new ArrayList<>();
        List<Order> activeOrders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<OperationBulletin> allBulletins = bulletinRepository.findAllByOrderByCreatedAtDesc();

        for (SewingLine line : lines) {
            List<LineDesign> designs = lineDesignRepository.findByLineId(line.getId());
            LineDesign design = designs.stream().findFirst().orElse(null);

            Order order = design != null ? design.getOrder() : null;
            if (order == null && !activeOrders.isEmpty()) {
                order = activeOrders.get((int) (line.getId() % activeOrders.size()));
            }

            OperationBulletin bulletin = null;
            if (line.getCurrentBulletin() != null) {
                bulletin = allBulletins.stream().filter(b -> b.getBulletinCode().equalsIgnoreCase(line.getCurrentBulletin())).findFirst().orElse(null);
            }
            if (bulletin == null && design != null) {
                bulletin = design.getBulletin();
            }
            if (bulletin == null && order != null && order.getStyle() != null) {
                final Long sId = order.getStyle().getId();
                bulletin = allBulletins.stream().filter(bu -> bu.getStyles() != null && bu.getStyles().stream().anyMatch(st -> st.getId().equals(sId))).findFirst().orElse(null);
            }

            int targetHourly = design != null ? design.getTargetHourlyOutput() : (line.getTargetEfficiencyPercent() != null ? (int) Math.round(line.getTargetEfficiencyPercent().doubleValue() * 0.9) : 70);
            double eff = design != null ? design.getPlannedEfficiency() : (line.getTargetEfficiencyPercent() != null ? line.getTargetEfficiencyPercent().doubleValue() : 80.0);
            double takt = targetHourly > 0 ? (3600.0 / targetHourly) : 51.4;
            double reqCap = eff > 0 ? (targetHourly / (eff / 100.0)) : targetHourly;
            double pitch = reqCap > 0 ? (3600.0 / reqCap) : 41.1;

            List<LineRequirementDTO.StationRequirementItem> stationItems = new ArrayList<>();
            List<LineRequirementDTO.MachineRequirementItem> machineItems = new ArrayList<>();
            String bottleneckStation = "S04";

            if (design != null) {
                List<BalanceWorkstation> workstations = balanceWorkstationRepository.findByLineDesignIdOrderByStationIndexAsc(design.getId());
                if (!workstations.isEmpty()) {
                    for (BalanceWorkstation ws : workstations) {
                        if (ws.getIsBottleneck()) {
                            bottleneckStation = ws.getStationCode();
                        }
                        if (ws.getOperations() != null && !ws.getOperations().isEmpty()) {
                            for (var op : ws.getOperations()) {
                                stationItems.add(LineRequirementDTO.StationRequirementItem.builder()
                                        .stationIndex(ws.getStationIndex())
                                        .stationCode(ws.getStationCode())
                                        .operationId(op.getOperation().getId())
                                        .operationCode(op.getOperation().getOperationCode())
                                        .operationName(op.getOperation().getName())
                                        .section(op.getBulletinLine() != null ? op.getBulletinLine().getSection() : "MAIN_ASSEMBLY")
                                        .operationSmv(op.getOperationSmv())
                                        .requiredMachineType(op.getMachineType() != null ? op.getMachineType() : ws.getPrimaryMachineType())
                                        .requiredSkillLevel(op.getBulletinLine() != null && op.getBulletinLine().getSkillRatingRequired() != null ? op.getBulletinLine().getSkillRatingRequired() : 3)
                                        .isParallelizable(op.getBulletinLine() != null ? op.getBulletinLine().getIsParallelizable() : true)
                                        .splitAllowed(op.getIsSplit())
                                        .designedCycleTimeSecs(ws.getEffectiveTimeSecs())
                                        .build());
                            }
                        } else {
                            stationItems.add(LineRequirementDTO.StationRequirementItem.builder()
                                    .stationIndex(ws.getStationIndex())
                                    .stationCode(ws.getStationCode())
                                    .operationId(1L)
                                    .operationCode("OP-GEN")
                                    .operationName("General Assembly")
                                    .section("MAIN_ASSEMBLY")
                                    .operationSmv(0.65)
                                    .requiredMachineType(ws.getPrimaryMachineType())
                                    .requiredSkillLevel(3)
                                    .isParallelizable(true)
                                    .splitAllowed(false)
                                    .designedCycleTimeSecs(ws.getEffectiveTimeSecs())
                                    .build());
                        }
                    }

                    if (design.getMachines() != null) {
                        for (LineDesignMachine m : design.getMachines()) {
                            machineItems.add(LineRequirementDTO.MachineRequirementItem.builder()
                                    .machineType(m.getMachineType())
                                    .requiredQty(m.getRequiredQty())
                                    .availableQty(m.getAvailableQty())
                                    .shortageQty(Math.max(0, m.getRequiredQty() - m.getAvailableQty()))
                                    .build());
                        }
                    }
                }
            }
            
            if (stationItems.isEmpty() && bulletin != null && bulletin.getLines() != null && !bulletin.getLines().isEmpty()) {
                int stIdx = 1;
                for (BulletinLine bl : bulletin.getLines()) {
                    stationItems.add(LineRequirementDTO.StationRequirementItem.builder()
                            .stationIndex(stIdx)
                            .stationCode("S" + String.format("%02d", stIdx++))
                            .operationId(bl.getOperation().getId())
                            .operationCode(bl.getOperation().getOperationCode())
                            .operationName(bl.getOperation().getName())
                            .section(bl.getSection() != null ? bl.getSection() : "MAIN_ASSEMBLY")
                            .operationSmv(bl.getSmv() != null ? bl.getSmv().doubleValue() : 0.45)
                            .requiredMachineType(bl.getMachineType() != null ? bl.getMachineType() : "Single Needle Lockstitch")
                            .requiredSkillLevel(bl.getSkillRatingRequired() != null ? bl.getSkillRatingRequired() : 3)
                            .isParallelizable(bl.getIsParallelizable() != null ? bl.getIsParallelizable() : true)
                            .splitAllowed(bl.getSplitAllowed() != null ? bl.getSplitAllowed() : false)
                            .designedCycleTimeSecs((bl.getSmv() != null ? bl.getSmv().doubleValue() : 0.45) * 60.0)
                            .build());
                }
            }

            double totalSmv = stationItems.stream().mapToDouble(s -> s.getOperationSmv() != null ? s.getOperationSmv() : 0.0).sum();

            results.add(LineRequirementDTO.builder()
                    .lineId(line.getId())
                    .lineCode(line.getLineCode())
                    .lineName(line.getLineName())
                    .lineType(line.getLineType())
                    .orderId(order != null ? order.getId() : null)
                    .orderNo(order != null ? order.getOrderNo() : "ORD-GEN")
                    .styleNo(order != null && order.getStyle() != null ? order.getStyle().getStyleNo() : "STYLE-GEN")
                    .bulletinId(bulletin != null ? bulletin.getId() : null)
                    .bulletinCode(bulletin != null ? bulletin.getBulletinCode() : "OB-GEN")
                    .bulletinRevision(bulletin != null ? bulletin.getRevisionNumber() : 1)
                    .targetPiecesPerHour(targetHourly)
                    .customerTaktSecs(takt)
                    .designedPitchSecs(pitch)
                    .designedManpower(design != null ? design.getTotalOperators() : line.getOperatorCount())
                    .plannedLineEfficiency(eff)
                    .totalSmvMinutes(totalSmv)
                    .workstationCount(stationItems.isEmpty() ? line.getWorkstationCount() : stationItems.size())
                    .stations(stationItems)
                    .machines(machineItems)
                    .currentBottleneckStation(bottleneckStation)
                    .status("READY")
                    .build());
        }

        return results;
    }
}
