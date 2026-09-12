package com.qtech.linebalancing.chatbot;

import com.qtech.linebalancing.chatbot.dto.ChatContextDto;
import com.qtech.linebalancing.chatbot.dto.ChatMessageRequest;
import com.qtech.linebalancing.chatbot.dto.ChatMessageResponse;
import com.qtech.linebalancing.chatbot.intent.ChatIntent;
import com.qtech.linebalancing.chatbot.intent.IntentClassifierService;
import com.qtech.linebalancing.chatbot.service.ChatbotService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatbotServiceTest {

    @Autowired
    private ChatbotService chatbotService;

    @Autowired
    private IntentClassifierService intentClassifier;

    @Test
    @DisplayName("Intent Classifier: Correctly identifies SMV query and extracts operation")
    void testClassifySmvQuery() {
        IntentClassifierService.ClassificationResult result =
                intentClassifier.classify("What is the SMV of Back Pocket Attach?", null);

        assertThat(result.intent()).isEqualTo(ChatIntent.GET_OPERATION_SMV);
        assertThat(result.entities().getOperationName()).isEqualTo("Back Pocket Attach");
    }

    @Test
    @DisplayName("Intent Classifier: Correctly identifies line operator headcount")
    void testClassifyOperatorQuery() {
        IntentClassifierService.ClassificationResult result =
                intentClassifier.classify("How many operators are assigned to Line 01?", null);

        assertThat(result.intent()).isEqualTo(ChatIntent.GET_LINE_MANPOWER);
        assertThat(result.entities().getLineCode()).isEqualTo("Line 01");
    }

    @Test
    @DisplayName("Intent Classifier: Correctly detects mutation and applies Read-Only Guardrail")
    void testReadOnlyGuardrail() {
        IntentClassifierService.ClassificationResult result =
                intentClassifier.classify("Delete Line 01 immediately", null);

        assertThat(result.intent()).isEqualTo(ChatIntent.READ_ONLY_GUARDRAIL);
    }

    @Test
    @DisplayName("Intent Classifier: Correctly flags out-of-scope external questions")
    void testOutOfScopeQuery() {
        IntentClassifierService.ClassificationResult result =
                intentClassifier.classify("What is the weather in Vietnam?", null);

        assertThat(result.intent()).isEqualTo(ChatIntent.OUT_OF_SCOPE);
    }

    @Test
    @DisplayName("Full Chat Flow: Returns grounded response with structured payload and source badge")
    void testProcessMessageGroundedResponse() {
        ChatMessageRequest request = ChatMessageRequest.builder()
                .message("What is the SMV of Back Pocket Attach?")
                .userIdentifier("test_ie_user")
                .context(ChatContextDto.builder().lineCode("Line 01").build())
                .build();

        ChatMessageResponse response = chatbotService.processMessage(request);

        assertThat(response).isNotNull();
        assertThat(response.getSender()).isEqualTo("ASSISTANT");
        assertThat(response.getDataSource()).isEqualTo("APPLICATION_DATA");
        assertThat(response.isDataAvailable()).isTrue();
        assertThat(response.getMessageText()).contains("Back Pocket Attach");
        assertThat(response.getStructuredPayload()).isNotNull();
    }

    @Test
    @DisplayName("Buyer Query: Correctly retrieves exact quantity for Netplay")
    void testBuyerOrderQuery() {
        ChatMessageRequest request = ChatMessageRequest.builder()
                .message("what is total quantity ordered by netplay")
                .userIdentifier("test_buyer_user")
                .build();

        ChatMessageResponse response = chatbotService.processMessage(request);

        assertThat(response).isNotNull();
        assertThat(response.getSender()).isEqualTo("ASSISTANT");
        assertThat(response.isDataAvailable()).isTrue();
        assertThat(response.getMessageText()).contains("Netplay");
        assertThat(response.getMessageText()).contains("12,000");
    }
}
