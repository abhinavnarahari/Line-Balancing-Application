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

    private Integer allowance = 0;

    private String allowancePfd;

    private Double plannedEfficiency;

    private Integer targetOutput;

    private List<LinePlanAssignmentRequest> assignments;

    /**
     * true = approve and release the plan to the floor (status "active").
     * false/blank = just save: a new plan stays "draft", an existing plan keeps its status.
     * Old clients that don't send it keep the previous behaviour (released).
     */
    private Boolean release;

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
