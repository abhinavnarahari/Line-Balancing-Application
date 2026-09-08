package com.qtech.linebalancing.lineplan.repository;

import com.qtech.linebalancing.lineplan.entity.LinePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LinePlanRepository extends JpaRepository<LinePlan, Long> {
    Optional<LinePlan> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);
    void deleteByOrderId(Long orderId);
}
