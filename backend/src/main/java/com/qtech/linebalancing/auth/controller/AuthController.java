package com.qtech.linebalancing.auth.controller;

import com.qtech.linebalancing.auth.dto.AuthDtos.ChangePasswordRequest;
import com.qtech.linebalancing.auth.dto.AuthDtos.CurrentUserResponse;
import com.qtech.linebalancing.auth.dto.AuthDtos.LoginRequest;
import com.qtech.linebalancing.auth.service.AppUserPrincipal;
import com.qtech.linebalancing.auth.service.LoginAttemptService;
import com.qtech.linebalancing.auth.service.UserService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private static final String INVALID_CREDENTIALS = "Invalid email or password.";

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final LoginAttemptService loginAttemptService;
    private final UserService userService;

    /** Issues the XSRF-TOKEN cookie so the SPA can send its first state-changing request (login). */
    @GetMapping("/csrf")
    public ApiResponse<Void> csrf(CsrfToken token) {
        token.getToken(); // force generation; the cookie repository writes it to the response
        return ApiResponse.success("ok");
    }

    @PostMapping("/login")
    public ApiResponse<CurrentUserResponse> login(@Valid @RequestBody LoginRequest body,
                                                  HttpServletRequest request,
                                                  HttpServletResponse response) {
        String attemptKey = body.email().trim().toLowerCase() + "|" + request.getRemoteAddr();
        if (loginAttemptService.isLocked(attemptKey)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed sign-in attempts. Please try again in 15 minutes.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(body.email().trim(), body.password()));
        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(attemptKey);
            log.warn("Failed sign-in for {} from {}", body.email(), request.getRemoteAddr());
            // Same message for unknown user, wrong password and disabled account (no account enumeration).
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }
        loginAttemptService.recordSuccess(attemptKey);

        // Session fixation protection: never keep a pre-login session id.
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        userService.recordLogin(principal.getId());
        log.info("User {} signed in", principal.getEmail());
        return ApiResponse.success(userService.currentUser(principal));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response,
                                    Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ApiResponse.success("Signed out");
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return ApiResponse.success(userService.currentUser(principal));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal AppUserPrincipal principal,
                                            @Valid @RequestBody ChangePasswordRequest body) {
        userService.changeOwnPassword(principal.getId(), body.currentPassword(), body.newPassword());
        return ApiResponse.success("Password changed");
    }
}
