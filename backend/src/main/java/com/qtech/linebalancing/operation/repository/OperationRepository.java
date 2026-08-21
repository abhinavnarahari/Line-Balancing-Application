package com.qtech.linebalancing.operation.repository;

import com.qtech.linebalancing.operation.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    List<Operation> findAllByOrderBySequenceAsc();

    List<Operation> findByActiveOrderBySequenceAsc(boolean active);

    boolean existsByOperationCodeIgnoreCase(String operationCode);

    boolean existsByOperationCodeIgnoreCaseAndIdNot(String operationCode, Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<Operation> findByOperationCodeIgnoreCase(String operationCode);
}
