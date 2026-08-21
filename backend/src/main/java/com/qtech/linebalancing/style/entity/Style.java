package com.qtech.linebalancing.style.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "styles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Style extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "style_no", nullable = false, unique = true, length = 50)
    private String styleNo;

    @Column(nullable = false, length = 150)
    private String buyer;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String season;

    @Column(name = "product_type", length = 100)
    private String productType;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
