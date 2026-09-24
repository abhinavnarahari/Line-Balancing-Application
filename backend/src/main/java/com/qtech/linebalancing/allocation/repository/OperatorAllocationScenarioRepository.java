package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorAllocationScenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorAllocationScenarioRepository extends JpaRepository<OperatorAllocationScenario, Long> {
    List<OperatorAllocationScenario> findByAllocationRunIdOrderByScenarioCodeAsc(Long allocationRunId);
    Optional<OperatorAllocationScenario> findByAllocationRunIdAndScenarioCode(Long allocationRunId, String scenarioCode);
}
