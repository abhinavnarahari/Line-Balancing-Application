package com.qtech.linebalancing.common.audit;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getRecentLogs(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String entityId) {
        if (entityName != null && !entityName.isEmpty()) {
            if (entityId != null && !entityId.isEmpty()) {
                return ResponseEntity.ok(auditLogRepository.findTop20ByEntityNameAndEntityIdOrderByTimestampDesc(entityName, entityId));
            }
            return ResponseEntity.ok(auditLogRepository.findTop10ByEntityNameOrderByTimestampDesc(entityName));
        }
        return ResponseEntity.ok(auditLogRepository.findTop10ByOrderByTimestampDesc());
    }
}
