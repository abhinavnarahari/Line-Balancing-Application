package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorAllocationBottleneck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorAllocationBottleneckRepository extends JpaRepository<OperatorAllocationBottleneck, Long> {
    List<OperatorAllocationBottleneck> findByAllocationRunIdOrderByLineIdAscStationIndexAsc(Long allocationRunId);
    List<OperatorAllocationBottleneck> findByAllocationRunIdAndLineId(Long allocationRunId, Long lineId);
}
