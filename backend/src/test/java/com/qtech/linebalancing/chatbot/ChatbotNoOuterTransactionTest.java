package com.qtech.linebalancing.chatbot;

import com.qtech.linebalancing.chatbot.dto.ChatMessageRequest;
import com.qtech.linebalancing.chatbot.dto.ChatMessageResponse;
import com.qtech.linebalancing.chatbot.repository.ChatConversationRepository;
import com.qtech.linebalancing.chatbot.service.ChatbotService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BE-02: processMessage runs without an outer transaction (so the LLM call never holds a DB connection).
 * Deliberately NOT @Transactional, so lazy-loading problems in the agent/tool path would surface here.
 * Requires the local PostgreSQL; the conversations it creates are deleted afterwards.
 */
@SpringBootTest
class ChatbotNoOuterTransactionTest {

    private static final String USER = "no-outer-tx-test@local";

    @Autowired private ChatbotService chatbotService;
    @Autowired private ChatConversationRepository conversationRepository;

    @AfterEach
    void cleanUp() {
        conversationRepository.deleteAll(conversationRepository.findByUserIdentifierOrderByUpdatedAtDesc(USER));
    }

    @Test
    void chatTurnsWorkWithoutAnOuterTransactionAndKeepHistory() {
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();

        Long conversationId = null;
        for (String question : List.of(
                "What is the SMV of Shoulder Join?",
                "How many operators are on Line 01?",
                "Calculate line balancing for OB-CREW-101 with 8 operators",
                "Show orders in production")) {
            ChatMessageRequest req = ChatMessageRequest.builder()
                    .message(question).userIdentifier(USER).conversationId(conversationId).build();
            ChatMessageResponse res = chatbotService.processMessage(req);
            assertThat(res.getMessageText()).as(question).isNotBlank();
            conversationId = res.getConversationId();
        }

        var conversation = chatbotService.getConversationById(conversationId, USER);
        assertThat(conversation.getMessages()).hasSize(8); // 4 questions + 4 answers in one conversation
    }
}
