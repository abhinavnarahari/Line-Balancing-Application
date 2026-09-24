package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorAllocationAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorAllocationAuditRepository extends JpaRepository<OperatorAllocationAudit, Long> {
    List<OperatorAllocationAudit> findByAllocationRunIdOrderByCreatedAtDesc(Long allocationRunId);
}
