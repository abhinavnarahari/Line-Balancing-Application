package com.qtech.linebalancing.production.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PieceProductionLogRequest {

    @NotNull(message = "Operator ID is required")
    private Long operatorId;

    private Long operationId;
    private String operationName;
    private Long orderId;

    @NotNull(message = "Target quantity is required")
    private Integer targetQty;

    @NotNull(message = "Completed quantity is required")
    private Integer completedQty;

    @NotNull(message = "Good quantity is required")
    private Integer goodQty;

    private Integer rejectQty;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private BigDecimal samMinutes;
    private String machineCode;
    private LocalDate logDate;
    private String notes;
}
