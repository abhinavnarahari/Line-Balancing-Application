package com.qtech.linebalancing.allocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public class PlanningContextDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String plantLocation;
        private LocalDate planningDate;
        private Long shiftId;
        private List<Long> lineIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String plantLocation;
        private LocalDate planningDate;
        private Long shiftId;
        private String shiftName;
        private Integer shiftWorkingHours;
        private List<LineSummaryItem> selectedLines;
        private List<OrderSummaryItem> activeOrders;
        private Integer totalTargetHourlyOutput;
        private Integer totalDesignedManpower;
        private Integer totalAvailableOperators;
        private Integer totalPresentOperators;
        private Integer totalAbsentOperators;
        private Integer totalAvailableMachines;
        private Integer totalRequiredMachines;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineSummaryItem {
        private Long lineId;
        private String lineCode;
        private String lineName;
        private String lineType;
        private String currentStyle;
        private String currentBulletin;
        private Long orderId;
        private String orderNo;
        private Long bulletinId;
        private String bulletinCode;
        private Integer revisionNumber;
        private Integer targetHourlyOutput;
        private Double plannedEfficiency;
        private Integer designedManpower;
        private Integer machineCount;
        private Long lineDesignId;
        private String designCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderSummaryItem {
        private Long orderId;
        private String orderNo;
        private String styleNo;
        private String customerName;
        private Integer orderQuantity;
        private Long bulletinId;
        private String bulletinCode;
        private Integer bulletinRevision;
    }
}
