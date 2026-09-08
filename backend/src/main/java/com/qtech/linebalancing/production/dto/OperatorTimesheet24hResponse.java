package com.qtech.linebalancing.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperatorTimesheet24hResponse {

    private Long operatorId;
    private String employeeId;
    private String operatorName;
    private String department;
    private String machineCode;

    // Array/Map of 24 hourly slots (index 0 to 23 -> H00:00 to H23:00)
    private Map<Integer, HourlySlotSummary> hourlySlots;

    private Integer totalTarget;
    private Integer totalCompleted;
    private Integer totalGood;
    private Integer totalReject;
    private BigDecimal totalWorkMinutes;
    private BigDecimal totalEarnedMinutes;
    private BigDecimal efficiencyPercent;
    private BigDecimal defectRatePercent;

    private List<PieceProductionLogResponse> rawLogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlySlotSummary {
        private Integer hour; // 0 to 23
        private String timeLabel; // e.g. "10:00 - 11:00"
        private Integer targetQty;
        private Integer completedQty;
        private Integer goodQty;
        private Integer rejectQty;
        private BigDecimal workMinutes;
        private BigDecimal earnedMinutes;
        private BigDecimal efficiencyPercent;
        private String operations;
        private String machines;
        private Integer entryCount;
    }
}
