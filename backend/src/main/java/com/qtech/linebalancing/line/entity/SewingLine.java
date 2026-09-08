package com.qtech.linebalancing.line.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sewing_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SewingLine extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "line_code", nullable = false, unique = true, length = 30)
    private String lineCode;

    @Column(name = "line_name", nullable = false, length = 100)
    private String lineName;

    @Column(length = 50)
    private String floor;

    @Column(name = "supervisor_name", length = 150)
    private String supervisorName;

    @Column(name = "operator_count", nullable = false)
    @Builder.Default
    private Integer operatorCount = 20;

    @Column(name = "machine_count", nullable = false)
    @Builder.Default
    private Integer machineCount = 22;

    @Column(name = "working_hours", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal workingHours = new BigDecimal("8.00");

    @Column(name = "capacity_per_day", nullable = false)
    @Builder.Default
    private Integer capacityPerDay = 1000;

    @Column(name = "target_efficiency_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal targetEfficiencyPercent = new BigDecimal("85.00");

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
