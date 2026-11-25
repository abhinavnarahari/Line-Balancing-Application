package com.qtech.linebalancing.auth.service;

import com.qtech.linebalancing.auth.dto.AuthDtos.CreateUserRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.CurrentUserResponse;
import com.qtech.linebalancing.auth.dto.AuthDtos.UpdateUserRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.UserResponse;
import com.qtech.linebalancing.auth.entity.AppUser;
import com.qtech.linebalancing.auth.entity.UserRole;
import com.qtech.linebalancing.auth.repository.AppUserRepository;
import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionRevocationService sessionRevocationService;

    public List<UserResponse> listUsers() {
        return userRepository.findAllByOrderByFullNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessRuleException("A user with email '" + email + "' already exists.");
        }
        AppUser user = AppUser.builder()
                .email(email)
                .fullName(request.fullName().trim())
                .role(request.role())
                .department(blankToNull(request.department()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .active(true)
                .build();
        log.info("User account created: {} ({})", email, request.role());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, Long actingUserId) {
        AppUser user = findOrThrow(id);
        boolean losesAdmin = user.getRole() == UserRole.SYSTEM_ADMIN
                && (request.role() != UserRole.SYSTEM_ADMIN || !request.active());
        if (losesAdmin && user.isActive() && userRepository.countByRoleAndActiveTrue(UserRole.SYSTEM_ADMIN) <= 1) {
            throw new BusinessRuleException("At least one active System Administrator is required.");
        }
        if (id.equals(actingUserId) && !request.active()) {
            throw new BusinessRuleException("You cannot deactivate your own account.");
        }

        boolean accessChanged = user.getRole() != request.role() || user.isActive() != request.active();
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setDepartment(blankToNull(request.department()));
        user.setActive(request.active());
        AppUser saved = userRepository.save(user);
        if (accessChanged) {
            sessionRevocationService.revokeSessions(id);
        }
        return toResponse(saved);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        AppUser user = findOrThrow(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        sessionRevocationService.revokeSessions(id);
        log.info("Password reset by administrator for user {}", user.getEmail());
    }

    @Transactional
    public void changeOwnPassword(Long id, String currentPassword, String newPassword) {
        AppUser user = findOrThrow(id);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void recordLogin(Long id) {
        userRepository.findById(id).ifPresent(u -> {
            u.setLastLoginAt(LocalDateTime.now());
            userRepository.save(u);
        });
    }

    public CurrentUserResponse currentUser(AppUserPrincipal principal) {
        AppUser user = findOrThrow(principal.getId());
        return new CurrentUserResponse(
                String.valueOf(user.getId()),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getRole().getTitle(),
                user.getDepartment() != null ? user.getDepartment() : "",
                initials(user.getFullName()),
                permissionsFor(user.getRole()));
    }

    static List<String> permissionsFor(UserRole role) {
        return switch (role) {
            case SYSTEM_ADMIN -> List.of("READ", "WRITE", "EXECUTE_LINE_BALANCE", "PUBLISH_BULLETINS", "ASSIGN_OPERATORS", "MANAGE_USERS");
            case INDUSTRIAL_ENGINEER, PRODUCTION_MANAGER -> List.of("READ", "WRITE", "EXECUTE_LINE_BALANCE", "PUBLISH_BULLETINS", "ASSIGN_OPERATORS");
            case LINE_SUPERVISOR -> List.of("READ", "RECORD_PRODUCTION", "ASSIGN_OPERATORS");
        };
    }

    private static String initials(String fullName) {
        String result = Arrays.stream(fullName.trim().split("\\s+"))
                .filter(w -> !w.isEmpty())
                .limit(2)
                .map(w -> w.substring(0, 1).toUpperCase())
                .collect(Collectors.joining());
        return result.isEmpty() ? "U" : result;
    }

    private AppUser findOrThrow(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private UserResponse toResponse(AppUser u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getRole().getTitle(),
                u.getDepartment(), u.isActive(), u.getLastLoginAt(), u.getCreatedAt());
    }
}
