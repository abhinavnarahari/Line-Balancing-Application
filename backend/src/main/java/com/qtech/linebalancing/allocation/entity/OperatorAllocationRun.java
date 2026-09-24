package com.qtech.linebalancing.allocation.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.shift.entity.Shift;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "operator_allocation_runs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAllocationRun extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_code", nullable = false, unique = true, length = 50)
    private String runCode;

    @Column(name = "planning_date", nullable = false)
    private LocalDate planningDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @Column(name = "plant_location", nullable = false, length = 100)
    @Builder.Default
    private String plantLocation = "Unit 1 - Main Apparel Complex";

    @Column(name = "selected_line_ids", nullable = false, length = 255)
    private String selectedLineIds; // e.g. "1,2,3"

    @Column(name = "solver_status", nullable = false, length = 50)
    @Builder.Default
    private String solverStatus = "OPTIMAL"; // OPTIMAL, FEASIBLE, TIME_LIMIT_BEST_FOUND, INFEASIBLE, INVALID_INPUT

    @Column(name = "total_selected_lines", nullable = false)
    @Builder.Default
    private Integer totalSelectedLines = 0;

    @Column(name = "total_available_operators", nullable = false)
    @Builder.Default
    private Integer totalAvailableOperators = 0;

    @Column(name = "total_assigned_operators", nullable = false)
    @Builder.Default
    private Integer totalAssignedOperators = 0;

    @Column(name = "total_unassigned_operators", nullable = false)
    @Builder.Default
    private Integer totalUnassignedOperators = 0;

    @Column(name = "total_designed_output", nullable = false)
    @Builder.Default
    private Integer totalDesignedOutput = 0;

    @Column(name = "total_achievable_output", nullable = false)
    @Builder.Default
    private Integer totalAchievableOutput = 0;

    @Column(name = "overall_designed_efficiency", nullable = false)
    @Builder.Default
    private Double overallDesignedEfficiency = 0.0;

    @Column(name = "overall_achievable_efficiency", nullable = false)
    @Builder.Default
    private Double overallAchievableEfficiency = 0.0;

    @Column(name = "target_achievement_percent", nullable = false)
    @Builder.Default
    private Double targetAchievementPercent = 0.0;

    @Column(name = "total_skill_gaps", nullable = false)
    @Builder.Default
    private Integer totalSkillGaps = 0;

    @Column(name = "total_machine_gaps", nullable = false)
    @Builder.Default
    private Integer totalMachineGaps = 0;

    @Column(name = "total_bottleneck_stations", nullable = false)
    @Builder.Default
    private Integer totalBottleneckStations = 0;

    @Column(name = "solver_runtime_ms", nullable = false)
    @Builder.Default
    private Long solverRuntimeMs = 0L;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OPTIMIZED"; // DRAFT, VALIDATED, OPTIMIZED, IE_REVIEW, APPROVED, APPLIED, ARCHIVED

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "applied_by", length = 100)
    private String appliedBy;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "created_by", nullable = false, length = 100)
    @Builder.Default
    private String createdBy = "Industrial Engineer";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "allocationRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperatorAllocationAssignment> assignments = new ArrayList<>();

    @OneToMany(mappedBy = "allocationRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperatorAllocationBottleneck> bottlenecks = new ArrayList<>();

    @OneToMany(mappedBy = "allocationRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperatorAllocationScenario> scenarios = new ArrayList<>();

    @OneToMany(mappedBy = "allocationRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperatorAllocationAudit> audits = new ArrayList<>();

    public void addAssignment(OperatorAllocationAssignment assignment) {
        assignments.add(assignment);
        assignment.setAllocationRun(this);
    }

    public void addBottleneck(OperatorAllocationBottleneck bottleneck) {
        bottlenecks.add(bottleneck);
        bottleneck.setAllocationRun(this);
    }

    public void addScenario(OperatorAllocationScenario scenario) {
        scenarios.add(scenario);
        scenario.setAllocationRun(this);
    }

    public void addAudit(OperatorAllocationAudit audit) {
        audits.add(audit);
        audit.setAllocationRun(this);
    }
}
