package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorAllocationAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorAllocationAssignmentRepository extends JpaRepository<OperatorAllocationAssignment, Long> {
    List<OperatorAllocationAssignment> findByAllocationRunIdOrderByLineIdAscStationIndexAsc(Long allocationRunId);
    List<OperatorAllocationAssignment> findByAllocationRunIdAndLineIdOrderByStationIndexAsc(Long allocationRunId, Long lineId);
    List<OperatorAllocationAssignment> findByAllocationRunIdAndOperatorId(Long allocationRunId, Long operatorId);
}
