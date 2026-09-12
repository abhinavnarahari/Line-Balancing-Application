package com.qtech.linebalancing.operationbulletin.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BulletinLineRequest {

    @NotNull(message = "Sequence is required")
    @Min(value = 1, message = "Sequence must be at least 1")
    private Integer sequence;

    @NotNull(message = "Operation ID is required")
    private Long operationId;

    @NotNull(message = "SMV is required")
    @DecimalMin(value = "0.0", message = "SMV must be non-negative")
    private BigDecimal smv;

    @Size(max = 100, message = "Machine type must not exceed 100 characters")
    private String machineType;

    @Min(value = 1, message = "Skill rating required must be between 1 and 5")
    @Max(value = 5, message = "Skill rating required must be between 1 and 5")
    private Integer skillRatingRequired;

    private String section;
    private String predecessorIds;
    private Boolean isParallelizable = true;
    private Boolean splitAllowed = false;
    private String splitType = "NONE";
    private String stitchType;
    private String seamType;
    private String attachmentType;
    private Integer wipThreshold;

    private String notes;
}
