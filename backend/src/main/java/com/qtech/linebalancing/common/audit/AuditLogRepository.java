package com.qtech.linebalancing.common.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop10ByEntityNameOrderByTimestampDesc(String entityName);
    List<AuditLog> findTop20ByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, String entityId);
    List<AuditLog> findTop10ByOrderByTimestampDesc();
}
