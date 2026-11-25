package com.qtech.linebalancing.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.auth.service.AppUserDetailsService;
import com.qtech.linebalancing.auth.service.SessionRevocationService;
import com.qtech.linebalancing.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import java.io.IOException;

/**
 * Session-cookie authentication with CSRF protection and server-side role checks.
 *
 * <p>Access policy: every API call requires a signed-in user. Reads are open to all roles.
 * Writes are limited to SYSTEM_ADMIN, INDUSTRIAL_ENGINEER and PRODUCTION_MANAGER, except the floor-execution
 * endpoints a LINE_SUPERVISOR uses. User administration is SYSTEM_ADMIN only.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PLANNERS = {"SYSTEM_ADMIN", "INDUSTRIAL_ENGINEER", "PRODUCTION_MANAGER"};
    private static final String[] ALL_ROLES = {"SYSTEM_ADMIN", "INDUSTRIAL_ENGINEER", "PRODUCTION_MANAGER", "LINE_SUPERVISOR"};

    /** Endpoints a Line Supervisor may write to (floor execution). */
    private static final String[] SUPERVISOR_WRITE_PATHS = {
            "/api/attendance/**",
            "/api/shift-assignments/**",
            "/api/piece-production/**",
            "/api/hourly-production/**",
            "/api/skill-matrix/performance-logs/**",
            "/api/skill-matrix/auto-update",
            "/api/notifications/**",
            "/api/chatbot/**",
            "/api/auth/**",
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper,
                                                   SessionRevocationService revocationService) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .securityContext(ctx -> ctx.securityContextRepository(securityContextRepository()))
                .sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable) // POST /api/auth/logout
                .requestCache(AbstractHttpConfigurer::disable)
                .addFilterAfter(new SessionRevocationFilter(revocationService), SecurityContextHolderFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                writeError(res, objectMapper, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required. Please sign in."))
                        .accessDeniedHandler((req, res, e) ->
                                writeError(res, objectMapper, HttpServletResponse.SC_FORBIDDEN,
                                        "You do not have permission to perform this action.")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/users/**").hasRole("SYSTEM_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole(ALL_ROLES)
                        .requestMatchers(SUPERVISOR_WRITE_PATHS).hasAnyRole(ALL_ROLES)
                        .requestMatchers("/api/**").hasAnyRole(PLANNERS)
                        .anyRequest().denyAll());
        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AppUserDetailsService userDetailsService, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }

    private static void writeError(HttpServletResponse res, ObjectMapper mapper, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(res.getOutputStream(), ApiResponse.error(message));
    }
}
