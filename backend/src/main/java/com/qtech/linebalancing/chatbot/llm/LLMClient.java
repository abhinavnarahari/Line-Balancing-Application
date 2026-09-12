package com.qtech.linebalancing.chatbot.llm;

import com.qtech.linebalancing.chatbot.retrieval.DataRetrievalResult;

public interface LLMClient {
    String generateGroundedResponse(String userMessage, DataRetrievalResult retrievalResult);
}
