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

    @Column(length = 50)
    @Builder.Default
    private String section = "MAIN_ASSEMBLY";

    @Column(name = "predecessor_ids", length = 255)
    private String predecessorIds;

    @Column(name = "is_parallelizable", nullable = false)
    @Builder.Default
    private Boolean isParallelizable = true;

    @Column(name = "split_allowed", nullable = false)
    @Builder.Default
    private Boolean splitAllowed = false;

    @Column(name = "split_type", length = 50)
    @Builder.Default
    private String splitType = "NONE";

    @Column(name = "stitch_type", length = 100)
    private String stitchType;

    @Column(name = "seam_type", length = 100)
    private String seamType;

    @Column(name = "attachment_type", length = 100)
    private String attachmentType;

    @Column(name = "wip_threshold")
    @Builder.Default
    private Integer wipThreshold = 20;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
