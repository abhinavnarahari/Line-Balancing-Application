package com.qtech.linebalancing.operator;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.operator.service.OperatorService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * BE-03: imports are all-or-nothing. Deliberately NOT @Transactional so the service's own transaction
 * boundary (and its rollback) is what gets tested. Requires the local PostgreSQL; cleans up after itself.
 */
@SpringBootTest
class OperatorBatchImportTest {

    private static final String PREFIX = "IMPTEST-";

    @Autowired private OperatorService service;
    @Autowired private OperatorRepository repository;

    @AfterEach
    void cleanUp() {
        repository.deleteAll(repository.findAll().stream()
                .filter(o -> o.getEmployeeId().startsWith(PREFIX)).toList());
    }

    private static OperatorRequest row(String id) {
        OperatorRequest r = new OperatorRequest();
        r.setEmployeeId(PREFIX + id);
        r.setName("Import " + id);
        r.setAge(30);
        r.setGender(Operator.Gender.Female);
        r.setDepartment("Sewing");
        r.setJoiningDate(LocalDate.of(2024, 1, 15));
        return r;
    }

    private long imported() {
        return repository.findAll().stream().filter(o -> o.getEmployeeId().startsWith(PREFIX)).count();
    }

    @Test
    void validBatchCreatesAllRows() {
        assertThat(service.createBatch(List.of(row("1"), row("2"), row("3")))).hasSize(3);
        assertThat(imported()).isEqualTo(3);
    }

    @Test
    void duplicateInsideFileRollsBackEverything() {
        assertThatThrownBy(() -> service.createBatch(List.of(row("1"), row("2"), row("1"))))
                .isInstanceOf(BusinessRuleException.class).hasMessageStartingWith("Row 4:");
        assertThat(imported()).isZero();
    }

    @Test
    void rowClashingWithExistingOperatorRollsBackEverything() {
        service.createBatch(List.of(row("EXIST")));
        assertThatThrownBy(() -> service.createBatch(List.of(row("A"), row("EXIST"))))
                .isInstanceOf(BusinessRuleException.class).hasMessageStartingWith("Row 3:");
        assertThat(imported()).isEqualTo(1); // only the pre-existing one
    }
}
