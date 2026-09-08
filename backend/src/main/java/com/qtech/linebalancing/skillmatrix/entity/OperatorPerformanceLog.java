package com.qtech.linebalancing.skillmatrix.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Stores one daily performance observation for an operator on a specific operation.
 * The manager (or IE team) records the actual cycle time observed on the shop floor.
 * These records are aggregated by the "Auto-Update" feature to compute performance-based ratings.
 */
@Entity
@Table(name = "operator_performance_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorPerformanceLog extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    /** The date on which this performance was observed. */
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /** Actual time in seconds the operator took to complete one unit of this operation. */
    @Column(name = "actual_cycle_time_seconds", nullable = false)
    private Integer actualCycleTimeSeconds;

    /** Who logged this entry (manager / IE / system). */
    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    /** ERPNext style status: DRAFT or SUBMITTED */
    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "DRAFT";

    @Column(columnDefinition = "TEXT")
    private String notes;
}
