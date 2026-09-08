package com.qtech.linebalancing.hourly.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class HourlyEntryRequest {
    @NotNull private Long linePlanId;
    @NotNull private Long operationId;
    @NotNull private Long operatorId;
    @NotNull private LocalDate logDate;
    @NotNull @Min(1) private Integer shiftHour;
    private String hourStartTime;
    private String hourEndTime;
    @Min(0) private Integer targetQty = 0;
    @Min(0) private Integer actualQty = 0;
    @Min(0) private Integer goodQty = 0;
    @Min(0) private Integer rejectQty = 0;
    private BigDecimal samMinutes;
    private String notes;
}