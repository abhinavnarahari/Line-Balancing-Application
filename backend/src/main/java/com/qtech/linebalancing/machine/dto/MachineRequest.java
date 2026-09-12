package com.qtech.linebalancing.machine.dto;

import com.qtech.linebalancing.machine.entity.Machine.MachineStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MachineRequest {

    @NotBlank(message = "Machine code is required")
    private String machineCode;

    @NotBlank(message = "Machine type is required")
    private String machineType;

    private String brand;
    private String model;
    private String serialNo;
    private Long lineId;
    private MachineStatus status;
    private Integer quantity;
    private Boolean active;
}
