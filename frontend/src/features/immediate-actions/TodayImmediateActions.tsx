import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  Check,
  UserCheck,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
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
  compact: _compact = false,
}: TodayImmediateActionsProps) {
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
      <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F3F5F2] border border-[#d4decb] flex items-center justify-center text-[#77876F] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-[#221912] tracking-tight">
                  Today's Immediate Actions
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F3F5F2] text-[#77876F] border border-[#d4decb]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#77876F] animate-pulse" />
                  100% Attendance Compliance
                </span>
              </div>
              <p className="text-xs text-[#8C7E6E] mt-0.5 font-medium">
                All scheduled operators are marked and present on floor within shift time windows. No overdue discrepancies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/attendance"
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold border border-[#E6DDCE] shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <span>Attendance Register</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#9C5B3C]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case 2: Immediate Actions Required (>15m / Overdue Operators) ───────────
  return (
    <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#E6DDCE]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Immediate Action Required
            </span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">
              {counts.total} {counts.total === 1 ? "Operator" : "Operators"} Unmarked
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#221912] tracking-tight">
            Today's Immediate Actions · Unmarked Shift Attendance
          </h2>
          <p className="text-xs text-[#8C7E6E] font-medium">
            Operators who have not marked attendance after scheduled shift start. Immediate intervention prevents sewing line pacing and bottleneck deficits.
          </p>
        </div>

        {/* Action Controls & Batch Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={() => handleBatchMarkPresent(filteredItems)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Mark all currently filtered operators as present"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark All Present ({filteredItems.length})</span>
            </button>
          )}

          <Link
            to="/attendance"
            className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold rounded-xl border border-[#E6DDCE] shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span>Attendance Tool</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#9C5B3C]" />
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
              ? "bg-[#9C5B3C] text-white border-[#9C5B3C] shadow-2xs"
              : "bg-[#FAF8F5] text-[#8C7E6E] border-[#E6DDCE] hover:bg-[#F6F1E8]"
          }`}
        >
          All Overdue ({counts.total})
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_1_5MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_1_5MIN"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
              : "bg-[#F3F5F2] text-[#77876F] border-[#d4decb] hover:bg-emerald-50"
          }`}
        >
          <span>1–5 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#77876F] font-bold">
            {counts.tier1_5min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_5_10MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_5_10MIN"
              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
              : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
          }`}
        >
          <span>5–10 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-900 font-bold">
            {counts.tier5_10min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_10_15MIN")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_10_15MIN"
              ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
              : "bg-orange-50 text-orange-950 border-orange-200 hover:bg-orange-100"
          }`}
        >
          <span>10–15 mins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-orange-900 font-bold">
            {counts.tier10_15min}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUrgencyFilter("TIER_CRITICAL_15PLUS")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            activeUrgencyFilter === "TIER_CRITICAL_15PLUS"
              ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
              : "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span>15+ mins (Critical)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-rose-900 font-extrabold">
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
              className="p-4 bg-white rounded-2xl border border-[#E6DDCE] hover:border-[#9C5B3C]/50 hover:shadow-md shadow-2xs flex flex-col justify-between gap-3 transition-all"
            >
              {/* Operator Info & Overdue Status */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-[#221912]">{item.operatorName}</strong>
                      <span className="text-[10.5px] font-mono font-bold text-[#9C5B3C] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E6DDCE]">
                        {item.employeeId}
                      </span>
                    </div>
                    <div className="text-xs text-[#8C7E6E] font-medium mt-0.5">
                      {item.department} · {item.shiftCode} ({item.shiftStartTime})
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.urgencyColor}`}>
                    {item.elapsedMinutes}m overdue
                  </span>
                </div>

                {/* Operations at Risk */}
                {item.assignedOperations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#E6DDCE] flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase">Assigned Station Operation:</span>
                    {item.assignedOperations.map(op => (
                      <div key={op.id} className="flex items-center gap-1.5">
                        <span
                          className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 bg-[#FAF8F5] text-[#9C5B3C] rounded-md border border-[#E6DDCE] shrink-0"
                        >
                          {op.operationCode}
                        </span>
                        <span className="text-xs font-medium text-[#221912] truncate max-w-[200px]" title={op.name}>
                          {op.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 1-Click Action Buttons */}
              <div className="pt-2.5 border-t border-[#E6DDCE] flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkPresent, item)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-[11px] font-bold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Mark operator present with current timestamp"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkLate, item)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-[11px] font-bold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title={`Mark operator late (+${item.elapsedMinutes}m)`}
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onQuickAction(handleMarkOnLeave, item)}
                    className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F6F1E8] text-[#221912] border border-[#E6DDCE] hover:border-[#8C7E6E] text-[11px] font-bold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Mark on excused leave"
                  >
                    <Calendar className="w-3 h-3 text-[#8C7E6E]" />
                    <span>Leave</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedReplacementItem(item)}
                    className="px-2.5 py-1.5 bg-[#FAF2EC] hover:bg-[#F5E5DC] text-[#9C5B3C] border border-[#E8D1C3] hover:border-[#9C5B3C] text-[11px] font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Find skill-matched present replacement on the floor"
                  >
                    <Sparkles className="w-3 h-3 text-[#9C5B3C]" />
                    <span>Replace</span>
                  </button>

                  <Link
                    to={`/settings/operators/${item.employeeId}`}
                    className="p-1.5 text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF8F5] rounded-xl border border-transparent hover:border-[#E6DDCE] transition-colors"
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
