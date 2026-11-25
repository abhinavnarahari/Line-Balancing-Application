package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.order.dto.OrderRequest;
import com.qtech.linebalancing.order.dto.OrderSizeLineRequest;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class OrderBatchImportTest {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private JdbcTemplate jdbc;

    private Long styleId;
    private Long sizeId;

    @BeforeEach
    void masters() {
        styleId = jdbc.queryForObject("INSERT INTO styles (style_no, buyer) VALUES ('ZZ-IMP-STYLE', 'ZZ Buyer') RETURNING id", Long.class);
        sizeId = jdbc.queryForObject("INSERT INTO sizes (code, label) VALUES ('ZZIMP', 'ZZ Import Size') RETURNING id", Long.class);
    }

    private OrderRequest order(String orderNo, int qty) {
        OrderRequest r = new OrderRequest();
        r.setOrderNo(orderNo);
        r.setBuyer("ZZ Buyer");
        r.setStyleId(styleId);
        r.setColor("Navy");
        r.setOrderDate(LocalDate.now());
        r.setDeliveryDate(LocalDate.now().plusDays(30));
        OrderSizeLineRequest line = new OrderSizeLineRequest();
        line.setSizeId(sizeId);
        line.setQuantity(qty);
        r.setSizeLines(List.of(line));
        return r;
    }

    @Test
    void validBatchCreatesEveryOrder() {
        var created = orderService.createBatch(List.of(order("ZZ-IMP-1", 100), order("ZZ-IMP-2", 200)));
        assertThat(created).extracting("orderNo").containsExactly("ZZ-IMP-1", "ZZ-IMP-2");
        assertThat(orderRepository.existsByOrderNoIgnoreCase("ZZ-IMP-2")).isTrue();
    }

    @Test
    void ordersWithoutANumberGetTheNextNumberOfTheirYear() {
        int year = LocalDate.now().getYear();
        String prefix = "PO-" + year + "-";
        int max = jdbc.queryForList("SELECT order_no FROM orders WHERE UPPER(order_no) LIKE ?", String.class, prefix + "%").stream()
                .map(n -> n.substring(prefix.length())).filter(t -> t.matches("[0-9]{1,9}")).mapToInt(Integer::parseInt).max().orElse(0);
        orderService.create(order(prefix + String.format("%03d", max + 5), 10)); // a number typed by hand moves the sequence on

        var created = orderService.createBatch(List.of(order("", 100), order(null, 200)));
        assertThat(created).extracting("orderNo")
                .containsExactly(prefix + String.format("%03d", max + 6), prefix + String.format("%03d", max + 7));
    }

    @Test
    void buyerIsOptional() {
        OrderRequest r = order("ZZ-IMP-NOBUYER", 10);
        r.setBuyer(" ");
        assertThat(orderService.create(r).getBuyer()).isNull();
    }

    @Test
    void anInvalidOrderAbortsTheBatchAndNamesTheOrder() {
        assertThatThrownBy(() -> orderService.createBatch(List.of(order("ZZ-IMP-1", 100), order("zz-imp-1", 50))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("zz-imp-1");
        assertThatThrownBy(() -> orderService.createBatch(List.of(order("ZZ-IMP-3", 0))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageStartingWith("Order 'ZZ-IMP-3':");
    }
}
