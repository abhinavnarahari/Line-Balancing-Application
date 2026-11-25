package com.qtech.linebalancing.masterdata;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.common.skill.SkillScale;
import com.qtech.linebalancing.skillmatrix.dto.SkillAssessmentRequest;
import com.qtech.linebalancing.skillmatrix.service.SkillMatrixService;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 4-level skill scale and the skill matrix batch import. Requires the local PostgreSQL; changes are rolled back. */
@SpringBootTest
@Transactional
class SkillScaleImportTest {

    @Autowired private SkillMatrixService service;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private Validator validator;

    @Test
    void levelsRoundTripThroughCycleTime() {
        double smvMinutes = 0.207;
        for (int level = 1; level <= 4; level++) {
            int cycle = (int) Math.round(smvMinutes * 60 / SkillScale.planningEfficiency(level));
            assertThat(SkillMatrixService.cycleTimeToRating(cycle, "x", smvMinutes)).as("level %d", level).isEqualTo(level);
        }
        assertThat(SkillScale.ratingForEfficiency(0.70)).isEqualTo(4);
        assertThat(SkillScale.ratingForEfficiency(0.69)).isEqualTo(3);
    }

    @Test
    void ratingFiveIsRejectedAndTheDatabaseOnlyAcceptsOneToFour() {
        SkillAssessmentRequest r = request(1L, 1L, 5);
        assertThat(validator.validate(r)).extracting(v -> v.getPropertyPath().toString()).contains("rating");
        assertThat(jdbc.queryForObject("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'skill_assessments_rating_check'", String.class))
                .contains("4");
    }

    @Test
    void batchSavesEveryRatingOrNone() {
        Long operatorId = jdbc.queryForObject("INSERT INTO operators (employee_id, name, gender, department, joining_date, active) "
                + "VALUES ('ZZ-SK1', 'Skill Test', 'Female', 'Sewing', CURRENT_DATE, true) RETURNING id", Long.class);
        Long op1 = jdbc.queryForObject("INSERT INTO operations (operation_code, name, standard_smv, sequence, active) VALUES ('ZZ-SK-OP1', 'ZZ Op 1', 0.461, 1, true) RETURNING id", Long.class);
        Long op2 = jdbc.queryForObject("INSERT INTO operations (operation_code, name, standard_smv, sequence, active) VALUES ('ZZ-SK-OP2', 'ZZ Op 2', 0.207, 2, true) RETURNING id", Long.class);

        var saved = service.addAssessmentsBatch(List.of(request(operatorId, op1, 4), request(operatorId, op2, 2)));
        assertThat(saved).extracting("rating").containsExactly(4, 2);

        assertThatThrownBy(() -> service.addAssessmentsBatch(List.of(request(operatorId, op1, 3), request(operatorId, op1, 2))))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("more than one rating");
    }

    private SkillAssessmentRequest request(Long operatorId, Long operationId, int rating) {
        SkillAssessmentRequest r = new SkillAssessmentRequest();
        r.setOperatorId(operatorId);
        r.setOperationId(operationId);
        r.setRating(rating);
        Double smv = operationId == null ? null : jdbc.query("SELECT standard_smv FROM operations WHERE id = ?", rs -> rs.next() ? rs.getDouble(1) : null, operationId);
        double smvSecs = (smv != null ? smv : 0.5) * 60;
        r.setCycleTimeSeconds((int) Math.max(1, Math.round(smvSecs / SkillScale.planningEfficiency(Math.min(rating, 4)))));
        r.setEffectiveDate(LocalDate.now());
        return r;
    }
}
