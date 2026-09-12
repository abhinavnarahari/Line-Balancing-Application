package com.qtech.linebalancing.lineplan.dto;

import lombok.Data;

import java.util.List;

@Data
public class LinePlanResponse {
    private Long id;
    private Long orderId;
    private Long shiftId;
    private Long lineId;
    private String lineCode;
    private String lineName;
    private Integer targetOutput;
    private Integer allowance;
    private String allowancePfd;
    private Double plannedEfficiency;
    private String status;
    private List<LinePlanAssignmentResponse> assignments;

    @Data
    public static class LinePlanAssignmentResponse {
        private Long bulletinLineId;
        private Long operationId;
        private Long operatorId;
        private Boolean isQcCheckpoint;
    }
}
