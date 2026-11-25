package com.qtech.linebalancing.auth.entity;

import com.qtech.linebalancing.common.audit.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppUser extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    /** BCrypt hash; never serialised to clients. */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(length = 120)
    private String department;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
}
