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

    public List<OrderResponse> getAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public OrderResponse create(OrderRequest request) {
        if (orderRepository.existsByOrderNoIgnoreCase(request.getOrderNo())) {
            throw new BusinessRuleException("Order number '" + request.getOrderNo() + "' already exists.");
        }
        validateDates(request);
        Style style = styleService.findEntityById(request.getStyleId());

        LocalDate plannedCompDate = request.getPlannedCompletionDate() != null
                ? request.getPlannedCompletionDate()
                : request.getDeliveryDate();

        Order order = Order.builder()
                .orderNo(request.getOrderNo().toUpperCase())
                .buyer(request.getBuyer())
                .style(style)
                .color(request.getColor())
                .orderDate(request.getOrderDate())
                .deliveryDate(request.getDeliveryDate())
                .plannedCompletionDate(plannedCompDate)
                .status(request.getStatus())
                .build();

        List<OrderSizeLine> lines = buildSizeLines(request.getSizeLines(), order);
        order.setSizeLines(lines);
        order.setTotalQuantity(lines.stream().mapToInt(OrderSizeLine::getQuantity).sum());

        if (order.getTotalQuantity() <= 0) {
            throw new BusinessRuleException("Total order quantity must be greater than 0.");
        }

        log.info("Creating order '{}' with total qty={}", order.getOrderNo(), order.getTotalQuantity());
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, Order.Status newStatus) {
        Order order = findOrThrow(id);
        order.setStatus(newStatus);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse update(Long id, OrderRequest request) {
        Order order = findOrThrow(id);
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
        order.setBuyer(request.getBuyer());
        order.setStyle(style);
        order.setColor(request.getColor());
        order.setOrderDate(request.getOrderDate());
        order.setDeliveryDate(request.getDeliveryDate());
        order.setPlannedCompletionDate(plannedCompDate);
        order.setStatus(request.getStatus());

        // In-place reconciliation of size lines to avoid unique constraint violations on (order_id, size_id)
        Map<Long, Integer> requestedSizes = new LinkedHashMap<>();
        if (request.getSizeLines() != null) {
            for (OrderSizeLineRequest lineReq : request.getSizeLines()) {
                if (lineReq.getSizeId() != null && lineReq.getQuantity() != null && lineReq.getQuantity() > 0) {
                    requestedSizes.put(lineReq.getSizeId(), requestedSizes.getOrDefault(lineReq.getSizeId(), 0) + lineReq.getQuantity());
                }
            }
        }

        // 1. Remove existing lines that are not in the new request
        order.getSizeLines().removeIf(line -> !requestedSizes.containsKey(line.getSize().getId()));

        // 2. Update existing lines or append new lines
        for (Map.Entry<Long, Integer> entry : requestedSizes.entrySet()) {
            Long sizeId = entry.getKey();
            Integer qty = entry.getValue();

            Optional<OrderSizeLine> existingLine = order.getSizeLines().stream()
                    .filter(l -> l.getSize().getId().equals(sizeId))
                    .findFirst();

            if (existingLine.isPresent()) {
                existingLine.get().setQuantity(qty);
            } else {
                Size size = sizeService.findEntityById(sizeId);
                order.getSizeLines().add(OrderSizeLine.builder()
                        .order(order)
                        .size(size)
                        .quantity(qty)
                        .build());
            }
        }

        order.setTotalQuantity(order.getSizeLines().stream().mapToInt(OrderSizeLine::getQuantity).sum());

        if (order.getTotalQuantity() <= 0) {
            throw new BusinessRuleException("Total order quantity must be greater than 0.");
        }

        log.info("Updated order id={} '{}' with total qty={}", id, order.getOrderNo(), order.getTotalQuantity());
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public void delete(Long id) {
        Order order = findOrThrow(id);
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

    private List<OrderSizeLine> buildSizeLines(List<OrderSizeLineRequest> lineRequests, Order order) {
        List<OrderSizeLine> lines = new ArrayList<>();
        Map<Long, Integer> merged = new LinkedHashMap<>();
        if (lineRequests != null) {
            for (OrderSizeLineRequest lineReq : lineRequests) {
                if (lineReq.getSizeId() == null || lineReq.getQuantity() == null || lineReq.getQuantity() <= 0) continue;
                merged.put(lineReq.getSizeId(), merged.getOrDefault(lineReq.getSizeId(), 0) + lineReq.getQuantity());
            }
        }
        for (Map.Entry<Long, Integer> entry : merged.entrySet()) {
            Size size = sizeService.findEntityById(entry.getKey());
            lines.add(OrderSizeLine.builder()
                    .order(order)
                    .size(size)
                    .quantity(entry.getValue())
                    .build());
        }
        return lines;
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

    private OrderResponse toResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderNo(order.getOrderNo());
        resp.setBuyer(order.getBuyer());
        resp.setStyleId(order.getStyle().getId());
        resp.setStyleNo(order.getStyle().getStyleNo());
        resp.setColor(order.getColor());
        resp.setOrderDate(order.getOrderDate());
        resp.setDeliveryDate(order.getDeliveryDate());
        resp.setPlannedCompletionDate(order.getPlannedCompletionDate() != null ? order.getPlannedCompletionDate() : order.getDeliveryDate());
        resp.setStatus(order.getStatus());
        resp.setTotalQuantity(order.getTotalQuantity());
        resp.setSizeLines(order.getSizeLines().stream().map(line -> {
            OrderResponse.OrderSizeLineResponse lineResp = new OrderResponse.OrderSizeLineResponse();
            lineResp.setId(line.getId());
            lineResp.setSizeId(line.getSize().getId());
            lineResp.setSizeCode(line.getSize().getCode());
            lineResp.setSizeLabel(line.getSize().getLabel());
            lineResp.setQuantity(line.getQuantity());
            return lineResp;
        }).toList());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setUpdatedAt(order.getUpdatedAt());
        return resp;
    }
}
