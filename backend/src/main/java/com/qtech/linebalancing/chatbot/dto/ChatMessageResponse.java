package com.qtech.linebalancing.chatbot.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private String sender;
    private String messageText;
    private String intent;
    private String dataSource;
    private boolean dataAvailable;
    private StructuredPayloadDto structuredPayload;
    private List<String> suggestedQuestions;
    private LocalDateTime createdAt;
}
