package com.qtech.linebalancing.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageRequest {

    private Long conversationId;

    @NotBlank(message = "Message cannot be empty")
    private String message;

    private ChatContextDto context;

    private String userIdentifier;
}
