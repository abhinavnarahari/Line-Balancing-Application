package com.qtech.linebalancing.chatbot.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatFeedbackRequest {

    @NotNull(message = "Message ID is required")
    private Long messageId;

    @NotNull(message = "Helpful flag is required")
    private Boolean helpful;

    private String comment;
}
