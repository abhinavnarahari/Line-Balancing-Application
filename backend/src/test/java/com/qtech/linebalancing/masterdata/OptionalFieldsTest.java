package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.operator.dto.OperatorRequest;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.service.OperatorService;
import com.qtech.linebalancing.style.dto.StyleRequest;
import com.qtech.linebalancing.style.service.StyleService;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** Operator age and style buyer are optional. Requires the local PostgreSQL; all changes are rolled back. */
@SpringBootTest
@Transactional
class OptionalFieldsTest {

    @Autowired private StyleService styleService;
    @Autowired private OperatorService operatorService;
    @Autowired private Validator validator;

    @Test
    void styleWithoutBuyerIsSaved() {
        StyleRequest req = new StyleRequest();
        req.setStyleNo("ZZ-NOBUYER");
        req.setBuyer("  ");
        assertThat(validator.validate(req)).isEmpty();

        var saved = styleService.create(req);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getBuyer()).isNull();
    }

    @Test
    void operatorWithoutAgeIsSavedButAGivenAgeIsStillChecked() {
        OperatorRequest req = new OperatorRequest();
        req.setEmployeeId("ZZ-NOAGE");
        req.setName("No Age Test");
        req.setGender(Operator.Gender.Other);
        req.setDepartment("Sewing");
        req.setJoiningDate(LocalDate.now());
        assertThat(validator.validate(req)).isEmpty();

        var saved = operatorService.create(req);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getAge()).isNull();

        req.setAge(12);
        assertThat(validator.validate(req)).extracting(v -> v.getPropertyPath().toString()).containsExactly("age");
    }
}
