package com.qtech.linebalancing.allocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ManualOverrideDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long lineId;
        private Integer stationIndex;
        private Long operatorId; // New operator ID, or null to unassign
        private Boolean pinAsFixed;
        private String justification;
        private String performedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalRequest {
        private String approvedBy;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyRequest {
        private String appliedBy;
        private String notes;
        private Boolean updateFloorAssignments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditLogDTO {
        private Long id;
        private String actionType;
        private String performedBy;
        private String lineName;
        private String stationCode;
        private String operatorName;
        private String previousValue;
        private String newValue;
        private String justification;
        private String timestamp;
    }
}
