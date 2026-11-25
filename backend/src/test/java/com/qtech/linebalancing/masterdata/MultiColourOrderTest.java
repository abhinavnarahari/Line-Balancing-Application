package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.order.dto.OrderRequest;
import com.qtech.linebalancing.order.dto.OrderSizeLineRequest;
import com.qtech.linebalancing.order.entity.Order;
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

/** Single- and multi-colour orders. Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class MultiColourOrderTest {

    @Autowired private OrderService orderService;
    @Autowired private JdbcTemplate jdbc;
    private Long styleId, s, m;

    @BeforeEach
    void masters() {
        styleId = jdbc.queryForObject("INSERT INTO styles (style_no) VALUES ('ZZ-MC-STYLE') RETURNING id", Long.class);
        s = jdbc.queryForObject("INSERT INTO sizes (code, label) VALUES ('ZZS', 'ZZ S') RETURNING id", Long.class);
        m = jdbc.queryForObject("INSERT INTO sizes (code, label) VALUES ('ZZM', 'ZZ M') RETURNING id", Long.class);
    }

    private OrderSizeLineRequest line(String color, Long sizeId, int qty) {
        OrderSizeLineRequest l = new OrderSizeLineRequest();
        l.setColor(color); l.setSizeId(sizeId); l.setQuantity(qty);
        return l;
    }

    private OrderRequest order(Order.OrderType type, String color, OrderSizeLineRequest... lines) {
        OrderRequest r = new OrderRequest();
        r.setStyleId(styleId); r.setOrderType(type); r.setColor(color);
        r.setOrderDate(LocalDate.now()); r.setDeliveryDate(LocalDate.now().plusDays(20));
        r.setSizeLines(List.of(lines));
        return r;
    }

    @Test
    void singleColourOrderTakesTheOrderColourOnEveryLine() {
        var o = orderService.create(order(Order.OrderType.SINGLE_COLOR, "Navy", line(null, s, 100), line("", m, 200)));
        assertThat(o.getOrderType()).isEqualTo(Order.OrderType.SINGLE_COLOR);
        assertThat(o.getColor()).isEqualTo("Navy");
        assertThat(o.getSizeLines()).extracting("color").containsOnly("Navy");
        assertThat(o.getTotalQuantity()).isEqualTo(300);
    }

    @Test
    void multiColourOrderKeepsEachColoursSizesAndSummarisesTheColours() {
        var o = orderService.create(order(Order.OrderType.MULTI_COLOR, null,
                line("BLACK", s, 100), line("BLACK", m, 200), line("WHITE", s, 50), line("black", s, 10)));
        assertThat(o.getOrderType()).isEqualTo(Order.OrderType.MULTI_COLOR);
        assertThat(o.getColor()).isEqualTo("BLACK, WHITE");
        assertThat(o.getSizeLines()).extracting("color", "quantity")
                .containsExactlyInAnyOrder(org.assertj.core.groups.Tuple.tuple("BLACK", 110), org.assertj.core.groups.Tuple.tuple("BLACK", 200), org.assertj.core.groups.Tuple.tuple("WHITE", 50));
        assertThat(o.getTotalQuantity()).isEqualTo(360);
    }

    @Test
    void typeIsInferredWhenNotGiven() {
        assertThat(orderService.create(order(null, null, line("RED", s, 1), line("BLUE", s, 1))).getOrderType()).isEqualTo(Order.OrderType.MULTI_COLOR);
        assertThat(orderService.create(order(null, "RED", line(null, s, 1))).getOrderType()).isEqualTo(Order.OrderType.SINGLE_COLOR);
    }

    @Test
    void typeAndColoursMustAgree() {
        assertThatThrownBy(() -> orderService.create(order(Order.OrderType.SINGLE_COLOR, null, line("RED", s, 1), line("BLUE", s, 1))))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("only one colour");
        assertThatThrownBy(() -> orderService.create(order(Order.OrderType.MULTI_COLOR, null, line("RED", s, 1), line("RED", m, 1))))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("at least two colours");
        assertThatThrownBy(() -> orderService.create(order(Order.OrderType.SINGLE_COLOR, null, line(null, s, 1))))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("needs a colour");
    }

    @Test
    void editingCanTurnASingleColourOrderIntoAMultiColourOne() {
        var o = orderService.create(order(Order.OrderType.SINGLE_COLOR, "Navy", line(null, s, 100), line(null, m, 100)));
        OrderRequest edit = order(Order.OrderType.MULTI_COLOR, null, line("Navy", s, 120), line("Grey", s, 80), line("Grey", m, 40));
        edit.setOrderNo(o.getOrderNo());
        var updated = orderService.update(o.getId(), edit);
        assertThat(updated.getOrderType()).isEqualTo(Order.OrderType.MULTI_COLOR);
        assertThat(updated.getColor()).isEqualTo("Navy, Grey");
        assertThat(updated.getTotalQuantity()).isEqualTo(240);
        assertThat(updated.getSizeLines()).hasSize(3);
    }
}
