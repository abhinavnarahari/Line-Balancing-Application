package com.qtech.linebalancing.shiftassignment.repository;

import com.qtech.linebalancing.shiftassignment.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {

    List<ShiftAssignment> findAllByOrderByCreatedAtDesc();

    List<ShiftAssignment> findByOperatorIdOrderByEffectiveFromDesc(Long operatorId);

    /**
     * Find active (open-ended) assignments for an operator.
     * Business rule: only ONE should exist at a time.
     */
    @Query("SELECT sa FROM ShiftAssignment sa WHERE sa.operator.id = :operatorId AND sa.effectiveTo IS NULL")
    List<ShiftAssignment> findActiveAssignmentsByOperator(@Param("operatorId") Long operatorId);

    /** Assignments of one operator covering a date, most recent start first. */
    @Query("""
            SELECT sa FROM ShiftAssignment sa
            WHERE sa.operator.id = :operatorId
              AND sa.effectiveFrom <= :date
              AND (sa.effectiveTo IS NULL OR sa.effectiveTo >= :date)
            ORDER BY sa.effectiveFrom DESC, sa.id DESC
            """)
    List<ShiftAssignment> findAssignmentsCovering(
            @Param("operatorId") Long operatorId,
            @Param("date") java.time.LocalDate date);

    /**
     * The operator's assignment on a given date. If legacy data has overlapping assignments, the most recently
     * started one wins (a single-result query would throw IncorrectResultSizeDataAccessException instead).
     */
    default Optional<ShiftAssignment> findCurrentAssignment(Long operatorId, java.time.LocalDate date) {
        return findAssignmentsCovering(operatorId, date).stream().findFirst();
    }

    /** All assignments covering a date, most recent start first (one query for the operator pool). */
    @Query("""
            SELECT sa FROM ShiftAssignment sa
            WHERE sa.effectiveFrom <= :date
              AND (sa.effectiveTo IS NULL OR sa.effectiveTo >= :date)
            ORDER BY sa.effectiveFrom DESC, sa.id DESC
            """)
    List<ShiftAssignment> findAllCovering(@Param("date") java.time.LocalDate date);
}
