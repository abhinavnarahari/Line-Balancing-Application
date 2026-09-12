package com.qtech.linebalancing.operationbulletin.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import com.qtech.linebalancing.style.entity.Style;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "operation_bulletins")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperationBulletin extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bulletin_code", nullable = false, length = 50)
    private String bulletinCode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "revision_number", nullable = false)
    @Builder.Default
    private Integer revisionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_bulletin_id")
    private OperationBulletin parentBulletin;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @Column(name = "released_by", length = 100)
    private String releasedBy;

    @Column(name = "released_at")
    private java.time.LocalDateTime releasedAt;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    /** Computed from sum of all bulletin_lines.smv. Updated on save by service. */
    @Column(name = "total_smv", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal totalSmv = BigDecimal.ZERO;

    /**
     * Many-to-many: one bulletin can be linked to multiple styles.
     * One style can use multiple bulletins (different versions or products).
     */
    @ManyToMany
    @JoinTable(
            name = "bulletin_styles",
            joinColumns = @JoinColumn(name = "bulletin_id"),
            inverseJoinColumns = @JoinColumn(name = "style_id")
    )
    @Builder.Default
    private Set<Style> styles = new HashSet<>();

    @OneToMany(mappedBy = "bulletin", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<BulletinLine> lines = new ArrayList<>();

    public enum Status {
        DRAFT, UNDER_REVIEW, APPROVED, RELEASED, PUBLISHED, ARCHIVED, OBSOLETE
    }
}
