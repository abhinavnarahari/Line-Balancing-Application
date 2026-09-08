package com.qtech.linebalancing.notification.service;

import com.qtech.linebalancing.attendance.entity.AttendanceRecord;
import com.qtech.linebalancing.attendance.repository.AttendanceRepository;
import com.qtech.linebalancing.common.exception.ResourceNotFoundException;
import com.qtech.linebalancing.notification.dto.NotificationResponse;
import com.qtech.linebalancing.notification.entity.Notification;
import com.qtech.linebalancing.notification.repository.NotificationRepository;
import com.qtech.linebalancing.operator.entity.Operator;
import com.qtech.linebalancing.operator.repository.OperatorRepository;
import com.qtech.linebalancing.shift.entity.Shift;
import com.qtech.linebalancing.shift.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AttendanceRepository attendanceRepository;
    private final OperatorRepository operatorRepository;
    private final ShiftRepository shiftRepository;

    @Transactional
    public List<NotificationResponse> getAllNotifications(Boolean unreadOnly) {
        syncExistingLateRecordsIfEmpty();
        List<Notification> list = (unreadOnly != null && unreadOnly)
                ? notificationRepository.findByIsReadFalseOrderByCreatedAtDesc()
                : notificationRepository.findTop100ByOrderByCreatedAtDesc();
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public Map<String, Long> getUnreadCount() {
        syncExistingLateRecordsIfEmpty();
        long count = notificationRepository.countByIsReadFalse();
        return Map.of("unreadCount", count);
    }

    @Transactional
    public void syncExistingLateRecordsIfEmpty() {
        if (notificationRepository.count() == 0) {
            List<AttendanceRecord> lateRecords = attendanceRepository.findByStatusOrderByAttendanceDateDesc(AttendanceRecord.Status.LATE);
            for (AttendanceRecord r : lateRecords) {
                LocalTime checkIn = r.getCheckInTime();
                LocalTime shiftStart = r.getShift() != null ? r.getShift().getStartTime() : null;
                long lateMins = 15;
                if (checkIn != null && shiftStart != null && checkIn.isAfter(shiftStart)) {
                    lateMins = java.time.Duration.between(shiftStart, checkIn).toMinutes();
                }
                createLateAttendanceNotification(r.getOperator(), r.getShift(), checkIn != null ? checkIn : LocalTime.of(7, 15), lateMins, r.getId());
            }
        }
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        n.setIsRead(true);
        n.setReadAt(LocalDateTime.now());
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @Transactional
    public Notification createLateAttendanceNotification(Operator operator, Shift shift, LocalTime checkInTime, long lateMinutes, Long attendanceId) {
        if (attendanceId != null && notificationRepository.existsByTypeAndReferenceId("ATTENDANCE_LATE", attendanceId)) {
            log.info("Late notification already dispatched for attendance ID: {}", attendanceId);
            return null;
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String timeFormatted = checkInTime != null ? checkInTime.format(timeFmt) : "Late";
        String shiftStartFormatted = shift != null && shift.getStartTime() != null ? shift.getStartTime().format(timeFmt) : "Scheduled Start";
        String shiftCode = shift != null ? (shift.getShiftCode() != null ? shift.getShiftCode() : "Shift") : "Shift";

        String title = "Late Attendance · " + operator.getName();
        String message = String.format("%s (%s) checked in at %s (%d min%s late for %s).",
                operator.getName(), operator.getEmployeeId(), timeFormatted, lateMinutes, lateMinutes == 1 ? "" : "s", shiftCode);

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type("ATTENDANCE_LATE")
                .severity("WARNING")
                .recipientRole("MANAGER")
                .operator(operator)
                .shift(shift)
                .referenceId(attendanceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.warn("MANAGER ALERT TRIGGERED: {}", message);
        return saved;
    }

    @Transactional
    public Notification createBottleneckNotification(String lineName, String orderNo, String bottleneckSummary, Integer bottleneckCount, Double taktTimeSecs, Long referenceId) {
        int count = bottleneckCount != null ? bottleneckCount : 1;
        double takt = taktTimeSecs != null ? taktTimeSecs : 0.0;
        String line = lineName != null ? lineName : "Sewing Line";
        String order = orderNo != null ? orderNo : "Active Order";

        String title = String.format("Bottleneck Alert · %s", line);
        String message = String.format("%s · %d station(s) exceed Takt (%.1fs): %s",
                order, count, takt, bottleneckSummary != null ? bottleneckSummary : "Cycle time exceeds target");

        if (referenceId != null) {
            List<Notification> existingList = notificationRepository.findByTypeAndReferenceId("BOTTLENECK_ALERT", referenceId);
            if (!existingList.isEmpty()) {
                Notification primary = existingList.get(0);
                primary.setTitle(title);
                primary.setMessage(message);
                primary.setSeverity("CRITICAL");
                primary.setIsRead(false);
                primary.setReadAt(null);

                // Clean up any extra duplicates so there is strictly ONE notification
                if (existingList.size() > 1) {
                    for (int i = 1; i < existingList.size(); i++) {
                        notificationRepository.delete(existingList.get(i));
                    }
                }
                return notificationRepository.save(primary);
            }
        }

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type("BOTTLENECK_ALERT")
                .severity("CRITICAL")
                .recipientRole("MANAGER")
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.warn("BOTTLENECK MANAGER ALERT DISPATCHED: {}", message);
        return saved;
    }

    @Transactional
    public Notification createUnmarkedAttendanceNotification(Operator operator, Shift shift, long overdueMinutes) {
        if (operator == null) return null;

        List<Notification> existing = notificationRepository.findByTypeAndReferenceId("ATTENDANCE_LATE", operator.getId());
        String shiftCode = shift != null && shift.getShiftCode() != null ? shift.getShiftCode() : "Scheduled Shift";
        String shiftStart = shift != null && shift.getStartTime() != null ? shift.getStartTime().toString() : "08:00";
        String message = String.format("%s (%s) has NOT marked attendance (%d mins overdue for %s start at %s).",
                operator.getName(), operator.getEmployeeId(), overdueMinutes, shiftCode, shiftStart);

        if (!existing.isEmpty()) {
            Notification primary = existing.get(0);
            primary.setMessage(message);
            primary.setSeverity(overdueMinutes >= 15 ? "CRITICAL" : overdueMinutes >= 10 ? "WARNING" : "INFO");
            primary.setIsRead(false);
            primary.setReadAt(null);
            return notificationRepository.save(primary);
        }

        Notification notification = Notification.builder()
                .title(String.format("Immediate Action · %s Unmarked", operator.getName()))
                .message(message)
                .type("ATTENDANCE_LATE")
                .severity(overdueMinutes >= 15 ? "CRITICAL" : overdueMinutes >= 10 ? "WARNING" : "INFO")
                .recipientRole("MANAGER")
                .operator(operator)
                .shift(shift)
                .referenceId(operator.getId())
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.warn("IMMEDIATE ACTION ATTENDANCE ALERT: {}", message);
        return saved;
    }

    @Transactional
    public Notification triggerUnmarkedAlert(Long operatorId, Long shiftId, long overdueMinutes) {
        Operator op = operatorRepository.findById(operatorId).orElse(null);
        Shift sh = shiftId != null ? shiftRepository.findById(shiftId).orElse(null) : null;
        if (op == null) return null;
        return createUnmarkedAttendanceNotification(op, sh, overdueMinutes);
    }

    public NotificationResponse toResponse(Notification n) {
        if (n == null) return null;
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .severity(n.getSeverity())
                .recipientRole(n.getRecipientRole())
                .operatorId(n.getOperator() != null ? n.getOperator().getId() : null)
                .operatorName(n.getOperator() != null ? n.getOperator().getName() : null)
                .operatorEmployeeId(n.getOperator() != null ? n.getOperator().getEmployeeId() : null)
                .shiftId(n.getShift() != null ? n.getShift().getId() : null)
                .shiftCode(n.getShift() != null ? n.getShift().getShiftCode() : null)
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
