package com.qtech.linebalancing.operation.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "operation_affinities",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_primary_alt_operation", columnNames = {"primary_operation_id", "alternative_operation_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationAffinity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "primary_operation_id", nullable = false)
    private Operation primaryOperation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "alternative_operation_id", nullable = false)
    private Operation alternativeOperation;

    @Enumerated(EnumType.STRING)
    @Column(name = "affinity_level", nullable = false, length = 30)
    @Builder.Default
    private AffinityLevel affinityLevel = AffinityLevel.DIRECT_SUBSTITUTE;

    @Column(name = "efficiency_transfer_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal efficiencyTransferPct = new BigDecimal("90.00");

    @Column(name = "rating_downgrade", nullable = false)
    @Builder.Default
    private Integer ratingDowngrade = 0;

    @Column(name = "machine_compatible", nullable = false)
    @Builder.Default
    private boolean machineCompatible = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum AffinityLevel {
        DIRECT_SUBSTITUTE,
        SIMILAR_TECHNIQUE,
        BASIC_COMPATIBLE
    }
}
