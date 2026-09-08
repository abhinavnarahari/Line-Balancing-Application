package com.qtech.linebalancing.notification.repository;

import com.qtech.linebalancing.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop100ByOrderByCreatedAtDesc();

    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();

    long countByIsReadFalse();

    boolean existsByTypeAndReferenceId(String type, Long referenceId);

    List<Notification> findByTypeAndReferenceId(String type, Long referenceId);

    Optional<Notification> findFirstByTypeAndReferenceIdOrderByCreatedAtDesc(String type, Long referenceId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.isRead = false")
    void markAllAsRead();
}
