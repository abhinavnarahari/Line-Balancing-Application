package com.qtech.linebalancing.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "SYSTEM_ADMIN")
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unknownUrlIs404() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void wrongMethodIs405() throws Exception {
        mockMvc.perform(patch("/api/shifts").with(csrf()))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void wrongPathVariableTypeIs400() throws Exception {
        mockMvc.perform(get("/api/shifts/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("id")));
    }

    @Test
    void malformedJsonIs400() throws Exception {
        mockMvc.perform(post("/api/shifts").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body."));
    }

    @Test
    void validationErrorsAreReturnedPerField() throws Exception {
        mockMvc.perform(post("/api/shifts").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.shiftName").value("Shift name is required"))
                .andExpect(jsonPath("$.message").value(containsString("Shift code is required")));
    }

    @Test
    void invalidBatchItemsAreRejectedWith400() throws Exception {
        mockMvc.perform(post("/api/skill-matrix/performance-logs/batch").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"actualCycleTimeSeconds\": 0}]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Operator ID is required")));
    }
}
