package com.qtech.linebalancing.machine.dto;

import com.qtech.linebalancing.machine.entity.Machine;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MachineResponse {
    private Long id;
    private String machineCode;
    private String machineType;
    private String brand;
    private String model;
    private String serialNo;
    private Long lineId;
    private String lineCode;
    private String lineName;
    private String status;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MachineResponse fromEntity(Machine m) {
        return MachineResponse.builder()
                .id(m.getId())
                .machineCode(m.getMachineCode())
                .machineType(m.getMachineType())
                .brand(m.getBrand())
                .model(m.getModel())
                .serialNo(m.getSerialNo())
                .lineId(m.getLine() != null ? m.getLine().getId() : null)
                .lineCode(m.getLine() != null ? m.getLine().getLineCode() : null)
                .lineName(m.getLine() != null ? m.getLine().getLineName() : null)
                .status(m.getStatus() != null ? m.getStatus().name() : "AVAILABLE")
                .active(m.isActive())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
