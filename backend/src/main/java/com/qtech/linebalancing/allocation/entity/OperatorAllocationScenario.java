package com.qtech.linebalancing.allocation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "operator_allocation_scenarios")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAllocationScenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "allocation_run_id", nullable = false)
    private OperatorAllocationRun allocationRun;

    @Column(name = "scenario_code", nullable = false, length = 50)
    private String scenarioCode; // SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D

    @Column(name = "scenario_title", nullable = false, length = 150)
    private String scenarioTitle;

    @Column(name = "scenario_description", nullable = false, columnDefinition = "TEXT")
    private String scenarioDescription;

    @Column(name = "total_achievable_output", nullable = false)
    @Builder.Default
    private Integer totalAchievableOutput = 0;

    @Column(name = "overall_efficiency", nullable = false)
    @Builder.Default
    private Double overallEfficiency = 0.0;

    @Column(name = "assigned_manpower", nullable = false)
    @Builder.Default
    private Integer assignedManpower = 0;

    @Column(name = "unassigned_manpower", nullable = false)
    @Builder.Default
    private Integer unassignedManpower = 0;

    @Column(name = "total_skill_gaps", nullable = false)
    @Builder.Default
    private Integer totalSkillGaps = 0;

    @Column(name = "total_machine_gaps", nullable = false)
    @Builder.Default
    private Integer totalMachineGaps = 0;

    @Column(name = "main_tradeoffs", columnDefinition = "TEXT")
    private String mainTradeoffs;

    @Column(name = "line_results_json", columnDefinition = "TEXT")
    private String lineResultsJson; // JSON serialized line-wise outputs and efficiencies

    @Column(name = "is_recommended", nullable = false)
    @Builder.Default
    private Boolean isRecommended = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
