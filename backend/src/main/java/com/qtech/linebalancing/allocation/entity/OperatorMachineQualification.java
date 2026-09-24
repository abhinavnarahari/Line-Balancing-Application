package com.qtech.linebalancing.allocation.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "operator_machine_qualifications",
       uniqueConstraints = @UniqueConstraint(
               columnNames = {"operator_id", "machine_type"},
               name = "uq_omq_operator_machine"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorMachineQualification extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @Column(name = "machine_type", nullable = false, length = 100)
    private String machineType;

    /** Qualification level: 1=Trainee, 2=Basic, 3=Proficient, 4=Skilled, 5=Expert */
    @Column(name = "qualification_level", nullable = false)
    @Builder.Default
    private Integer qualificationLevel = 3;

    @Column(name = "certified_since")
    private LocalDate certifiedSince;

    @Column(name = "experience_months")
    @Builder.Default
    private Integer experienceMonths = 6;

    @Column(name = "is_primary_qualification", nullable = false)
    @Builder.Default
    private Boolean isPrimaryQualification = false;

    @Column(length = 255)
    private String notes;
}
