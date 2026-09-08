import { useState, useEffect, useMemo } from "react";
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
  RefreshCw,
  Search,
  CheckCircle2,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useImmediateActions, type ImmediateActionItem } from "../../features/immediate-actions/useImmediateActions";
import { ReplacementModal } from "../../features/immediate-actions/ReplacementModal";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi as shiftApi } from "../../features/shifts/api";
import { shiftAssignmentApi, type ShiftAssignment } from "../../features/shift-assignments/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { operationsApi, type Operation } from "../../features/operations/api";

export function ImmediateActionsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Master Data State
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "AVAILABLE_FREE">("OVERDUE");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "UNMARKED" | "LATE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [selectedReplacementItem, setSelectedReplacementItem] = useState<ImmediateActionItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [
        opsData,
        shiftsData,
        assignmentsData,
        attData,
        plansData,
        skillData,
        operationsData,
      ] = await Promise.allSettled([
        operatorsApi.getOperators(),
        shiftApi.getShifts(true),
        shiftAssignmentApi.getAssignments(),
        attendanceApi.getAttendanceByDate(todayStr),
        linePlanApi.getAllPlans().catch(() => []),
        skillApi.getCurrentMatrix().catch(() => []),
        operationsApi.getOperations().catch(() => []),
      ]);

      if (opsData.status === "fulfilled") setOperators(opsData.value || []);
      if (shiftsData.status === "fulfilled") setShifts(shiftsData.value || []);
      if (assignmentsData.status === "fulfilled") setAssignments(assignmentsData.value || []);
      if (attData.status === "fulfilled") setAttendanceRecords(attData.value || []);
      if (plansData.status === "fulfilled") setLinePlans(plansData.value || []);
      if (skillData.status === "fulfilled") setSkillMatrix(skillData.value || []);
      if (operationsData.status === "fulfilled") setOperations(operationsData.value || []);
    } catch (err) {
      console.error("Failed to load immediate actions data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000); // 10s live floor poll
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  const {
    items,
    counts,
    unallocatedPresentOperators,
    handleMarkPresent,
    handleMarkLate,
    handleMarkOnLeave,
    handleBatchMarkPresent,
  } = useImmediateActions({
    operators,
    shifts,
    assignments,
    attendanceRecords,
    linePlans,
    currentTime,
    skillMatrix,
    operations,
    onRefresh: loadAllData,
  });

  // Filtered Overdue & Late Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (categoryFilter !== "ALL" && item.statusType !== categoryFilter) return false;
      if (shiftFilter !== "ALL" && String(item.shiftId) !== String(shiftFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.operatorName.toLowerCase().includes(q) ||
          item.employeeId.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, categoryFilter, shiftFilter, searchQuery]);

  // Filtered Unallocated Present Operators
  const filteredUnallocated = useMemo(() => {
    return unallocatedPresentOperators.filter(u => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.operator.name.toLowerCase().includes(q) ||
          u.operator.employeeId.toLowerCase().includes(q) ||
          (u.operator.department || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [unallocatedPresentOperators, searchQuery]);

  // Count total operations at risk
  const totalRiskOpsCount = useMemo(() => {
    const opSet = new Set<string>();
    items.forEach(item => {
      item.assignedOperations.forEach(op => opSet.add(String(op.id)));
    });
    return opSet.size;
  }, [items]);

  const onQuickAction = async (
    actionName: string,
    actionFn: (item: ImmediateActionItem) => Promise<void>,
    item: ImmediateActionItem
  ) => {
    setProcessingId(item.id);
    try {
      await actionFn(item);
      showToast(`✓ ${actionName} applied successfully for ${item.operatorName} (${item.employeeId})`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to apply action for ${item.operatorName}`, "info");
    } finally {
      setProcessingId(null);
    }
  };

  // Plant Compliance Rate
  const totalRoster = operators.length;
  const markedPresentCount = attendanceRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
  const compliancePercent = totalRoster > 0 ? Math.round((markedPresentCount / totalRoster) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8 space-y-6 w-full font-sans">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {actionToast && (
        <div className="fixed top-20 right-8 z-[99999] bg-[#221912] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{actionToast.message}</span>
        </div>
      )}

      {/* ── 1. Executive Shopfloor Header ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
              Shopfloor Governance
            </span>
            <span className="text-[#E6DDCE]">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F5F2] text-[#77876F] border border-[#d4decb]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#77876F] animate-pulse" />
              Live Shift Attendance Engine
            </span>
            <span className="text-[#E6DDCE]">·</span>
            <span className="text-[11px] text-[#8C7E6E] font-mono">
              {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-[#221912] tracking-tight">
              Today's Immediate Actions
            </h1>
            {items.length > 0 ? (
              <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-rose-600 text-white uppercase tracking-wider shadow-sm flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {items.length} Critical Escalations
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-700 text-white shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% Floor Attendance Compliance
              </span>
            )}
          </div>
          <p className="text-xs text-[#8C7E6E] font-medium max-w-3xl leading-relaxed">
            Operators who have not marked attendance <strong className="text-[#221912]">more than 5 minutes after shift start</strong> are classified as <span className="text-rose-700 font-bold uppercase">Critical Floor Escalations</span>. Review qualified bottleneck operations and deploy available free buffer operators immediately.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-mono font-bold text-[#221912]">
            <Clock className="w-4 h-4 text-[#9C5B3C]" />
            <span>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} IST</span>
          </div>

          <button
            type="button"
            onClick={loadAllData}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#221912] font-bold text-xs border border-[#E6DDCE] shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#9C5B3C] ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live Floor</span>
          </button>

          <Link
            to="/attendance"
            className="px-4 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white font-bold text-xs shadow-xs shadow-[#9C5B3C]/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span>Attendance Register</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Executive Metric Ribbon ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Critical Overdue */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Critical Escalations
            </span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${items.length > 0 ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono ${items.length > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                {items.length}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E]">
                Operators (&gt;5m Unmarked)
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              {items.length === 0 ? "Zero shift attendance discrepancies." : "Immediate supervisor resolution needed."}
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div className={`h-full rounded-full ${items.length > 0 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, items.length * 8)}%` }} />
          </div>
        </div>

        {/* Bottleneck Operations at Risk */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Sewing Operations at Risk
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-amber-700">
                {totalRiskOpsCount}
              </span>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Critical Operations
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              GSD certified operations impacted by missing manpower.
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, totalRiskOpsCount * 10)}%` }} />
          </div>
        </div>

        {/* Free Buffer Operators */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Available Buffer Operators
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-indigo-700">
                {counts.unallocatedPresentCount}
              </span>
              <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Free on Floor
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Present today &amp; 0 active production order assignments.
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, counts.unallocatedPresentCount * 5)}%` }} />
          </div>
        </div>

        {/* Floor Attendance Rate */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Floor Attendance Rate
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3F5F2] text-[#77876F] border border-[#d4decb] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono text-[#221912]">{compliancePercent}%</span>
              <span className="text-xs font-bold text-[#77876F] bg-[#F3F5F2] px-2.5 py-0.5 rounded-full border border-[#d4decb]">
                {markedPresentCount} / {totalRoster} Active
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Overall shopfloor roster presence for active shifts.
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div className="bg-[#77876F] h-full rounded-full" style={{ width: `${compliancePercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace Container ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="px-6 pt-4 bg-white border-b border-[#E6DDCE] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("OVERDUE")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "OVERDUE"
                  ? "border-rose-600 text-rose-950 font-black"
                  : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Critical Unmarked Operators (&gt;5 mins)</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${items.length > 0 ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                {items.length} Critical
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("AVAILABLE_FREE")}
              className={`pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "AVAILABLE_FREE"
                  ? "border-indigo-600 text-indigo-950 font-black"
                  : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Available Buffer Operators (Skill Matched &amp; Free)</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {counts.unallocatedPresentCount} Available
              </span>
            </button>
          </div>

          {/* Batch Action Button */}
          {activeTab === "OVERDUE" && filteredItems.length > 1 && (
            <button
              type="button"
              onClick={async () => {
                await handleBatchMarkPresent(filteredItems);
                showToast(`✓ Batch Marked ${filteredItems.length} operators as Present`);
              }}
              className="mb-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Batch Mark Present ({filteredItems.length})</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 bg-[#FDFCFB] border-b border-[#E6DDCE] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search operator name, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
              />
            </div>

            {/* Shift Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#8C7E6E] hidden sm:inline">Shift:</span>
              <select
                value={shiftFilter}
                onChange={e => setShiftFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
              >
                <option value="ALL">All Active Shifts</option>
                {shifts.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.shiftCode} ({s.startTime || "07:00"} – {s.endTime || "15:30"})
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Category Filter Pills */}
            {activeTab === "OVERDUE" && (
              <div className="flex items-center gap-1 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === "ALL"
                      ? "bg-[#221912] text-white shadow-2xs"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  All ({counts.totalCritical})
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilter("UNMARKED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    categoryFilter === "UNMARKED"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-rose-900 hover:bg-rose-50"
                  }`}
                >
                  <span>Unmarked</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-900 font-extrabold">
                    {counts.unmarkedCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategoryFilter("LATE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    categoryFilter === "LATE"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  <span>Late Arrivals</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-extrabold">
                    {counts.lateCount}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-[#8C7E6E]">
            Showing <strong className="text-[#221912]">{activeTab === "OVERDUE" ? filteredItems.length : filteredUnallocated.length}</strong> records
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────────── */}
        {activeTab === "OVERDUE" ? (
          <div>
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6DDCE] bg-[#F9F7F4] text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                      <th className="py-4 px-6">Operator Profile</th>
                      <th className="py-4 px-4">Scheduled Shift</th>
                      <th className="py-4 px-4">Escalation Status</th>
                      <th className="py-4 px-4">Operations at Risk</th>
                      <th className="py-4 px-4">Free Buffer Substitutes</th>
                      <th className="py-4 px-6 text-right">Immediate Escalation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DDCE] text-xs">
                    {filteredItems.map(item => {
                      const isBusy = processingId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#FFFDFB] transition-colors"
                        >
                          {/* 1. Operator Info */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center font-black text-sm text-[#221912] shrink-0">
                                {item.operatorName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/settings/operators/${item.employeeId}`}
                                    className="font-bold text-sm text-[#221912] hover:text-[#9C5B3C] transition-colors"
                                  >
                                    {item.operatorName}
                                  </Link>
                                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded text-[#8C7E6E]">
                                    {item.employeeId}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#8C7E6E] mt-0.5">
                                  {item.department} Department
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Assigned Shift */}
                          <td className="py-4 px-4 font-medium">
                            <div className="font-bold text-[#221912]">{item.shiftCode}</div>
                            <div className="text-[11px] text-[#8C7E6E] font-mono mt-0.5">
                              {item.shiftStartTime} – {item.shiftEndTime}
                            </div>
                          </td>

                          {/* 3. Overdue / Late Status */}
                          <td className="py-4 px-4">
                            {item.statusType === "LATE" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span className="uppercase text-[10px] tracking-wider text-amber-700 font-extrabold mr-0.5">LATE</span>
                                <span>+{item.lateMinutes}m Late Arrival</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                <span className="uppercase text-[10px] tracking-wider text-rose-700 font-extrabold mr-0.5">UNMARKED</span>
                                <span>{item.elapsedMinutes}m overdue</span>
                              </span>
                            )}
                          </td>

                          {/* 4. Operations at Risk */}
                          <td className="py-4 px-4">
                            {item.assignedOperations.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {item.assignedOperations.slice(0, 3).map(op => (
                                  <span
                                    key={op.id}
                                    className="text-[11px] font-mono font-medium px-2 py-0.5 bg-[#F6F1E8] text-[#221912] rounded border border-[#E6DDCE]"
                                    title={op.name}
                                  >
                                    {op.operationCode}
                                  </span>
                                ))}
                                {item.assignedOperations.length > 3 && (
                                  <span className="text-[10.5px] text-[#8C7E6E] font-bold self-center">
                                    +{item.assignedOperations.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[#8C7E6E] italic">General Sewing Qualified</span>
                            )}
                          </td>

                          {/* 5. Buffer Replacement Options */}
                          <td className="py-4 px-4">
                            {item.replacementCandidates.length > 0 ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 w-fit">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{item.replacementCandidates.length} Free Operators Matched</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#8C7E6E]">No free buffer match</span>
                            )}
                          </td>

                          {/* 6. Immediate Action Triggers (Crisp Professional Design) */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => onQuickAction(item.statusType === "LATE" ? "Confirm Present" : "Mark Present", handleMarkPresent, item)}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title={item.statusType === "LATE" ? "Confirm operator is present and working at station" : "Register Present with live timestamp"}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{item.statusType === "LATE" ? "Confirm Present" : "Present"}</span>
                              </button>

                              {item.statusType === "UNMARKED" && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => onQuickAction("Mark Late", handleMarkLate, item)}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  title={`Register Late (+${item.elapsedMinutes}m overdue)`}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Late</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => onQuickAction("Mark On-Leave", handleMarkOnLeave, item)}
                                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title="Mark Excused On-Leave"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Leave</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedReplacementItem(item)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                title="Deploy Skill-Matched Present Buffer Operator"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Deploy Substitute</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* All Clear State */
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#221912]">100% Shift Attendance Compliance</h3>
                  <p className="text-xs text-[#8C7E6E] max-w-lg mx-auto font-medium">
                    No active operators are currently overdue (&gt;5 mins past shift start). All sewing floor lines are operating at planned staffing levels.
                  </p>
                </div>
                <Link
                  to="/attendance"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9C5B3C] text-white rounded-xl text-xs font-bold hover:bg-[#B06C49] shadow-sm transition-all"
                >
                  <span>Open Daily Attendance Register</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* ── Tab 2: Available Present Operators (Skill Matched & Free) ── */
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Free Buffer Workforce (Checked in Today · 0 Active Production Orders)</span>
                </h4>
                <p className="text-xs text-indigo-800">
                  These verified operators have checked in on the floor today and are 100% available to replace absent operators or alleviate line bottlenecks.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 bg-white rounded-xl border border-indigo-200 text-indigo-700 shadow-2xs shrink-0">
                {filteredUnallocated.length} Available on Floor
              </span>
            </div>

            {filteredUnallocated.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnallocated.map(unalloc => (
                  <div
                    key={unalloc.operator.id}
                    className="p-5 bg-white rounded-2xl border border-[#E6DDCE] hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                            {unalloc.operator.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/settings/operators/${unalloc.operator.employeeId}`}
                                className="font-bold text-sm text-[#221912] hover:text-[#9C5B3C]"
                              >
                                {unalloc.operator.name}
                              </Link>
                              <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded text-[#8C7E6E]">
                                {unalloc.operator.employeeId}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8C7E6E]">
                              {unalloc.operator.department || "Sewing"} Department
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Present {unalloc.checkInTime ? `(${unalloc.checkInTime})` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          Unallocated Buffer
                        </span>
                      </div>

                      {/* Certified Skills (★3+) */}
                      <div className="mt-3.5 pt-3 border-t border-[#E6DDCE]">
                        <div className="text-[10px] font-bold text-[#8C7E6E] uppercase mb-1.5">
                          Certified Skill Competencies:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {unalloc.topSkills.length > 0 ? (
                            unalloc.topSkills.slice(0, 4).map(skill => (
                              <span
                                key={skill.operationId}
                                className="text-[11px] font-medium px-2 py-0.5 bg-[#F6F1E8] text-[#221912] rounded-md border border-[#E6DDCE]"
                              >
                                {skill.operationName} <strong className="text-amber-600 font-bold">★{skill.rating}</strong>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#8C7E6E] italic">General Sewing Qualified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E6DDCE] flex items-center justify-between">
                      <span className="text-[11px] text-[#8C7E6E] font-medium">Ready for deployment</span>
                      <Link
                        to={`/settings/operators/${unalloc.operator.employeeId}`}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <span>Skill Matrix</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-[#8C7E6E] space-y-1">
                <p className="font-bold text-slate-800">All Present Floor Operators Are Currently Allocated</p>
                <p>There are no floating or unallocated buffer operators free on the floor today.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nested Smart Replacement Modal ────────────────────────────── */}
      <ReplacementModal
        isOpen={Boolean(selectedReplacementItem)}
        onClose={() => setSelectedReplacementItem(null)}
        item={selectedReplacementItem}
        onAssignReplacement={() => {
          loadAllData();
          showToast(`✓ Replacement operator deployed to station`);
        }}
      />
    </div>
  );
}
