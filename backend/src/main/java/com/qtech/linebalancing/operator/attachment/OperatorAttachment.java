package com.qtech.linebalancing.operator.attachment;

import com.qtech.linebalancing.operator.entity.Operator;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operator_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatorAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private byte[] data;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    public void onPrePersist() {
        this.uploadedAt = LocalDateTime.now();
    }
}
