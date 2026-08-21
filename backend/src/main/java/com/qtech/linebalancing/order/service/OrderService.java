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

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final StyleService styleService;
    private final SizeService sizeService;

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

        Order order = Order.builder()
                .orderNo(request.getOrderNo().toUpperCase())
                .buyer(request.getBuyer())
                .style(style)
                .color(request.getColor())
                .orderDate(request.getOrderDate())
                .deliveryDate(request.getDeliveryDate())
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

    // ── Helpers ────────────────────────────────────────────────────────────────

    private List<OrderSizeLine> buildSizeLines(List<OrderSizeLineRequest> lineRequests, Order order) {
        List<OrderSizeLine> lines = new ArrayList<>();
        for (OrderSizeLineRequest lineReq : lineRequests) {
            if (lineReq.getQuantity() == null || lineReq.getQuantity() < 0) continue;
            Size size = sizeService.findEntityById(lineReq.getSizeId());
            lines.add(OrderSizeLine.builder()
                    .order(order)
                    .size(size)
                    .quantity(lineReq.getQuantity())
                    .build());
        }
        return lines;
    }

    private void validateDates(OrderRequest request) {
        if (request.getDeliveryDate().isBefore(request.getOrderDate())) {
            throw new BusinessRuleException("Delivery date cannot be before the order date.");
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
