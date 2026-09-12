package com.qtech.linebalancing.chatbot.intent;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExtractedEntities {
    private String operationName;
    private String lineCode;
    private Long lineId;
    private String styleCode;
    private Long styleId;
    private String orderCode;
    private Long orderId;
    private String buyerName;
    private String operatorName;
    private String machineType;
    private Integer stationNum;
    private List<String> compareLines;
    private boolean isAmbiguous;
    private String ambiguityReason;
}
