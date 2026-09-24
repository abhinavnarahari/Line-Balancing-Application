package com.qtech.linebalancing.allocation.entity;

import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "operator_allocation_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAllocationAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "allocation_run_id", nullable = false)
    private OperatorAllocationRun allocationRun;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_id", nullable = false)
    private SewingLine line;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_design_id")
    private LineDesign lineDesign;

    @Column(name = "station_index", nullable = false)
    private Integer stationIndex;

    @Column(name = "station_code", nullable = false, length = 30)
    private String stationCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @Column(name = "operation_name", nullable = false, length = 150)
    private String operationName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_line_id")
    private BulletinLine bulletinLine;

    @Column(name = "required_machine_type", length = 100)
    private String requiredMachineType;

    @Column(name = "required_skill_level", nullable = false)
    @Builder.Default
    private Integer requiredSkillLevel = 3;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @Column(name = "operator_name", length = 150)
    private String operatorName;

    @Column(name = "operator_code", length = 50)
    private String operatorCode;

    @Column(name = "assigned_skill_level")
    private Integer assignedSkillLevel;

    @Column(name = "performance_source", nullable = false, length = 30)
    @Builder.Default
    private String performanceSource = "CALIBRATED"; // HISTORICAL, CALIBRATED, ESTIMATED, MISSING

    @Column(name = "standard_smv", nullable = false)
    @Builder.Default
    private Double standardSmv = 0.0;

    @Column(name = "effective_cycle_time_secs", nullable = false)
    @Builder.Default
    private Double effectiveCycleTimeSecs = 0.0;

    @Column(name = "operator_efficiency_percent", nullable = false)
    @Builder.Default
    private Double operatorEfficiencyPercent = 80.0;

    @Column(name = "match_status", nullable = false, length = 50)
    @Builder.Default
    private String matchStatus = "MATCH"; // EXCELLENT, MATCH, SKILL_GAP, MACHINE_GAP, TRAINEE, UNASSIGNED

    @Column(name = "is_bottleneck", nullable = false)
    @Builder.Default
    private Boolean isBottleneck = false;

    @Column(name = "is_fixed", nullable = false)
    @Builder.Default
    private Boolean isFixed = false;

    @Column(length = 255)
    private String notes;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
