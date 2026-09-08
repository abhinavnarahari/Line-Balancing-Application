package com.qtech.linebalancing.machine.repository;

import com.qtech.linebalancing.machine.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    List<Machine> findByActive(boolean active);
    List<Machine> findByLineId(Long lineId);
    List<Machine> findByMachineType(String machineType);
    Optional<Machine> findByMachineCode(String machineCode);
    boolean existsByMachineCode(String machineCode);
    boolean existsByMachineCodeAndIdNot(String machineCode, Long id);
}
