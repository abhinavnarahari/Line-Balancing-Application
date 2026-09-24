package com.qtech.linebalancing.allocation.entity;

import com.qtech.linebalancing.line.entity.SewingLine;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "operator_allocation_bottlenecks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAllocationBottleneck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "allocation_run_id", nullable = false)
    private OperatorAllocationRun allocationRun;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_id", nullable = false)
    private SewingLine line;

    @Column(name = "line_name", nullable = false, length = 100)
    private String lineName;

    @Column(name = "station_index", nullable = false)
    private Integer stationIndex;

    @Column(name = "station_code", nullable = false, length = 30)
    private String stationCode;

    @Column(name = "operation_name", nullable = false, length = 150)
    private String operationName;

    @Column(name = "required_cycle_time_secs", nullable = false)
    @Builder.Default
    private Double requiredCycleTimeSecs = 0.0;

    @Column(name = "effective_cycle_time_secs", nullable = false)
    @Builder.Default
    private Double effectiveCycleTimeSecs = 0.0;

    @Column(name = "required_skill_level", nullable = false)
    @Builder.Default
    private Integer requiredSkillLevel = 3;

    @Column(name = "assigned_operator_skill")
    private Integer assignedOperatorSkill;

    @Column(name = "required_machine_type", length = 100)
    private String requiredMachineType;

    @Column(name = "bottleneck_reason", nullable = false, length = 255)
    private String bottleneckReason;

    @Column(name = "recommended_action", nullable = false, length = 255)
    private String recommendedAction;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
