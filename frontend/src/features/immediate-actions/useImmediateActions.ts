import { useMemo } from "react";
import type { Operator } from "../operators/api";
import type { Shift } from "../shifts/types";
import type { ShiftAssignment } from "../shift-assignments/api";
import { attendanceApi, type AttendanceRecord } from "../attendance/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { Operation } from "../operations/api";
import type { LinePlan } from "../line-balance/api";

export interface ReplacementCandidate {
  operator: Operator;
  rating: number;
  attendanceStatus: string;
  isWorkingOnOrder: boolean;
  matchedOperations: { operationId: number | string; operationCode?: string; operationName: string; rating: number }[];
}

export type UrgencyTier = "TIER_1_5MIN" | "TIER_5_10MIN" | "TIER_10_15MIN" | "TIER_CRITICAL_15PLUS";

export interface ImmediateActionItem {
  id: string;
  operatorId: number | string;
  operatorName: string;
  employeeId: string;
  department: string;
  shiftId: number | string;
  shiftCode: string;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  elapsedMinutes: number;
  urgencyTier: UrgencyTier;
  urgencyColor: string;
  severity: "CRITICAL";
  statusType: "UNMARKED" | "LATE";
  lateMinutes?: number;
  checkInTime?: string;
  assignedOperations: Operation[];
  replacementCandidates: ReplacementCandidate[];
}

export interface UnallocatedPresentOperator {
  operator: Operator;
  attendanceStatus: string;
  checkInTime?: string;
  shiftCode?: string;
  topSkills: { operationId: number | string; operationCode?: string; operationName: string; rating: number }[];
}

interface UseImmediateActionsProps {
  operators: Operator[];
  shifts: Shift[];
  assignments?: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
  linePlans?: LinePlan[];
  currentTime: Date;
  skillMatrix?: SkillAssessment[];
  operations?: Operation[];
  onRefresh?: () => void;
}

export function useImmediateActions({
  operators,
  shifts,
  assignments = [],
  attendanceRecords,
  linePlans = [],
  currentTime,
  skillMatrix = [],
  operations = [],
  onRefresh,
}: UseImmediateActionsProps) {
  const todayStr = useMemo(() => {
    return currentTime.toISOString().split("T")[0];
  }, [currentTime]);

  // 1. Identify all operators currently assigned to any active line plan / production order
  const busyOperatorIds = useMemo(() => {
    const set = new Set<string>();
    linePlans.forEach(plan => {
      (plan.assignments || []).forEach(a => {
        if (a.operatorId) {
          set.add(String(a.operatorId));
        }
      });
    });
    return set;
  }, [linePlans]);

  // 2. Identify all Present operators who are free & unallocated (NOT working on any production order)
  const unallocatedPresentOperators = useMemo<UnallocatedPresentOperator[]>(() => {
    const list: UnallocatedPresentOperator[] = [];
    const activeOps = operators.filter(o => o.active !== false);

    activeOps.forEach(op => {
      // Must NOT be working on an active production order
      if (busyOperatorIds.has(String(op.id))) return;

      // Must have marked attendance as Present or Late today
      const att = attendanceRecords.find(
        r => String(r.operatorId) === String(op.id) && r.attendanceDate === todayStr
      );
      if (att && (att.status === "PRESENT" || att.status === "LATE")) {
        const skills = skillMatrix
          .filter(s => String(s.operatorId) === String(op.id) && s.rating >= 3)
          .map(s => {
            const opObj = operations.find(o => String(o.id) === String(s.operationId));
            return {
              operationId: s.operationId,
              operationCode: opObj?.operationCode,
              operationName: opObj?.name || `Operation ${s.operationId}`,
              rating: s.rating,
            };
          })
          .sort((a, b) => b.rating - a.rating);

        list.push({
          operator: op,
          attendanceStatus: att.status,
          checkInTime: att.checkInTime || "07:00",
          shiftCode: att.shiftCode || "Shift A",
          topSkills: skills,
        });
      }
    });

    return list;
  }, [operators, busyOperatorIds, attendanceRecords, todayStr, skillMatrix, operations]);

  // 3. Compute immediate action items:
  //    (a) Unmarked shift operators whose shift started >5 mins ago
  //    (b) Late arrivals (operators marked LATE in attendance e.g. 15m late)
  const items = useMemo<ImmediateActionItem[]>(() => {
    const activeOps = operators.filter(o => o.active !== false);
    const activeShifts = shifts.filter(s => s.active !== false);
    if (activeOps.length === 0 || activeShifts.length === 0) return [];

    const nowMs = currentTime.getTime();
    const actionList: ImmediateActionItem[] = [];

    activeOps.forEach(op => {
      // Find operator's assigned shift for today or fallback
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

      // Check today's attendance record
      const record = attendanceRecords.find(
        r => String(r.operatorId) === String(op.id) && r.attendanceDate === todayStr
      );

      // If marked PRESENT (on-time), HALF_DAY, or ON_LEAVE -> already resolved/excused, not an escalation
      if (record?.status === "PRESENT" || record?.status === "HALF_DAY" || record?.status === "ON_LEAVE") {
        return;
      }

      let statusType: "UNMARKED" | "LATE" = "UNMARKED";
      let lateMinutes = 0;
      let checkInTime = record?.checkInTime;

      if (record?.status === "LATE") {
        statusType = "LATE";
        lateMinutes = record.lateMinutes || (elapsedMinutes > 0 ? elapsedMinutes : 15);
      } else {
        // Unmarked operator: Must be >5 mins past shift start
        if (elapsedMinutes < 5) return;
        statusType = "UNMARKED";
        lateMinutes = elapsedMinutes;
      }

      // Qualified operations for this missing/late operator
      const opSkills = skillMatrix.filter(s => String(s.operatorId) === String(op.id) && s.rating >= 3);
      const qualifiedOps = opSkills
        .map(s => operations.find(o => String(o.id) === String(s.operationId)))
        .filter(Boolean) as Operation[];
      const targetOpIds = qualifiedOps.map(o => String(o.id));

      // Match free present replacement candidates
      const replacementCandidates: ReplacementCandidate[] = [];

      unallocatedPresentOperators.forEach(unalloc => {
        if (String(unalloc.operator.id) === String(op.id)) return;

        const matched = skillMatrix.filter(
          s => String(s.operatorId) === String(unalloc.operator.id) &&
               targetOpIds.includes(String(s.operationId)) &&
               s.rating >= 3
        );

        if (matched.length > 0) {
          const bestRating = Math.max(...matched.map(m => m.rating), 0);
          replacementCandidates.push({
            operator: unalloc.operator,
            rating: bestRating,
            attendanceStatus: unalloc.attendanceStatus,
            isWorkingOnOrder: false,
            matchedOperations: matched.map(m => {
              const opObj = operations.find(o => String(o.id) === String(m.operationId));
              return {
                operationId: m.operationId,
                operationCode: opObj?.operationCode,
                operationName: opObj?.name || `Operation ${m.operationId}`,
                rating: m.rating,
              };
            }),
          });
        }
      });

      replacementCandidates.sort((a, b) => b.rating - a.rating);

      const mins = statusType === "LATE" ? (lateMinutes ?? elapsedMinutes) : elapsedMinutes;
      let urgencyTier: UrgencyTier = "TIER_CRITICAL_15PLUS";
      let urgencyColor = "bg-rose-50 text-rose-800 border-rose-200";
      if (mins <= 5) {
        urgencyTier = "TIER_1_5MIN";
        urgencyColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
      } else if (mins <= 10) {
        urgencyTier = "TIER_5_10MIN";
        urgencyColor = "bg-amber-50 text-amber-800 border-amber-200";
      } else if (mins <= 15) {
        urgencyTier = "TIER_10_15MIN";
        urgencyColor = "bg-orange-50 text-orange-900 border-orange-200";
      } else {
        urgencyTier = "TIER_CRITICAL_15PLUS";
        urgencyColor = "bg-rose-50 text-rose-800 border-rose-200";
      }

      actionList.push({
        id: `${op.id}_${shift.id}_${todayStr}`,
        operatorId: op.id,
        operatorName: op.name,
        employeeId: op.employeeId,
        department: op.department || "Sewing",
        shiftId: shift.id,
        shiftCode: shift.shiftCode || "Shift A",
        shiftName: shift.shiftName || (shift as any).name || "Shift A",
        shiftStartTime: shift.startTime || "07:00",
        shiftEndTime: shift.endTime || "15:30",
        elapsedMinutes,
        urgencyTier,
        urgencyColor,
        severity: "CRITICAL",
        statusType,
        lateMinutes,
        checkInTime,
        assignedOperations: qualifiedOps,
        replacementCandidates,
      });
    });

    return actionList.sort((a, b) => {
      // Sort unmarked first, then by elapsed/late minutes descending
      if (a.statusType !== b.statusType) {
        return a.statusType === "UNMARKED" ? -1 : 1;
      }
      return (b.lateMinutes || b.elapsedMinutes) - (a.lateMinutes || a.elapsedMinutes);
    });
  }, [operators, shifts, assignments, attendanceRecords, currentTime, skillMatrix, operations, todayStr, unallocatedPresentOperators]);

  // Action Handlers
  const handleMarkPresent = async (item: ImmediateActionItem) => {
    const nowTimeStr = currentTime.toTimeString().split(" ")[0].slice(0, 5); // HH:mm
    await attendanceApi.markAttendance({
      operatorId: item.operatorId,
      shiftId: item.shiftId,
      attendanceDate: todayStr,
      status: "PRESENT",
      checkInTime: nowTimeStr,
      remarks: `Marked Present via Today's Immediate Actions at ${nowTimeStr}`,
    });
    onRefresh?.();
  };

  const handleMarkLate = async (item: ImmediateActionItem) => {
    const nowTimeStr = currentTime.toTimeString().split(" ")[0].slice(0, 5);
    const lateDuration = Math.max(1, item.elapsedMinutes > 0 ? item.elapsedMinutes : item.lateMinutes || 15);
    await attendanceApi.markAttendance({
      operatorId: item.operatorId,
      shiftId: item.shiftId,
      attendanceDate: todayStr,
      status: "LATE",
      checkInTime: nowTimeStr,
      lateMinutes: lateDuration,
      remarks: `Marked Late (+${lateDuration}m) via Immediate Actions`,
    });
    onRefresh?.();
  };

  const handleMarkOnLeave = async (item: ImmediateActionItem) => {
    await attendanceApi.markAttendance({
      operatorId: item.operatorId,
      shiftId: item.shiftId,
      attendanceDate: todayStr,
      status: "ON_LEAVE",
      remarks: "Marked On-Leave by manager via Immediate Actions",
    });
    onRefresh?.();
  };

  const handleMarkAbsent = async (item: ImmediateActionItem) => {
    await attendanceApi.markAttendance({
      operatorId: item.operatorId,
      shiftId: item.shiftId,
      attendanceDate: todayStr,
      status: "ABSENT",
      remarks: `Unmarked absence confirmed (>5m overdue) by manager`,
    });
    onRefresh?.();
  };

  const handleBatchMarkPresent = async (targetItems: ImmediateActionItem[]) => {
    const nowTimeStr = currentTime.toTimeString().split(" ")[0].slice(0, 5);
    await Promise.all(
      targetItems.map(item =>
        attendanceApi.markAttendance({
          operatorId: item.operatorId,
          shiftId: item.shiftId,
          attendanceDate: todayStr,
          status: "PRESENT",
          checkInTime: nowTimeStr,
          remarks: `Batch Marked Present via Immediate Actions at ${nowTimeStr}`,
        })
      )
    );
    onRefresh?.();
  };

  const counts = useMemo(() => {
    const unmarkedCount = items.filter(i => i.statusType === "UNMARKED").length;
    const lateCount = items.filter(i => i.statusType === "LATE").length;
    const tier1_5min = items.filter(i => i.urgencyTier === "TIER_1_5MIN").length;
    const tier5_10min = items.filter(i => i.urgencyTier === "TIER_5_10MIN").length;
    const tier10_15min = items.filter(i => i.urgencyTier === "TIER_10_15MIN").length;
    const tierCritical15plus = items.filter(i => i.urgencyTier === "TIER_CRITICAL_15PLUS").length;
    return {
      total: items.length,
      totalCritical: items.length,
      unmarkedCount,
      lateCount,
      tier1_5min,
      tier5_10min,
      tier10_15min,
      tierCritical15plus,
      unallocatedPresentCount: unallocatedPresentOperators.length,
    };
  }, [items, unallocatedPresentOperators]);

  return {
    items,
    counts,
    unallocatedPresentOperators,
    handleMarkPresent,
    handleMarkLate,
    handleMarkOnLeave,
    handleMarkAbsent,
    handleBatchMarkPresent,
  };
}
