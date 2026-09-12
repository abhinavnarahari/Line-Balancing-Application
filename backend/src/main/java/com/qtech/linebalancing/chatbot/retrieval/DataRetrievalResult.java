package com.qtech.linebalancing.chatbot.retrieval;

import com.qtech.linebalancing.chatbot.dto.StructuredPayloadDto;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DataRetrievalResult {
    private boolean dataAvailable;
    private String primaryFactText;
    private String contextualExplanation;
    private StructuredPayloadDto structuredPayload;
    private Map<String, Object> rawData;
    private List<String> suggestedQuestions;
}
