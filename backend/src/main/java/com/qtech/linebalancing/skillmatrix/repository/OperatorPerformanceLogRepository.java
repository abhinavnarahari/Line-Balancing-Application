package com.qtech.linebalancing.skillmatrix.repository;

import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorPerformanceLogRepository extends JpaRepository<OperatorPerformanceLog, Long> {

    /** All logs across all operators, newest first. */
    List<OperatorPerformanceLog> findAllByOrderByLogDateDesc();

    /** All logs for a specific operator, newest first. */
    List<OperatorPerformanceLog> findByOperatorIdOrderByLogDateDesc(Long operatorId);

    /** All logs for a specific operator + operation, newest first. */
    List<OperatorPerformanceLog> findByOperatorIdAndOperationIdOrderByLogDateDesc(Long operatorId, Long operationId);

    /** Bulk load for the optimizer: rows of [operatorId, operationId, actualCycleTimeSeconds]. */
    @Query("SELECT pl.operator.id, pl.operation.id, pl.actualCycleTimeSeconds FROM OperatorPerformanceLog pl " +
           "WHERE pl.operator.id IN :operatorIds AND pl.operation.id IN :operationIds")
    List<Object[]> findCycleTimes(@org.springframework.data.repository.query.Param("operatorIds") java.util.Collection<Long> operatorIds,
                                  @org.springframework.data.repository.query.Param("operationIds") java.util.Collection<Long> operationIds);

    /**
     * Returns a list of [operationId, avgCycleTimeSeconds] pairs for a given operator.
     * Used by the auto-update algorithm to derive ratings.
     */
    @Query("SELECT pl.operation.id, AVG(pl.actualCycleTimeSeconds) " +
           "FROM OperatorPerformanceLog pl " +
           "WHERE pl.operator.id = :operatorId " +
           "GROUP BY pl.operation.id")
    List<Object[]> findAvgCycleTimeByOperator(@Param("operatorId") Long operatorId);
}
