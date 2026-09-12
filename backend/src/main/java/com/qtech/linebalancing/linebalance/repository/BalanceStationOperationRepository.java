package com.qtech.linebalancing.linebalance.repository;

import com.qtech.linebalancing.linebalance.entity.BalanceStationOperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BalanceStationOperationRepository extends JpaRepository<BalanceStationOperation, Long> {
    List<BalanceStationOperation> findByBalanceWorkstationIdOrderBySequenceAsc(Long balanceWorkstationId);
}
