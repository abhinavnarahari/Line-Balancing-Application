package com.qtech.linebalancing.chatbot.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatContextDto {
    private Long styleId;
    private String styleCode;
    private Long lineId;
    private String lineCode;
    private Long orderId;
    private String orderCode;
    private Long shiftId;
    private Long lineDesignId;
    private String page;
}
