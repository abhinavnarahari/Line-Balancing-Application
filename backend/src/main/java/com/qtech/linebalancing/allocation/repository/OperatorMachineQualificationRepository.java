package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorMachineQualification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorMachineQualificationRepository extends JpaRepository<OperatorMachineQualification, Long> {
    List<OperatorMachineQualification> findByOperatorId(Long operatorId);

    /** Bulk load for the optimizer: rows of [operatorId, lower(machineType), qualificationLevel]. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT q.operator.id, LOWER(q.machineType), q.qualificationLevel FROM OperatorMachineQualification q WHERE q.operator.id IN :operatorIds")
    List<Object[]> findLevelsForOperators(@org.springframework.data.repository.query.Param("operatorIds") java.util.Collection<Long> operatorIds);
    List<OperatorMachineQualification> findByMachineTypeIgnoreCase(String machineType);
    Optional<OperatorMachineQualification> findByOperatorIdAndMachineTypeIgnoreCase(Long operatorId, String machineType);
}
