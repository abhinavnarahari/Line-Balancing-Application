package com.qtech.linebalancing.operation.repository;

import com.qtech.linebalancing.operation.entity.OperationAffinity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationAffinityRepository extends JpaRepository<OperationAffinity, Long> {

    @Query("SELECT a FROM OperationAffinity a JOIN FETCH a.primaryOperation JOIN FETCH a.alternativeOperation WHERE a.primaryOperation.id = :primaryOpId")
    List<OperationAffinity> findByPrimaryOperationId(@Param("primaryOpId") Long primaryOpId);

    @Query("SELECT a FROM OperationAffinity a JOIN FETCH a.primaryOperation JOIN FETCH a.alternativeOperation WHERE a.alternativeOperation.id = :altOpId")
    List<OperationAffinity> findByAlternativeOperationId(@Param("altOpId") Long altOpId);

    Optional<OperationAffinity> findByPrimaryOperationIdAndAlternativeOperationId(Long primaryOpId, Long altOpId);

    boolean existsByPrimaryOperationIdAndAlternativeOperationId(Long primaryOpId, Long altOpId);

    @Query("SELECT a FROM OperationAffinity a JOIN FETCH a.primaryOperation JOIN FETCH a.alternativeOperation ORDER BY a.primaryOperation.sequence ASC, a.affinityLevel ASC")
    List<OperationAffinity> findAllWithOperations();
}
