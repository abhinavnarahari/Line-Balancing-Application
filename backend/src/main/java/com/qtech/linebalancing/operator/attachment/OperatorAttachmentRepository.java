package com.qtech.linebalancing.operator.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OperatorAttachmentRepository extends JpaRepository<OperatorAttachment, Long> {
    List<OperatorAttachment> findByOperatorIdOrderByUploadedAtDesc(Long operatorId);
}
