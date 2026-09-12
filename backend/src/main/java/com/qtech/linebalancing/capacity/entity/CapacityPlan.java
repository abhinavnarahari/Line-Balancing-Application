package com.qtech.linebalancing.capacity.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.style.entity.Style;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "capacity_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CapacityPlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_code", nullable = false, unique = true, length = 50)
    private String planCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "style_id")
    private Style style;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id")
    private OperationBulletin bulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @Column(name = "order_quantity", nullable = false)
    private Integer orderQuantity;

    @Column(name = "available_days", nullable = false)
    @Builder.Default
    private Integer availableDays = 1;

    @Column(name = "target_hourly_output", nullable = false)
    private Integer targetHourlyOutput;

    @Column(name = "planned_efficiency", nullable = false)
    @Builder.Default
    private Double plannedEfficiency = 80.0;

    @Column(name = "allowance_pfd", length = 50)
    @Builder.Default
    private String allowancePfd = "5,4,1";

    @Column(name = "total_smv_minutes", nullable = false)
    @Builder.Default
    private Double totalSmvMinutes = 0.0;

    @Column(name = "customer_takt_secs", nullable = false)
    @Builder.Default
    private Double customerTaktSecs = 0.0;

    @Column(name = "required_design_capacity", nullable = false)
    @Builder.Default
    private Double requiredDesignCapacity = 0.0;

    @Column(name = "designed_pitch_secs", nullable = false)
    @Builder.Default
    private Double designedPitchSecs = 0.0;

    @Column(name = "theoretical_manpower", nullable = false)
    @Builder.Default
    private Double theoreticalManpower = 0.0;

    @Column(name = "planned_manpower", nullable = false)
    @Builder.Default
    private Double plannedManpower = 0.0;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "ACTIVE";
}
