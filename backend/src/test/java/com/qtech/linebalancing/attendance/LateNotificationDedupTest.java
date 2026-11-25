package com.qtech.linebalancing.attendance;

import com.qtech.linebalancing.attendance.dto.AttendanceRequest;
import com.qtech.linebalancing.attendance.dto.BiometricSyncRequest;
import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import com.qtech.linebalancing.attendance.service.AttendanceService;
import com.qtech.linebalancing.notification.repository.NotificationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

/**
 * Documents existing behaviour (audit item BE-01 turned out not to be a defect): NotificationService sends at most
 * one ATTENDANCE_LATE notification per attendance record, so edits and repeated biometric syncs do not re-alert.
 * Requires the local PostgreSQL used by the other integration tests; all changes are rolled back.
 */
@SpringBootTest
@Transactional
class LateNotificationDedupTest {

    private static final LocalDate DAY = LocalDate.of(2031, 1, 6);

    @Autowired private AttendanceService attendanceService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private OperatorRepository operatorRepository;
    @Autowired private ShiftRepository shiftRepository;

    @Test
    void reSavingALateRecordDoesNotNotifyAgain() {
        Operator op = operatorRepository.findAll().stream().filter(Operator::isActive).findFirst().orElse(null);
        Shift shift = shiftRepository.findById(1L).orElse(null);
        assumeThat(op).isNotNull();
        assumeThat(shift).isNotNull();
        assumeThat(shift.getStartTime()).isNotNull();

        long before = notificationRepository.count();

        AttendanceRequest req = new AttendanceRequest();
        req.setAttendanceDate(DAY);
        req.setOperatorId(op.getId());
        req.setShiftId(shift.getId());
        req.setStatus(AttendanceRecord.Status.PRESENT);
        req.setCheckInTime(shift.getStartTime().plusMinutes(20));
        attendanceService.markAttendance(req);
        assertThat(notificationRepository.count()).isEqualTo(before + 1);

        req.setRemarks("edited remarks");
        attendanceService.markAttendance(req);
        assertThat(notificationRepository.count()).as("remarks-only edit").isEqualTo(before + 1);

        BiometricSyncRequest sync = new BiometricSyncRequest();
        sync.setEmployeeId(op.getEmployeeId());
        sync.setAttendanceDate(DAY);
        sync.setCheckInTime(shift.getStartTime().plusMinutes(40));
        attendanceService.syncBiometric(List.of(sync));
        attendanceService.syncBiometric(List.of(sync));
        long afterSyncs = notificationRepository.count();
        attendanceService.syncBiometric(List.of(sync));
        assertThat(notificationRepository.count()).as("repeated biometric sync").isEqualTo(afterSyncs);
    }
}
