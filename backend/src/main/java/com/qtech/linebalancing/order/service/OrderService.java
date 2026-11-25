package com.qtech.linebalancing.order.service;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.order.dto.OrderRequest;
import com.qtech.linebalancing.order.dto.OrderResponse;
import com.qtech.linebalancing.order.dto.OrderSizeLineRequest;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.entity.OrderSizeLine;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.size.entity.Size;
import com.qtech.linebalancing.size.service.SizeService;
import com.qtech.linebalancing.style.entity.Style;
import com.qtech.linebalancing.style.service.StyleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.qtech.linebalancing.lineplan.repository.LinePlanRepository;
import com.qtech.linebalancing.production.entity.PieceProductionLog;
import com.qtech.linebalancing.production.repository.PieceProductionLogRepository;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class OrderService {

    private final OrderRepository orderRepository;
    private final StyleService styleService;
    private final SizeService sizeService;
    private final LinePlanRepository linePlanRepository;
    private final PieceProductionLogRepository pieceProductionLogRepository;
    private final com.qtech.linebalancing.hourly.repository.HourlyProductionEntryRepository hourlyEntryRepository;

    public List<OrderResponse> getAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** All-or-nothing import: any invalid or duplicate order aborts the whole batch (the error names the order). */
    @Transactional
    public List<OrderResponse> createBatch(List<OrderRequest> requests) {
        java.util.Set<String> seen = new java.util.HashSet<>();
        List<OrderResponse> created = new java.util.ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            OrderRequest r = requests.get(i);
            String orderNo = r.getOrderNo() == null ? "" : r.getOrderNo().trim();
            if (!orderNo.isEmpty() && !seen.add(orderNo.toUpperCase())) {
                throw new BusinessRuleException("Order '" + orderNo + "' appears more than once in the import.");
            }
            String label = orderNo.isEmpty() ? "Order " + (i + 1) + " (no order number)" : "Order '" + orderNo + "'";
            try {
                created.add(create(r));
            } catch (BusinessRuleException e) {
                throw new BusinessRuleException(label + ": " + e.getMessage());
            }
        }
        return created;
    }

    @Transactional
    public OrderResponse create(OrderRequest request) {
        if (request.getOrderNo() == null || request.getOrderNo().isBlank()) {
            request.setOrderNo(nextOrderNo(request.getOrderDate()));
        }
        if (orderRepository.existsByOrderNoIgnoreCase(request.getOrderNo())) {
            throw new BusinessRuleException("Order number '" + request.getOrderNo() + "' already exists.");
        }
        validateDates(request);
        Style style = styleService.findEntityById(request.getStyleId());

        LocalDate plannedCompDate = request.getPlannedCompletionDate() != null
                ? request.getPlannedCompletionDate()
                : request.getDeliveryDate();

        ResolvedLines resolved = resolveLines(request);

        Order order = Order.builder()
                .orderNo(request.getOrderNo().toUpperCase())
                .buyer(blankToNull(request.getBuyer()))
                .style(style)
                .color(resolved.colorSummary())
                .orderType(resolved.type())
                .orderDate(request.getOrderDate())
                .deliveryDate(request.getDeliveryDate())
                .plannedCompletionDate(plannedCompDate)
                .status(request.getStatus())
                .build();

        List<OrderSizeLine> lines = new ArrayList<>();
        for (ResolvedLine l : resolved.lines().values()) {
            lines.add(OrderSizeLine.builder().order(order).size(sizeService.findEntityById(l.sizeId()))
                    .color(l.color()).quantity(l.quantity()).build());
        }
        order.setSizeLines(lines);
        order.setTotalQuantity(lines.stream().mapToInt(OrderSizeLine::getQuantity).sum());

        if (order.getTotalQuantity() <= 0) {
            throw new BusinessRuleException("Total order quantity must be greater than 0.");
        }

        log.info("Creating order '{}' with total qty={}", order.getOrderNo(), order.getTotalQuantity());
        return toResponse(orderRepository.saveAndFlush(order)); // flush so rowVersion in the response is current
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Next free number for the order's year: PO-2026-001, PO-2026-002, … (numbers typed by hand in that form are respected). */
    String nextOrderNo(LocalDate orderDate) {
        int year = (orderDate != null ? orderDate : LocalDate.now()).getYear();
        String prefix = "PO-" + year + "-";
        int max = 0;
        for (String no : orderRepository.findOrderNosStartingWith(prefix)) {
            String tail = no.substring(prefix.length());
            if (tail.matches("\\d{1,9}")) max = Math.max(max, Integer.parseInt(tail));
        }
        return prefix + String.format("%03d", max + 1);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, Order.Status newStatus) {
        Order order = findOrThrow(id);
        order.setStatus(newStatus);
        return toResponse(orderRepository.saveAndFlush(order)); // flush so rowVersion in the response is current
    }

    @Transactional
    public OrderResponse update(Long id, OrderRequest request) {
        Order order = findOrThrow(id);
        assertNotStale(request.getRowVersion(), order.getRowVersion(), "Order '" + order.getOrderNo() + "'");
        if (request.getOrderNo() == null || request.getOrderNo().isBlank()) {
            request.setOrderNo(order.getOrderNo()); // blank on edit keeps the current number
        }
        if (!order.getOrderNo().equalsIgnoreCase(request.getOrderNo()) &&
                orderRepository.existsByOrderNoIgnoreCase(request.getOrderNo())) {
            throw new BusinessRuleException("Order number '" + request.getOrderNo() + "' already exists.");
        }
        validateDates(request);
        Style style = styleService.findEntityById(request.getStyleId());

        LocalDate plannedCompDate = request.getPlannedCompletionDate() != null
                ? request.getPlannedCompletionDate()
                : request.getDeliveryDate();

        order.setOrderNo(request.getOrderNo().toUpperCase());
        order.setBuyer(blankToNull(request.getBuyer()));
        order.setStyle(style);
        ResolvedLines resolved = resolveLines(request);
        order.setColor(resolved.colorSummary());
        order.setOrderType(resolved.type());
        order.setOrderDate(request.getOrderDate());
        order.setDeliveryDate(request.getDeliveryDate());
        order.setPlannedCompletionDate(plannedCompDate);
        order.setStatus(request.getStatus());

        // Reconcile lines in place, keyed by colour + size (avoids unique-constraint clashes on (order, colour, size))
        Map<String, ResolvedLine> requested = resolved.lines();
        order.getSizeLines().removeIf(line -> !requested.containsKey(lineKey(line.getColor(), line.getSize().getId())));
        for (Map.Entry<String, ResolvedLine> entry : requested.entrySet()) {
            ResolvedLine l = entry.getValue();
            Optional<OrderSizeLine> existing = order.getSizeLines().stream()
                    .filter(x -> lineKey(x.getColor(), x.getSize().getId()).equals(entry.getKey()))
                    .findFirst();
            if (existing.isPresent()) {
                existing.get().setQuantity(l.quantity());
                existing.get().setColor(l.color());
            } else {
                order.getSizeLines().add(OrderSizeLine.builder().order(order).size(sizeService.findEntityById(l.sizeId()))
                        .color(l.color()).quantity(l.quantity()).build());
            }
        }

        order.setTotalQuantity(order.getSizeLines().stream().mapToInt(OrderSizeLine::getQuantity).sum());

        if (order.getTotalQuantity() <= 0) {
            throw new BusinessRuleException("Total order quantity must be greater than 0.");
        }

        log.info("Updated order id={} '{}' with total qty={}", id, order.getOrderNo(), order.getTotalQuantity());
        return toResponse(orderRepository.saveAndFlush(order)); // flush so rowVersion in the response is current
    }

    @Transactional
    public void delete(Long id) {
        Order order = findOrThrow(id);
        // Production history must survive: only orders that never started can be deleted.
        if (order.getStatus() != Order.Status.PLANNED) {
            throw new BusinessRuleException("Order '" + order.getOrderNo() + "' is " + order.getStatus()
                    + " and cannot be deleted. Put it ON_HOLD or mark it COMPLETED instead.");
        }
        if (pieceProductionLogRepository.existsByOrderId(id) || hourlyEntryRepository.existsByLinePlanOrderId(id)) {
            throw new BusinessRuleException("Order '" + order.getOrderNo()
                    + "' already has recorded production and cannot be deleted. Put it ON_HOLD instead.");
        }
        log.info("Deleting order id={} '{}'", id, order.getOrderNo());

        // 1. Delete associated line plans and cascade stations/hourly entries
        linePlanRepository.deleteByOrderId(id);

        // 2. Decouple associated piece production logs to maintain historic operator records
        List<PieceProductionLog> logs = pieceProductionLogRepository.findAllWithDetailsByOrderId(id);
        if (!logs.isEmpty()) {
            for (PieceProductionLog l : logs) {
                l.setOrder(null);
            }
            pieceProductionLogRepository.saveAll(logs);
        }

        // 3. Delete order entity (order_size_lines cascade automatically)
        orderRepository.delete(order);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    // ── Colours and sizes ──────────────────────────────────────────────────────────────

    private record ResolvedLine(String color, Long sizeId, int quantity) {}

    private record ResolvedLines(Order.OrderType type, String colorSummary, Map<String, ResolvedLine> lines) {}

    private static String lineKey(String color, Long sizeId) {
        return color.trim().toUpperCase() + "|" + sizeId;
    }

    /**
     * Lines with their colour (blank = the order's colour), same colour + size merged, and the order type checked:
     * a single-colour order has exactly one colour; a multi-colour order needs at least two.
     * Without a type, one colour = SINGLE_COLOR and more = MULTI_COLOR.
     */
    ResolvedLines resolveLines(OrderRequest request) {
        String orderColor = blankToNull(request.getColor());
        Map<String, ResolvedLine> merged = new LinkedHashMap<>();
        Map<String, String> colours = new LinkedHashMap<>(); // upper-case -> first spelling
        if (request.getSizeLines() != null) {
            for (OrderSizeLineRequest l : request.getSizeLines()) {
                if (l.getSizeId() == null || l.getQuantity() == null || l.getQuantity() <= 0) continue;
                String colour = blankToNull(l.getColor()) != null ? l.getColor().trim() : orderColor;
                if (colour == null) {
                    throw new BusinessRuleException("Every size quantity needs a colour.");
                }
                colour = colours.computeIfAbsent(colour.toUpperCase(), k -> l.getColor() != null && !l.getColor().isBlank() ? l.getColor().trim() : orderColor);
                String key = lineKey(colour, l.getSizeId());
                ResolvedLine prev = merged.get(key);
                merged.put(key, new ResolvedLine(colour, l.getSizeId(), (prev != null ? prev.quantity() : 0) + l.getQuantity()));
            }
        }
        if (merged.isEmpty()) {
            throw new BusinessRuleException("Total order quantity must be greater than 0.");
        }
        Order.OrderType type = request.getOrderType() != null
                ? request.getOrderType()
                : (colours.size() > 1 ? Order.OrderType.MULTI_COLOR : Order.OrderType.SINGLE_COLOR);
        if (type == Order.OrderType.SINGLE_COLOR && colours.size() > 1) {
            throw new BusinessRuleException("A single-colour order can have only one colour, but " + colours.size()
                    + " were given (" + String.join(", ", colours.values()) + "). Choose Multi-colour for this order.");
        }
        if (type == Order.OrderType.MULTI_COLOR && colours.size() < 2) {
            throw new BusinessRuleException("A multi-colour order needs at least two colours. Choose Single colour for one colour.");
        }
        String summary = String.join(", ", colours.values());
        if (summary.length() > 100) {
            String prefix = colours.size() + " colours: ";
            summary = prefix + summary.substring(0, 100 - prefix.length() - 1) + "…";
        }
        return new ResolvedLines(type, summary, merged);
    }

    private void validateDates(OrderRequest request) {
        if (request.getDeliveryDate().isBefore(request.getOrderDate())) {
            throw new BusinessRuleException("Delivery date cannot be before the order date.");
        }
        if (request.getPlannedCompletionDate() != null && request.getPlannedCompletionDate().isBefore(request.getOrderDate())) {
            throw new BusinessRuleException("Planned completion date cannot be before the order date.");
        }
    }

    private Order findOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    private static void assertNotStale(Long requestVersion, Long currentVersion, String what) {
        if (requestVersion != null && !requestVersion.equals(currentVersion)) {
            throw new BusinessRuleException(what + " was changed by someone else since you opened it. "
                    + "Reload it and apply your changes again.");
        }
    }

    private OrderResponse toResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderNo(order.getOrderNo());
        resp.setBuyer(order.getBuyer());
        resp.setStyleId(order.getStyle().getId());
        resp.setStyleNo(order.getStyle().getStyleNo());
        resp.setColor(order.getColor());
        resp.setOrderType(order.getOrderType());
        resp.setOrderDate(order.getOrderDate());
        resp.setDeliveryDate(order.getDeliveryDate());
        resp.setPlannedCompletionDate(order.getPlannedCompletionDate() != null ? order.getPlannedCompletionDate() : order.getDeliveryDate());
        resp.setStatus(order.getStatus());
        resp.setRowVersion(order.getRowVersion());
        resp.setTotalQuantity(order.getTotalQuantity());
        resp.setSizeLines(order.getSizeLines().stream().map(line -> {
            OrderResponse.OrderSizeLineResponse lineResp = new OrderResponse.OrderSizeLineResponse();
            lineResp.setId(line.getId());
            lineResp.setSizeId(line.getSize().getId());
            lineResp.setSizeCode(line.getSize().getCode());
            lineResp.setSizeLabel(line.getSize().getLabel());
            lineResp.setQuantity(line.getQuantity());
            lineResp.setColor(line.getColor());
            return lineResp;
        }).toList());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setUpdatedAt(order.getUpdatedAt());
        return resp;
    }
}
