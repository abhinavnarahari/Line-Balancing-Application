package com.qtech.linebalancing.production.repository;

import com.qtech.linebalancing.production.entity.PieceProductionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PieceProductionLogRepository extends JpaRepository<PieceProductionLog, Long> {

    /** One row per day with production: [logDate, run count, good pieces]. Used by the date pickers. */
    @Query("SELECT p.logDate, COUNT(p), COALESCE(SUM(p.goodQty), 0) FROM PieceProductionLog p GROUP BY p.logDate ORDER BY p.logDate")
    java.util.List<Object[]> summarizeByDate();

    boolean existsByOrderId(Long orderId);

    /** Most recent production log (used to point users at the latest day with data). */
    java.util.Optional<PieceProductionLog> findTopByOrderByLogDateDesc();

    /** Good pieces per order: rows of [orderId, sum(goodQty)]. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT p.order.id, COALESCE(SUM(p.goodQty), 0) FROM PieceProductionLog p WHERE p.order IS NOT NULL GROUP BY p.order.id")
    List<Object[]> sumGoodQtyByOrder();

    @org.springframework.data.jpa.repository.Query(
            "SELECT COALESCE(SUM(p.goodQty), 0) FROM PieceProductionLog p WHERE p.order.id = :orderId")
    Long sumGoodQtyForOrder(@org.springframework.data.repository.query.Param("orderId") Long orderId);

    List<PieceProductionLog> findByLogDateOrderByStartTimeAsc(LocalDate logDate);

    List<PieceProductionLog> findByOperatorIdAndLogDateOrderByStartTimeAsc(Long operatorId, LocalDate logDate);

    List<PieceProductionLog> findByOperatorIdOrderByLogDateDescStartTimeDesc(Long operatorId);

    @Query("SELECT p FROM PieceProductionLog p LEFT JOIN FETCH p.operator LEFT JOIN FETCH p.operation LEFT JOIN FETCH p.order WHERE p.logDate = :logDate ORDER BY p.operator.id, p.startTime")
    List<PieceProductionLog> findAllWithDetailsByLogDate(@Param("logDate") LocalDate logDate);

    @Query("SELECT p FROM PieceProductionLog p LEFT JOIN FETCH p.operator LEFT JOIN FETCH p.operation LEFT JOIN FETCH p.order ORDER BY p.logDate DESC, p.startTime DESC")
    List<PieceProductionLog> findAllWithDetails();

    @Query("SELECT p FROM PieceProductionLog p LEFT JOIN FETCH p.operator LEFT JOIN FETCH p.operation LEFT JOIN FETCH p.order WHERE p.order.id = :orderId ORDER BY p.logDate DESC, p.startTime DESC")
    List<PieceProductionLog> findAllWithDetailsByOrderId(@Param("orderId") Long orderId);
}
