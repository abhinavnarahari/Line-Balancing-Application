package com.qtech.linebalancing.order;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.order.service.OrderService;
import com.qtech.linebalancing.production.repository.PieceProductionLogRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** REL-04. Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class OrderDeletionGuardTest {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PieceProductionLogRepository pieceLogRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager em;

    @Test
    void orderInProductionCannotBeDeleted() {
        Order order = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.Status.IN_PRODUCTION).findFirst().orElse(null);
        assumeThat(order).isNotNull();
        assertThatThrownBy(() -> orderService.delete(order.getId()))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("cannot be deleted");
        assertThat(orderRepository.existsById(order.getId())).isTrue();
    }

    @Test
    void plannedOrderWithRecordedProductionCannotBeDeleted() {
        Long orderId = pieceLogRepository.findAll().stream()
                .filter(l -> l.getOrder() != null).map(l -> l.getOrder().getId()).findFirst().orElse(null);
        assumeThat(orderId).isNotNull();
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(Order.Status.PLANNED);
        orderRepository.saveAndFlush(order);

        assertThatThrownBy(() -> orderService.delete(orderId))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("recorded production");
    }

    @Test
    void productionHistoryForeignKeysAreRestrict() {
        Integer cascading = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM pg_constraint
                WHERE conname IN ('fk_ppl_operator', 'fk_hpe_operator', 'fk_hpe_operation') AND confdeltype = 'c'
                """, Integer.class);
        assertThat(cascading).isZero();
        em.clear();
    }
}
