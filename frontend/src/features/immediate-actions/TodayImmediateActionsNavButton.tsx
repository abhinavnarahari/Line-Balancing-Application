import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { operatorsApi, type Operator } from "../operators/api";
import { shiftsApi as shiftApi } from "../shifts/api";
import { shiftAssignmentApi, type ShiftAssignment } from "../shift-assignments/api";
import { attendanceApi, type AttendanceRecord } from "../attendance/api";

export function TodayImmediateActionsNavButton() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadNavData = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [opsData, shiftsData, assignmentsData, attData] = await Promise.allSettled([
        operatorsApi.getOperators(),
        shiftApi.getShifts(true),
        shiftAssignmentApi.getAssignments(),
        attendanceApi.getAttendanceByDate(todayStr),
      ]);

      if (opsData.status === "fulfilled") setOperators(opsData.value || []);
      if (shiftsData.status === "fulfilled") setShifts(shiftsData.value || []);
      if (assignmentsData.status === "fulfilled") setAssignments(assignmentsData.value || []);
      if (attData.status === "fulfilled") setAttendanceRecords(attData.value || []);
    } catch (err) {
      console.error("Failed to load nav immediate actions count:", err);
    }
  };

  useEffect(() => {
    loadNavData();
    const interval = setInterval(loadNavData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, []);

  // Compute overdue count (>5 mins past shift start and unmarked)
  const criticalCount = useMemo(() => {
    const todayStr = currentTime.toISOString().split("T")[0];
    const activeOps = operators.filter(o => o.active !== false);
    const activeShifts = shifts.filter(s => s.active !== false);
    if (activeOps.length === 0 || activeShifts.length === 0) return 0;

    const nowMs = currentTime.getTime();
    let count = 0;

    activeOps.forEach(op => {
      const assign = assignments.find(
        a => String(a.operatorId) === String(op.id) &&
             (!a.effectiveTo || a.effectiveTo >= todayStr) &&
             (!a.effectiveFrom || a.effectiveFrom <= todayStr)
      );
      const shift = (assign ? activeShifts.find(s => String(s.id) === String(assign.shiftId)) : null) || activeShifts[0];
      if (!shift) return;

      const [sh, sm] = (shift.startTime || "07:00").split(":").map(Number);
      const shiftStartToday = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        sh || 7,
        sm || 0,
        0,
        0
      );

      const elapsedMs = nowMs - shiftStartToday.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

      const record = attendanceRecords.find(
        r => String(r.operatorId) === String(op.id) && r.attendanceDate === todayStr
      );

      // If marked Present on-time, Half-day, or On-leave, skip
      if (record?.status === "PRESENT" || record?.status === "HALF_DAY" || record?.status === "ON_LEAVE") {
        return;
      }

      // If marked LATE in attendance -> count as critical escalation!
      if (record?.status === "LATE") {
        count++;
        return;
      }

      // If UNMARKED -> count if >5 mins past shift start
      if (elapsedMinutes >= 5) {
        count++;
      }
    });

    return count;
  }, [operators, shifts, assignments, attendanceRecords, currentTime]);

  const isActive = location.pathname === "/immediate-actions";
  const hasCritical = criticalCount > 0;

  return (
    <Link
      to="/immediate-actions"
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
        isActive
          ? "bg-[#221912] text-white border-[#221912] shadow-sm"
          : hasCritical
          ? "bg-rose-50 text-rose-950 border-rose-300 hover:bg-rose-100 hover:border-rose-400 hover:shadow-xs"
          : "bg-white text-[#221912] border-[#E6DDCE] hover:bg-[#F6F1E8] hover:border-[#D8C9B8]"
      }`}
      title="Open Today's Immediate Actions (>5m Unmarked Attendance Escalations)"
    >
      <div className="relative flex items-center justify-center">
        {hasCritical ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        )}
      </div>

      <span className="tracking-tight font-bold">
        Immediate Actions
      </span>

      {hasCritical ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-black bg-rose-600 text-white shadow-2xs">
          {criticalCount} Critical
        </span>
      ) : (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          All Clear
        </span>
      )}
    </Link>
  );
}
