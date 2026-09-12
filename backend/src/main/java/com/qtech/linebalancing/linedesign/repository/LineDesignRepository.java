package com.qtech.linebalancing.linedesign.repository;

import com.qtech.linebalancing.linedesign.entity.LineDesign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LineDesignRepository extends JpaRepository<LineDesign, Long> {
    Optional<LineDesign> findByDesignCode(String designCode);
    List<LineDesign> findByOrderId(Long orderId);
    List<LineDesign> findByLineId(Long lineId);
    List<LineDesign> findByCapacityPlanId(Long capacityPlanId);
    List<LineDesign> findByStatus(String status);
}
