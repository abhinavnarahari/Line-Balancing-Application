package com.qtech.linebalancing.allocation.repository;

import com.qtech.linebalancing.allocation.entity.OperatorMachineQualification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatorMachineQualificationRepository extends JpaRepository<OperatorMachineQualification, Long> {
    List<OperatorMachineQualification> findByOperatorId(Long operatorId);
    List<OperatorMachineQualification> findByMachineTypeIgnoreCase(String machineType);
    Optional<OperatorMachineQualification> findByOperatorIdAndMachineTypeIgnoreCase(Long operatorId, String machineType);
}
