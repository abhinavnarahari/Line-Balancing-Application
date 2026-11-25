package com.qtech.linebalancing.operationbulletin;

import com.qtech.linebalancing.operationbulletin.dto.BulletinResponse;
import com.qtech.linebalancing.operationbulletin.entity.OperationBulletin;
import com.qtech.linebalancing.operationbulletin.repository.OperationBulletinRepository;
import com.qtech.linebalancing.operationbulletin.service.OperationBulletinService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

/** Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class BulletinRevisionTest {

    @Autowired
    private OperationBulletinService bulletinService;

    @Autowired
    private OperationBulletinRepository bulletinRepository;

    @Test
    void revisionCanBeCreatedTwiceAndKeepsCodeAndVersion() {
        OperationBulletin parent = bulletinRepository.findAll().stream().findFirst().orElse(null);
        assumeThat(parent).as("needs at least one seeded bulletin").isNotNull();

        BulletinResponse rev = bulletinService.createRevision(parent.getId());
        bulletinRepository.flush(); // force the INSERT so the DB unique constraint is evaluated

        BulletinResponse rev2 = bulletinService.createRevision(rev.getId());
        bulletinRepository.flush();

        OperationBulletin saved = bulletinRepository.findById(rev2.getId()).orElseThrow();
        assertThat(saved.getBulletinCode()).isEqualTo(parent.getBulletinCode());
        assertThat(saved.getVersion()).isEqualTo(parent.getVersion());
        assertThat(saved.getRevisionNumber()).isEqualTo(parent.getRevisionNumber() + 2);

        // Editing the revision must not be blocked by its parent sharing code + version.
        assertThat(bulletinRepository.existsByBulletinCodeIgnoreCaseAndVersionAndRevisionNumberAndIdNot(
                saved.getBulletinCode(), saved.getVersion(), saved.getRevisionNumber(), saved.getId())).isFalse();
    }
}
