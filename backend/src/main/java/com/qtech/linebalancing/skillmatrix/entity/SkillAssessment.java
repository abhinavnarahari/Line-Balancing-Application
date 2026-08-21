package com.qtech.linebalancing.skillmatrix.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "skill_assessments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SkillAssessment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    /**
     * Skill rating: 1=Beginner, 2=Basic, 3=Standard, 4=Good, 5=Expert.
     * Scale is subject to business confirmation — stored as-is for flexibility.
     */
    @Column(nullable = false)
    private Integer rating;

    /** Time in seconds to complete one unit of this operation at this skill level. */
    @Column(name = "cycle_time_seconds", nullable = false)
    private Integer cycleTimeSeconds;

    @Column(nullable = false)
    @Builder.Default
    private Integer revision = 1;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    /**
     * Only one record per operator+operation pair should have isCurrent=true.
     * Enforced by a partial unique index on the DB.
     */
    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private boolean isCurrent = true;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
