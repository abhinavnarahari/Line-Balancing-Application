package com.qtech.linebalancing.chatbot.repository;

import com.qtech.linebalancing.chatbot.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    List<ChatConversation> findByUserIdentifierOrderByUpdatedAtDesc(String userIdentifier);
}
