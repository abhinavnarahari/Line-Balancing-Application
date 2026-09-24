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
    private String lineType;
    private String floor;
    private String department;
    private String supervisorName;
    private String ieInCharge;
    private String qcInspector;
    private Integer workstationCount;
    private Integer operatorCount;
    private Integer helperCount;
    private Integer machineCount;
    private BigDecimal workingHours;
    private Integer capacityPerDay;
    private BigDecimal targetEfficiencyPercent;
    private String operationalStatus;
    private String currentStyle;
    private String currentBulletin;
    private boolean active;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SewingLineResponse fromEntity(SewingLine line) {
        return SewingLineResponse.builder()
                .id(line.getId())
                .lineCode(line.getLineCode())
                .lineName(line.getLineName())
                .lineType(line.getLineType() != null ? line.getLineType() : "PBS")
                .floor(line.getFloor())
                .department(line.getDepartment() != null ? line.getDepartment() : "Sewing Floor")
                .supervisorName(line.getSupervisorName())
                .ieInCharge(line.getIeInCharge())
                .qcInspector(line.getQcInspector())
                .workstationCount(line.getWorkstationCount() != null ? line.getWorkstationCount() : 24)
                .operatorCount(line.getOperatorCount())
                .helperCount(line.getHelperCount() != null ? line.getHelperCount() : 2)
                .machineCount(line.getMachineCount())
                .workingHours(line.getWorkingHours())
                .capacityPerDay(line.getCapacityPerDay())
                .targetEfficiencyPercent(line.getTargetEfficiencyPercent())
                .operationalStatus(line.getOperationalStatus() != null ? line.getOperationalStatus() : (line.isActive() ? "ACTIVE" : "IDLE"))
                .currentStyle(line.getCurrentStyle())
                .currentBulletin(line.getCurrentBulletin())
                .active(line.isActive())
                .notes(line.getNotes())
                .createdAt(line.getCreatedAt())
                .updatedAt(line.getUpdatedAt())
                .build();
    }
}
