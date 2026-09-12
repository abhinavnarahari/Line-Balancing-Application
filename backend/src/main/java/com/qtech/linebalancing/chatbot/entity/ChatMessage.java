package com.qtech.linebalancing.chatbot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private MessageSender sender;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(length = 100)
    private String intent;

    @Column(name = "data_source", length = 50)
    @Builder.Default
    private String dataSource = "APPLICATION_DATA";

    @Column(name = "data_available")
    @Builder.Default
    private Boolean dataAvailable = true;

    @Column(name = "structured_payload", columnDefinition = "TEXT")
    private String structuredPayload;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum MessageSender {
        USER,
        ASSISTANT,
        SYSTEM
    }
}
