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

    @NotNull(message = "Allowance is required")
    @Min(value = 0, message = "Allowance cannot be negative")
    private Integer allowance;

    private List<LinePlanAssignmentRequest> assignments;

    @Data
    public static class LinePlanAssignmentRequest {
        @NotNull(message = "Bulletin line ID is required")
        private Long bulletinLineId;

        @NotNull(message = "Operation ID is required")
        private Long operationId;

        // Operator ID can be null if unassigned
        private Long operatorId;
    }
}
