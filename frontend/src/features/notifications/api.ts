import { api } from "../../lib/api";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: "ATTENDANCE_LATE" | "BOTTLENECK_ALERT" | "LINE_PACING" | "SYSTEM" | string;
  severity: "INFO" | "WARNING" | "CRITICAL" | string;
  recipientRole?: string;
  operatorId?: number;
  operatorName?: string;
  operatorEmployeeId?: string;
  shiftId?: number;
  shiftCode?: string;
  referenceId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: (unreadOnly?: boolean): Promise<NotificationItem[]> =>
    api.get("/notifications", { params: { unreadOnly } }),

  getUnreadCount: (): Promise<{ unreadCount: number }> =>
    api.get("/notifications/unread-count"),

  markAsRead: (id: number): Promise<NotificationItem> =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<{ message: string }> =>
    api.put("/notifications/mark-all-read"),

  deleteNotification: (id: number): Promise<void> =>
    api.delete(`/notifications/${id}`),

  triggerBottleneckAlert: (data: {
    lineName?: string;
    orderNo?: string;
    bottleneckSummary?: string;
    bottleneckCount?: number;
    taktTimeSecs?: number;
    referenceId?: number;
  }): Promise<NotificationItem> =>
    api.post("/notifications/bottleneck-alert", data),

  triggerUnmarkedAttendanceAlert: (data: {
    operatorId: number | string;
    shiftId?: number | string;
    overdueMinutes: number;
  }): Promise<NotificationItem> =>
    api.post("/notifications/unmarked-attendance-alert", null, { params: data }),
};
