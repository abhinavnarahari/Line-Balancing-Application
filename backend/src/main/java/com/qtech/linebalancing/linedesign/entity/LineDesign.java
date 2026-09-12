package com.qtech.linebalancing.linedesign.entity;

import com.qtech.linebalancing.capacity.entity.CapacityPlan;
import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.line.entity.SewingLine;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.order.entity.Order;
import com.qtech.linebalancing.shift.entity.Shift;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "line_designs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LineDesign extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "design_code", nullable = false, unique = true, length = 50)
    private String designCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capacity_plan_id")
    private CapacityPlan capacityPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_id")
    private OperationBulletin bulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id")
    private SewingLine line;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @Column(name = "total_workstations", nullable = false)
    @Builder.Default
    private Integer totalWorkstations = 1;

    @Column(name = "total_operators", nullable = false)
    @Builder.Default
    private Integer totalOperators = 1;

    @Column(name = "total_helpers", nullable = false)
    @Builder.Default
    private Integer totalHelpers = 0;

    @Column(name = "total_qc", nullable = false)
    @Builder.Default
    private Integer totalQc = 0;

    @Column(name = "total_machines", nullable = false)
    @Builder.Default
    private Integer totalMachines = 0;

    @Column(name = "target_hourly_output", nullable = false)
    private Integer targetHourlyOutput;

    @Column(name = "planned_efficiency", nullable = false)
    @Builder.Default
    private Double plannedEfficiency = 80.0;

    @Column(name = "designed_pitch_secs", nullable = false)
    @Builder.Default
    private Double designedPitchSecs = 0.0;

    @Column(name = "line_balance_efficiency", nullable = false)
    @Builder.Default
    private Double lineBalanceEfficiency = 0.0;

    @Column(name = "strategy_name", length = 50)
    private String strategyName;

    @Column(name = "station_allocations", columnDefinition = "TEXT")
    private String stationAllocations;

    @Column(name = "workstations_json", columnDefinition = "TEXT")
    private String workstationsJson;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, BALANCED, APPROVED, RELEASED, ACTIVE, CLOSED

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "released_by", length = 100)
    private String releasedBy;

    @OneToMany(mappedBy = "lineDesign", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LineDesignMachine> machines = new ArrayList<>();

    public void addMachine(LineDesignMachine machine) {
        machines.add(machine);
        machine.setLineDesign(this);
    }
}
