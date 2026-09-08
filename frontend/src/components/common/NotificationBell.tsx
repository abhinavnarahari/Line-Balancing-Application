import { useState, useEffect, useRef } from "react";
import { Bell, Clock, CheckCircle2, ShieldAlert, Trash2, ArrowUpRight, Check } from "lucide-react";
import { notificationsApi, type NotificationItem } from "../../features/notifications/api";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const [list, countRes] = await Promise.all([
        notificationsApi.getNotifications(filter === "UNREAD"),
        notificationsApi.getUnreadCount()
      ]);
      const validList = Array.isArray(list) ? list : [];
      setNotifications(validList);
      const unread = typeof countRes === "number"
        ? countRes
        : (countRes?.unreadCount ?? validList.filter(n => !n.isRead).length);
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // 12s live polling
    return () => clearInterval(interval);
  }, [filter]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.type === "ATTENDANCE_LATE") {
      const url = item.operatorEmployeeId
        ? `/attendance?employeeId=${encodeURIComponent(item.operatorEmployeeId)}`
        : "/attendance";
      navigate(url);
    } else if (item.type === "BOTTLENECK_ALERT") {
      const url = item.referenceId
        ? `/fixed-shift-target?orderId=${item.referenceId}`
        : "/fixed-shift-target";
      navigate(url);
    } else {
      navigate("/fixed-shift-target");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSecs < 45) return "Just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return dateStr;
    }
  };

  const displayedList = filter === "UNREAD" ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Refined Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
          isOpen
            ? "bg-slate-100 border-slate-300 text-slate-900 shadow-inner"
            : "bg-white border-[#E6DDCE] hover:border-[#9C5B3C] text-slate-700 hover:text-slate-900 shadow-2xs hover:bg-[#FDFBF7]"
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9.5px] font-mono font-bold text-white shadow-xs border border-white">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
            <span className="relative">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Professional Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[390px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.14),0_4px_16px_rgba(15,23,42,0.06)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100"
              >
                <Check className="w-3.5 h-3.5 text-slate-600" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Minimalist Segmented Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg gap-0.5">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  filter === "ALL"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("UNREAD")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  filter === "UNREAD"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <span className="text-[10.5px] text-slate-400 font-medium font-mono">
              Live Feed
            </span>
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {displayedList.length === 0 ? (
              <div className="py-10 px-6 text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">
                    {filter === "UNREAD" ? "No unread alerts" : "All caught up"}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                    Line bottlenecks and late attendance notifications will appear here.
                  </p>
                </div>
              </div>
            ) : (
              displayedList.map(item => {
                const isLate = item.type === "ATTENDANCE_LATE";
                const isBottleneck = item.type === "BOTTLENECK_ALERT";

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 relative group ${
                      !item.isRead
                        ? "bg-rose-50/25 hover:bg-rose-50/50"
                        : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {!item.isRead && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    )}

                    {/* Category Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border ${
                        isLate
                          ? "bg-amber-50 text-amber-700 border-amber-200/80"
                          : "bg-rose-50 text-rose-700 border-rose-200/80"
                      }`}
                    >
                      {isLate ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-600 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        {isBottleneck ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
                            <span>Open Fixed Shift Target</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono">
                            <span>Review Attendance</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Row Dismiss / Delete Action */}
                    <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={e => handleDelete(item.id, e)}
                        className="w-6 h-6 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clean Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Shopfloor Real-Time Sync</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/line-balance?mode=SHIFT_TARGET");
              }}
              className="font-bold text-[#9C5B3C] hover:text-[#221912] transition-colors cursor-pointer"
            >
              Fixed Shift Balancing →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
