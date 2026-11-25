package com.qtech.linebalancing.shift;

import com.qtech.linebalancing.common.exception.BusinessRuleException;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import com.qtech.linebalancing.shift.service.ShiftService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assumptions.assumeThat;

/** Requires the local PostgreSQL used by the other integration tests; all changes are rolled back. */
@SpringBootTest
@Transactional
class ShiftDeletionTest {

    @Autowired private ShiftService service;
    @Autowired private ShiftRepository shiftRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void unusedShiftIsDeleted() {
        Shift shift = shiftRepository.saveAndFlush(Shift.builder()
                .shiftCode("ZZDEL").shiftName("ZZ Delete Test")
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                .breakDurationMinutes(0).active(true).build());

        service.delete(shift.getId());

        assertThat(shiftRepository.findById(shift.getId())).isEmpty();
    }

    @Test
    void shiftInUseIsRefusedWithWhatUsesItAndIsKept() {
        Long usedShiftId = jdbcTemplate.query("SELECT shift_id FROM attendance_records WHERE shift_id IS NOT NULL LIMIT 1",
                rs -> rs.next() ? rs.getLong(1) : null);
        assumeThat(usedShiftId).as("needs a shift with attendance records").isNotNull();

        assertThatThrownBy(() -> service.delete(usedShiftId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("attendance record")
                .hasMessageContaining("Deactivate it instead");
        assertThat(shiftRepository.findById(usedShiftId)).isPresent();
    }
}
