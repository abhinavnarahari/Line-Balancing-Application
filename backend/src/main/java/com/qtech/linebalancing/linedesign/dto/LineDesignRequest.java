package com.qtech.linebalancing.linedesign.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class LineDesignRequest {

    private String designCode;

    private Long capacityPlanId;

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private Long bulletinId;
    private Long lineId;
    private Long shiftId;

    private Integer totalWorkstations = 1;
    private Integer totalOperators = 1;
    private Integer totalHelpers = 0;
    private Integer totalQc = 0;
    private Integer totalMachines = 0;

    @NotNull(message = "Target hourly output is required")
    private Integer targetHourlyOutput;

    private Double plannedEfficiency = 80.0;
    private Double designedPitchSecs;
    private Double lineBalanceEfficiency;
    private String strategyName;
    private String stationAllocations;
    private String workstationsJson;

    private String status = "DRAFT"; // DRAFT, BALANCED, APPROVED, RELEASED, ACTIVE, CLOSED
    private Integer version = 1;

    private String createdBy;
    private String approvedBy;
    private String releasedBy;

    private List<LineDesignMachineRequest> machines;

    @Data
    public static class LineDesignMachineRequest {
        private String machineType;
        private Integer requiredQty;
        private Integer availableQty;
        private String notes;
    }
}
