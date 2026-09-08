package com.qtech.linebalancing.common.audit;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "entity_name", nullable = false)
    private String entityName;
    
    @Column(name = "entity_id", nullable = false)
    private String entityId;
    
    @Column(nullable = false, length = 50)
    private String action; // CREATE, UPDATE, DELETE
    
    @Column(name = "details", length = 500)
    private String details;

    @Column(name = "performed_by", nullable = false)
    private String performedBy; // "System" or "Admin" for now
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (performedBy == null) {
            performedBy = "Admin";
        }
    }
}
