package com.qtech.linebalancing.chatbot.controller;

import com.qtech.linebalancing.chatbot.dto.*;
import com.qtech.linebalancing.chatbot.service.ChatbotService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> chat(@Valid @RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatbotService.processMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Message processed successfully", response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ChatConversationResponse>>> getConversations(
            @RequestParam(required = false, defaultValue = "default_user") String userIdentifier) {
        List<ChatConversationResponse> conversations = chatbotService.getConversations(userIdentifier);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ChatConversationResponse>> getConversationById(@PathVariable Long id) {
        ChatConversationResponse conversation = chatbotService.getConversationById(id);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable Long id) {
        chatbotService.deleteConversation(id);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Void>> recordFeedback(@Valid @RequestBody ChatFeedbackRequest request) {
        chatbotService.recordFeedback(request);
        return ResponseEntity.ok(ApiResponse.success("Feedback recorded successfully", null));
    }
}
