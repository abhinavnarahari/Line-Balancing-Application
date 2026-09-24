package com.qtech.linebalancing.allocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreflightValidationDTO {

    private boolean isValid;
    private int totalErrors;
    private int totalWarnings;
    private int totalInfo;
    private String summaryMessage;
    private List<ValidationIssueItem> issues;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationIssueItem {
        private String severity; // ERROR, WARNING, INFO
        private String issueType; // SKILL_GAP, MACHINE_GAP, MISSING_OB, ZERO_SMV, ATTENDANCE_SHORTAGE, FIXED_ASSIGNMENT_CONFLICT
        private Long lineId;
        private String lineName;
        private String stationCode;
        private String operationName;
        private String problemDescription;
        private String recommendedAction;
    }
}
