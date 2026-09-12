package com.qtech.linebalancing.linebalance.repository;

import com.qtech.linebalancing.linebalance.entity.BalanceWorkstation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BalanceWorkstationRepository extends JpaRepository<BalanceWorkstation, Long> {
    List<BalanceWorkstation> findByLineDesignIdOrderByStationIndexAsc(Long lineDesignId);
    Optional<BalanceWorkstation> findByLineDesignIdAndStationIndex(Long lineDesignId, Integer stationIndex);
}
