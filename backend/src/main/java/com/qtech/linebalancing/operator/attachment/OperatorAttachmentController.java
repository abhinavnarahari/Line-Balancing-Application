package com.qtech.linebalancing.operator.attachment;

import com.qtech.linebalancing.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorAttachmentController {

    private final OperatorAttachmentService attachmentService;

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        AttachmentResponse response = attachmentService.uploadAttachment(id, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", response));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(attachmentService.getAttachments(id)));
    }

    @GetMapping("/attachments/{id}/download")
    @SuppressWarnings("null")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long id) {
        OperatorAttachment attachment = attachmentService.getAttachmentData(id);
        String fileName = attachment.getFileName() != null ? attachment.getFileName() : "attachment";

        return ResponseEntity.ok()
                .contentType(safeMediaType(attachment.getFileType()))
                // Encoded by Spring, so quotes/semicolons/non-ASCII in uploaded names cannot break the header
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(attachment.getData());
    }

    /**
     * The stored type comes from the uploader's browser. Malformed values would make every download fail,
     * and active content types (HTML/SVG/XML/JS) could run script if opened, so serve those as raw bytes.
     */
    private MediaType safeMediaType(String storedType) {
        if (storedType == null || storedType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            MediaType type = MediaType.parseMediaType(storedType);
            String subtype = type.getSubtype().toLowerCase();
            if (subtype.contains("html") || subtype.contains("svg") || subtype.contains("xml")
                    || subtype.contains("javascript") || subtype.contains("ecmascript")) {
                return MediaType.APPLICATION_OCTET_STREAM;
            }
            return type;
        } catch (InvalidMediaTypeException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully"));
    }
}
