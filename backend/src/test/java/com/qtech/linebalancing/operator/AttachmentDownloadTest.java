package com.qtech.linebalancing.operator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "SYSTEM_ADMIN")
@Transactional
class AttachmentDownloadTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private OperatorRepository operatorRepository;
    @Autowired private ObjectMapper objectMapper;

    private long operatorId() {
        Long id = operatorRepository.findAll().stream().findFirst().map(o -> o.getId()).orElse(null);
        assumeThat(id).isNotNull();
        return id;
    }

    private long upload(String name, String type, byte[] data) throws Exception {
        MvcResult res = mockMvc.perform(multipart("/api/operators/{id}/attachments", operatorId())
                        .file(new MockMultipartFile("file", name, type, data)).with(csrf()))
                .andExpect(status().isCreated()).andReturn();
        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        return body.path("data").path("id").asLong();
    }

    @Test
    void htmlUploadIsServedAsDownloadWithSafeHeader() throws Exception {
        long id = upload("x\"; filename=evil.html", "text/html", "<script>alert(1)</script>".getBytes());

        MvcResult res = mockMvc.perform(get("/api/operators/attachments/{id}/download", id))
                .andExpect(status().isOk()).andReturn();

        assertThat(res.getResponse().getContentType()).isEqualTo("application/octet-stream");
        assertThat(res.getResponse().getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        String cd = res.getResponse().getHeader("Content-Disposition");
        assertThat(cd).startsWith("attachment;");
        assertThat(cd).doesNotContain("filename=evil.html");
    }

    @Test
    void malformedStoredTypeStillDownloads() throws Exception {
        long id = upload("scan.pdf", "not a media type", new byte[]{1, 2, 3});
        mockMvc.perform(get("/api/operators/attachments/{id}/download", id)).andExpect(status().isOk());
    }

    @Test
    void pdfKeepsItsType() throws Exception {
        long id = upload("report.pdf", "application/pdf", new byte[]{1, 2, 3});
        MvcResult res = mockMvc.perform(get("/api/operators/attachments/{id}/download", id))
                .andExpect(status().isOk()).andReturn();
        assertThat(res.getResponse().getContentType()).isEqualTo("application/pdf");
    }
}
