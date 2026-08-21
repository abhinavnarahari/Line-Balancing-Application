package com.qtech.linebalancing.operation.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "operations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Operation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_code", nullable = false, unique = true, length = 20)
    private String operationCode;

    @Column(nullable = false, length = 150, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
