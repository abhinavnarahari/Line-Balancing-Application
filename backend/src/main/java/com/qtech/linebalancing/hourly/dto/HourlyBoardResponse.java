package com.qtech.linebalancing.hourly.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class HourlyBoardResponse {
    private Long linePlanId;
    private String orderNo;
    private String shiftName;
    private String logDate;
    private int totalShiftHours;
    private String shiftStartTime;
    private String shiftEndTime;
    private double lineEfficiencyPercent;
    private int totalActualOutput;
    private int totalTargetOutput;
    private long operationsOnTarget;
    private long operationsBehind;
    private List<OperationRow> rows;

    @Data
    public static class OperationRow {
        private Long operationId;
        private String operationCode;
        private String operationName;
        private int sequence;
        private BigDecimal samMinutes;
        private int hourlyTarget;
        private Long operatorId;
        private String operatorEmployeeId;
        private String operatorName;
        private int totalActual;
        private int totalGood;
        private int totalReject;
        private int totalTarget;
        private double efficiencyPercent;
        private Map<Integer, HourCell> hours;
    }

    @Data
    public static class HourCell {
        private Long entryId;
        private int shiftHour;
        private String startTime;
        private String endTime;
        private int targetQty;
        private int actualQty;
        private int goodQty;
        private int rejectQty;
        private double efficiencyPercent;
        private String status;
    }
}