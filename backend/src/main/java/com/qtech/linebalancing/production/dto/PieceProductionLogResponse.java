package com.qtech.linebalancing.production.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceProductionLogResponse {

    private Long id;
    private Long operatorId;
    private String operatorEmployeeId;
    private String operatorName;
    private String department;

    private Long operationId;
    private String operationCode;
    private String operationName;

    private Long orderId;
    private String orderNo;

    private Integer targetQty;
    private Integer completedQty;
    private Integer goodQty;
    private Integer rejectQty;

    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal actualTimeMinutes;
    private BigDecimal samMinutes;
    private String machineCode;
    private LocalDate logDate;
    private Integer hourSlot;
    private String notes;

    // Computed metrics
    private BigDecimal earnedMinutes;
    private BigDecimal efficiencyPercent;
    private BigDecimal defectRatePercent;

    private LocalDateTime createdAt;
}
