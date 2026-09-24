package com.qtech.linebalancing.allocation.entity;

import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "operator_allocation_audits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAllocationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "allocation_run_id", nullable = false)
    private OperatorAllocationRun allocationRun;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // OPTIMIZE, OVERRIDE, APPROVE, REJECT, APPLY, PIN_OPERATOR

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id")
    private SewingLine line;

    @Column(name = "station_code", length = 30)
    private String stationCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
