package com.qtech.linebalancing.chatbot.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatConversationResponse {
    private Long id;
    private String userIdentifier;
    private String title;
    private String contextMetadata;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChatMessageResponse> messages;
}
