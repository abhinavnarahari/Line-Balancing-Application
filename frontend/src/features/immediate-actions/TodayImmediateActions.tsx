import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Check,
  UserCheck,
  UserX,
  Calendar,
  Users,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useImmediateActions, type ImmediateActionItem, type UrgencyTier } from "./useImmediateActions";
import { ReplacementModal } from "./ReplacementModal";
import type { Operator } from "../operators/api";
import type { Shift } from "../shifts/types";
import type { ShiftAssignment } from "../shift-assignments/api";
import type { AttendanceRecord } from "../attendance/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { Operation } from "../operations/api";

interface TodayImmediateActionsProps {
  operators: Operator[];
  shifts: Shift[];
  assignments?: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
  currentTime: Date;
  skillMatrix?: SkillAssessment[];
  operations?: Operation[];
  onRefresh?: () => void;
  compact?: boolean;
}

export function TodayImmediateActions({
  operators,
  shifts,
  assignments = [],
  attendanceRecords,
  currentTime,
  skillMatrix = [],
  operations = [],
  onRefresh,
  compact = false,
}: TodayImmediateActionsProps) {
  const navigate = useNavigate();
  const [activeUrgencyFilter, setActiveUrgencyFilter] = useState<"ALL" | UrgencyTier>("ALL");
  const [selectedReplacementItem, setSelectedReplacementItem] = useState<ImmediateActionItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    items,
    counts,
    handleMarkPresent,
    handleMarkLate,
    handleMarkOnLeave,
    handleBatchMarkPresent,
  } = useImmediateActions({
    operators,
    shifts,
    assignments,
    attendanceRecords,
    currentTime,
    skillMatrix,
    operations,
    onRefresh,
  });

  const filteredItems = items.filter(item => {
    if (activeUrgencyFilter === "ALL") return true;
    return item.urgencyTier === activeUrgencyFilter;
  });

  const onQuickAction = async (action: (item: ImmediateActionItem) => Promise<void>, item: ImmediateActionItem) => {
    setProcessingId(item.id);
    try {
      await action(item);
    } finally {
      setProcessingId(null);
    }
  };

  // ─── Case 1: All Workforce Accounted For (All-Clear State) ─────────────────
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 shadow-[0_1px_3px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Today's Immediate Actions
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  100% Attendance Compliance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                All scheduled operators are marked and present on floor within shift time windows. No overdue discrepancies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/attendance"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>Attendance Register</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case 2: Immediate Actions Required (>15m / Overdue Operators) ───────────
  return (
    <div className="rounded-2xl border border-rose-300/80 bg-gradient-to-br from-rose-50/60 via-white to-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(225,29,72,0.08)] space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1 border-b border-rose-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Immediate Action Required
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {counts.total} {counts.total === 1 ? "Operator" : "Operators"} Unmarked
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Today's Immediate Actions · Unmarked Shift Attendance
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Operators who have not marked attendance after scheduled shift start. Immediate intervention prevents sewing line pacing and bottleneck deficits.
          </p>
        </div>

        {/* Action Controls & Batch Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={() => handleBatchMarkPresent(filteredItems)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Mark all currently filtered operators as present"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark All Present ({filteredItems.length})</span>
            </button>
          )}

          <Link
            to="/attendance"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span>Attendance Tool</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Urgency Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            activeUrgencyFilter === "ALL"
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Overdue ({counts.total})
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_1_5MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_1_5MIN"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
              : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <span>1–5 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900">
            {counts.tier1_5min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_5_10MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_5_10MIN"
              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
              : "bg-white text-amber-900 border-amber-200 hover:bg-amber-50"
          }`}
        >
          <span>5–10 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900">
            {counts.tier5_10min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_10_15MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_10_15MIN"
              ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
              : "bg-white text-orange-950 border-orange-200 hover:bg-orange-50"
          }`}
        >
          <span>10–15 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 text-orange-900">
            {counts.tier10_15min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_CRITICAL_15PLUS")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_CRITICAL_15PLUS"
              ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
              : "bg-white text-rose-900 border-rose-200 hover:bg-rose-50"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span>15+ mins (Critical)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-900 font-extrabold">
            {counts.tierCritical15plus}
          </span>
        </button>
      </div>

      {/* Overdue Operator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredItems.map(item => {
          const isBusy = processingId === item.id;

          return (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between gap-3 transition-all"
            >
              {/* Operator Info & Overdue Status */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-black text-sm">
                      {item.operatorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900">{item.operatorName}</strong>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.employeeId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {item.department} · {item.shiftCode} ({item.shiftStartTime})
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.urgencyColor}`}>
                    {item.elapsedMinutes}m overdue
                  </span>
                </div>

                {/* Operations at Risk */}
                {item.assignedOperations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Ops:</span>
                    {item.assignedOperations.slice(0, 3).map(op => (
                      <span
                        key={op.id}
                        className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200"
                        title={op.name}
                      >
                        {op.operationCode}
                      </span>
                    ))}
                    {item.assignedOperations.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{item.assignedOperations.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 1-Click Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkPresent, item)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Mark operator present with current timestamp"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkLate, item)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title={`Mark operator late (+${item.elapsedMinutes}m)`}
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkOnLeave, item)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Mark on excused leave"
                  >
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Leave</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedReplacementItem(item)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                    title="Find skill-matched present replacement on the floor"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Replace</span>
                  </button>

                  <Link
                    to={`/operators/${item.employeeId}`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View operator details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Replacement Modal Dialog */}
      <ReplacementModal
        isOpen={Boolean(selectedReplacementItem)}
        onClose={() => setSelectedReplacementItem(null)}
        item={selectedReplacementItem}
        onAssignReplacement={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
}
