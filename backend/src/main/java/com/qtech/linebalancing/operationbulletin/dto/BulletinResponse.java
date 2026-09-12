package com.qtech.linebalancing.operationbulletin.dto;

import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BulletinResponse {
    private Long id;
    private String bulletinCode;
    private String name;
    private String description;
    private Integer version;
    private Integer revisionNumber;
    private Long parentBulletinId;
    private OperationBulletin.Status status;
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String releasedBy;
    private LocalDateTime releasedAt;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private BigDecimal totalSmv;
    private List<StyleSummary> styles;
    private List<BulletinLineResponse> lines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class StyleSummary {
        private Long id;
        private String styleNo;
        private String buyer;
    }

    @Data
    public static class BulletinLineResponse {
        private Long id;
        private Integer sequence;
        private Long operationId;
        private String operationCode;
        private String operationName;
        private BigDecimal smv;
        private String machineType;
        private Integer skillRatingRequired;
        private String section;
        private String predecessorIds;
        private Boolean isParallelizable;
        private Boolean splitAllowed;
        private String splitType;
        private String stitchType;
        private String seamType;
        private String attachmentType;
        private Integer wipThreshold;
        private String notes;
    }
}
