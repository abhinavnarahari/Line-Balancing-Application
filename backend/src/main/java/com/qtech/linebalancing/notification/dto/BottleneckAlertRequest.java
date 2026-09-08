package com.qtech.linebalancing.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BottleneckAlertRequest {
    private String lineName;
    private String orderNo;
    private String bottleneckSummary;
    private Integer bottleneckCount;
    private Double taktTimeSecs;
    private Long referenceId;
}
