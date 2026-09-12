package com.qtech.linebalancing.linebalance.entity;

import com.qtech.linebalancing.linedesign.entity.LineDesign;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "operator_station_placements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorStationPlacement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_design_id", nullable = false)
    private LineDesign lineDesign;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "balance_workstation_id", nullable = false)
    private BalanceWorkstation balanceWorkstation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id")
    private Operator operator;

    @Column(name = "required_skill_level", nullable = false)
    @Builder.Default
    private Integer requiredSkillLevel = 3;

    @Column(name = "actual_skill_level")
    private Integer actualSkillLevel;

    @Column(name = "match_status", nullable = false, length = 50)
    @Builder.Default
    private String matchStatus = "MATCH"; // EXCELLENT, MATCH, GAP, TRAINING_REQUIRED, UNASSIGNED

    @Column(length = 255)
    private String notes;
}
