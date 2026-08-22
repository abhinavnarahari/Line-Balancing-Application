package com.qtech.linebalancing.skillmatrix.repository;

import com.qtech.linebalancing.skillmatrix.entity.OperatorPerformanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperatorPerformanceLogRepository extends JpaRepository<OperatorPerformanceLog, Long> {

    /** All logs for a specific operator, newest first. */
    List<OperatorPerformanceLog> findByOperatorIdOrderByLogDateDesc(Long operatorId);

    /** All logs for a specific operator + operation, newest first. */
    List<OperatorPerformanceLog> findByOperatorIdAndOperationIdOrderByLogDateDesc(Long operatorId, Long operationId);

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
