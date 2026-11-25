package com.qtech.linebalancing.auth.service;

import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Throttles password guessing: after {@link #MAX_FAILURES} consecutive failures for the same
 * email + client IP, further attempts are refused for {@link #LOCK_DURATION}.
 * In-memory is sufficient for the single-instance deployment.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private record Attempts(int failures, Instant lockedUntil) {
    }

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttemptService() {
        this(Clock.systemUTC());
    }

    LoginAttemptService(Clock clock) {
        this.clock = clock;
    }

    public boolean isLocked(String key) {
        Attempts a = attempts.get(key);
        return a != null && a.lockedUntil() != null && clock.instant().isBefore(a.lockedUntil());
    }

    public void recordFailure(String key) {
        attempts.compute(key, (k, current) -> {
            int failures = (current == null || isExpiredLock(current)) ? 1 : current.failures() + 1;
            Instant lockedUntil = failures >= MAX_FAILURES ? clock.instant().plus(LOCK_DURATION) : null;
            return new Attempts(failures, lockedUntil);
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private boolean isExpiredLock(Attempts a) {
        return a.lockedUntil() != null && !clock.instant().isBefore(a.lockedUntil());
    }
}
