package com.qtech.linebalancing.notification.controller;

import com.qtech.linebalancing.common.response.ApiResponse;
import com.qtech.linebalancing.notification.dto.NotificationResponse;
import com.qtech.linebalancing.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAllNotifications(
            @RequestParam(required = false) Boolean unreadOnly) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getAllNotifications(unreadOnly)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAsRead(id)));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Map<String, String>>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", Map.of("status", "SUCCESS")));
    }

    @PostMapping("/bottleneck-alert")
    public ResponseEntity<ApiResponse<NotificationResponse>> triggerBottleneckAlert(
            @RequestBody com.qtech.linebalancing.notification.dto.BottleneckAlertRequest request) {
        var notification = notificationService.createBottleneckNotification(
                request.getLineName(),
                request.getOrderNo(),
                request.getBottleneckSummary(),
                request.getBottleneckCount(),
                request.getTaktTimeSecs(),
                request.getReferenceId()
        );
        return ResponseEntity.ok(ApiResponse.success("Bottleneck alert dispatched to manager", notificationService.toResponse(notification)));
    }

    @PostMapping("/unmarked-attendance-alert")
    public ResponseEntity<ApiResponse<NotificationResponse>> triggerUnmarkedAttendanceAlert(
            @RequestParam Long operatorId,
            @RequestParam(required = false) Long shiftId,
            @RequestParam long overdueMinutes) {
        var notification = notificationService.triggerUnmarkedAlert(operatorId, shiftId, overdueMinutes);
        return ResponseEntity.ok(ApiResponse.success("Unmarked attendance alert dispatched", notificationService.toResponse(notification)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }
}
