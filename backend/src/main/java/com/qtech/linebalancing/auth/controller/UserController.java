package com.qtech.linebalancing.auth.controller;

import com.qtech.linebalancing.auth.dto.AuthDtos.CreateUserRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.ResetPasswordRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.UpdateUserRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.UserResponse;
import com.qtech.linebalancing.auth.service.AppUserPrincipal;
import com.qtech.linebalancing.auth.service.UserService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** User administration — restricted to SYSTEM_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> list() {
        return ApiResponse.success(userService.listUsers());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created", userService.createUser(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(@PathVariable Long id,
                                            @Valid @RequestBody UpdateUserRequest request,
                                            @AuthenticationPrincipal AppUserPrincipal principal) {
        return ApiResponse.success("User updated", userService.updateUser(id, request, principal.getId()));
    }

    @PostMapping("/{id}/reset-password")
    public ApiResponse<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request.newPassword());
        return ApiResponse.success("Password reset; the user's active sessions were signed out");
    }
}
