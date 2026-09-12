package com.qtech.linebalancing.linebalance.entity;

import com.qtech.linebalancing.linedesign.entity.LineDesign;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "optimization_recommendations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OptimizationRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_design_id", nullable = false)
    private LineDesign lineDesign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "balance_workstation_id")
    private BalanceWorkstation balanceWorkstation;

    @Column(name = "strategy_type", nullable = false, length = 50)
    private String strategyType; // PARALLEL_OP, SPLIT_OPERATION, OPERATOR_SWAP, MACHINE_UPGRADE, COMBINE_STATIONS

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "current_cycle_time_secs")
    private Double currentCycleTimeSecs;

    @Column(name = "projected_cycle_time_secs")
    private Double projectedCycleTimeSecs;

    @Column(name = "projected_capacity_per_hour")
    private Double projectedCapacityPerHour;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PROPOSED"; // PROPOSED, ACCEPTED, REJECTED

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
