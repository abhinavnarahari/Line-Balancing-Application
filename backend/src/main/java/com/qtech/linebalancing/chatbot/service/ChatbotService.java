package com.qtech.linebalancing.chatbot.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.chatbot.dto.*;
import com.qtech.linebalancing.chatbot.entity.ChatConversation;
import com.qtech.linebalancing.chatbot.entity.ChatFeedback;
import com.qtech.linebalancing.chatbot.entity.ChatMessage;
import com.qtech.linebalancing.chatbot.intent.IntentClassifierService;
import com.qtech.linebalancing.chatbot.llm.LLMClient;
import com.qtech.linebalancing.chatbot.repository.ChatConversationRepository;
import com.qtech.linebalancing.chatbot.repository.ChatFeedbackRepository;
import com.qtech.linebalancing.chatbot.repository.ChatMessageRepository;
import com.qtech.linebalancing.chatbot.retrieval.ChatDataRetrievalService;
import com.qtech.linebalancing.chatbot.retrieval.DataRetrievalResult;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatFeedbackRepository feedbackRepository;
    private final IntentClassifierService intentClassifier;
    private final ChatDataRetrievalService dataRetrievalService;
    private final LLMClient llmClient;
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

        // 3. Classify intent & extract entities
        IntentClassifierService.ClassificationResult classification =
                intentClassifier.classify(request.getMessage(), request.getContext());

        // 4. Retrieve Grounded Application Facts
        DataRetrievalResult retrievalResult =
                dataRetrievalService.retrieveData(classification.intent(), classification.entities(), request.getContext());

        // 5. Generate Grounded AI Response
        String responseText = llmClient.generateGroundedResponse(request.getMessage(), retrievalResult);

        // 6. Serialize Structured Payload
        String payloadJson = null;
        if (retrievalResult.getStructuredPayload() != null) {
            try {
                payloadJson = objectMapper.writeValueAsString(retrievalResult.getStructuredPayload());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize structured payload", e);
            }
        }

        // 7. Persist Assistant Message
        ChatMessage assistantMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(ChatMessage.MessageSender.ASSISTANT)
                .messageText(responseText)
                .intent(classification.intent().name())
                .dataSource("APPLICATION_DATA")
                .dataAvailable(retrievalResult.isDataAvailable())
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
                .structuredPayload(retrievalResult.getStructuredPayload())
                .suggestedQuestions(retrievalResult.getSuggestedQuestions() != null ? retrievalResult.getSuggestedQuestions() : List.of())
                .createdAt(assistantMessage.getCreatedAt())
                .build();
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
