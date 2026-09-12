package com.qtech.linebalancing.capacity.repository;

import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CapacityPlanRepository extends JpaRepository<CapacityPlan, Long> {
    Optional<CapacityPlan> findByPlanCode(String planCode);
    List<CapacityPlan> findByOrderId(Long orderId);
    List<CapacityPlan> findByStatus(String status);
}
