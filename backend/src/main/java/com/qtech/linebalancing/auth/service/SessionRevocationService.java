package com.qtech.linebalancing.auth.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Records when a user's existing sessions stop being valid (account disabled, role changed,
 * password changed/reset). Sessions authenticated before that instant are rejected on their next request.
 */
@Service
public class SessionRevocationService {

    private final Map<Long, Instant> revokedBefore = new ConcurrentHashMap<>();

    public void revokeSessions(Long userId) {
        revokedBefore.put(userId, Instant.now());
    }

    public boolean isRevoked(AppUserPrincipal principal) {
        Instant cutoff = revokedBefore.get(principal.getId());
        return cutoff != null && !principal.getAuthenticatedAt().isAfter(cutoff);
    }
}
