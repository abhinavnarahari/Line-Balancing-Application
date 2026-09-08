package com.qtech.linebalancing.production.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.order.entity.Order;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Stores piece/batch level production completions for an operator.
 * Captures target, completed, good, reject quantities, start/end time, actual time, SAM, and machine.
 */
@Entity
@Table(name = "piece_production_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceProductionLog extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_id")
    private Operation operation;

    @Column(name = "operation_name", length = 150)
    private String operationName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "target_qty", nullable = false)
    @Builder.Default
    private Integer targetQty = 0;

    @Column(name = "completed_qty", nullable = false)
    @Builder.Default
    private Integer completedQty = 0;

    @Column(name = "good_qty", nullable = false)
    @Builder.Default
    private Integer goodQty = 0;

    @Column(name = "reject_qty", nullable = false)
    @Builder.Default
    private Integer rejectQty = 0;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "actual_time_minutes", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal actualTimeMinutes = BigDecimal.ZERO;

    @Column(name = "sam_minutes", nullable = false, precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal samMinutes = new BigDecimal("0.35");

    @Column(name = "machine_code", length = 100)
    private String machineCode;

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    @Column(name = "hour_slot", nullable = false)
    @Builder.Default
    private Integer hourSlot = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
