package com.qtech.linebalancing.linebalance.repository;

import com.qtech.linebalancing.linebalance.entity.OperatorStationPlacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorStationPlacementRepository extends JpaRepository<OperatorStationPlacement, Long> {
    List<OperatorStationPlacement> findByLineDesignId(Long lineDesignId);
    Optional<OperatorStationPlacement> findByBalanceWorkstationId(Long balanceWorkstationId);
}
