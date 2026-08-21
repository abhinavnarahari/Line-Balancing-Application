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

    /**
     * Find the current active assignment for an operator on a given date.
     */
    @Query("""
            SELECT sa FROM ShiftAssignment sa
            WHERE sa.operator.id = :operatorId
              AND sa.effectiveFrom <= :date
              AND (sa.effectiveTo IS NULL OR sa.effectiveTo >= :date)
            ORDER BY sa.effectiveFrom DESC
            """)
    Optional<ShiftAssignment> findCurrentAssignment(
            @Param("operatorId") Long operatorId,
            @Param("date") java.time.LocalDate date);
}
