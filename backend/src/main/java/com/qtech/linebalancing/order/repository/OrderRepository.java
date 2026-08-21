package com.qtech.linebalancing.order.repository;

import com.qtech.linebalancing.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByOrderByCreatedAtDesc();
    boolean existsByOrderNoIgnoreCase(String orderNo);
    boolean existsByOrderNoIgnoreCaseAndIdNot(String orderNo, Long id);
}
