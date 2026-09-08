package com.qtech.linebalancing.line.dto;

import com.qtech.linebalancing.line.entity.SewingLine;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SewingLineResponse {
    private Long id;
    private String lineCode;
    private String lineName;
    private String floor;
    private String supervisorName;
    private Integer operatorCount;
    private Integer machineCount;
    private BigDecimal workingHours;
    private Integer capacityPerDay;
    private BigDecimal targetEfficiencyPercent;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SewingLineResponse fromEntity(SewingLine line) {
        return SewingLineResponse.builder()
                .id(line.getId())
                .lineCode(line.getLineCode())
                .lineName(line.getLineName())
                .floor(line.getFloor())
                .supervisorName(line.getSupervisorName())
                .operatorCount(line.getOperatorCount())
                .machineCount(line.getMachineCount())
                .workingHours(line.getWorkingHours())
                .capacityPerDay(line.getCapacityPerDay())
                .targetEfficiencyPercent(line.getTargetEfficiencyPercent())
                .active(line.isActive())
                .createdAt(line.getCreatedAt())
                .updatedAt(line.getUpdatedAt())
                .build();
    }
}
