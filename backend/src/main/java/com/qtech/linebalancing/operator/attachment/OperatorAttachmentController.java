package com.qtech.linebalancing.operator.attachment;

import com.qtech.linebalancing.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(getFileType(attachment)))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(attachment.getData());
    }

    private String getFileType(OperatorAttachment attachment) {
        return (attachment.getFileType() != null) ? attachment.getFileType() : "application/octet-stream";
    }
    
    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully"));
    }
}
