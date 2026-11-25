package com.qtech.linebalancing.production;

import com.qtech.linebalancing.operator.repository.OperatorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.assertj.core.api.Assumptions.assumeThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "SYSTEM_ADMIN")
@Transactional
class PieceProductionValidationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private OperatorRepository operatorRepository;

    private String body(long operatorId, int completed, int good, int reject) {
        return """
                {"operatorId": %d, "targetQty": %d, "completedQty": %d, "goodQty": %d, "rejectQty": %d,
                 "startTime": "10:00:00", "endTime": "11:00:00", "samMinutes": 0.45}
                """.formatted(operatorId, completed, completed, good, reject);
    }

    private long anyOperatorId() {
        Long id = operatorRepository.findAll().stream().findFirst().map(o -> o.getId()).orElse(null);
        assumeThat(id).isNotNull();
        return id;
    }

    @Test
    void negativeQuantityIsRejected() throws Exception {
        mockMvc.perform(post("/api/piece-production/record").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(anyOperatorId(), -50, -50, 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("must not be negative")));
    }

    @Test
    void goodPlusRejectMustEqualCompleted() throws Exception {
        mockMvc.perform(post("/api/piece-production/record").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(anyOperatorId(), 100, 120, 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("must equal completed quantity")));
    }

    @Test
    void consistentEntryIsAccepted() throws Exception {
        mockMvc.perform(post("/api/piece-production/record").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(anyOperatorId(), 100, 97, 3)))
                .andExpect(status().isCreated());
    }
}
