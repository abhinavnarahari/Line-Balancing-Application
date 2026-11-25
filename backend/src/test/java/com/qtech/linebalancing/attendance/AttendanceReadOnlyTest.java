package com.qtech.linebalancing.attendance;

import com.qtech.linebalancing.allocation.dto.OperatorPoolDTO;
import com.qtech.linebalancing.allocation.service.OperatorPoolService;
import com.qtech.linebalancing.attendance.repository.AttendanceRepository;
import com.qtech.linebalancing.attendance.service.AttendanceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * DB-02: viewing attendance or planning a future day must never write attendance rows.
 * Requires the local PostgreSQL used by the other integration tests; all changes are rolled back.
 */
@SpringBootTest
@Transactional
class AttendanceReadOnlyTest {

    private static final LocalDate FUTURE = LocalDate.now().plusYears(3);
    private static final LocalDate PAST_UNRECORDED = LocalDate.of(2001, 1, 1);

    @Autowired private AttendanceService attendanceService;
    @Autowired private OperatorPoolService operatorPoolService;
    @Autowired private AttendanceRepository attendanceRepository;

    @Test
    void viewingADayWithoutRecordsReturnsNothingAndWritesNothing() {
        assertThat(attendanceService.getAttendanceForDate(FUTURE, null)).isEmpty();
        assertThat(attendanceRepository.findByAttendanceDateOrderByOperatorId(FUTURE)).isEmpty();
    }

    @Test
    void planningAFutureDayProjectsAvailabilityWithoutWriting() {
        List<OperatorPoolDTO> pool = operatorPoolService.getOperatorPool(FUTURE, null);
        assertThat(pool).isNotEmpty();
        assertThat(pool).allMatch(p -> "PRESENT".equals(p.getAttendanceStatus()));
        assertThat(attendanceRepository.findByAttendanceDateOrderByOperatorId(FUTURE)).isEmpty();
    }

    @Test
    void pastDayWithoutRecordsIsNotReported() {
        List<OperatorPoolDTO> pool = operatorPoolService.getOperatorPool(PAST_UNRECORDED, null);
        assertThat(pool).allMatch(p -> !"ABSENT".equals(p.getAttendanceStatus()));
        assertThat(attendanceRepository.findByAttendanceDateOrderByOperatorId(PAST_UNRECORDED)).isEmpty();
    }
}
