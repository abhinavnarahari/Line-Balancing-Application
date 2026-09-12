package com.qtech.linebalancing.chatbot.repository;

import com.qtech.linebalancing.chatbot.entity.ChatFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatFeedbackRepository extends JpaRepository<ChatFeedback, Long> {
    List<ChatFeedback> findByMessageId(Long messageId);
}
