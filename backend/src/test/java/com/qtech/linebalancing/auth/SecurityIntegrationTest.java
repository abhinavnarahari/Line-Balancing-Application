package com.qtech.linebalancing.auth;

import com.qtech.linebalancing.auth.entity.AppUser;
import com.qtech.linebalancing.auth.entity.UserRole;
import com.qtech.linebalancing.auth.repository.AppUserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end checks of the real login flow (CSRF cookie → login → session) and the role policy.
 * Requires the local PostgreSQL used by the other integration tests; all changes are rolled back.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {

    private static final String PASSWORD = "Factory2026";

    @Autowired private MockMvc mockMvc;
    @Autowired private AppUserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private AppUser admin;
    private AppUser supervisor;

    @BeforeEach
    void createUsers() {
        admin = userRepository.save(user("sec-admin@test.local", UserRole.SYSTEM_ADMIN));
        supervisor = userRepository.save(user("sec-supervisor@test.local", UserRole.LINE_SUPERVISOR));
        userRepository.save(user("sec-ie@test.local", UserRole.INDUSTRIAL_ENGINEER));
    }

    private AppUser user(String email, UserRole role) {
        return AppUser.builder().email(email).fullName(role.getTitle()).role(role)
                .passwordHash(passwordEncoder.encode(PASSWORD)).active(true).build();
    }

    /** A browser-like client: holds the session and the XSRF-TOKEN cookie and echoes it as a header. */
    private final class Client {
        MockHttpSession session = new MockHttpSession();
        String xsrf;

        Client csrf() throws Exception {
            MvcResult r = mockMvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk()).andReturn();
            Cookie c = r.getResponse().getCookie("XSRF-TOKEN");
            assertThat(c).as("XSRF-TOKEN cookie").isNotNull();
            xsrf = c.getValue();
            return this;
        }

        MvcResult login(String email, String password, int expectedStatus) throws Exception {
            MvcResult r = mockMvc.perform(post("/api/auth/login").session(session)
                            .cookie(new Cookie("XSRF-TOKEN", xsrf)).header("X-XSRF-TOKEN", xsrf)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                    .andExpect(status().is(expectedStatus)).andReturn();
            if (r.getRequest().getSession(false) instanceof MockHttpSession s) {
                session = s;
            }
            return r;
        }

        org.springframework.test.web.servlet.ResultActions write(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder b, String json) throws Exception {
            return mockMvc.perform(b.session(session).cookie(new Cookie("XSRF-TOKEN", xsrf)).header("X-XSRF-TOKEN", xsrf)
                    .contentType(MediaType.APPLICATION_JSON).content(json));
        }

        org.springframework.test.web.servlet.ResultActions read(String url) throws Exception {
            return mockMvc.perform(get(url).session(session));
        }
    }

    private Client signedIn(String email) throws Exception {
        Client c = new Client().csrf();
        c.login(email, PASSWORD, 200);
        return c;
    }

    @Test
    void anonymousRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/operators")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
    }

    @Test
    void loginWithoutCsrfTokenIsForbidden() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sec-admin@test.local\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void wrongPasswordGivesGenericError() throws Exception {
        MvcResult r = new Client().csrf().login("sec-admin@test.local", "WrongPass1", 401);
        assertThat(r.getResponse().getContentAsString()).contains("Invalid email or password");
        r = new Client().csrf().login("nobody@test.local", "WrongPass1", 401);
        assertThat(r.getResponse().getContentAsString()).contains("Invalid email or password");
    }

    @Test
    void sessionGivesAccessAndMeReturnsServerRole() throws Exception {
        Client c = signedIn("sec-supervisor@test.local");
        c.read("/api/operators").andExpect(status().isOk());
        c.read("/api/auth/me").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("LINE_SUPERVISOR"))
                .andExpect(jsonPath("$.data.email").value("sec-supervisor@test.local"));
    }

    @Test
    void supervisorCanRecordFloorDataButNotChangePlansOrMasters() throws Exception {
        Client c = signedIn("sec-supervisor@test.local");
        // Allowed path: reaches validation (400), i.e. not blocked by security
        c.write(post("/api/attendance"), "{}").andExpect(status().isBadRequest());
        c.write(post("/api/operators"), "{}").andExpect(status().isForbidden());
        c.write(post("/api/orders"), "{}").andExpect(status().isForbidden());
        c.read("/api/users").andExpect(status().isForbidden());
    }

    @Test
    void engineerCanWriteMastersButNotManageUsers() throws Exception {
        Client c = signedIn("sec-ie@test.local");
        c.write(post("/api/operators"), "{}").andExpect(status().isBadRequest());
        c.read("/api/users").andExpect(status().isForbidden());
    }

    @Test
    void adminManagesUsersAndDeactivationEndsTheirSession() throws Exception {
        Client sup = signedIn("sec-supervisor@test.local");
        sup.read("/api/operators").andExpect(status().isOk());

        Client adm = signedIn("sec-admin@test.local");
        adm.read("/api/users").andExpect(status().isOk());
        adm.write(put("/api/users/" + supervisor.getId()),
                        "{\"fullName\":\"Line Supervisor\",\"role\":\"LINE_SUPERVISOR\",\"active\":false}")
                .andExpect(status().isOk());

        sup.read("/api/operators").andExpect(status().isUnauthorized());
        new Client().csrf().login("sec-supervisor@test.local", PASSWORD, 401);
    }

    @Test
    void lastAdminCannotBeDemoted() throws Exception {
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.SYSTEM_ADMIN && !u.getId().equals(admin.getId()))
                .forEach(u -> { u.setActive(false); userRepository.save(u); });
        Client adm = signedIn("sec-admin@test.local");
        adm.write(put("/api/users/" + admin.getId()),
                        "{\"fullName\":\"Admin\",\"role\":\"INDUSTRIAL_ENGINEER\",\"active\":true}")
                .andExpect(status().isConflict());
    }

    @Test
    void repeatedFailuresLockTheAccountTemporarily() throws Exception {
        // Dedicated account: the throttle is application-wide, so it must not lock users other tests sign in with.
        userRepository.save(user("sec-lockout@test.local", UserRole.INDUSTRIAL_ENGINEER));
        Client c = new Client().csrf();
        for (int i = 0; i < 5; i++) {
            c.login("sec-lockout@test.local", "WrongPass1", 401);
        }
        c.login("sec-lockout@test.local", PASSWORD, 429);
    }

    @Test
    void chatConversationsAreScopedToTheSignedInUser() throws Exception {
        Client c = signedIn("sec-supervisor@test.local");
        c.read("/api/chatbot/conversations?userIdentifier=someone-else").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }
}
