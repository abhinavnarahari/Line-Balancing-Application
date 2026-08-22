package com.qtech.linebalancing.lineplan.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "line_plan_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LinePlanAssignment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_plan_id", nullable = false)
    private LinePlan linePlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bulletin_line_id", nullable = false)
    private BulletinLine bulletinLine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator; // Can be null if unassigned
}
