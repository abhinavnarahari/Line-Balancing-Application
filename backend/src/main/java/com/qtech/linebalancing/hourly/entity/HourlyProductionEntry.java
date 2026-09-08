package com.qtech.linebalancing.hourly.entity;

import com.qtech.linebalancing.lineplan.entity.LinePlan;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "hourly_production_entries",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_hpe_key",
        columnNames = {"line_plan_id","operation_id","operator_id","log_date","shift_hour"}
    )
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HourlyProductionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_plan_id", nullable = false)
    private LinePlan linePlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @Column(name = "log_date", nullable = false)
    @Builder.Default
    private LocalDate logDate = LocalDate.now();

    @Column(name = "shift_hour", nullable = false)
    private Integer shiftHour;

    @Column(name = "hour_start_time")
    private LocalTime hourStartTime;

    @Column(name = "hour_end_time")
    private LocalTime hourEndTime;

    @Column(name = "target_qty", nullable = false)
    @Builder.Default
    private Integer targetQty = 0;

    @Column(name = "actual_qty", nullable = false)
    @Builder.Default
    private Integer actualQty = 0;

    @Column(name = "good_qty", nullable = false)
    @Builder.Default
    private Integer goodQty = 0;

    @Column(name = "reject_qty", nullable = false)
    @Builder.Default
    private Integer rejectQty = 0;

    @Column(name = "sam_minutes", nullable = false, precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal samMinutes = new BigDecimal("0.35");

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}