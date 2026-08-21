package com.qtech.linebalancing.operationbulletin.dto;

import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
public class BulletinRequest {

    @NotBlank(message = "Bulletin code is required")
    @Size(max = 50, message = "Bulletin code must not exceed 50 characters")
    private String bulletinCode;

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must not exceed 200 characters")
    private String name;

    private String description;

    @Min(value = 1, message = "Version must be at least 1")
    private Integer version = 1;

    private OperationBulletin.Status status = OperationBulletin.Status.DRAFT;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    /** IDs of styles to attach this bulletin to. */
    private Set<Long> styleIds;

    @NotEmpty(message = "At least one operation line is required")
    @Valid
    private List<BulletinLineRequest> lines;
}
