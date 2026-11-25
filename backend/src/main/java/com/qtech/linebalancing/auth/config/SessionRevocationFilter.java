package com.qtech.linebalancing.auth.config;

import com.qtech.linebalancing.auth.service.AppUserPrincipal;
import com.qtech.linebalancing.auth.service.SessionRevocationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Ends sessions that were authenticated before an admin disabled the user or changed their access. */
@RequiredArgsConstructor
class SessionRevocationFilter extends OncePerRequestFilter {

    private final SessionRevocationService revocationService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserPrincipal principal
                && revocationService.isRevoked(principal)) {
            SecurityContextHolder.clearContext();
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
        }
        chain.doFilter(request, response);
    }
}
