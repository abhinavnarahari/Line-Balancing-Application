package com.qtech.linebalancing.skillmatrix.repository;

import com.qtech.linebalancing.skillmatrix.entity.SkillAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillAssessmentRepository extends JpaRepository<SkillAssessment, Long> {

    /** All current (latest revision) assessments. */
    List<SkillAssessment> findByIsCurrentTrueOrderByOperatorIdAscOperationIdAsc();

    /** Current assessment for a specific operator+operation. */
    @Query("SELECT sa FROM SkillAssessment sa WHERE sa.operator.id = :opId AND sa.operation.id = :opnId AND sa.isCurrent = true")
    Optional<SkillAssessment> findCurrentByOperatorAndOperation(
            @Param("opId") Long operatorId, @Param("opnId") Long operationId);

    /** Full revision history for a specific operator+operation. */
    @Query("SELECT sa FROM SkillAssessment sa WHERE sa.operator.id = :opId AND sa.operation.id = :opnId ORDER BY sa.revision DESC")
    List<SkillAssessment> findHistoryByOperatorAndOperation(
            @Param("opId") Long operatorId, @Param("opnId") Long operationId);

    /** All assessments for a specific operator (current and history). */
    List<SkillAssessment> findByOperatorIdOrderByOperationIdAscRevisionDesc(Long operatorId);

    /** All assessments for a specific operation (current and history). */
    List<SkillAssessment> findByOperationIdOrderByOperatorIdAscRevisionDesc(Long operationId);

    /** Get the maximum revision number for a given operator+operation combo. */
    @Query("SELECT COALESCE(MAX(sa.revision), 0) FROM SkillAssessment sa WHERE sa.operator.id = :opId AND sa.operation.id = :opnId")
    Integer findMaxRevision(@Param("opId") Long operatorId, @Param("opnId") Long operationId);

    /** Mark all current assessments for a given operator+operation as no longer current. */
    @Modifying
    @Query("UPDATE SkillAssessment sa SET sa.isCurrent = false WHERE sa.operator.id = :opId AND sa.operation.id = :opnId AND sa.isCurrent = true")
    void markPreviousAsNotCurrent(@Param("opId") Long operatorId, @Param("opnId") Long operationId);
}
