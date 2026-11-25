package com.qtech.linebalancing.auth.config;

import com.qtech.linebalancing.auth.entity.AppUser;
import com.qtech.linebalancing.auth.entity.UserRole;
import com.qtech.linebalancing.auth.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Creates the first System Administrator when no user accounts exist, so a fresh installation is reachable
 * without any credential being committed to the repository. Does nothing once any user exists.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@sewnexa.local}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        String password = adminPassword;
        boolean generated = password == null || password.isBlank();
        if (generated) {
            byte[] bytes = new byte[15];
            new SecureRandom().nextBytes(bytes);
            password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        }

        userRepository.save(AppUser.builder()
                .email(adminEmail.trim().toLowerCase())
                .fullName("System Administrator")
                .role(UserRole.SYSTEM_ADMIN)
                .department("IT & Administration")
                .passwordHash(passwordEncoder.encode(password))
                .active(true)
                .build());

        if (generated) {
            // One-time bootstrap output (same approach as Jenkins/Grafana); set APP_ADMIN_PASSWORD to avoid it.
            log.warn("Created initial administrator '{}' with generated password: {}  -- sign in and change it now.",
                    adminEmail, password);
        } else {
            log.info("Created initial administrator '{}' from APP_ADMIN_PASSWORD.", adminEmail);
        }
    }
}
