package com.qtech.linebalancing.style.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StyleResponse {
    private Long id;
    private String styleNo;
    private String buyer;
    private String description;
    private String season;
    private String productType;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
