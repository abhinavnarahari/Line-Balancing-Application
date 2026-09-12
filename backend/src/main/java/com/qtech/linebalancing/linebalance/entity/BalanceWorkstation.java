package com.qtech.linebalancing.linebalance.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.linedesign.entity.LineDesign;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "balance_workstations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"line_design_id", "station_index"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BalanceWorkstation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_design_id", nullable = false)
    private LineDesign lineDesign;

    @Column(name = "station_index", nullable = false)
    private Integer stationIndex;

    @Column(name = "station_code", nullable = false, length = 20)
    private String stationCode; // S01, S02, etc.

    @Column(name = "primary_machine_type", length = 100)
    private String primaryMachineType;

    @Column(name = "allocated_operators", nullable = false)
    @Builder.Default
    private Integer allocatedOperators = 1;

    @Column(name = "effective_time_secs", nullable = false)
    @Builder.Default
    private Double effectiveTimeSecs = 0.0;

    @Column(name = "capacity_per_hour", nullable = false)
    @Builder.Default
    private Double capacityPerHour = 0.0;

    @Column(name = "workload_percent", nullable = false)
    @Builder.Default
    private Double workloadPercent = 0.0;

    @Column(name = "is_bottleneck", nullable = false)
    @Builder.Default
    private Boolean isBottleneck = false;

    @OneToMany(mappedBy = "balanceWorkstation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<BalanceStationOperation> operations = new ArrayList<>();

    public void addOperation(BalanceStationOperation operation) {
        operations.add(operation);
        operation.setBalanceWorkstation(this);
    }
}
