package com.qtech.linebalancing.common;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.operationbulletin.dto.BulletinRequest;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operationbulletin.service.OperationBulletinService;
import com.qtech.linebalancing.order.dto.OrderRequest;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.order.repository.OrderRepository;
import com.qtech.linebalancing.order.service.OrderService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** REL-01. Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class OptimisticLockingTest {

    @Autowired private OperationBulletinService bulletinService;
    @Autowired private OperationBulletinRepository bulletinRepository;
    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private EntityManager em;

    @Test
    void staleBulletinEditIsRejectedAndSavesIncrementTheVersion() {
        OperationBulletin source = bulletinRepository.findAll().stream().findFirst().orElse(null);
        assumeThat(source).isNotNull();
        Long id = bulletinService.createRevision(source.getId()).getId();
        em.flush();
        long loaded = bulletinRepository.findById(id).orElseThrow().getRowVersion();

        BulletinRequest stale = new BulletinRequest();
        stale.setRowVersion(loaded + 7);
        assertThatThrownBy(() -> bulletinService.update(id, stale))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("changed by someone else");

        var response = bulletinService.updateStatus(id, OperationBulletin.Status.UNDER_REVIEW, "tester");
        assertThat(response.getRowVersion()).as("response carries the new version").isEqualTo(loaded + 1);
        em.flush();
        em.clear();
        assertThat(bulletinRepository.findById(id).orElseThrow().getRowVersion()).isEqualTo(loaded + 1);
    }

    @Test
    void staleOrderEditIsRejected() {
        Order order = orderRepository.findAll().stream().findFirst().orElse(null);
        assumeThat(order).isNotNull();
        OrderRequest stale = new OrderRequest();
        stale.setRowVersion(order.getRowVersion() + 3);
        assertThatThrownBy(() -> orderService.update(order.getId(), stale))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("changed by someone else");
    }
}
