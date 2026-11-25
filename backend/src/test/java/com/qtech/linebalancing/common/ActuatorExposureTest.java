package com.qtech.linebalancing.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "SYSTEM_ADMIN")
class ActuatorExposureTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void onlyHealthIsExposed() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/metrics")).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/actuator/info")).andExpect(status().is4xxClientError());
    }
}
