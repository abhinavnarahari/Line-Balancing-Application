package com.qtech.linebalancing.auth.service;

import com.qtech.linebalancing.auth.entity.AppUser;
import com.qtech.linebalancing.auth.entity.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

/**
 * Authenticated user stored in the HTTP session. {@code authenticatedAt} lets the session be revoked
 * when an admin disables the account, changes its role or resets its password (see SessionRevocationFilter).
 */
public final class AppUserPrincipal implements UserDetails, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String email;
    private final String fullName;
    private final String passwordHash;
    private final UserRole role;
    private final String department;
    private final boolean active;
    private final Instant authenticatedAt;

    public AppUserPrincipal(AppUser user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.department = user.getDepartment();
        this.active = user.isActive();
        this.authenticatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public UserRole getRole() { return role; }
    public String getDepartment() { return department; }
    public Instant getAuthenticatedAt() { return authenticatedAt; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isEnabled() { return active; }
}
