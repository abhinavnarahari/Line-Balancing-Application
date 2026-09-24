package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorAllocationRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorAllocationRunRepository extends JpaRepository<OperatorAllocationRun, Long> {
    Optional<OperatorAllocationRun> findByRunCode(String runCode);
    List<OperatorAllocationRun> findByPlanningDateOrderByCreatedAtDesc(LocalDate planningDate);
    List<OperatorAllocationRun> findAllByOrderByCreatedAtDesc();
}
