package com.qtech.linebalancing.chatbot.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StructuredPayloadDto {
    private String type; // METRIC, TABLE, CHART, COMPARISON, ALERT
    private String title;
    private List<String> headers;
    private List<Map<String, Object>> rows;
    private Map<String, Object> metrics;
    private List<Map<String, Object>> chartData;
}
