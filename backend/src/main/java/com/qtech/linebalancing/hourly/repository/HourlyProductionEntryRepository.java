package com.qtech.linebalancing.hourly.repository;

import com.qtech.linebalancing.hourly.entity.HourlyProductionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HourlyProductionEntryRepository extends JpaRepository<HourlyProductionEntry, Long> {

    @Query("SELECT e FROM HourlyProductionEntry e " +
           "JOIN FETCH e.operation " +
           "JOIN FETCH e.operator " +
           "WHERE e.linePlan.id = :linePlanId AND e.logDate = :logDate " +
           "ORDER BY e.operation.sequence, e.shiftHour")
    List<HourlyProductionEntry> findByLinePlanIdAndLogDate(
            @Param("linePlanId") Long linePlanId,
            @Param("logDate") LocalDate logDate);

    @Query("SELECT e FROM HourlyProductionEntry e " +
           "WHERE e.linePlan.id = :linePlanId " +
           "  AND e.operation.id = :operationId " +
           "  AND e.operator.id = :operatorId " +
           "  AND e.logDate = :logDate " +
           "  AND e.shiftHour = :shiftHour")
    Optional<HourlyProductionEntry> findByKey(
            @Param("linePlanId") Long linePlanId,
            @Param("operationId") Long operationId,
            @Param("operatorId") Long operatorId,
            @Param("logDate") LocalDate logDate,
            @Param("shiftHour") Integer shiftHour);
}