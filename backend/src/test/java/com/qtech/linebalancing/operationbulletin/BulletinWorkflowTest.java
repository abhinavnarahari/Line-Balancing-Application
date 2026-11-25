package com.qtech.linebalancing.operationbulletin;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.operationbulletin.dto.BulletinRequest;
import com.qtech.linebalancing.operationbulletin.dto.BulletinResponse;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin.Status;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operationbulletin.service.OperationBulletinService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** FUNC-06 change control. Requires the local PostgreSQL used by the other integration tests; rolled back. */
@SpringBootTest
@Transactional
class BulletinWorkflowTest {

    @Autowired private OperationBulletinService service;
    @Autowired private OperationBulletinRepository repository;

    private OperationBulletin source;

    @BeforeEach
    void pickBulletin() {
        source = repository.findAll().stream().findFirst().orElse(null);
        assumeThat(source).as("needs a seeded bulletin").isNotNull();
    }

    /** A fresh DRAFT revision of the seeded bulletin, so each test starts from a known status. */
    private Long draft() {
        BulletinResponse rev = service.createRevision(source.getId());
        assertThat(rev.getStatus()).isEqualTo(Status.DRAFT);
        return rev.getId();
    }

    @Test
    void releaseRequiresApprovalFirst() {
        Long id = draft();
        assertThatThrownBy(() -> service.updateStatus(id, Status.RELEASED, "tester"))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("Approve it first");

        service.updateStatus(id, Status.APPROVED, "IE Lead");
        BulletinResponse released = service.updateStatus(id, Status.RELEASED, "Plant Head");
        assertThat(released.getStatus()).isEqualTo(Status.RELEASED);
        OperationBulletin saved = repository.findById(id).orElseThrow();
        assertThat(saved.getApprovedBy()).isEqualTo("IE Lead");
        assertThat(saved.getReleasedBy()).isEqualTo("Plant Head");
    }

    @Test
    void releasedBulletinIsLockedAndCannotBeDeleted() {
        Long id = draft();
        service.updateStatus(id, Status.APPROVED, null);
        service.updateStatus(id, Status.RELEASED, null);

        BulletinRequest anyEdit = new BulletinRequest();
        assertThatThrownBy(() -> service.update(id, anyEdit))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("Create a revision");
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("Archive it instead");

        // The supported path: a new revision is an editable DRAFT
        assertThat(service.createRevision(id).getStatus()).isEqualTo(Status.DRAFT);
    }

    @Test
    void archivedIsTerminal() {
        Long id = draft();
        service.updateStatus(id, Status.ARCHIVED, null);
        assertThatThrownBy(() -> service.updateStatus(id, Status.DRAFT, null))
                .isInstanceOf(BusinessRuleException.class);
    }
}
