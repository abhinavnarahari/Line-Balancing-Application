package com.qtech.linebalancing.chatbot.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.agent.EnterpriseAgentEngine;
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
import org.springframework.transaction.annotation.Transactional;
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
    private final EnterpriseAgentEngine agentEngine;
    private final ObjectMapper objectMapper;

    @Transactional
    public ChatMessageResponse processMessage(ChatMessageRequest request) {
        String userIdentifier = request.getUserIdentifier() != null ? request.getUserIdentifier() : "default_user";

        // 1. Get or create conversation session
        ChatConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseGet(() -> createNewConversation(userIdentifier, request.getMessage(), request.getContext()));
        } else {
            conversation = createNewConversation(userIdentifier, request.getMessage(), request.getContext());
        }

        // 2. Persist User Message
        ChatMessage userMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(ChatMessage.MessageSender.USER)
                .messageText(request.getMessage().trim())
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(userMessage);

        // 3. Retrieve conversation history for multi-turn context
        List<ChatMessage> previousMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Map<String, String>> history = new ArrayList<>();
        // Keep up to last 8 messages
        int startIdx = Math.max(0, previousMessages.size() - 8);
        for (int i = startIdx; i < previousMessages.size() - 1; i++) {
            ChatMessage pm = previousMessages.get(i);
            String role = pm.getSender() == ChatMessage.MessageSender.USER ? "user" : "assistant";
            history.add(Map.of("role", role, "content", pm.getMessageText()));
        }

        // 4. Run Enterprise Agent Engine
        EnterpriseAgentEngine.AgentResult result = agentEngine.execute(
                request.getMessage(),
                request.getContext(),
                history
        );

        // 5. Serialize Structured Payload
        String payloadJson = null;
        if (result.structuredPayload() != null) {
            try {
                payloadJson = objectMapper.writeValueAsString(result.structuredPayload());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize structured payload", e);
            }
        }

        // 6. Persist Assistant Message
        ChatMessage assistantMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(ChatMessage.MessageSender.ASSISTANT)
                .messageText(result.responseText())
                .intent(result.intent())
                .dataSource(result.dataSource())
                .dataAvailable(result.dataAvailable())
                .structuredPayload(payloadJson)
                .createdAt(LocalDateTime.now())
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return ChatMessageResponse.builder()
                .id(assistantMessage.getId())
                .conversationId(conversation.getId())
                .sender("ASSISTANT")
                .messageText(assistantMessage.getMessageText())
                .intent(assistantMessage.getIntent())
                .dataSource(assistantMessage.getDataSource())
                .dataAvailable(assistantMessage.getDataAvailable())
                .structuredPayload(result.structuredPayload())
                .suggestedQuestions(result.suggestedQuestions() != null ? result.suggestedQuestions() : List.of())
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
    public ChatConversationResponse getConversationById(Long id) {
        ChatConversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + id));
        return toConversationResponse(conv);
    }

    @Transactional
    public void deleteConversation(Long id) {
        conversationRepository.deleteById(id);
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
