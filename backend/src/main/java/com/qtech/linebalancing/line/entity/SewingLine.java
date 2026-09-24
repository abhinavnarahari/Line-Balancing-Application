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

    @Column(name = "line_type", nullable = false, length = 40)
    @Builder.Default
    private String lineType = "PBS";

    @Column(length = 50)
    private String floor;

    @Column(length = 100)
    @Builder.Default
    private String department = "Sewing Floor";

    @Column(name = "supervisor_name", length = 150)
    private String supervisorName;

    @Column(name = "ie_in_charge", length = 150)
    private String ieInCharge;

    @Column(name = "qc_inspector", length = 150)
    private String qcInspector;

    @Column(name = "workstation_count", nullable = false)
    @Builder.Default
    private Integer workstationCount = 24;

    @Column(name = "operator_count", nullable = false)
    @Builder.Default
    private Integer operatorCount = 20;

    @Column(name = "helper_count", nullable = false)
    @Builder.Default
    private Integer helperCount = 2;

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

    @Column(name = "operational_status", nullable = false, length = 30)
    @Builder.Default
    private String operationalStatus = "ACTIVE";

    @Column(name = "current_style", length = 100)
    private String currentStyle;

    @Column(name = "current_bulletin", length = 100)
    private String currentBulletin;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
