package com.qtech.linebalancing.operation.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OperationResponse {
    private Long id;
    private String operationCode;
    private String name;
    private String description;
    private Integer sequence;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
