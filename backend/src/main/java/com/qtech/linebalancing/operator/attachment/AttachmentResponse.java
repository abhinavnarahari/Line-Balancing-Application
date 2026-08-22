package com.qtech.linebalancing.operator.attachment;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AttachmentResponse {
    private Long id;
    private String fileName;
    private String fileType;
    private LocalDateTime uploadedAt;
}
