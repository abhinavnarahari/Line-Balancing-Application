package com.qtech.linebalancing.linebalance.entity;

import com.qtech.linebalancing.operation.entity.Operation;
import com.qtech.linebalancing.operationbulletin.entity.BulletinLine;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "balance_station_operations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BalanceStationOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "balance_workstation_id", nullable = false)
    private BalanceWorkstation balanceWorkstation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulletin_line_id")
    private BulletinLine bulletinLine;

    @Column(nullable = false)
    @Builder.Default
    private Integer sequence = 1;

    @Column(name = "operation_smv", nullable = false)
    @Builder.Default
    private Double operationSmv = 0.0;

    @Column(name = "machine_type", length = 100)
    private String machineType;

    @Column(name = "is_split", nullable = false)
    @Builder.Default
    private Boolean isSplit = false;

    @Column(name = "split_ratio", nullable = false)
    @Builder.Default
    private Double splitRatio = 1.0;

    @Column(name = "is_qc_checkpoint", nullable = false)
    @Builder.Default
    private Boolean isQcCheckpoint = false;
}
