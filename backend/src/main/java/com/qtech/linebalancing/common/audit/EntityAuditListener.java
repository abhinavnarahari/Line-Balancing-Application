package com.qtech.linebalancing.common.audit;

import com.qtech.linebalancing.common.BeanUtil;
import jakarta.persistence.*;
import java.lang.reflect.Field;
import java.time.LocalDateTime;

public class EntityAuditListener {

    @PostPersist
    public void postPersist(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Created");
        }
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Updated");
        }
    }

    @PostRemove
    public void postRemove(Object entity) {
        if (!(entity instanceof AuditLog)) {
            logAction(entity, "Deleted");
        }
    }

    @SuppressWarnings("null")
    private void logAction(Object entity, String action) {
        try {
            AuditLogRepository auditLogRepository = BeanUtil.getBean(AuditLogRepository.class);
            if (auditLogRepository != null) {
                String entityName = entity.getClass().getSimpleName();
                String entityId = extractId(entity);
                
                AuditLog log = AuditLog.builder()
                        .entityName(entityName)
                        .entityId(entityId)
                        .action(action)
                        .performedBy("System")
                        .timestamp(LocalDateTime.now())
                        .build();
                
                auditLogRepository.save(log);
            }
        } catch (Exception e) {
            // Ignore audit log failures
        }
    }

    private String extractId(Object entity) {
        try {
            Field idField = entity.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            Object id = idField.get(entity);
            return id != null ? id.toString() : "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }
}
