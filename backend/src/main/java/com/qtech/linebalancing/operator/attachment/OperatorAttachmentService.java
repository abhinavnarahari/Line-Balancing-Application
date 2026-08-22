package com.qtech.linebalancing.operator.attachment;

import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OperatorAttachmentService {

    private final OperatorAttachmentRepository attachmentRepository;
    private final OperatorRepository operatorRepository;

    @Transactional
    public AttachmentResponse uploadAttachment(Long operatorId, MultipartFile file) throws IOException {
        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Operator not found"));

        OperatorAttachment attachment = OperatorAttachment.builder()
                .operator(operator)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .data(file.getBytes())
                .build();

        attachment = attachmentRepository.save(attachment);
        return mapToResponse(attachment);
    }

    public List<AttachmentResponse> getAttachments(Long operatorId) {
        return attachmentRepository.findByOperatorIdOrderByUploadedAtDesc(operatorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OperatorAttachment getAttachmentData(Long id) {
        return attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
    }
    
    @Transactional
    public void deleteAttachment(Long id) {
        attachmentRepository.deleteById(id);
    }

    private AttachmentResponse mapToResponse(OperatorAttachment attachment) {
        AttachmentResponse response = new AttachmentResponse();
        response.setId(attachment.getId());
        response.setFileName(attachment.getFileName());
        response.setFileType(attachment.getFileType());
        response.setUploadedAt(attachment.getUploadedAt());
        return response;
    }
}
