package com.qtech.linebalancing.chatbot.assistant.skills;

import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.Fmt;
import com.qtech.linebalancing.chatbot.assistant.nlu.AnalyzedQuestion;
import com.qtech.linebalancing.chatbot.assistant.nlu.EntityType;
import com.qtech.linebalancing.chatbot.assistant.nlu.Intent;
import com.qtech.linebalancing.chatbot.dto.StructuredPayloadDto;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.notification.entity.Notification;
import com.qtech.linebalancing.notification.repository.NotificationRepository;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.production.entity.PieceProductionLog;
import com.qtech.linebalancing.production.repository.PieceProductionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/** Orders, piece production output and alerts. */
@Component
@RequiredArgsConstructor
public class ProductionSkill implements Skill {

    private final OrderRepository orderRepository;
    private final PieceProductionLogRepository pieceLogRepository;
    private final LinePlanRepository linePlanRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public Set<Intent> intents() {
        return EnumSet.of(Intent.ORDER_STATUS, Intent.ORDER_LIST, Intent.PRODUCTION_SUMMARY, Intent.ALERTS);
    }

    @Override
    public Answer answer(AnalyzedQuestion q) {
        return switch (q.intent()) {
            case ORDER_STATUS -> order(q);
            case ORDER_LIST -> orders(q);
            case PRODUCTION_SUMMARY -> production(q);
            default -> alerts();
        };
    }

    private Answer order(AnalyzedQuestion q) {
        Order o = orderRepository.findById(q.first(EntityType.ORDER).get().id()).orElseThrow();
        long good = Optional.ofNullable(pieceLogRepository.sumGoodQtyForOrder(o.getId())).orElse(0L);
        int qty = o.getTotalQuantity() == null ? 0 : o.getTotalQuantity();
        double progress = qty > 0 ? Math.min(100.0, good * 100.0 / qty) : 0;
        LocalDate today = LocalDate.now();

        StringBuilder t = new StringBuilder("**Order " + o.getOrderNo() + "** — " + Objects.toString(o.getBuyer(), "—")
                + (o.getStyle() != null ? ", style " + o.getStyle().getStyleNo() : "") + (o.getColor() != null ? ", " + o.getColor() : "") + "\n\n");
        t.append("- **Status:** ").append(Fmt.humanize(o.getStatus())).append("\n");
        t.append("- **Progress:** **").append(Fmt.num(good)).append(" of ").append(Fmt.num(qty)).append(" pcs** good output recorded (")
                .append(Fmt.pct(progress)).append("), ").append(Fmt.num(Math.max(0, qty - good))).append(" remaining\n");
        if (o.getDeliveryDate() != null) {
            long days = ChronoUnit.DAYS.between(today, o.getDeliveryDate());
            t.append("- **Delivery date:** ").append(Fmt.date(o.getDeliveryDate())).append(" — ")
                    .append(days > 0 ? days + " days left" : days == 0 ? "due today" : "**overdue by " + (-days) + " days**").append("\n");
        }
        if (o.getPlannedCompletionDate() != null) t.append("- **Planned completion:** ").append(Fmt.date(o.getPlannedCompletionDate())).append("\n");
        if (o.getOrderDate() != null) t.append("- **Order date:** ").append(Fmt.date(o.getOrderDate())).append("\n");
        linePlanRepository.findFirstByOrderIdOrderByIdAsc(o.getId()).ifPresent(p -> t.append("- **Line plan:** ")
                .append(p.getLine() != null ? p.getLine().getLineCode() : "no line assigned").append(", ").append(p.getStatus()).append("\n"));
        if (o.getSizeLines() != null && !o.getSizeLines().isEmpty()) {
            // Per colour for multi-colour orders, e.g. "BLACK: S 100, M 200; WHITE: S 50"
            String sizes = o.getSizeLines().stream()
                    .collect(Collectors.groupingBy(sl -> Objects.toString(sl.getColor(), ""), java.util.LinkedHashMap::new, Collectors.toList()))
                    .entrySet().stream()
                    .map(e -> (o.getOrderType() == com.qtech.linebalancing.order.entity.Order.OrderType.MULTI_COLOR ? e.getKey() + ": " : "")
                            + e.getValue().stream()
                                .sorted(Comparator.comparing(sl -> sl.getSize().getSequence() == null ? 0 : sl.getSize().getSequence()))
                                .map(sl -> sl.getSize().getCode() + " " + Fmt.num(sl.getQuantity())).collect(Collectors.joining(", ")))
                    .collect(Collectors.joining("; "));
            t.append("- **Sizes:** ").append(sizes).append("\n");
        }
        t.append("\n*Progress counts good pieces from production logs recorded against this order.*");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("Ordered", qty);
        m.put("Produced (good)", good);
        m.put("Progress", Fmt.pct(progress));
        return Answer.of(t.toString(), List.of("Orders", "Piece production logs", "Line plans"),
                        List.of("Show production for " + o.getOrderNo() + " today", "Show the capacity plan for " + o.getOrderNo()))
                .withPayload(Fmt.metrics("Order " + o.getOrderNo(), m));
    }

    private Answer orders(AnalyzedQuestion q) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<String> scope = new ArrayList<>();
        if (q.params().orderStatus() != null) {
            orders = orders.stream().filter(o -> o.getStatus() != null && o.getStatus().name().equals(q.params().orderStatus())).toList();
            scope.add(Fmt.humanize(q.params().orderStatus()).toLowerCase());
        }
        if (q.has(EntityType.BUYER)) {
            String buyer = q.first(EntityType.BUYER).get().key();
            orders = orders.stream().filter(o -> buyer.equalsIgnoreCase(Objects.toString(o.getBuyer(), "").trim())).toList();
            scope.add("for " + buyer);
        }
        String where = scope.isEmpty() ? "" : " " + String.join(" ", scope);
        if (orders.isEmpty()) return Answer.notAvailable("There are no orders" + where + ".", List.of("List all orders"));
        Map<Long, Long> good = new HashMap<>();
        pieceLogRepository.sumGoodQtyByOrder().forEach(r -> good.put((Long) r[0], ((Number) r[1]).longValue()));
        List<List<Object>> rows = orders.stream().map(o -> {
            long g = good.getOrDefault(o.getId(), 0L);
            int qty = o.getTotalQuantity() == null ? 0 : o.getTotalQuantity();
            return List.<Object>of(o.getOrderNo(), Objects.toString(o.getBuyer(), "—"), o.getStyle() != null ? o.getStyle().getStyleNo() : "—",
                    Fmt.humanize(o.getStatus()), Fmt.num(qty), Fmt.num(g), qty > 0 ? Fmt.pct(Math.min(100, g * 100.0 / qty)) : "—", Fmt.date(o.getDeliveryDate()));
        }).toList();
        return Answer.of("**" + orders.size() + " order" + (orders.size() == 1 ? "" : "s") + "**" + where + ": "
                        + orders.stream().map(o -> o.getOrderNo() + " (" + Fmt.humanize(o.getStatus()) + ", due " + Fmt.date(o.getDeliveryDate()) + ")")
                        .collect(Collectors.joining("; ")) + ".",
                        List.of("Orders", "Piece production logs"), List.of("What is the progress of " + orders.get(0).getOrderNo() + "?"))
                .withPayload(Fmt.table("Orders" + where, List.of("Order", "Buyer", "Style", "Status", "Qty", "Produced", "Progress", "Delivery"), rows));
    }

    /** Output for a day from piece production logs; efficiency = earned minutes ÷ worked minutes (as in Production Monitoring). */
    private Answer production(AnalyzedQuestion q) {
        LocalDate date = q.params().date() != null ? q.params().date() : LocalDate.now();
        List<PieceProductionLog> logs = pieceLogRepository.findAllWithDetailsByLogDate(date);
        List<String> scope = new ArrayList<>();
        if (q.has(EntityType.ORDER)) {
            Long orderId = q.first(EntityType.ORDER).get().id();
            logs = logs.stream().filter(l -> l.getOrder() != null && l.getOrder().getId().equals(orderId)).toList();
            scope.add("order " + q.first(EntityType.ORDER).get().display());
        }
        if (q.has(EntityType.LINE)) {
            Long lineId = q.first(EntityType.LINE).get().id();
            Set<Long> lineOrders = linePlanRepository.findAll().stream()
                    .filter(p -> p.getLine() != null && p.getLine().getId().equals(lineId) && p.getOrder() != null)
                    .map(p -> p.getOrder().getId()).collect(Collectors.toSet());
            logs = logs.stream().filter(l -> l.getOrder() != null && lineOrders.contains(l.getOrder().getId())).toList();
            scope.add(q.first(EntityType.LINE).get().display() + " (orders planned on it)");
        }
        if (q.has(EntityType.OPERATOR)) {
            Long opId = q.first(EntityType.OPERATOR).get().id();
            logs = logs.stream().filter(l -> l.getOperator().getId().equals(opId)).toList();
            scope.add(q.first(EntityType.OPERATOR).get().display());
        }
        String day = date.equals(LocalDate.now()) ? "today (" + Fmt.date(date) + ")" : Fmt.date(date);
        String where = scope.isEmpty() ? "" : " for " + String.join(", ", scope);
        if (logs.isEmpty()) {
            String latest = pieceLogRepository.findTopByOrderByLogDateDesc().map(l -> " The most recent production was recorded on "
                    + Fmt.date(l.getLogDate()) + ".").orElse(" No production has been recorded yet.");
            return Answer.notAvailable("No piece production has been recorded" + where + " " + day + "." + latest,
                    pieceLogRepository.findTopByOrderByLogDateDesc().map(l -> List.of("Show production on " + l.getLogDate())).orElse(List.of()));
        }
        int completed = logs.stream().mapToInt(l -> nz(l.getCompletedQty())).sum();
        int good = logs.stream().mapToInt(l -> nz(l.getGoodQty())).sum();
        int reject = logs.stream().mapToInt(l -> nz(l.getRejectQty())).sum();
        double earned = logs.stream().mapToDouble(l -> nz(l.getGoodQty()) * (l.getSamMinutes() == null ? 0 : l.getSamMinutes().doubleValue())).sum();
        double worked = logs.stream().mapToDouble(l -> l.getActualTimeMinutes() == null ? 0 : l.getActualTimeMinutes().doubleValue()).sum();
        long operators = logs.stream().map(l -> l.getOperator().getId()).distinct().count();

        StringBuilder t = new StringBuilder("**Production " + day + "**" + where + ": **" + Fmt.num(good) + " good pieces** of "
                + Fmt.num(completed) + " completed, " + Fmt.num(reject) + " rejected");
        if (completed > 0) t.append(" (").append(Fmt.pct(reject * 100.0 / completed)).append(" defect rate)");
        t.append(", from ").append(logs.size()).append(" production logs by ").append(operators).append(" operator").append(operators == 1 ? "" : "s").append(".");
        if (worked > 0) {
            t.append("\n\n**Efficiency:** ").append(Fmt.pct(earned * 100 / worked)).append(" — ").append(Fmt.dec(earned, 1))
                    .append(" earned minutes (good pieces × SAM) over ").append(Fmt.dec(worked, 0)).append(" minutes worked.");
        }
        Map<String, int[]> byOperation = new TreeMap<>();
        logs.forEach(l -> {
            String op = l.getOperation() != null ? l.getOperation().getName() : Objects.toString(l.getOperationName(), "—");
            int[] acc = byOperation.computeIfAbsent(op, k -> new int[3]);
            acc[0] += nz(l.getCompletedQty());
            acc[1] += nz(l.getGoodQty());
            acc[2] += nz(l.getRejectQty());
        });
        List<List<Object>> rows = byOperation.entrySet().stream()
                .map(e -> List.<Object>of(e.getKey(), Fmt.num(e.getValue()[0]), Fmt.num(e.getValue()[1]), Fmt.num(e.getValue()[2]))).toList();
        Map<Integer, Integer> byHour = new TreeMap<>();
        logs.forEach(l -> byHour.merge(l.getHourSlot() == null ? 0 : l.getHourSlot(), nz(l.getGoodQty()), Integer::sum));
        StructuredPayloadDto payload = byHour.size() > 1
                ? StructuredPayloadDto.builder().type("CHART").title("Good pieces by hour — " + Fmt.date(date))
                .chartData(byHour.entrySet().stream().map(e -> Map.<String, Object>of("name", String.format("%02d:00", e.getKey()), "actual", e.getValue())).toList())
                .rows(Fmt.table("", List.of("Operation", "Completed", "Good", "Rejected"), rows).getRows())
                .headers(List.of("Operation", "Completed", "Good", "Rejected")).build()
                : Fmt.table("Output by operation — " + Fmt.date(date), List.of("Operation", "Completed", "Good", "Rejected"), rows);
        return Answer.of(t.toString(), List.of("Piece production logs"),
                        List.of("Show production for yesterday", "What is the progress of order " + orderRepository.findAllByOrderByCreatedAtDesc().stream().findFirst().map(Order::getOrderNo).orElse("") + "?"))
                .withPayload(payload);
    }

    private Answer alerts() {
        List<Notification> recent = notificationRepository.findTop100ByOrderByCreatedAtDesc();
        long unread = notificationRepository.countByIsReadFalse();
        if (recent.isEmpty()) return Answer.notAvailable("There are no notifications or alerts.", List.of());
        DateTimeFormatter f = DateTimeFormatter.ofPattern("d MMM HH:mm", Locale.ENGLISH);
        List<Notification> shown = recent.stream().limit(10).toList();
        StringBuilder t = new StringBuilder("**" + unread + " unread** of " + recent.size() + " recent notifications. Latest:\n\n");
        shown.stream().limit(5).forEach(n -> t.append("- ").append(n.getCreatedAt() != null ? n.getCreatedAt().format(f) + " — " : "")
                .append("**").append(Fmt.humanize(n.getSeverity())).append("** ").append(n.getTitle())
                .append(Boolean.TRUE.equals(n.getIsRead()) ? "" : " *(unread)*").append("\n"));
        List<List<Object>> rows = shown.stream().map(n -> List.<Object>of(n.getCreatedAt() != null ? n.getCreatedAt().format(f) : "—",
                Fmt.humanize(n.getType()), Fmt.humanize(n.getSeverity()), n.getTitle(), Boolean.TRUE.equals(n.getIsRead()) ? "Read" : "Unread")).toList();
        return Answer.of(t.toString(), List.of("Notifications"), List.of("Show today's attendance", "Show production today"))
                .withPayload(Fmt.table("Recent notifications", List.of("Time", "Type", "Severity", "Title", "Status"), rows));
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }
}
