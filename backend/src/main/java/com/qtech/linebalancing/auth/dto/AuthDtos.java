package com.qtech.linebalancing.auth.dto;

import com.qtech.linebalancing.auth.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Request/response types for authentication and user administration. */
public final class AuthDtos {

    private AuthDtos() {
    }

    /** At least 8 characters with at least one letter and one digit. */
    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).{8,100}$";
    public static final String PASSWORD_MESSAGE = "must be 8-100 characters and contain a letter and a digit";

    public record LoginRequest(
            @NotBlank(message = "is required") @Email(message = "must be a valid email") String email,
            @NotBlank(message = "is required") String password) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "is required") String currentPassword,
            @NotBlank(message = "is required") @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String newPassword) {
    }

    public record CreateUserRequest(
            @NotBlank(message = "is required") @Email(message = "must be a valid email") @Size(max = 150) String email,
            @NotBlank(message = "is required") @Size(max = 120) String fullName,
            @NotNull(message = "is required") UserRole role,
            @Size(max = 120) String department,
            @NotBlank(message = "is required") @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password) {
    }

    public record UpdateUserRequest(
            @NotBlank(message = "is required") @Size(max = 120) String fullName,
            @NotNull(message = "is required") UserRole role,
            @Size(max = 120) String department,
            @NotNull(message = "is required") Boolean active) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "is required") @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String newPassword) {
    }

    /** Shape matches the frontend {@code AuthUser} type. */
    public record CurrentUserResponse(
            String id,
            String name,
            String email,
            UserRole role,
            String roleTitle,
            String department,
            String initials,
            List<String> permissions) {
    }

    public record UserResponse(
            Long id,
            String email,
            String fullName,
            UserRole role,
            String roleTitle,
            String department,
            boolean active,
            LocalDateTime lastLoginAt,
            LocalDateTime createdAt) {
    }
}
