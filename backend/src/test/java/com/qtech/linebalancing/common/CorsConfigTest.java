package com.qtech.linebalancing.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@SpringBootTest(properties = "app.cors.allowed-origins=*")
@AutoConfigureMockMvc
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void wildcardOriginDoesNotAllowCredentials() throws Exception {
        mockMvc.perform(options("/api/operators")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "DELETE"))
                .andExpect(header().string("Access-Control-Allow-Origin", "*"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }
}
