package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.Fmt;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.line.repository.SewingLineRepository;
import com.qtech.linebalancing.lineplan.entity.LinePlan;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.machine.entity.Machine;
import com.qtech.linebalancing.machine.repository.MachineRepository;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operation.repository.OperationRepository;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.BulletinLineRepository;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.skillmatrix.repository.SkillAssessmentRepository;
import com.qtech.linebalancing.style.entity.Style;
import com.qtech.linebalancing.style.repository.StyleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/** Operations, styles, lines, machines, shifts and the overall data overview. */
@Component
@RequiredArgsConstructor
public class MasterDataSkill implements Skill {

    private final OperationRepository operationRepository;
    private final BulletinLineRepository bulletinLineRepository;
    private final OperationBulletinRepository bulletinRepository;
    private final SkillAssessmentRepository skillRepository;
    private final StyleRepository styleRepository;
    private final OrderRepository orderRepository;
    private final SewingLineRepository lineRepository;
    private final LinePlanRepository linePlanRepository;
    private final MachineRepository machineRepository;
    private final ShiftRepository shiftRepository;
    private final OperatorRepository operatorRepository;

    @Override
    public Set<Intent> intents() {
        return EnumSet.of(Intent.OPERATION_DETAILS, Intent.OPERATION_LIST, Intent.STYLE_DETAILS, Intent.STYLE_LIST,
                Intent.LINE_DETAILS, Intent.LINE_LIST, Intent.MACHINE_INVENTORY, Intent.SHIFT_INFO, Intent.OVERVIEW);
    }

    @Override
    public Answer answer(AnalyzedQuestion q) {
        return switch (q.intent()) {
            case OPERATION_DETAILS -> operation(q);
            case OPERATION_LIST -> operations(q);
            case STYLE_DETAILS -> style(q);
            case STYLE_LIST -> styles(q);
            case LINE_DETAILS -> line(q);
            case LINE_LIST -> lines();
            case MACHINE_INVENTORY -> machines(q);
            case SHIFT_INFO -> shifts(q);
            default -> overview();
        };
    }

    private Answer operation(AnalyzedQuestion q) {
        Operation op = operationRepository.findById(q.first(EntityType.OPERATION).get().id()).orElseThrow();
        StringBuilder t = new StringBuilder("**" + op.getName() + " (" + op.getOperationCode() + ")**\n\n");
        t.append("- **Standard SMV:** ").append(Fmt.smv(op.getStandardSmv())).append("\n");
        t.append("- **Machine type:** ").append(Objects.toString(op.getMachineType(), "not set")).append("\n");
        t.append("- **Status:** ").append(op.isActive() ? "Active" : "Inactive").append("\n");
        if (op.getDescription() != null && !op.getDescription().isBlank()) t.append("- **Description:** ").append(op.getDescription()).append("\n");

        List<BulletinLine> usage = bulletinLineRepository.findByOperationId(op.getId());
        if (!usage.isEmpty()) {
            t.append("- **Used in bulletins:** ").append(usage.stream()
                    .map(bl -> bl.getBulletin().getBulletinCode() + " (seq " + bl.getSequence()
                            + (bl.getSmv() != null && op.getStandardSmv() != null && bl.getSmv().compareTo(op.getStandardSmv()) != 0
                            ? ", " + Fmt.dec(bl.getSmv().doubleValue(), 4) + " min in this bulletin" : "") + ")")
                    .distinct().collect(Collectors.joining(", "))).append("\n");
        }
        long skilled = skillRepository.findByOperationIdOrderByOperatorIdAscRevisionDesc(op.getId()).stream()
                .filter(s -> s.isCurrent() && s.getOperator().isActive() && s.getRating() != null && s.getRating() >= com.qtech.linebalancing.common.skill.SkillScale.INDEPENDENT).count();
        t.append("- **Operators who can run it independently (level 3–4):** ").append(skilled).append("\n");
        return Answer.of(t.toString(), List.of("Operations master", "Operation bulletins", "Skill matrix"),
                List.of("Who are the best operators for " + op.getName() + "?", "List all operations"));
    }

    private Answer operations(AnalyzedQuestion q) {
        List<Operation> ops = operationRepository.findByActiveOrderBySequenceAsc(true);
        String machine = q.first(EntityType.MACHINE_TYPE).map(r -> r.key()).orElse(null);
        if (machine != null) ops = ops.stream().filter(o -> machine.equalsIgnoreCase(o.getMachineType())).toList();
        if (ops.isEmpty()) return Answer.notAvailable("No active operations" + (machine != null ? " use the " + machine : "") + ".", List.of("List all operations"));
        double total = ops.stream().filter(o -> o.getStandardSmv() != null).mapToDouble(o -> o.getStandardSmv().doubleValue()).sum();
        List<List<Object>> rows = ops.stream().map(o -> List.<Object>of(o.getOperationCode(), o.getName(),
                o.getStandardSmv() != null ? Fmt.dec(o.getStandardSmv().doubleValue(), 4) : "—", Objects.toString(o.getMachineType(), "—"))).toList();
        String scope = machine != null ? " on " + machine : "";
        return Answer.of("There are **" + ops.size() + " active operations**" + scope + " (their standard SMVs add up to "
                        + Fmt.dec(total, 4) + " min; this is a catalog total, not a garment SMV — see the operation bulletin for that).",
                        List.of("Operations master"), List.of("What is the SMV of " + ops.get(0).getName() + "?"))
                .withPayload(Fmt.table("Operations" + scope, List.of("Code", "Operation", "SMV (min)", "Machine type"), rows));
    }

    private Answer style(AnalyzedQuestion q) {
        Style st = styleRepository.findById(q.first(EntityType.STYLE).get().id()).orElseThrow();
        StringBuilder t = new StringBuilder("**Style " + st.getStyleNo() + "**\n\n");
        t.append("- **Buyer:** ").append(Objects.toString(st.getBuyer(), "not set")).append("\n");
        if (st.getSeason() != null) t.append("- **Season:** ").append(st.getSeason()).append("\n");
        if (st.getProductType() != null) t.append("- **Product type:** ").append(st.getProductType()).append("\n");
        if (st.getDescription() != null && !st.getDescription().isBlank()) t.append("- **Description:** ").append(st.getDescription()).append("\n");
        t.append("- **Status:** ").append(st.isActive() ? "Active" : "Inactive").append("\n");
        List<OperationBulletin> bulletins = bulletinRepository.findAll().stream()
                .filter(b -> b.getStyles() != null && b.getStyles().stream().anyMatch(s -> s.getId().equals(st.getId()))).toList();
        t.append("- **Operation bulletins:** ").append(bulletins.isEmpty() ? "none linked" : bulletins.stream()
                .map(b -> b.getBulletinCode() + " rev " + b.getRevisionNumber() + " (" + Fmt.humanize(b.getStatus()) + ", total SMV "
                        + (b.getTotalSmv() != null ? Fmt.dec(b.getTotalSmv().doubleValue(), 4) + " min" : "not set") + ")")
                .collect(Collectors.joining("; "))).append("\n");
        List<Order> orders = orderRepository.findAll().stream().filter(o -> o.getStyle() != null && o.getStyle().getId().equals(st.getId())).toList();
        t.append("- **Orders:** ").append(orders.isEmpty() ? "none" : orders.stream()
                .map(o -> o.getOrderNo() + " (" + Fmt.humanize(o.getStatus()) + ", " + Fmt.num(o.getTotalQuantity()) + " pcs)")
                .collect(Collectors.joining("; "))).append("\n");
        return Answer.of(t.toString(), List.of("Styles master", "Operation bulletins", "Orders"),
                List.of("Show the operation bulletin for " + st.getStyleNo(), "List all styles"));
    }

    private Answer styles(AnalyzedQuestion q) {
        List<Style> styles = styleRepository.findAllByOrderByStyleNoAsc();
        String buyer = q.first(EntityType.BUYER).map(r -> r.key()).orElse(null);
        if (buyer != null) styles = styles.stream().filter(s -> buyer.equalsIgnoreCase(Objects.toString(s.getBuyer(), "").trim())).toList();
        if (styles.isEmpty()) return Answer.notAvailable("No styles found" + (buyer != null ? " for buyer " + buyer : "") + ".", List.of("List all styles"));
        List<List<Object>> rows = styles.stream().map(s -> List.<Object>of(s.getStyleNo(), Objects.toString(s.getBuyer(), "—"),
                Objects.toString(s.getSeason(), "—"), Objects.toString(s.getProductType(), "—"), s.isActive() ? "Active" : "Inactive")).toList();
        return Answer.of("**" + styles.size() + " style" + (styles.size() == 1 ? "" : "s") + "**" + (buyer != null ? " for " + buyer : "") + ": "
                        + styles.stream().map(s -> s.getStyleNo() + " (" + Objects.toString(s.getBuyer(), "no buyer") + ")").collect(Collectors.joining(", ")) + ".",
                        List.of("Styles master"), List.of("Who is the buyer for " + styles.get(0).getStyleNo() + "?"))
                .withPayload(Fmt.table("Styles", List.of("Style", "Buyer", "Season", "Product type", "Status"), rows));
    }

    private Answer line(AnalyzedQuestion q) {
        SewingLine l = lineRepository.findById(q.first(EntityType.LINE).get().id()).orElseThrow();
        StringBuilder t = new StringBuilder("**" + l.getLineCode() + " — " + l.getLineName() + "**\n\n");
        t.append("- **Status:** ").append(Fmt.humanize(l.getOperationalStatus())).append(l.isActive() ? "" : " (inactive)").append("\n");
        t.append("- **Type / floor:** ").append(Objects.toString(l.getLineType(), "—")).append(" / ").append(Objects.toString(l.getFloor(), "—")).append("\n");
        t.append("- **Configured staffing:** ").append(Fmt.num(l.getOperatorCount())).append(" operators, ").append(Fmt.num(l.getHelperCount()))
                .append(" helpers, ").append(Fmt.num(l.getWorkstationCount())).append(" workstations, ").append(Fmt.num(l.getMachineCount())).append(" machines\n");
        t.append("- **Capacity:** ").append(Fmt.num(l.getCapacityPerDay())).append(" pcs/day over ")
                .append(l.getWorkingHours() != null ? Fmt.dec(l.getWorkingHours().doubleValue(), 2) : "—").append(" h, target efficiency ")
                .append(l.getTargetEfficiencyPercent() != null ? Fmt.pct(l.getTargetEfficiencyPercent().doubleValue()) : "—").append("\n");
        if (l.getSupervisorName() != null) t.append("- **Supervisor:** ").append(l.getSupervisorName()).append("\n");
        if (l.getIeInCharge() != null) t.append("- **IE in charge:** ").append(l.getIeInCharge()).append("\n");
        if (l.getCurrentStyle() != null || l.getCurrentBulletin() != null) {
            t.append("- **Currently set up for:** ").append(Objects.toString(l.getCurrentStyle(), "—")).append(" / bulletin ")
                    .append(Objects.toString(l.getCurrentBulletin(), "—")).append("\n");
        }
        List<LinePlan> plans = linePlanRepository.findAll().stream().filter(p -> p.getLine() != null && p.getLine().getId().equals(l.getId())).toList();
        t.append("- **Line plans:** ").append(plans.isEmpty() ? "none" : plans.stream()
                .map(p -> (p.getOrder() != null ? p.getOrder().getOrderNo() : "no order") + " (" + p.getStatus() + ", target "
                        + Fmt.num(p.getTargetOutput()) + ", " + p.getAssignments().stream().filter(a -> a.getOperator() != null).count()
                        + "/" + p.getAssignments().size() + " stations staffed)")
                .collect(Collectors.joining("; "))).append("\n");
        int installed = machineRepository.findByLineId(l.getId()).stream().filter(Machine::isActive).mapToInt(m -> m.getQuantity() == null ? 0 : m.getQuantity()).sum();
        t.append("- **Machines allocated in the machine register:** ").append(installed).append("\n");
        return Answer.of(t.toString(), List.of("Sewing lines master", "Line plans", "Machines"),
                List.of("Show production for " + l.getLineCode() + " today", "How many machines are on " + l.getLineCode() + "?"));
    }

    private Answer lines() {
        List<SewingLine> lines = lineRepository.findAll().stream().sorted(Comparator.comparing(SewingLine::getLineCode)).toList();
        if (lines.isEmpty()) return Answer.notAvailable("No sewing lines are configured yet. Add them under [Settings → Sewing Lines](/settings/lines).", List.of());
        long active = lines.stream().filter(SewingLine::isActive).count();
        List<List<Object>> rows = lines.stream().map(l -> List.<Object>of(l.getLineCode(), l.getLineName(), Fmt.humanize(l.getOperationalStatus()),
                Fmt.num(l.getOperatorCount()), Fmt.num(l.getCapacityPerDay()),
                l.getTargetEfficiencyPercent() != null ? Fmt.pct(l.getTargetEfficiencyPercent().doubleValue()) : "—")).toList();
        return Answer.of("There are **" + lines.size() + " sewing lines** (" + active + " active): "
                        + lines.stream().map(l -> l.getLineCode() + " — " + l.getLineName()).collect(Collectors.joining("; ")) + ".",
                        List.of("Sewing lines master"), List.of("Show details of " + lines.get(0).getLineCode()))
                .withPayload(Fmt.table("Sewing lines", List.of("Code", "Name", "Status", "Operators", "Capacity/day", "Target eff."), rows));
    }

    private Answer machines(AnalyzedQuestion q) {
        List<Machine> machines = machineRepository.findByActive(true);
        List<String> scope = new ArrayList<>();
        String type = q.first(EntityType.MACHINE_TYPE).map(r -> r.key()).orElse(null);
        if (type != null) {
            machines = machines.stream().filter(m -> type.equalsIgnoreCase(m.getMachineType())).toList();
            scope.add(type);
        }
        if (q.has(EntityType.LINE)) {
            Long lineId = q.first(EntityType.LINE).get().id();
            machines = machines.stream().filter(m -> m.getLine() != null && m.getLine().getId().equals(lineId)).toList();
            scope.add("on " + q.first(EntityType.LINE).get().display());
        }
        String where = scope.isEmpty() ? "" : " (" + String.join(", ", scope) + ")";
        if (machines.isEmpty()) return Answer.notAvailable("No active machines are registered" + where + ".", List.of("How many machines do we have?"));
        int units = machines.stream().mapToInt(m -> m.getQuantity() == null ? 0 : m.getQuantity()).sum();
        Map<String, Integer> byType = machines.stream().collect(Collectors.groupingBy(m -> Objects.toString(m.getMachineType(), "—"), TreeMap::new,
                Collectors.summingInt(m -> m.getQuantity() == null ? 0 : m.getQuantity())));
        Map<String, Integer> byStatus = machines.stream().collect(Collectors.groupingBy(m -> Fmt.humanize(m.getStatus()), TreeMap::new,
                Collectors.summingInt(m -> m.getQuantity() == null ? 0 : m.getQuantity())));
        StringBuilder t = new StringBuilder("There are **" + Fmt.num(units) + " machines**" + where + ", registered as " + machines.size()
                + " machine record" + (machines.size() == 1 ? "" : "s") + " (each record has a quantity).");
        t.append("\n\n**By status:** ").append(byStatus.entrySet().stream().map(e -> e.getKey() + " " + e.getValue()).collect(Collectors.joining(" · ")));
        List<List<Object>> rows = byType.entrySet().stream().map(e -> List.<Object>of(e.getKey(), e.getValue())).toList();
        return Answer.of(t.toString(), List.of("Machine register"), List.of("How many overlock machines do we have?", "Which operations use Single Needle Lockstitch?"))
                .withPayload(Fmt.table("Machines by type" + where, List.of("Machine type", "Units"), rows));
    }

    private Answer shifts(AnalyzedQuestion q) {
        List<Shift> shifts = q.has(EntityType.SHIFT)
                ? shiftRepository.findById(q.first(EntityType.SHIFT).get().id()).map(List::of).orElse(List.of())
                : shiftRepository.findAllByOrderByShiftCodeAsc();
        if (shifts.isEmpty()) return Answer.notAvailable("No shifts are configured. Add them under [Settings → Shifts](/settings/shifts).", List.of());
        List<List<Object>> rows = new ArrayList<>();
        StringBuilder t = new StringBuilder(shifts.size() == 1 ? "" : "There are **" + shifts.size() + " shifts**:\n\n");
        for (Shift s : shifts) {
            long span = Duration.between(s.getStartTime(), s.getEndTime()).toMinutes();
            if (span <= 0) span += 24 * 60; // overnight
            int brk = s.getBreakDurationMinutes() == null ? 0 : s.getBreakDurationMinutes();
            double netHours = (span - brk) / 60.0;
            t.append("- **").append(s.getShiftName()).append(" (").append(s.getShiftCode()).append(")**: ")
                    .append(s.getStartTime()).append("–").append(s.getEndTime()).append(span > 0 && s.getEndTime().isBefore(s.getStartTime()) ? " (overnight)" : "")
                    .append(", ").append(brk).append(" min break → ").append(Fmt.dec(netHours, 2)).append(" net working hours")
                    .append(s.isActive() ? "" : " — inactive").append("\n");
            rows.add(List.of(s.getShiftCode(), s.getShiftName(), s.getStartTime().toString(), s.getEndTime().toString(), brk + " min", Fmt.dec(netHours, 2)));
        }
        return Answer.of(t.toString(), List.of("Shifts master"), List.of("Show today's attendance"))
                .withPayload(Fmt.table("Shifts", List.of("Code", "Name", "Start", "End", "Break", "Net hours"), rows));
    }

    private Answer overview() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Active operators", operatorRepository.findByActiveOrderByNameAsc(true).size());
        m.put("Operations", operationRepository.count());
        m.put("Styles", styleRepository.count());
        m.put("Sewing lines", lineRepository.count());
        m.put("Orders", orderRepository.count());
        m.put("Operation bulletins", bulletinRepository.count());
        m.put("Machines (units)", machineRepository.findByActive(true).stream().mapToInt(x -> x.getQuantity() == null ? 0 : x.getQuantity()).sum());
        m.put("Shifts", shiftRepository.count());
        String text = "**SewNexa data overview:** " + m.entrySet().stream().map(e -> e.getValue() + " " + e.getKey().toLowerCase()).collect(Collectors.joining(", ")) + ".";
        return Answer.of(text, List.of("All masters"), List.of("List all sewing lines", "List all orders", "How many operators are there?"))
                .withPayload(Fmt.metrics("Data overview", m));
    }
}
