package com.qtech.linebalancing.operationbulletin.entity;

import com.qtech.linebalancing.operation.entity.Operation;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "bulletin_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BulletinLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bulletin_id", nullable = false)
    private OperationBulletin bulletin;

    @Column(nullable = false)
    private Integer sequence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operation_id", nullable = false)
    private Operation operation;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal smv;

    @Column(name = "machine_type", length = 100)
    private String machineType;

    @Column(name = "skill_rating_required")
    private Integer skillRatingRequired;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
