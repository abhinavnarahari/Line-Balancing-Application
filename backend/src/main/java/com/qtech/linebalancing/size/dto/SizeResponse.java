package com.qtech.linebalancing.size.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SizeResponse {
    private Long id;
    private String code;
    private String label;
    private Integer sequence;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
