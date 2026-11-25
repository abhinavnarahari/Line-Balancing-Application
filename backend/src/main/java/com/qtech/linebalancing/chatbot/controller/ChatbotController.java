package com.qtech.linebalancing.chatbot.controller;

import com.qtech.linebalancing.chatbot.dto.*;
import com.qtech.linebalancing.chatbot.service.ChatbotService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.qtech.linebalancing.auth.service.AppUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final com.qtech.linebalancing.chatbot.assistant.skills.HelpSkill helpSkill;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> chat(@Valid @RequestBody ChatMessageRequest request,
                                                                 @AuthenticationPrincipal AppUserPrincipal principal) {
        request.setUserIdentifier(principal.getEmail()); // never trust a client-supplied identity
        ChatMessageResponse response = chatbotService.processMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Message processed successfully", response));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@Valid @RequestBody ChatMessageRequest request,
                                 @AuthenticationPrincipal AppUserPrincipal principal) {
        request.setUserIdentifier(principal.getEmail());
        return chatbotService.streamMessage(request);
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ChatConversationResponse>>> getConversations(
            @AuthenticationPrincipal AppUserPrincipal principal) {
        List<ChatConversationResponse> conversations = chatbotService.getConversations(principal.getEmail());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ChatConversationResponse>> getConversationById(
            @PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        ChatConversationResponse conversation = chatbotService.getConversationById(id, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        chatbotService.deleteConversation(id, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    /** Starter questions for the chat panel, built from the application's real records. */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<com.qtech.linebalancing.chatbot.assistant.skills.HelpSkill.PromptCategory>>> suggestions() {
        return ResponseEntity.ok(ApiResponse.success(helpSkill.starterQuestions()));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Void>> recordFeedback(@Valid @RequestBody ChatFeedbackRequest request) {
        chatbotService.recordFeedback(request);
        return ResponseEntity.ok(ApiResponse.success("Feedback recorded successfully", null));
    }
}
