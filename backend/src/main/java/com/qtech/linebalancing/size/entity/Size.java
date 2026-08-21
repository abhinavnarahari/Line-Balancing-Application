package com.qtech.linebalancing.size.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sizes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Size extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 50)
    private String label;

    @Column(nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
