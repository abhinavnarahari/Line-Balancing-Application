package com.qtech.linebalancing.chatbot.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.assistant.Answer;
import com.qtech.linebalancing.chatbot.assistant.ConversationState;
import com.qtech.linebalancing.chatbot.assistant.GroundedAssistant;
import com.qtech.linebalancing.chatbot.dto.*;
import com.qtech.linebalancing.chatbot.entity.ChatConversation;
import com.qtech.linebalancing.chatbot.entity.ChatFeedback;
import com.qtech.linebalancing.chatbot.entity.ChatMessage;
import com.qtech.linebalancing.chatbot.repository.ChatConversationRepository;
import com.qtech.linebalancing.chatbot.repository.ChatFeedbackRepository;
import com.qtech.linebalancing.chatbot.repository.ChatMessageRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatFeedbackRepository feedbackRepository;
    private final GroundedAssistant assistant;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    /** Conversation id and what the previous answer was about, captured in the first (short) transaction. */
    private record PreparedTurn(Long conversationId, ConversationState previous) {
    }

    /**
     * Handles one chat turn in two short transactions with the LLM/agent call in between, so a slow LLM
     * (seconds per round trip) never holds a pooled database connection. The agent's tools open their own
     * read-only transactions.
     */
    public ChatMessageResponse processMessage(ChatMessageRequest request) {
        String userIdentifier = request.getUserIdentifier() != null ? request.getUserIdentifier() : "default_user";
        TransactionTemplate tx = new TransactionTemplate(transactionManager);

        // 1. Get/create the conversation, persist the user message, collect history
        PreparedTurn turn = tx.execute(status -> {
            ChatConversation conversation;
            if (request.getConversationId() != null) {
                // Only continue a conversation the caller owns; otherwise start a new one.
                conversation = conversationRepository.findByIdAndUserIdentifier(request.getConversationId(), userIdentifier)
                        .orElseGet(() -> createNewConversation(userIdentifier, request.getMessage(), request.getContext()));
            } else {
                conversation = createNewConversation(userIdentifier, request.getMessage(), request.getContext());
            }

            messageRepository.save(ChatMessage.builder()
                    .conversation(conversation)
                    .sender(ChatMessage.MessageSender.USER)
                    .messageText(request.getMessage().trim())
                    .createdAt(LocalDateTime.now())
                    .build());

            // Follow-up context: what the last assistant answer in this conversation was about
            List<ChatMessage> previousMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
            ConversationState previous = null;
            for (int i = previousMessages.size() - 1; i >= 0 && previous == null; i--) {
                if (previousMessages.get(i).getSender() == ChatMessage.MessageSender.ASSISTANT) {
                    previous = ConversationState.fromJson(previousMessages.get(i).getAssistantState());
                }
            }
            return new PreparedTurn(conversation.getId(), previous);
        });

        // 2. Answer outside any write transaction (the assistant reads in its own read-only transaction)
        GroundedAssistant.Reply reply = assistant.ask(request.getMessage(), request.getContext(), turn.previous());
        Answer result = reply.answer();

        String payloadJson = null;
        if (result.payload() != null) {
            try {
                payloadJson = objectMapper.writeValueAsString(result.payload());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize structured payload", e);
            }
        }
        final String payload = payloadJson;
        final String stateJson = reply.state() != null ? reply.state().toJson() : null;

        // 3. Persist the assistant reply
        ChatMessage assistantMessage = tx.execute(status -> {
            ChatConversation conversation = conversationRepository.findById(turn.conversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + turn.conversationId()));
            ChatMessage saved = messageRepository.save(ChatMessage.builder()
                    .conversation(conversation)
                    .sender(ChatMessage.MessageSender.ASSISTANT)
                    .messageText(result.text())
                    .intent(reply.intent().name())
                    .dataSource(result.dataAvailable() ? "APPLICATION_DATA" : "NONE")
                    .dataAvailable(result.dataAvailable())
                    .structuredPayload(payload)
                    .assistantState(stateJson)
                    .createdAt(LocalDateTime.now())
                    .build());
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
            return saved;
        });

        return ChatMessageResponse.builder()
                .id(assistantMessage.getId())
                .conversationId(turn.conversationId())
                .sender("ASSISTANT")
                .messageText(assistantMessage.getMessageText())
                .intent(assistantMessage.getIntent())
                .dataSource(assistantMessage.getDataSource())
                .dataAvailable(assistantMessage.getDataAvailable())
                .structuredPayload(result.payload())
                .suggestedQuestions(result.suggestions() != null ? result.suggestions() : List.of())
                .createdAt(assistantMessage.getCreatedAt())
                .build();
    }

    /**
     * Real-time Streaming SSE Handler.
     */
    public SseEmitter streamMessage(ChatMessageRequest request) {
        SseEmitter emitter = new SseEmitter(60000L); // 60s timeout

        CompletableFuture.runAsync(() -> {
            try {
                // Send initial typing / reasoning status
                emitter.send(SseEmitter.event().name("status").data("Analyzing manufacturing master data & line state..."));

                ChatMessageResponse response = processMessage(request);

                // Stream response in smooth natural chunks
                String fullText = response.getMessageText();
                String[] words = fullText.split("(?<=\\s)|(?<=\\n)");
                
                StringBuilder accumulated = new StringBuilder();
                for (String word : words) {
                    accumulated.append(word);
                    emitter.send(SseEmitter.event().name("chunk").data(word));
                    Thread.sleep(12); // Smooth word streaming cadence
                }

                // Send completion payload
                emitter.send(SseEmitter.event().name("complete").data(response));
                emitter.complete();
            } catch (Exception e) {
                log.warn("SSE stream interrupted: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().name("error").data("Stream error: " + e.getMessage()));
                    emitter.complete();
                } catch (IOException ignored) {}
            }
        });

        return emitter;
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getConversations(String userIdentifier) {
        String uid = userIdentifier != null ? userIdentifier : "default_user";
        return conversationRepository.findByUserIdentifierOrderByUpdatedAtDesc(uid).stream()
                .map(this::toConversationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatConversationResponse getConversationById(Long id, String userIdentifier) {
        return toConversationResponse(findOwned(id, userIdentifier));
    }

    @Transactional
    public void deleteConversation(Long id, String userIdentifier) {
        conversationRepository.delete(findOwned(id, userIdentifier));
    }

    /** 404 (not 403) for other users' conversations so their ids are not disclosed. */
    private ChatConversation findOwned(Long id, String userIdentifier) {
        return conversationRepository.findByIdAndUserIdentifier(id, userIdentifier)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));
    }

    @Transactional
    public void recordFeedback(ChatFeedbackRequest request) {
        ChatFeedback feedback = ChatFeedback.builder()
                .messageId(request.getMessageId())
                .helpful(request.getHelpful())
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();
        feedbackRepository.save(feedback);
    }

    private ChatConversation createNewConversation(String userIdentifier, String initialMessage, ChatContextDto context) {
        String title = initialMessage.length() > 40 ? initialMessage.substring(0, 40) + "..." : initialMessage;
        String meta = null;
        if (context != null) {
            try {
                meta = objectMapper.writeValueAsString(context);
            } catch (JsonProcessingException ignored) {}
        }
        ChatConversation conv = ChatConversation.builder()
                .userIdentifier(userIdentifier)
                .title(title)
                .contextMetadata(meta)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return conversationRepository.save(conv);
    }

    private ChatConversationResponse toConversationResponse(ChatConversation conv) {
        List<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        List<ChatMessageResponse> msgResponses = messages.stream().map(m -> {
            StructuredPayloadDto payload = null;
            if (m.getStructuredPayload() != null && !m.getStructuredPayload().isBlank()) {
                try {
                    payload = objectMapper.readValue(m.getStructuredPayload(), StructuredPayloadDto.class);
                } catch (Exception ignored) {}
            }
            return ChatMessageResponse.builder()
                    .id(m.getId())
                    .conversationId(conv.getId())
                    .sender(m.getSender().name())
                    .messageText(m.getMessageText())
                    .intent(m.getIntent())
                    .dataSource(m.getDataSource())
                    .dataAvailable(m.getDataAvailable() != null ? m.getDataAvailable() : true)
                    .structuredPayload(payload)
                    .createdAt(m.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ChatConversationResponse.builder()
                .id(conv.getId())
                .userIdentifier(conv.getUserIdentifier())
                .title(conv.getTitle())
                .contextMetadata(conv.getContextMetadata())
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .messages(msgResponses)
                .build();
    }
}
