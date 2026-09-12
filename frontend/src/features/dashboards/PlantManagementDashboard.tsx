import { useState, useMemo } from "react";
import type { LinePlan } from "../line-balance/api";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Cpu,
  Calendar,
  GraduationCap,
  Sparkles,
  Download,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Filter,
  Award,
  Star,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Zap,
} from "lucide-react";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { Operation } from "../operations/api";
import type { SewingLine } from "../lines/api";
import { computeForwardSkillGapAnalysis, type ForwardPlanSummary } from "./forwardSkillGap";

interface PlantManagementDashboardProps {
  orders: Order[];
  bulletins: OperationBulletin[];
  operators: Operator[];
  skillMatrix: SkillAssessment[];
  operations: Operation[];
  lines: SewingLine[];
  linePlans?: LinePlan[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function PlantManagementDashboard({
  orders,
  bulletins,
  operators,
  skillMatrix,
  operations,
  lines,
  linePlans = [],
  onRefresh,
  loading = false,
}: PlantManagementDashboardProps) {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");

  // Multi-dimensional Workforce Filters & View State
  const [allocationFilter, setAllocationFilter] = useState<"ALL" | "SEATED" | "UNALLOCATED" | "Buffer Pool" | "Cross-Training" | "Line Float">("ALL");
  const [selectedOperationFilter, setSelectedOperationFilter] = useState<string>("ALL");
  const [selectedSkillRatingFilter, setSelectedSkillRatingFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Operator for Detailed Modal Drawer
  const [selectedOperatorForModal, setSelectedOperatorForModal] = useState<any | null>(null);
  const [copiedEmpId, setCopiedEmpId] = useState<string | null>(null);

  // 1. Forward Planning Skill Gap Analysis (e.g. October Plan)
  const forwardPlan: ForwardPlanSummary = useMemo(() => {
    return computeForwardSkillGapAnalysis(
      orders,
      bulletins,
      operators,
      skillMatrix,
      operations,
      selectedMonth
    );
  }, [orders, bulletins, operators, skillMatrix, operations, selectedMonth]);

  // 2. Seated vs. Unallocated Real-time Workforce Breakdown (from real plan assignments)
  const workforce = useMemo(() => {
    const activeOps = operators.filter((o) => o.active !== false);
    const totalCount = activeOps.length;

    // Collect all operator assignments from active line plans
    const operatorAssignmentMap = new Map<string, {
      plan: LinePlan;
      asg: any;
      line?: SewingLine;
      order?: Order;
      operationName: string;
    }>();

    linePlans.forEach((plan) => {
      const lineObj = lines.find((l) => String(l.id) === String(plan.lineId));
      const orderObj = orders.find((o) => String(o.id) === String(plan.orderId));
      (plan.assignments || []).forEach((asg) => {
        if (asg.operatorId != null) {
          const opKey = String(asg.operatorId);
          const opObj = operations.find((o) => String(o.id) === String(asg.operationId));
          const bLine = (bulletins || [])
            .flatMap((b) => b.lines || [])
            .find((l) => String(l.id) === String(asg.bulletinLineId) || String(l.operationId) === String(asg.operationId));
          const operationName = bLine?.operationName || opObj?.name || (asg as any).operationName || "Sewing Operation";

          if (!operatorAssignmentMap.has(opKey)) {
            operatorAssignmentMap.set(opKey, {
              plan,
              asg,
              line: lineObj,
              order: orderObj,
              operationName,
            });
          }
        }
      });
    });

    const statusOptions: Array<"Buffer Pool" | "Cross-Training" | "Line Float"> = [
      "Buffer Pool",
      "Cross-Training",
      "Line Float",
    ];

    let unallocIdx = 0;

    const allDeployments = activeOps.map((op) => {
      const assignment =
        operatorAssignmentMap.get(String(op.id)) ||
        operatorAssignmentMap.get(op.employeeId);

      const opSkills = skillMatrix.filter(
        (s) =>
          String(s.operatorId) === String(op.id) ||
          s.employeeId === op.employeeId
      );
      const bestSkill = [...opSkills].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      const certifiedOperations = opSkills.map((s) => ({
        id: s.id,
        operationId: s.operationId,
        operationName: s.operationName || "Operation",
        operationCode: s.operationCode || "",
        rating: s.rating || 3,
        cycleTimeSeconds: s.cycleTimeSeconds || 0,
        effectiveDate: s.effectiveDate || "",
        notes: s.notes || "",
      }));

      if (assignment) {
        // Seated on a production line
        const assignedLineCode = assignment.line?.lineCode || `Line ${assignment.plan.lineId || "1"}`;
        const assignedLineName = assignment.line?.lineName || "Main Sewing Line";
        const assignedStationNum = assignment.asg.stationNum || 1;
        const assignedOperationName = assignment.operationName;
        const assignedOrderNo = assignment.order?.orderNo;
        const currentOpSkill = opSkills.find(
          (s) =>
            String(s.operationId) === String(assignment.asg.operationId) ||
            s.operationName?.toLowerCase() === assignedOperationName.toLowerCase()
        );
        const skillRating = currentOpSkill?.rating || bestSkill?.rating || ((op as any).skillRating ? Number((op as any).skillRating) : 4);

        return {
          ...op,
          isAllocated: true,
          allocationStatus: "SEATED" as const,
          unallocatedStatus: undefined,
          assignedPlanId: assignment.plan.id,
          assignedOrderId: assignment.plan.orderId,
          assignedOrderNo,
          assignedLineId: assignment.plan.lineId,
          assignedLineCode,
          assignedLineName,
          assignedStationNum,
          assignedOperationId: assignment.asg.operationId,
          assignedOperationName,
          primarySkill: assignedOperationName,
          skillRating,
          certifiedOperations,
        };
      } else {
        // Unallocated / Buffer / Floating
        const primarySkill = bestSkill?.operationName || (op as any).primarySkill || "General Production";
        const skillRating = bestSkill?.rating || ((op as any).skillRating ? Number((op as any).skillRating) : 3);
        const unallocatedStatus = statusOptions[unallocIdx++ % statusOptions.length];

        return {
          ...op,
          isAllocated: false,
          allocationStatus: "UNALLOCATED" as const,
          unallocatedStatus,
          assignedPlanId: undefined,
          assignedOrderId: undefined,
          assignedOrderNo: undefined,
          assignedLineId: undefined,
          assignedLineCode: undefined,
          assignedLineName: undefined,
          assignedStationNum: undefined,
          assignedOperationId: undefined,
          assignedOperationName: undefined,
          primarySkill,
          skillRating,
          certifiedOperations,
        };
      }
    });

    const seatedList = allDeployments.filter((d) => d.isAllocated);
    const unallocatedList = allDeployments.filter((d) => !d.isAllocated);
    const seatedCount = seatedList.length;
    const unallocatedCount = unallocatedList.length;
    const seatedPercent = totalCount > 0 ? Math.round((seatedCount / totalCount) * 100) : 0;
    const unallocatedPercent = totalCount > 0 ? 100 - seatedPercent : 0;

    // Buffer sub-pool counts
    const bufferPoolCount = unallocatedList.filter((d) => d.unallocatedStatus === "Buffer Pool").length;
    const crossTrainingCount = unallocatedList.filter((d) => d.unallocatedStatus === "Cross-Training").length;
    const lineFloatCount = unallocatedList.filter((d) => d.unallocatedStatus === "Line Float").length;

    // Master/Expert Reserves on Bench (L4 / L5 Unallocated operators)
    const masterReservesCount = unallocatedList.filter((d) => d.skillRating >= 4).length;

    return {
      totalCount,
      seatedCount,
      unallocatedCount,
      seatedPercent,
      unallocatedPercent,
      bufferPoolCount,
      crossTrainingCount,
      lineFloatCount,
      masterReservesCount,
      allDeployments,
      seatedList,
      unallocatedList,
    };
  }, [operators, linePlans, skillMatrix, lines, orders, operations, bulletins]);

  // Distinct Operations for the Operation-wise dropdown filter with qualified operator counts
  const distinctOperationsWithCounts = useMemo(() => {
    const opCountMap = new Map<string, number>();
    
    // Initialize with all unique operation names
    operations.forEach((op) => {
      if (op.name) opCountMap.set(op.name.trim(), 0);
    });
    bulletins.forEach((b) => {
      (b.lines || []).forEach((l) => {
        if (l.operationName) opCountMap.set(l.operationName.trim(), 0);
      });
    });
    skillMatrix.forEach((s) => {
      if (s.operationName) opCountMap.set(s.operationName.trim(), 0);
    });

    // Count how many operators are qualified or assigned to each operation
    workforce.allDeployments.forEach((op) => {
      const opSet = new Set<string>();
      if (op.assignedOperationName) opSet.add(op.assignedOperationName.trim());
      if (op.primarySkill) opSet.add(op.primarySkill.trim());
      (op.certifiedOperations || []).forEach((c) => {
        if (c.operationName) opSet.add(c.operationName.trim());
      });

      opSet.forEach((name) => {
        if (opCountMap.has(name)) {
          opCountMap.set(name, (opCountMap.get(name) || 0) + 1);
        }
      });
    });

    return Array.from(opCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [operations, bulletins, skillMatrix, workforce.allDeployments]);

  // Multi-criteria Filter Engine
  const filteredWorkforce = useMemo(() => {
    return workforce.allDeployments.filter((op) => {
      // 1. Allocation Status & Sub-category Filter
      if (allocationFilter === "SEATED" && !op.isAllocated) return false;
      if (allocationFilter === "UNALLOCATED" && op.isAllocated) return false;
      if (
        allocationFilter === "Buffer Pool" ||
        allocationFilter === "Cross-Training" ||
        allocationFilter === "Line Float"
      ) {
        if (op.isAllocated || op.unallocatedStatus !== allocationFilter) return false;
      }

      // 2. Operation-wise Filter
      if (selectedOperationFilter !== "ALL") {
        const matchesAssigned = op.assignedOperationName?.toLowerCase() === selectedOperationFilter.toLowerCase();
        const matchesSkill = op.certifiedOperations.some(
          (c) => c.operationName.toLowerCase() === selectedOperationFilter.toLowerCase()
        );
        const matchesPrimary = op.primarySkill.toLowerCase() === selectedOperationFilter.toLowerCase();
        if (!matchesAssigned && !matchesSkill && !matchesPrimary) return false;
      }

      // 3. Skill Rating Filter (5, 4, 3, 2, 1, or 4-5)
      if (selectedSkillRatingFilter !== "ALL") {
        if (selectedSkillRatingFilter === "5") {
          if (op.skillRating !== 5 && !op.certifiedOperations.some((c) => c.rating === 5)) return false;
        } else if (selectedSkillRatingFilter === "4") {
          if (op.skillRating !== 4 && !op.certifiedOperations.some((c) => c.rating === 4)) return false;
        } else if (selectedSkillRatingFilter === "3") {
          if (op.skillRating !== 3 && !op.certifiedOperations.some((c) => c.rating === 3)) return false;
        } else if (selectedSkillRatingFilter === "2") {
          if (op.skillRating !== 2 && !op.certifiedOperations.some((c) => c.rating === 2)) return false;
        } else if (selectedSkillRatingFilter === "1") {
          if (op.skillRating !== 1 && !op.certifiedOperations.some((c) => c.rating === 1)) return false;
        } else if (selectedSkillRatingFilter === "HIGH") {
          // L4 or L5 Masters
          if (op.skillRating < 4 && !op.certifiedOperations.some((c) => c.rating >= 4)) return false;
        }
      }

      // 4. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = op.name.toLowerCase().includes(q);
        const matchesEmpId = op.employeeId.toLowerCase().includes(q);
        const matchesDept = op.department?.toLowerCase().includes(q);
        const matchesLine = op.assignedLineCode?.toLowerCase().includes(q) || op.assignedLineName?.toLowerCase().includes(q);
        const matchesOp = op.assignedOperationName?.toLowerCase().includes(q) || op.primarySkill.toLowerCase().includes(q);
        const matchesCertified = op.certifiedOperations.some((c) => c.operationName.toLowerCase().includes(q));

        if (!matchesName && !matchesEmpId && !matchesDept && !matchesLine && !matchesOp && !matchesCertified) {
          return false;
        }
      }

      return true;
    });
  }, [
    workforce.allDeployments,
    allocationFilter,
    selectedOperationFilter,
    selectedSkillRatingFilter,
    searchQuery,
  ]);

  // Pagination calculations
  const totalItems = filteredWorkforce.length;
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * (pageSize === Infinity ? totalItems : pageSize);
  const endIndex = pageSize === Infinity ? totalItems : startIndex + pageSize;
  const paginatedWorkforce = filteredWorkforce.slice(startIndex, endIndex);

  // Clear all filters handler
  const handleResetFilters = () => {
    setAllocationFilter("ALL");
    setSelectedOperationFilter("ALL");
    setSelectedSkillRatingFilter("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    allocationFilter !== "ALL" ||
    selectedOperationFilter !== "ALL" ||
    selectedSkillRatingFilter !== "ALL" ||
    searchQuery.trim() !== "";

  // Copy Employee ID to clipboard
  const handleCopyEmpId = (empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(empId);
    setCopiedEmpId(empId);
    setTimeout(() => setCopiedEmpId(null), 2000);
  };

  // Export Filtered Workforce Roster to CSV
  const handleExportRosterCSV = () => {
    const headers = [
      "Employee ID",
      "Operator Name",
      "Department",
      "Allocation Status",
      "Assigned Line",
      "Station No",
      "Active Order",
      "Buffer Category",
      "Primary Skill",
      "Skill Rating",
      "Certified Skills Count",
      "Certified Operations List",
    ];

    const rows = filteredWorkforce.map((op) => [
      `"${op.employeeId}"`,
      `"${op.name}"`,
      `"${op.department || "Sewing"}"`,
      `"${op.isAllocated ? "SEATED" : "UNALLOCATED"}"`,
      `"${op.assignedLineCode || "N/A"}"`,
      `"${op.assignedStationNum || "N/A"}"`,
      `"${op.assignedOrderNo || "N/A"}"`,
      `"${op.unallocatedStatus || "N/A"}"`,
      `"${op.isAllocated ? op.assignedOperationName : op.primarySkill}"`,
      `"L${op.skillRating}"`,
      `"${op.certifiedOperations.length}"`,
      `"${op.certifiedOperations.map((c: any) => `${c.operationName} (L${c.rating})`).join("; ")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Plant_Workforce_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Plant Executive Operations Header ───────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
              Plant Management Executive Cockpit
            </span>
            <span className="text-[#E6DDCE]">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Plant 1 Operations Active
            </span>
            <span className="text-[#E6DDCE]">·</span>
            <span className="text-[11px] font-mono text-[#8C7E6E]">
              {lines.length} Production Lines Active
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
            Workforce Allocation &amp; Forward Skill Gap Analysis
          </h2>
          <p className="text-xs text-[#8C7E6E] font-medium max-w-3xl leading-relaxed">
            Real-time monitoring of seated vs. unallocated floor operators and forward competency planning for upcoming shipment schedules.
          </p>
        </div>

        {/* Forward Plan Month Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Plan Selector */}
          <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="text-[11px] font-bold text-[#8C7E6E]">Forward Plan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-[#221912] text-xs focus:outline-none cursor-pointer"
            >
              <option value="2026-10">October 2026 Plan (Upcoming)</option>
              <option value="2026-11">November 2026 Plan (Ramp-up)</option>
              <option value="2026-09">September 2026 (Current Month)</option>
            </select>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] shadow-2xs transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}

          <Link
            to="/skill-matrix"
            className="px-3.5 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span>Open Skill Matrix</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Top Strategic KPI Ribbon ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Seated Operators */}
        <div
          onClick={() => {
            setAllocationFilter("SEATED");
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 ${
            allocationFilter === "SEATED"
              ? "bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white border-[#E6DDCE] hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Seated Operators (On Machines)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {workforce.seatedCount}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {workforce.seatedPercent}% Seated
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Actively deployed across {lines.length} production sewing lines
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${workforce.seatedPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Unallocated Operators */}
        <div
          onClick={() => {
            setAllocationFilter("UNALLOCATED");
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 ${
            allocationFilter === "UNALLOCATED"
              ? "bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-[#E6DDCE] hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Unallocated / Buffer Pool
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {workforce.unallocatedCount}
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {workforce.unallocatedPercent}% Buffer
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] text-[#8C7E6E] mt-1 font-medium">
              <span className="text-amber-800 font-bold">{workforce.bufferPoolCount} Pool</span>
              <span>·</span>
              <span className="text-indigo-800 font-bold">{workforce.crossTrainingCount} Training</span>
              <span>·</span>
              <span className="text-emerald-800 font-bold">{workforce.lineFloatCount} Floats</span>
            </div>
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${workforce.unallocatedPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: High-Skill Reserves (L4/L5 Bench Strength) */}
        <div
          onClick={() => {
            setSelectedSkillRatingFilter("HIGH");
            setAllocationFilter("UNALLOCATED");
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 ${
            selectedSkillRatingFilter === "HIGH" && allocationFilter === "UNALLOCATED"
              ? "bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20"
              : "bg-white border-[#E6DDCE] hover:border-indigo-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Master Reserves on Bench
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-900 font-mono">
                {workforce.masterReservesCount}
              </span>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                L4 &amp; L5 Masters
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              High-efficiency operators ready for line bottleneck relief
            </p>
          </div>
          <div className="text-[11px] text-indigo-800 font-bold flex items-center gap-1">
            <span>Click to filter available masters</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Forward October Skill Deficit */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Forward {forwardPlan.planMonth.split(" ")[0]} Skill Gap
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700 font-mono">
                {forwardPlan.criticalShortfallCount} Machine Classes
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 font-semibold">
              Critical deficit in Flatlock &amp; Feed-off-the-Arm
            </p>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center gap-1">
            <span>Requires 10-day cross-skilling program</span>
          </div>
        </div>
      </div>

      {/* ── 3. Seated vs. Unallocated Workforce Cockpit ─────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-5">
        {/* Header & Main Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E6DDCE]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#221912]">
                Workforce Deployment: Seated vs. Unallocated Floor Status
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                {workforce.totalCount} Total Active Operators
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-0.5">
              Live shopfloor distribution of operators seated at active workstations vs. buffer/floating pools with operation &amp; skill filtering.
            </p>
          </div>

          {/* Allocation Mode Segmented Tabs */}
          <div className="flex items-center bg-[#F6F1E8] p-1 rounded-2xl border border-[#E6DDCE] text-xs font-bold gap-1 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAllocationFilter("ALL");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                allocationFilter === "ALL"
                  ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                  : "text-[#8C7E6E] hover:text-[#221912]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Workforce ({workforce.totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAllocationFilter("SEATED");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                allocationFilter === "SEATED"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${allocationFilter === "SEATED" ? "bg-white" : "bg-emerald-600"}`} />
              <span>Seated ({workforce.seatedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAllocationFilter("Buffer Pool");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                allocationFilter === "Buffer Pool"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-800 hover:text-amber-950 hover:bg-amber-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${allocationFilter === "Buffer Pool" ? "bg-white" : "bg-amber-500"}`} />
              <span>Buffer Pool ({workforce.bufferPoolCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAllocationFilter("Cross-Training");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                allocationFilter === "Cross-Training"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-indigo-800 hover:text-indigo-950 hover:bg-indigo-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${allocationFilter === "Cross-Training" ? "bg-white" : "bg-indigo-500"}`} />
              <span>Cross-Training ({workforce.crossTrainingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAllocationFilter("Line Float");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                allocationFilter === "Line Float"
                  ? "bg-teal-700 text-white shadow-2xs"
                  : "text-teal-800 hover:text-teal-950 hover:bg-teal-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${allocationFilter === "Line Float" ? "bg-white" : "bg-teal-600"}`} />
              <span>Line Float ({workforce.lineFloatCount})</span>
            </button>
          </div>
        </div>

        {/* Visual Allocation Breakdown Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAllocationFilter("SEATED");
                setCurrentPage(1);
              }}
              className="text-emerald-800 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Seated on Production Lines ({workforce.seatedCount} Ops · {workforce.seatedPercent}%)
            </button>
            <button
              type="button"
              onClick={() => {
                setAllocationFilter("UNALLOCATED");
                setCurrentPage(1);
              }}
              className="text-amber-800 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Unallocated / Buffer ({workforce.unallocatedCount} Ops · {workforce.unallocatedPercent}%)
            </button>
          </div>

          <div className="h-4 w-full bg-[#F6F1E8] rounded-full overflow-hidden flex border border-[#E6DDCE]">
            <div
              className="bg-emerald-600 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-mono font-bold cursor-pointer hover:opacity-90"
              style={{ width: `${workforce.seatedPercent}%` }}
              title={`Click to filter Seated: ${workforce.seatedCount}`}
              onClick={() => {
                setAllocationFilter("SEATED");
                setCurrentPage(1);
              }}
            >
              {workforce.seatedPercent}%
            </div>
            <div
              className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-mono font-bold cursor-pointer hover:opacity-90"
              style={{ width: `${workforce.unallocatedPercent}%` }}
              title={`Click to filter Unallocated: ${workforce.unallocatedCount}`}
              onClick={() => {
                setAllocationFilter("UNALLOCATED");
                setCurrentPage(1);
              }}
            >
              {workforce.unallocatedPercent}%
            </div>
          </div>
        </div>

        {/* Multi-Criteria Filters Bar */}
        <div className="bg-[#FDFCFB] border border-[#E6DDCE] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#221912]">
              <Filter className="w-3.5 h-3.5 text-[#9C5B3C]" />
              <span>Multi-Criteria Filter Suite</span>
              <span className="text-[10px] text-[#8C7E6E] font-normal">
                (Matches active station &amp; skill matrix competencies)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportRosterCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#221912] border border-[#E6DDCE] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="Export Filtered Workforce to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#8C7E6E]" />
                <span>Export Roster CSV</span>
              </button>

              {/* View Switcher (Table vs Grid) */}
              <div className="flex items-center bg-[#F6F1E8] p-0.5 rounded-xl border border-[#E6DDCE]">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-[#9C5B3C] shadow-2xs"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#9C5B3C] shadow-2xs"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C5B3C] hover:underline cursor-pointer pl-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Filter 1: Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search operator, EMP ID, line..."
                className="w-full h-9 pl-9 pr-8 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] placeholder-[#8C7E6E] focus:outline-none focus:border-[#9C5B3C] shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter 2: Operation-wise Filter with Counts */}
            <div>
              <select
                value={selectedOperationFilter}
                onChange={(e) => {
                  setSelectedOperationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">All Operations ({distinctOperationsWithCounts.length})</option>
                {distinctOperationsWithCounts.map((op) => (
                  <option key={op.name} value={op.name}>
                    {op.name} ({op.count} qualified)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Skill Rating Filter */}
            <div>
              <select
                value={selectedSkillRatingFilter}
                onChange={(e) => {
                  setSelectedSkillRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Skill Ratings (L1–L5)</option>
                <option value="HIGH">⭐ High Competency (L4 &amp; L5)</option>
                <option value="5">⭐ Level 5 · Master (90%+)</option>
                <option value="4">⭐ Level 4 · Expert (80–89%)</option>
                <option value="3">⭐ Level 3 · Competent (70–79%)</option>
                <option value="2">⭐ Level 2 · Developing (60–69%)</option>
                <option value="1">⭐ Level 1 · Trainee (&lt;60%)</option>
              </select>
            </div>
          </div>

          {/* Quick Skill Level Chips Ribbon */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-[#8C7E6E] font-bold text-[10.5px] uppercase tracking-wider mr-1">
              Quick Rating:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedSkillRatingFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all cursor-pointer ${
                selectedSkillRatingFilter === "ALL"
                  ? "bg-[#9C5B3C] text-white border-[#9C5B3C]"
                  : "bg-white text-[#8C7E6E] border-[#E6DDCE] hover:text-[#221912]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSkillRatingFilter("5");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedSkillRatingFilter === "5"
                  ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                  : "bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100/60"
              }`}
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>L5 Master</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSkillRatingFilter("4");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedSkillRatingFilter === "4"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                  : "bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60"
              }`}
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>L4 Expert</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSkillRatingFilter("3");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedSkillRatingFilter === "3"
                  ? "bg-sky-600 text-white border-sky-700 shadow-2xs"
                  : "bg-sky-50/60 text-sky-900 border-sky-200 hover:bg-sky-100/60"
              }`}
            >
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>L3 Competent</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSkillRatingFilter("2");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all cursor-pointer ${
                selectedSkillRatingFilter === "2"
                  ? "bg-slate-700 text-white border-slate-800 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              L2 / L1 Trainee
            </button>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#E6DDCE]/60 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-[#8C7E6E]">Active Filters:</span>

              {allocationFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] font-semibold text-[11px]">
                  Status: {allocationFilter}
                  <button
                    type="button"
                    onClick={() => setAllocationFilter("ALL")}
                    className="hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedOperationFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] font-semibold text-[11px]">
                  Operation: {selectedOperationFilter}
                  <button
                    type="button"
                    onClick={() => setSelectedOperationFilter("ALL")}
                    className="hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSkillRatingFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] font-semibold text-[11px]">
                  Rating: {selectedSkillRatingFilter === "HIGH" ? "L4/L5 Masters" : `Level ${selectedSkillRatingFilter}`}
                  <button
                    type="button"
                    onClick={() => setSelectedSkillRatingFilter("ALL")}
                    className="hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] font-semibold text-[11px]">
                  Search: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Counter & Rows Per Page */}
        <div className="flex items-center justify-between text-xs text-[#8C7E6E] px-1 flex-wrap gap-2">
          <div>
            Showing <strong className="text-[#221912] font-mono">{filteredWorkforce.length}</strong> of{" "}
            <strong className="text-[#221912] font-mono">{workforce.totalCount}</strong> active operators
            {hasActiveFilters && (
              <span className="text-[#9C5B3C] font-semibold ml-1.5">(Filtered)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold">Rows per page:</span>
            <select
              value={pageSize === Infinity ? "ALL" : String(pageSize)}
              onChange={(e) => {
                setPageSize(e.target.value === "ALL" ? Infinity : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 bg-white border border-[#E6DDCE] rounded-lg px-2 text-xs font-mono font-bold text-[#221912] focus:outline-none cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="ALL">All ({filteredWorkforce.length})</option>
            </select>
          </div>
        </div>

        {/* Operator Deployment Content: Table View vs Grid View */}
        {filteredWorkforce.length === 0 ? (
          <div className="py-16 text-center space-y-2 border border-[#E6DDCE] rounded-2xl bg-[#FDFCFB]">
            <UserX className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-[#221912]">No operators match the selected filters</p>
            <p className="text-xs text-[#8C7E6E]">Try adjusting or resetting the operation, skill rating, or search terms.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-1.5 bg-[#9C5B3C] text-white rounded-xl text-xs font-bold hover:bg-[#B06C49] transition-colors cursor-pointer shadow-2xs"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* High-Density Enterprise Table View */
          <div className="overflow-x-auto rounded-2xl border border-[#E6DDCE] bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: "980px" }}>
              <thead>
                <tr className="bg-[#FDFCFB] border-b border-[#E6DDCE] text-[10.5px] font-bold text-[#8C7E6E] uppercase select-none">
                  <th className="py-3 px-4 w-32">Emp ID</th>
                  <th className="py-3 px-4 w-52">Operator Profile</th>
                  <th className="py-3 px-4 w-52">Deployment Status</th>
                  <th className="py-3 px-4">Active &amp; Certified Operations</th>
                  <th className="py-3 px-4 w-36 text-center">Skill Rating</th>
                  <th className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDCE]">
                {paginatedWorkforce.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOperatorForModal(op)}
                    className="hover:bg-[#FEFCF9] transition-colors group cursor-pointer"
                  >
                    {/* Emp ID with Copy Button */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#9C5B3C]">
                        <span>{op.employeeId}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyEmpId(op.employeeId, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#F6F1E8] rounded text-[#8C7E6E] hover:text-[#221912]"
                          title="Copy EMP ID"
                        >
                          {copiedEmpId === op.employeeId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Operator Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl font-bold text-[10px] flex items-center justify-center shrink-0 border shadow-2xs relative ${
                          op.isAllocated
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {op.name?.slice(0, 2).toUpperCase()}
                          <span
                            className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-white ${
                              op.isAllocated ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-[#221912] text-xs truncate group-hover:text-[#9C5B3C] transition-colors flex items-center gap-1">
                            <span>{op.name}</span>
                          </div>
                          <div className="text-[10px] text-[#8C7E6E] flex items-center gap-1.5">
                            <span>{op.department || "Sewing"}</span>
                            <span>·</span>
                            <span className="text-[9px] px-1 rounded bg-[#F6F1E8] text-[#8C7E6E] font-medium border border-[#E6DDCE]">
                              {op.role || "OPERATOR"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Deployment Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {op.isAllocated ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Seated · {op.assignedLineCode}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono font-medium pl-1">
                            Station #{op.assignedStationNum} {op.assignedOrderNo ? `(${op.assignedOrderNo})` : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            op.unallocatedStatus === "Cross-Training"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : op.unallocatedStatus === "Line Float"
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {op.unallocatedStatus || "Buffer Pool"}
                          </span>
                          <div className="text-[10px] text-[#8C7E6E] pl-1 font-medium">
                            Available for deployment
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Active & Certified Operations */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#221912] text-xs">
                            {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                          </span>
                          {op.isAllocated ? (
                            <span className="text-[9.5px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold font-mono">
                              Active Station
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-semibold font-mono">
                              Primary Competency
                            </span>
                          )}
                        </div>

                        {op.certifiedOperations && op.certifiedOperations.length > 0 && (
                          <div className="text-[10px] text-[#8C7E6E] flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-600">
                              {op.certifiedOperations.length} Certified {op.certifiedOperations.length === 1 ? "Skill" : "Skills"}:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {op.certifiedOperations.slice(0, 3).map((c: any) => (
                                <span
                                  key={c.operationId}
                                  className="px-1.5 py-0.2 rounded bg-slate-50 text-slate-700 font-mono text-[9px] border border-slate-200"
                                >
                                  {c.operationName} (L{c.rating})
                                </span>
                              ))}
                              {op.certifiedOperations.length > 3 && (
                                <span className="text-[9px] text-[#9C5B3C] font-mono font-bold hover:underline">
                                  +{op.certifiedOperations.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Skill Rating Level */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border shadow-2xs ${
                          op.skillRating >= 5
                            ? "bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/20"
                            : op.skillRating >= 4
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : op.skillRating >= 3
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          <Star className={`w-3 h-3 ${op.skillRating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
                          <span>L{op.skillRating}</span>
                          <span className="text-[9.5px] font-normal text-slate-500">
                            {op.skillRating >= 5 ? "Master" : op.skillRating >= 4 ? "Expert" : op.skillRating >= 3 ? "Competent" : "Developing"}
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOperatorForModal(op)}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#221912] border border-[#E6DDCE] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="View Operator Full Skill Matrix Profile"
                        >
                          <span>Profile</span>
                        </button>

                        {op.isAllocated ? (
                          <button
                            type="button"
                            onClick={() => {
                              const params = new URLSearchParams();
                              if (op.assignedOrderId) params.set("orderId", String(op.assignedOrderId));
                              if (op.assignedLineId) params.set("lineId", String(op.assignedLineId));
                              navigate(`/line-balance?${params.toString()}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            title="Open this operator in Line Balancing"
                          >
                            <span>View Station</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate("/line-balance")}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            title="Allocate this buffer operator to an open workstation"
                          >
                            <span>Deploy</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Visual Operator Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedWorkforce.map((op) => (
              <div
                key={op.id}
                onClick={() => setSelectedOperatorForModal(op)}
                className="p-4 rounded-2xl border border-[#E6DDCE] bg-white shadow-2xs hover:shadow-md hover:border-[#9C5B3C]/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                {/* Card Header: Avatar, Name, EMP ID, Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl font-bold text-xs flex items-center justify-center shrink-0 border shadow-2xs relative ${
                      op.isAllocated
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                      {op.name?.slice(0, 2).toUpperCase()}
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-white ${
                          op.isAllocated ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#221912] group-hover:text-[#9C5B3C] transition-colors truncate max-w-[150px]">
                        {op.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C7E6E] font-mono">
                        <span className="font-bold text-[#9C5B3C]">{op.employeeId}</span>
                        <span>·</span>
                        <span>{op.department || "Sewing"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Status Pill */}
                  <div>
                    {op.isAllocated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {op.assignedLineCode}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        op.unallocatedStatus === "Cross-Training"
                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                          : op.unallocatedStatus === "Line Float"
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {op.unallocatedStatus || "Buffer Pool"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Active / Primary Operation & Skill Rating */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">
                      {op.isAllocated ? "Active Operation" : "Primary Competency"}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.2 rounded border ${
                      op.skillRating >= 5
                        ? "bg-amber-50 text-amber-900 border-amber-300"
                        : op.skillRating >= 4
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-sky-50 text-sky-800 border-sky-200"
                    }`}>
                      <Star className={`w-2.5 h-2.5 ${op.skillRating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
                      <span>L{op.skillRating} {op.skillRating >= 5 ? "Master" : op.skillRating >= 4 ? "Expert" : "Competent"}</span>
                    </span>
                  </div>

                  <div className="font-bold text-xs text-[#221912] truncate">
                    {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                  </div>

                  {op.isAllocated && (
                    <div className="text-[10px] text-emerald-800 font-mono font-medium flex items-center gap-1">
                      <span>Station #{op.assignedStationNum}</span>
                      {op.assignedOrderNo && <span>· PO: {op.assignedOrderNo}</span>}
                    </div>
                  )}
                </div>

                {/* Certified Skills Chips */}
                {op.certifiedOperations && op.certifiedOperations.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-[#8C7E6E]">
                      <span>Certified Skills:</span>
                      <span className="font-mono font-bold text-[#9C5B3C]">{op.certifiedOperations.length} Total</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {op.certifiedOperations.slice(0, 3).map((c: any) => (
                        <span
                          key={c.operationId}
                          className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono text-[9px] border border-[#E6DDCE]"
                        >
                          {c.operationName} (L{c.rating})
                        </span>
                      ))}
                      {op.certifiedOperations.length > 3 && (
                        <span className="text-[9px] text-[#9C5B3C] font-mono font-bold">
                          +{op.certifiedOperations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-[#E6DDCE] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setSelectedOperatorForModal(op)}
                    className="text-xs font-bold text-[#8C7E6E] hover:text-[#9C5B3C] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  {op.isAllocated ? (
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (op.assignedOrderId) params.set("orderId", String(op.assignedOrderId));
                        if (op.assignedLineId) params.set("lineId", String(op.assignedLineId));
                        navigate(`/line-balance?${params.toString()}`);
                      }}
                      className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>View Station</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/line-balance")}
                      className="px-3 py-1 rounded-xl bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>Deploy to Line</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-[#E6DDCE] text-xs">
            <div className="text-[#8C7E6E] font-medium">
              Page <strong className="text-[#221912] font-mono">{validCurrentPage}</strong> of{" "}
              <strong className="text-[#221912] font-mono">{totalPages}</strong> ({totalItems} total operators)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E6DDCE] bg-white text-[#8C7E6E] hover:text-[#221912] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    validCurrentPage === pageNum
                      ? "bg-[#9C5B3C] text-white shadow-2xs"
                      : "bg-white border border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E6DDCE] bg-white text-[#8C7E6E] hover:text-[#221912] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Forward Planning Skill Gap Analysis (The October Plan) ── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E6DDCE]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#9C5B3C] flex items-center justify-center text-white shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#221912]">
                Forward Planning Skill Gap Analysis: {forwardPlan.planMonth}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                Action Required
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] font-medium leading-relaxed max-w-3xl">
              Cross-references forward delivery orders scheduled for {forwardPlan.planMonth.split(" ")[0]} against certified plant operator competence. Identifies machine class deficits for proactive training before mass line setup.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => alert(`Exporting ${forwardPlan.planMonth} Skill Gap & Training Roadmap to CSV/PDF`)}
              className="px-3 py-1.5 rounded-xl bg-[#F6F1E8] hover:bg-[#EAE2D5] text-[#221912] text-xs font-bold border border-[#E6DDCE] flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#8C7E6E]" />
              <span>Export Forward Plan</span>
            </button>
          </div>
        </div>

        {/* Senior IE Strategic Callout */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <span className="font-black text-[#221912] uppercase tracking-wider text-[11px] block">
              Senior Industrial Engineering Forward Analysis:
            </span>
            <p className="text-[#221912] font-medium leading-relaxed">
              {forwardPlan.activeOrdersCount > 0
                ? <>
                    Upcoming <strong>{forwardPlan.activeOrdersCount} order{forwardPlan.activeOrdersCount !== 1 ? 's' : ''}</strong> scheduled for <strong>{forwardPlan.planMonth}</strong> require{' '}
                    <strong>{forwardPlan.totalOperatorsRequired} operators</strong> across specialized machine classes.{' '}
                    {forwardPlan.criticalShortfallCount > 0
                      ? <>
                          Current skill gap analysis identifies <strong>{forwardPlan.criticalShortfallCount} machine class{forwardPlan.criticalShortfallCount !== 1 ? 'es' : ''}</strong>{' '}
                          with critical operator deficits. Cross-training candidates are listed below.
                        </>
                      : <>All machine classes show sufficient qualified operators for the planned schedule.</>}
                  </>
                : <>No orders currently scheduled for {forwardPlan.planMonth}. Add orders to generate forward planning analysis.</>}
            </p>
          </div>
        </div>

        {/* Competency Balance Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E6DDCE]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFCFB] border-b border-[#E6DDCE] text-[10.5px] font-bold text-[#8C7E6E] uppercase">
                <th className="py-2.5 px-3">Sewing Machine Class</th>
                <th className="py-2.5 px-3">Process Category</th>
                <th className="py-2.5 px-3 text-center">Required (Oct)</th>
                <th className="py-2.5 px-3 text-center">Qualified (Avail)</th>
                <th className="py-2.5 px-3 text-center">Net Skill Gap</th>
                <th className="py-2.5 px-3">Forward Action Plan</th>
                <th className="py-2.5 px-3">Triggering Styles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {forwardPlan.skillDemands.map((demand) => (
                <tr
                  key={demand.machineClass}
                  className={`hover:bg-[#FEFCF9] transition-colors ${
                    demand.status === "severe_deficit" ? "bg-rose-50/30" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-[#221912] flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-[#9C5B3C] shrink-0" />
                    <span>{demand.machineClass}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#8C7E6E]">{demand.category}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-[#221912]">
                    {demand.requiredOperators}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-[#221912]">
                    {demand.availableQualifiedOperators}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                        demand.skillGap < -5
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : demand.skillGap < 0
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : demand.skillGap > 5
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {demand.skillGap > 0 ? `+${demand.skillGap} Surplus` : `${demand.skillGap} Deficit`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-[#221912] max-w-xs font-medium">
                    {demand.actionRecommendation}
                  </td>
                  <td className="py-2.5 px-3 text-[10.5px] text-[#8C7E6E] truncate max-w-[140px]">
                    {demand.sourceStyles.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Forward Training & Upskilling Roadmap Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#221912] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#9C5B3C]" />
              Recommended Cross-Training Program: Mobilize Before Oct 1
            </span>
            <span className="text-xs font-bold text-[#8C7E6E]">
              {forwardPlan.trainingRoadmap.length} Candidate Operators Selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {forwardPlan.trainingRoadmap.slice(0, 6).map((c, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white border border-[#E6DDCE] shadow-2xs space-y-2 hover:border-[#9C5B3C]/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#9C5B3C]">{c.employeeId}</span>
                  <span
                    className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      c.status === "In Training"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-indigo-50 text-indigo-800 border-indigo-300"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-[#221912]">{c.operatorName}</h5>
                  <p className="text-[11px] text-[#8C7E6E] mt-0.5">
                    Current: Level {c.currentRating} on {c.currentMachine.split("(")[0]}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-[#F6F1E8] border border-[#E6DDCE] text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C7E6E]">Target Machine:</span>
                    <span className="font-bold text-[#221912] truncate max-w-[130px]">{c.targetMachine}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8C7E6E]">Est. Curriculum:</span>
                    <span className="font-mono font-bold text-indigo-800">{c.trainingDaysEstimate} Training Days</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/skill-matrix")}
                  className="w-full py-1 rounded-lg bg-white hover:bg-[#F6F1E8] text-[#221912] hover:text-[#9C5B3C] border border-[#E6DDCE] text-xs font-bold transition-colors cursor-pointer"
                >
                  Assign to Skill Center
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Operator Skill Profile & Station Inspection Modal ───── */}
      {selectedOperatorForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl border border-[#E6DDCE] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-[#FAF8F5] border-b border-[#E6DDCE] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl font-black text-base flex items-center justify-center shrink-0 border shadow-2xs ${
                  selectedOperatorForModal.isAllocated
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}>
                  {selectedOperatorForModal.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#221912]">
                      {selectedOperatorForModal.name}
                    </h3>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-white text-[#9C5B3C] border border-[#E6DDCE]">
                      {selectedOperatorForModal.employeeId}
                    </span>
                  </div>
                  <div className="text-xs text-[#8C7E6E] flex items-center gap-2 mt-0.5">
                    <span>{selectedOperatorForModal.department || "Sewing"} Department</span>
                    <span>·</span>
                    <span>Role: {selectedOperatorForModal.role || "OPERATOR"}</span>
                    {selectedOperatorForModal.gender && (
                      <>
                        <span>·</span>
                        <span>{selectedOperatorForModal.gender}, Age {selectedOperatorForModal.age || 28}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOperatorForModal(null)}
                className="p-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Current Live Deployment Status Card */}
              <div className={`p-4 rounded-2xl border ${
                selectedOperatorForModal.isAllocated
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-amber-50/50 border-amber-200"
              } space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C7E6E]">
                    Current Shopfloor Deployment Status
                  </span>
                  {selectedOperatorForModal.isAllocated ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Seated at Active Workstation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10.5px]">
                      Available in {selectedOperatorForModal.unallocatedStatus || "Buffer Pool"}
                    </span>
                  )}
                </div>

                {selectedOperatorForModal.isAllocated ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-[#8C7E6E] block font-medium">Production Line</span>
                      <strong className="text-[#221912] font-mono">{selectedOperatorForModal.assignedLineCode}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-[#8C7E6E] block font-medium">Workstation #</span>
                      <strong className="text-[#221912] font-mono">Station {selectedOperatorForModal.assignedStationNum}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-[#8C7E6E] block font-medium">Active Operation</span>
                      <strong className="text-[#221912] truncate block">{selectedOperatorForModal.assignedOperationName}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-[#8C7E6E] block font-medium">Active Order</span>
                      <strong className="text-[#221912] font-mono">{selectedOperatorForModal.assignedOrderNo || "PO-102"}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[#8C7E6E] block">Primary Verified Competence:</span>
                      <strong className="text-[#221912] font-bold text-sm">{selectedOperatorForModal.primarySkill}</strong>
                    </div>
                    <span className="text-amber-800 bg-amber-100 font-bold px-2.5 py-1 rounded-lg text-xs">
                      Ready for Line Deployment
                    </span>
                  </div>
                )}
              </div>

              {/* Certified Competency Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#221912] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#9C5B3C]" />
                    <span>Skill Matrix Certifications ({selectedOperatorForModal.certifiedOperations.length})</span>
                  </h4>
                  <Link
                    to="/skill-matrix"
                    className="text-xs font-bold text-[#9C5B3C] hover:underline flex items-center gap-1"
                  >
                    <span>Edit in Skill Matrix</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {selectedOperatorForModal.certifiedOperations.length === 0 ? (
                  <div className="p-6 text-center border border-[#E6DDCE] rounded-xl bg-[#FAF8F5] text-xs text-[#8C7E6E]">
                    No specific skill assessments recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#E6DDCE]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#E6DDCE] text-[10px] font-bold text-[#8C7E6E] uppercase">
                          <th className="py-2.5 px-3">Certified Operation</th>
                          <th className="py-2.5 px-3 text-center">Skill Rating</th>
                          <th className="py-2.5 px-3 text-center">Benchmark Cycle Time</th>
                          <th className="py-2.5 px-3">Effective Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DDCE]">
                        {selectedOperatorForModal.certifiedOperations.map((c: any) => (
                          <tr key={c.id || c.operationId} className="hover:bg-[#FAF8F5]/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#221912]">{c.operationName}</div>
                              {c.operationCode && (
                                <span className="font-mono text-[10px] text-[#8C7E6E]">{c.operationCode}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                                c.rating >= 5
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : c.rating >= 4
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-sky-50 text-sky-800 border-sky-200"
                              }`}>
                                <Star className={`w-3 h-3 ${c.rating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
                                <span>L{c.rating}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-[#221912]">
                              {c.cycleTimeSeconds ? `${c.cycleTimeSeconds}s` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[#8C7E6E] font-mono">
                              {c.effectiveDate || "Active"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-[#FAF8F5] border-t border-[#E6DDCE] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOperatorForModal(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#221912] border border-[#E6DDCE] text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedOperatorForModal.isAllocated ? (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (selectedOperatorForModal.assignedOrderId) params.set("orderId", String(selectedOperatorForModal.assignedOrderId));
                      if (selectedOperatorForModal.assignedLineId) params.set("lineId", String(selectedOperatorForModal.assignedLineId));
                      navigate(`/line-balance?${params.toString()}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Station in Line Balancing</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/line-balance")}
                    className="px-4 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Deploy Operator to Line Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
