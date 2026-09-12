package com.qtech.linebalancing.linedesign.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "line_design_machines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LineDesignMachine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_design_id", nullable = false)
    private LineDesign lineDesign;

    @Column(name = "machine_type", nullable = false, length = 100)
    private String machineType;

    @Column(name = "required_qty", nullable = false)
    @Builder.Default
    private Integer requiredQty = 1;

    @Column(name = "available_qty", nullable = false)
    @Builder.Default
    private Integer availableQty = 0;

    @Column(length = 255)
    private String notes;
}
