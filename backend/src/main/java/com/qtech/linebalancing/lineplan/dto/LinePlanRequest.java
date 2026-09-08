package com.qtech.linebalancing.lineplan.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class LinePlanRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Shift ID is required")
    private Long shiftId;

    private Long lineId;

    @NotNull(message = "Allowance is required")
    @Min(value = 0, message = "Allowance cannot be negative")
    private Integer allowance;

    private String allowancePfd;

    private Integer targetOutput;

    private List<LinePlanAssignmentRequest> assignments;

    @Data
    public static class LinePlanAssignmentRequest {
        private Long bulletinLineId; // Optional if plan created from Master Operations

        @NotNull(message = "Operation ID is required")
        private Long operationId;

        // Operator ID can be null if unassigned
        private Long operatorId;

        private Boolean isQcCheckpoint;
    }
}
