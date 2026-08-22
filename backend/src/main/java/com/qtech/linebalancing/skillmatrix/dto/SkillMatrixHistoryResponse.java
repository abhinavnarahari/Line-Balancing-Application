package com.qtech.linebalancing.skillmatrix.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SkillMatrixHistoryResponse {
    private Long id;
    private Long operatorId;
    private String operatorName;
    private String employeeId;
    private Long operationId;
    private String operationName;
    private String operationCode;
    private Integer oldRating;
    private Integer newRating;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
