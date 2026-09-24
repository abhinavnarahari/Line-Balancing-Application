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
public class LineRequirementDTO {

    private Long lineId;
    private String lineCode;
    private String lineName;
    private String lineType;
    private Long orderId;
    private String orderNo;
    private String styleNo;
    private Long bulletinId;
    private String bulletinCode;
    private Integer bulletinRevision;
    private Integer targetPiecesPerHour;
    private Double customerTaktSecs;
    private Double designedPitchSecs;
    private Integer designedManpower;
    private Double plannedLineEfficiency;
    private Double totalSmvMinutes;
    private Integer workstationCount;
    private List<StationRequirementItem> stations;
    private List<MachineRequirementItem> machines;
    private String currentBottleneckStation;
    private String status; // READY, MISSING_DATA, BALANCED

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StationRequirementItem {
        private Integer stationIndex;
        private String stationCode;
        private Long operationId;
        private String operationCode;
        private String operationName;
        private String section;
        private Double operationSmv;
        private String requiredMachineType;
        private Integer requiredSkillLevel;
        private Boolean isParallelizable;
        private Boolean splitAllowed;
        private Double designedCycleTimeSecs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MachineRequirementItem {
        private String machineType;
        private Integer requiredQty;
        private Integer availableQty;
        private Integer shortageQty;
    }
}
