package com.qtech.linebalancing.lineplan.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.shift.entity.Shift;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "line_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LinePlan extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id")
    private com.qtech.linebalancing.line.entity.SewingLine line;

    @Column(name = "target_output", nullable = false)
    private Integer targetOutput;

    @Column(nullable = false)
    @Builder.Default
    private Integer allowance = 10;

    @Column(name = "allowance_pfd", length = 100)
    @Builder.Default
    private String allowancePfd = "5,4,1";

    @Column(name = "planned_efficiency")
    @Builder.Default
    private Double plannedEfficiency = 80.0;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "draft"; // draft, active, completed

    @OneToMany(mappedBy = "linePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LinePlanAssignment> assignments = new ArrayList<>();

    public void addAssignment(LinePlanAssignment assignment) {
        assignments.add(assignment);
        assignment.setLinePlan(this);
    }
}
