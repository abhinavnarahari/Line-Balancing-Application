package com.qtech.linebalancing.operation.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OperationResponse {
    private Long id;
    private String operationCode;
    private String name;
    private String description;
    private Integer sequence;
    private boolean active;
    private BigDecimal standardSmv;
    private String machineType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
