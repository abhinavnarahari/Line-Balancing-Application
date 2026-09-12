package com.qtech.linebalancing.linedesign.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class LineDesignResponse {
    private Long id;
    private String designCode;
    private Long capacityPlanId;
    private Long orderId;
    private String orderNo;
    private Long styleId;
    private String styleNo;
    private Long bulletinId;
    private String bulletinCode;
    private Long lineId;
    private String lineCode;
    private String lineName;
    private Long shiftId;
    private String shiftName;
    private Integer totalWorkstations;
    private Integer totalOperators;
    private Integer totalHelpers;
    private Integer totalQc;
    private Integer totalMachines;
    private Integer targetHourlyOutput;
    private Double plannedEfficiency;
    private Double designedPitchSecs;
    private Double lineBalanceEfficiency;
    private String strategyName;
    private String stationAllocations;
    private String workstationsJson;
    private String status;
    private Integer version;
    private String createdBy;
    private String approvedBy;
    private String releasedBy;
    private List<LineDesignMachineResponse> machines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class LineDesignMachineResponse {
        private Long id;
        private String machineType;
        private Integer requiredQty;
        private Integer availableQty;
        private Integer shortageQty;
        private String notes;
    }
}
