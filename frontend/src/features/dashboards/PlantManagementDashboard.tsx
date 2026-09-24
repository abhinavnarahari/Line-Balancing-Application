import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  Download,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Filter,
  Star,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  Check,
  Copy,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { Operation } from "../operations/api";
import type { SewingLine } from "../lines/api";
import type { LinePlan } from "../line-balance/api";
import { computeForwardSkillGapAnalysis } from "./forwardSkillGap";

export interface PlantManagementDashboardProps {
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
  orders = [],
  bulletins = [],
  operators = [],
  skillMatrix = [],
  operations = [],
  lines = [],
  linePlans = [],
  onRefresh,
  loading = false,
}: PlantManagementDashboardProps) {
  const navigate = useNavigate();

  // Multi-dimensional Workforce Filters & View State
  const [allocationFilter, setAllocationFilter] = useState<
    "ALL" | "SEATED" | "NON_SEATED"
  >("ALL");
  const [selectedOperationFilter, setSelectedOperationFilter] = useState<string>("ALL");
  const [selectedSkillRatingFilter, setSelectedSkillRatingFilter] = useState<string>("ALL");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Operator for Detailed Modal Profile
  const [selectedOperatorForModal, setSelectedOperatorForModal] = useState<any | null>(null);
  const [copiedEmpId, setCopiedEmpId] = useState<string | null>(null);

  // 1. Compute Seated vs. Unallocated Workforce from Real Line Plans & Operators
  const workforce = useMemo(() => {
    const activeOps = operators.filter((o) => o.active !== false);
    const totalCount = activeOps.length;

    // Index all operator assignments from active line plans
    const operatorAssignmentMap = new Map<
      string,
      {
        plan: LinePlan;
        line?: SewingLine;
        order?: Order;
        stationNum: number | string;
        operationName: string;
      }
    >();

    linePlans.forEach((plan) => {
      const lineObj = lines.find((l) => String(l.id) === String(plan.lineId) || l.lineCode === plan.lineCode);
      const orderObj = orders.find((o) => String(o.id) === String(plan.orderId));

      (plan.assignments || []).forEach((asg, idx) => {
        if (asg.operatorId != null) {
          const opKey = String(asg.operatorId);
          const opObj = operations.find((o) => String(o.id) === String(asg.operationId));
          const bLine = (bulletins || [])
            .flatMap((b) => b.lines || [])
            .find(
              (l) =>
                String(l.id) === String(asg.bulletinLineId) ||
                (asg.operationId != null && String(l.operationId) === String(asg.operationId))
            );

          const operationName =
            bLine?.operationName || opObj?.name || (asg as any).operationName || "Sewing Operation";
          const stationNum =
            typeof asg.stationId === "number" && asg.stationId < 100
              ? asg.stationId
              : typeof asg.stationId === "string" && !isNaN(Number(asg.stationId)) && Number(asg.stationId) < 100
                ? Number(asg.stationId)
                : idx + 1;

          if (!operatorAssignmentMap.has(opKey)) {
            operatorAssignmentMap.set(opKey, {
              plan,
              line: lineObj,
              order: orderObj,
              stationNum,
              operationName,
            });
          }
        }
      });
    });

    const allDeployments = activeOps.map((op) => {
      const assignment =
        operatorAssignmentMap.get(String(op.id)) || operatorAssignmentMap.get(op.employeeId);

      const opSkills = skillMatrix.filter(
        (s) => String(s.operatorId) === String(op.id) || s.employeeId === op.employeeId
      );
      const bestSkill = [...opSkills].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];

      const certifiedOperations = opSkills.map((s) => ({
        id: s.id,
        operationId: s.operationId,
        operationName: s.operationName || "Sewing Operation",
        machineType: s.machineType || "Single Needle Lockstitch",
        rating: Number(s.rating) || 3,
        certifiedDate: s.assessmentDate || s.createdAt || "Active",
      }));

      const isAllocated = !!assignment;
      const skillRating = bestSkill ? Number(bestSkill.rating) || 3 : 3;
      const primarySkill = bestSkill ? bestSkill.operationName : "General Sewing Operations";

      return {
        id: op.id,
        employeeId: op.employeeId,
        name: op.name,
        department: op.department || "Sewing Department",
        role: op.role || "OPERATOR",
        joiningDate: op.joiningDate,
        isAllocated,
        assignedLineId: assignment?.line?.id || null,
        assignedLineCode: assignment?.line?.lineCode || (assignment ? "Line 01" : null),
        assignedLineName: assignment?.line?.lineName || (assignment ? "Sewing Line 01" : null),
        assignedStationNum: assignment?.stationNum || null,
        assignedOrderId: assignment?.order?.id || null,
        assignedOrderNo: assignment?.order?.orderNo || null,
        assignedOperationName: assignment?.operationName || null,
        skillRating,
        primarySkill,
        certifiedOperations,
      };
    });

    const seatedList = allDeployments.filter((d) => d.isAllocated);
    const unallocatedList = allDeployments.filter((d) => !d.isAllocated);

    const seatedCount = seatedList.length;
    const unallocatedCount = unallocatedList.length;
    const seatedPercent = totalCount > 0 ? Math.round((seatedCount / totalCount) * 100) : 0;
    const unallocatedPercent = totalCount > 0 ? 100 - seatedPercent : 0;

    const masterReservesCount = unallocatedList.filter((d) => d.skillRating >= 4).length;

    // Multi-skilling versatility ratio (% with >= 2 certified skills)
    const multiSkilledCount = allDeployments.filter((d) => d.certifiedOperations.length >= 2).length;
    const multiSkilledPercent = totalCount > 0 ? Math.round((multiSkilledCount / totalCount) * 100) : 0;

    // Average skill rating across factory
    const avgSkillRating =
      totalCount > 0
        ? Math.round((allDeployments.reduce((sum, d) => sum + d.skillRating, 0) / totalCount) * 10) / 10
        : 3.5;

    return {
      totalCount,
      seatedCount,
      unallocatedCount,
      seatedPercent,
      unallocatedPercent,
      masterReservesCount,
      multiSkilledCount,
      multiSkilledPercent,
      avgSkillRating,
      allDeployments,
    };
  }, [operators, linePlans, lines, orders, operations, bulletins, skillMatrix]);

  // 2. Real Factory Lines Summary
  const linesSummary = useMemo(() => {
    return lines
      .filter((l) => l.active !== false)
      .map((line) => {
        const plan = linePlans.find((p) => String(p.lineId) === String(line.id) || p.lineCode === line.lineCode);
        const order = plan?.orderId ? orders.find((o) => String(o.id) === String(plan.orderId)) : null;
        const targetCapacity = Number(line.capacityPerDay) || 600;
        const reqOperators = Number(line.operatorCount) || 12;
        const deployedOperators = (plan?.assignments || []).filter((a) => a.operatorId != null).length;
        const manningPercent = reqOperators > 0 ? Math.min(100, Math.round((deployedOperators / reqOperators) * 100)) : 0;

        return {
          id: line.id,
          lineCode: line.lineCode,
          lineName: line.lineName,
          floor: line.floor || "Main Sewing Floor",
          supervisor: line.supervisorName || "Line Supervisor",
          lineType: line.lineType || "Standard",
          activeOrderNo: order?.orderNo || (plan ? `PO-${plan.orderId}` : "Standby"),
          activeStyle: order?.styleNo || "Standard Style",
          buyer: order?.buyer || "Export",
          targetCapacity,
          reqOperators,
          deployedOperators,
          manningPercent,
          hasPlan: !!plan,
          status: !plan ? "No Plan" : deployedOperators === 0 ? "Needs Manning" : "Running",
        };
      });
  }, [lines, linePlans, orders]);

  // 3. Plant Capacity Total
  const totalPlantCapacityPerDay = useMemo(() => {
    return linesSummary.reduce((sum, l) => sum + l.targetCapacity, 0);
  }, [linesSummary]);

  const totalOrdersPieces = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.totalQuantity) || 0), 0);
  }, [orders]);

  // 4. Forward Planning Skill Gap Analysis (Next Month / Schedule)
  const forwardPlan = useMemo(() => {
    return computeForwardSkillGapAnalysis(
      orders,
      bulletins,
      operators,
      skillMatrix,
      operations,
      "2026-10"
    );
  }, [orders, bulletins, operators, skillMatrix, operations]);

  // Distinct Operations for filter
  const distinctOperations = useMemo(() => {
    const set = new Set<string>();
    operations.forEach((o) => {
      if (o.name) set.add(o.name);
    });
    bulletins.forEach((b) => {
      (b.lines || []).forEach((l) => {
        if (l.operationName) set.add(l.operationName);
      });
    });
    workforce.allDeployments.forEach((d) => {
      if (d.primarySkill) set.add(d.primarySkill);
      if (d.assignedOperationName) set.add(d.assignedOperationName);
      d.certifiedOperations.forEach((c) => {
        if (c.operationName) set.add(c.operationName);
      });
    });
    return Array.from(set).sort();
  }, [operations, bulletins, workforce.allDeployments]);

  // 5. Filtered Operators List
  const filteredWorkforce = useMemo(() => {
    return workforce.allDeployments.filter((op) => {
      // 1. Allocation Filter
      if (allocationFilter === "SEATED" && !op.isAllocated) return false;
      if (allocationFilter === "NON_SEATED" && op.isAllocated) return false;

      // 2. Department Filter
      if (selectedDepartmentFilter !== "ALL" && op.department !== selectedDepartmentFilter) {
        return false;
      }

      // 3. Operation Filter
      if (selectedOperationFilter !== "ALL") {
        const matchesAssigned = op.assignedOperationName?.toLowerCase() === selectedOperationFilter.toLowerCase();
        const matchesSkill = op.certifiedOperations.some(
          (c) => c.operationName.toLowerCase() === selectedOperationFilter.toLowerCase()
        );
        const matchesPrimary = op.primarySkill.toLowerCase() === selectedOperationFilter.toLowerCase();
        if (!matchesAssigned && !matchesSkill && !matchesPrimary) return false;
      }

      // 4. Skill Rating Filter
      if (selectedSkillRatingFilter !== "ALL") {
        const reqLvl = Number(selectedSkillRatingFilter);
        if (op.skillRating !== reqLvl && !op.certifiedOperations.some((c) => c.rating === reqLvl)) {
          return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = op.name.toLowerCase().includes(q);
        const matchesId = op.employeeId.toLowerCase().includes(q);
        const matchesDept = (op.department || "").toLowerCase().includes(q);
        const matchesLine = (op.assignedLineCode || "").toLowerCase().includes(q);
        const matchesOp = (op.assignedOperationName || "").toLowerCase().includes(q);
        return matchesName || matchesId || matchesDept || matchesLine || matchesOp;
      }

      return true;
    });
  }, [
    workforce.allDeployments,
    allocationFilter,
    selectedDepartmentFilter,
    selectedOperationFilter,
    selectedSkillRatingFilter,
    searchQuery,
  ]);

  // Pagination
  const totalItems = filteredWorkforce.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedWorkforce = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredWorkforce.slice(start, start + pageSize);
  }, [filteredWorkforce, validCurrentPage, pageSize]);

  // Distinct Departments for filter
  const distinctDepartments = useMemo(() => {
    const depts = new Set<string>();
    workforce.allDeployments.forEach((op) => {
      if (op.department) depts.add(op.department);
    });
    return Array.from(depts);
  }, [workforce.allDeployments]);

  // Export Roster to Excel
  const handleExportRoster = () => {
    try {
      const exportData = filteredWorkforce.map((op) => ({
        "Employee ID": op.employeeId,
        "Operator Name": op.name,
        "Department": op.department,
        "Role": op.role,
        "Status": op.isAllocated ? `SEATED (${op.assignedLineCode})` : "NON-SEATED",
        "Assigned Line": op.assignedLineCode || "—",
        "Assigned Station": op.assignedStationNum ? `St #${op.assignedStationNum}` : "—",
        "Assigned Order": op.assignedOrderNo || "—",
        "Active / Primary Operation": op.isAllocated ? op.assignedOperationName : op.primarySkill,
        "Skill Rating Level": `L${op.skillRating}`,
        "Total Certified Skills": op.certifiedOperations.length,
        "Certified Skills List": op.certifiedOperations.map((c) => `${c.operationName} (L${c.rating})`).join("; "),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Plant Workforce Deployment");
      const todayStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Plant_Workforce_Roster_${todayStr}.xlsx`);
    } catch (err) {
      console.error("Failed to export workforce roster:", err);
      alert("Failed to export roster. Please try again.");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── 1. Plant Executive Operations Header ───────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#9C5B3C] shrink-0">
              Plant Executive Operations Cockpit
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Plant Floor Active
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">·</span>
            <span className="text-[11px] font-mono font-bold text-[#221912] shrink-0">
              {lines.length} Production Lines
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">·</span>
            <span className="text-[11px] font-mono text-[#8C7E6E] shrink-0">
              {workforce.totalCount} Active Operators
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
              Plant Workforce Deployment &amp; Competency Governance
            </h1>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Export Roster to Excel */}
          <button
            type="button"
            onClick={handleExportRoster}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#221912] border border-[#E6DDCE] text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Download full plant deployment roster in Excel format"
          >
            <Download className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="whitespace-nowrap">Export Roster</span>
          </button>

          {/* Skill Matrix Link */}
          <Link
            to="/skill-matrix"
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#221912] border border-[#E6DDCE] text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="whitespace-nowrap">Skill Matrix</span>
          </Link>

          {/* Line Balance Link */}
          <Link
            to="/line-balance"
            className="h-9 px-3.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B2F] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span className="whitespace-nowrap">Balance Lines</span>
          </Link>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 w-9 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}
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
              Seated Operators
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
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${workforce.seatedPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Non-Seated Operators */}
        <div
          onClick={() => {
            setAllocationFilter("NON_SEATED");
            setCurrentPage(1);
          }}
          className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-200 ${
            allocationFilter === "NON_SEATED"
              ? "bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-[#E6DDCE] hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Non-Seated Operators
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
                {workforce.unallocatedPercent}% Non-Seated
              </span>
            </div>
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${workforce.unallocatedPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Multi-Skilled Workforce Versatility */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Multi-Skilling Versatility
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Star className="w-4 h-4 text-indigo-600 fill-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-900 font-mono">
                {workforce.multiSkilledPercent}%
              </span>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                {workforce.multiSkilledCount} Operators
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center justify-between">
            <span>Avg Plant Rating: <strong className="font-mono text-[#221912] font-bold">L{workforce.avgSkillRating}</strong></span>
            <span>Master Reserves: <strong className="font-mono text-indigo-800 font-bold">{workforce.masterReservesCount}</strong></span>
          </div>
        </div>

        {/* Metric 4: Total Plant Daily Capacity */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Plant Daily Sewing Capacity
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {totalPlantCapacityPerDay.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                Pcs / Day
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center justify-between">
            <span>Total Order Load:</span>
            <span className="font-mono font-bold text-[#221912]">{totalOrdersPieces.toLocaleString()} pcs</span>
          </div>
        </div>
      </div>

      {/* ── 3. Active Sewing Lines & Manning Summary ───────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DDCE]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#221912] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9C5B3C]" />
              <span>Plant Sewing Lines &amp; Manning Capacity Overview</span>
            </h3>
          </div>
          <Link
            to="/line-dashboard"
            className="text-xs font-bold text-[#9C5B3C] hover:underline flex items-center gap-1"
          >
            <span>Open Line Operations Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {linesSummary.map((line) => (
            <div
              key={line.id}
              className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2.5 hover:border-[#9C5B3C] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-[#221912] text-white">
                    {line.lineCode}
                  </span>
                  <h4 className="font-bold text-xs text-[#221912]">{line.lineName}</h4>
                </div>
                <span
                  className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    line.status === "Running"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : line.status === "Needs Manning"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-zinc-100 text-zinc-700 border-zinc-300"
                  }`}
                >
                  {line.status}
                </span>
              </div>

              <div className="text-xs text-[#8C7E6E] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Supervisor:</span>
                  <strong className="text-[#221912]">{line.supervisor}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Order:</span>
                  <strong className="text-[#221912]">{line.activeOrderNo}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Capacity:</span>
                  <strong className="font-mono text-[#9C5B3C]">{line.targetCapacity} pcs/day</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E6DDCE]/60 space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-[#8C7E6E]">Manning:</span>
                  <span className="font-mono font-bold text-[#221912]">
                    {line.deployedOperators} / {line.reqOperators} Ops ({line.manningPercent}%)
                  </span>
                </div>
                <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
                  <div
                    className={`h-full rounded-full ${
                      line.manningPercent >= 90 ? "bg-emerald-600" : "bg-amber-500"
                    }`}
                    style={{ width: `${line.manningPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Workforce Deployment & Allocation Roster ─────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-5">
        {/* Header & Main Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E6DDCE]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#221912]">
                Workforce Deployment: Seated vs. Non-Seated Roster
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                {workforce.totalCount} Operators
              </span>
            </div>
          </div>

          {/* Allocation Mode Segmented Tabs */}
          <div className="flex items-center bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE] text-xs font-bold gap-1 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAllocationFilter("ALL");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
                setAllocationFilter("NON_SEATED");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                allocationFilter === "NON_SEATED"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-800 hover:text-amber-950 hover:bg-amber-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${allocationFilter === "NON_SEATED" ? "bg-white" : "bg-amber-500"}`} />
              <span>Non-Seated ({workforce.unallocatedCount})</span>
            </button>
          </div>
        </div>

        {/* Multi-Criteria Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6DDCE]">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, line..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-[#E6DDCE] text-xs text-[#221912] placeholder-[#8C7E6E] focus:outline-none focus:border-[#9C5B3C]"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => {
                setSelectedDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E6DDCE] text-xs text-[#221912] font-medium focus:outline-none focus:border-[#9C5B3C] cursor-pointer"
            >
              <option value="ALL">All Departments ({distinctDepartments.length})</option>
              {distinctDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Operation / Skill Filter */}
          <div>
            <select
              value={selectedOperationFilter}
              onChange={(e) => {
                setSelectedOperationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E6DDCE] text-xs text-[#221912] font-medium focus:outline-none focus:border-[#9C5B3C] cursor-pointer"
            >
              <option value="ALL">All Operations ({distinctOperations.length})</option>
              {distinctOperations.map((opName) => (
                <option key={opName} value={opName}>
                  {opName}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Level Filter */}
          <div>
            <select
              value={selectedSkillRatingFilter}
              onChange={(e) => {
                setSelectedSkillRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E6DDCE] text-xs text-[#221912] font-medium focus:outline-none focus:border-[#9C5B3C] cursor-pointer"
            >
              <option value="ALL">All Skill Ratings</option>
              <option value="5">Level 5 — Master Operator</option>
              <option value="4">Level 4 — Expert Operator</option>
              <option value="3">Level 3 — Competent Operator</option>
              <option value="2">Level 2 — Developing Operator</option>
              <option value="1">Level 1 — Novice Trainee</option>
            </select>
          </div>

          {/* View Mode & Reset Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E6DDCE]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-[#9C5B3C] text-white" : "text-[#8C7E6E] hover:text-[#221912]"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-[#9C5B3C] text-white" : "text-[#8C7E6E] hover:text-[#221912]"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setAllocationFilter("ALL");
                setSelectedDepartmentFilter("ALL");
                setSelectedOperationFilter("ALL");
                setSelectedSkillRatingFilter("ALL");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-[#9C5B3C] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* ── Table View ── */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-[#E6DDCE]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E6DDCE] text-[10.5px] uppercase font-bold text-[#8C7E6E]">
                  <th className="py-3 px-4 w-52">Operator</th>
                  <th className="py-3 px-4 w-44">Deployment Status</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4 text-center w-36">Skill Rating</th>
                  <th className="py-3 px-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDCE]">
                {paginatedWorkforce.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-[#8C7E6E] italic">
                      No operators found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedWorkforce.map((op) => (
                    <tr
                      key={op.id}
                      onClick={() => setSelectedOperatorForModal(op)}
                      className="hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer group"
                    >
                      {/* Operator Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] font-bold text-xs shrink-0">
                            {op.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                              {op.name}
                            </div>
                            <div className="text-[10.5px] text-[#8C7E6E] font-mono font-medium">
                              {op.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Deployment Status */}
                      <td className="py-3 px-4">
                        {op.isAllocated ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Seated on {op.assignedLineCode}
                            </span>
                            <div className="text-[10px] text-emerald-700 font-mono font-medium pl-0.5">
                              Station {op.assignedStationNum} {op.assignedOrderNo && `(${op.assignedOrderNo})`}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Non-Seated
                            </span>
                            <div className="text-[10px] text-[#8C7E6E] font-medium pl-0.5">
                              Available
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Operation */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#221912] text-xs">
                            {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                          </span>
                          {op.isAllocated && (
                            <span className="text-[9.5px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold font-mono">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Skill Rating Level */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-2xs ${
                            op.skillRating >= 5
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : op.skillRating >= 4
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : op.skillRating >= 3
                                  ? "bg-sky-50 text-sky-800 border-sky-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              op.skillRating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"
                            }`}
                          />
                          <span>
                            L{op.skillRating}{" "}
                            {op.skillRating >= 5
                              ? "Master"
                              : op.skillRating >= 4
                                ? "Expert"
                                : op.skillRating >= 3
                                  ? "Competent"
                                  : "Developing"}
                          </span>
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOperatorForModal(op)}
                            className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#221912] border border-[#E6DDCE] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                            title="View Operator Full Profile"
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
                              title="Allocate this operator to an open workstation"
                            >
                              <span>Deploy</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedWorkforce.map((op) => (
              <div
                key={op.id}
                onClick={() => setSelectedOperatorForModal(op)}
                className="p-4 rounded-xl border border-[#E6DDCE] bg-white shadow-2xs hover:shadow-md hover:border-[#9C5B3C]/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        op.isAllocated ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#221912] group-hover:text-[#9C5B3C] transition-colors truncate max-w-[150px]">
                        {op.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8C7E6E] font-mono">
                        <span className="font-bold text-[#9C5B3C]">{op.employeeId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    {op.isAllocated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {op.assignedLineCode}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Non-Seated
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">
                      {op.isAllocated ? "Active Operation" : "Primary Competency"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.2 rounded border ${
                        op.skillRating >= 5
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : op.skillRating >= 4
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-sky-50 text-sky-800 border-sky-200"
                      }`}
                    >
                      <Star
                        className={`w-2.5 h-2.5 ${
                          op.skillRating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"
                        }`}
                      />
                      <span>
                        L{op.skillRating} {op.skillRating >= 5 ? "Master" : op.skillRating >= 4 ? "Expert" : "Competent"}
                      </span>
                    </span>
                  </div>

                  <div className="font-bold text-xs text-[#221912] truncate">
                    {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                  </div>

                  {op.isAllocated && (
                    <div className="text-[10px] text-emerald-800 font-mono font-medium flex items-center gap-1">
                      <span>Station {op.assignedStationNum}</span>
                      {op.assignedOrderNo && <span>· PO: {op.assignedOrderNo}</span>}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="pt-2 border-t border-[#E6DDCE] flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
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

      {/* ── 5. Forward Planning Skill Gap Analysis ────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E6DDCE]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#221912] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#9C5B3C]" />
                <span>Forward Planning Skill Gap Analysis ({forwardPlan.planMonth})</span>
              </h3>
              {forwardPlan.criticalShortfallCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>{forwardPlan.criticalShortfallCount} Critical Shortfalls</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6DDCE] text-[#8C7E6E]">
              Orders: <strong className="text-[#221912]">{forwardPlan.activeOrdersCount}</strong> ({forwardPlan.totalPlannedPieces.toLocaleString()} pcs)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6DDCE] text-[#8C7E6E]">
              Required: <strong className="text-[#221912]">{forwardPlan.totalOperatorsRequired}</strong> Ops
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6DDCE] text-[#8C7E6E]">
              Available: <strong className="text-[#221912]">{forwardPlan.totalOperatorsAvailable}</strong> Ops
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg border ${
                forwardPlan.overallSkillGap >= 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-rose-50 text-rose-800 border-rose-300"
              }`}
            >
              {forwardPlan.overallSkillGap >= 0 ? `+${forwardPlan.overallSkillGap} Surplus` : `${forwardPlan.overallSkillGap} Net Deficit`}
            </span>
          </div>
        </div>

        {/* Machine Competency Demand vs. Qualified Supply Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E6DDCE]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6DDCE] text-[10.5px] uppercase font-bold text-[#8C7E6E]">
                <th className="py-2.5 px-3">Machine Class &amp; Category</th>
                <th className="py-2.5 px-3 text-center">Required (Plan)</th>
                <th className="py-2.5 px-3 text-center">Qualified (Supply)</th>
                <th className="py-2.5 px-3 text-center">Competency Gap</th>
                <th className="py-2.5 px-3">Action Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {forwardPlan.skillDemands.map((demand) => (
                <tr key={demand.machineClass} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-[#221912]">{demand.machineClass}</div>
                    <div className="text-[10px] text-[#8C7E6E] font-medium">{demand.category}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-[#221912]">
                    {demand.requiredOperators} Ops
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800">
                    {demand.availableQualifiedOperators} Qualified
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        demand.status === "severe_deficit"
                          ? "bg-rose-50 text-rose-800 border-rose-300 font-mono"
                          : demand.status === "moderate_deficit"
                            ? "bg-amber-50 text-amber-800 border-amber-300 font-mono"
                            : demand.status === "surplus"
                              ? "bg-sky-50 text-sky-800 border-sky-300 font-mono"
                              : "bg-emerald-50 text-emerald-800 border-emerald-300 font-mono"
                      }`}
                    >
                      {demand.skillGap > 0
                        ? `+${demand.skillGap} Surplus`
                        : demand.skillGap < 0
                          ? `${demand.skillGap} Deficit`
                          : "Balanced (0)"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-[#221912]">
                    {demand.actionRecommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cross-Training & Skill Ramp-up Roadmap */}
        {forwardPlan.trainingRoadmap.length > 0 && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#221912] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#9C5B3C]" />
                <span>Recommended Cross-Training &amp; Skills Ramp-Up Roadmap</span>
              </h4>
              <span className="text-[11px] font-mono text-[#8C7E6E]">
                {forwardPlan.trainingRoadmap.length} Candidate Operators
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {forwardPlan.trainingRoadmap.map((cand, idx) => (
                <div
                  key={`${cand.operatorId}-${idx}`}
                  className="p-3 rounded-lg bg-white border border-[#E6DDCE] text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#221912]">{cand.operatorName}</span>
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${
                        cand.status === "In Training"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {cand.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8C7E6E] font-mono">
                    <span>{cand.employeeId}</span>
                    <span className="mx-1">·</span>
                    <span>Current: L{cand.currentRating}</span>
                  </div>
                  <div className="text-[11px] text-[#221912] pt-1 border-t border-[#F6F1E8] flex items-center justify-between">
                    <span>Target: <strong>{cand.targetCategory}</strong></span>
                    <span className="text-[#9C5B3C] font-bold font-mono text-[10px]">
                      ~{cand.trainingDaysEstimate} Days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Operator Skill Profile Modal ───────────────────────────── */}
      {selectedOperatorForModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-[#FAF8F5] border-b border-[#E6DDCE] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                    selectedOperatorForModal.isAllocated
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#221912]">
                      {selectedOperatorForModal.name}
                    </h3>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        selectedOperatorForModal.isAllocated
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-amber-100 text-amber-900 border-amber-300"
                      }`}
                    >
                      {selectedOperatorForModal.isAllocated
                        ? `Seated · ${selectedOperatorForModal.assignedLineCode}`
                        : "Non-Seated"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8C7E6E] mt-0.5 font-mono">
                    <span className="font-bold text-[#9C5B3C]">
                      {selectedOperatorForModal.employeeId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOperatorForModal.employeeId);
                        setCopiedEmpId(selectedOperatorForModal.employeeId);
                        setTimeout(() => setCopiedEmpId(null), 2000);
                      }}
                      className="text-slate-400 hover:text-[#221912] cursor-pointer"
                      title="Copy Employee ID"
                    >
                      {copiedEmpId === selectedOperatorForModal.employeeId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span>·</span>
                    <span>{selectedOperatorForModal.department}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOperatorForModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Current Allocation Banner */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C7E6E] block">
                  Current Floor Deployment Status:
                </span>
                {selectedOperatorForModal.isAllocated ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#8C7E6E] block text-[11px]">Assigned Line:</span>
                      <strong className="text-[#221912]">
                        {selectedOperatorForModal.assignedLineCode} ({selectedOperatorForModal.assignedLineName})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8C7E6E] block text-[11px]">Station / Sequence:</span>
                      <strong className="text-[#221912]">
                        Station #{selectedOperatorForModal.assignedStationNum}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8C7E6E] block text-[11px]">Active Operation:</span>
                      <strong className="text-[#9C5B3C]">
                        {selectedOperatorForModal.assignedOperationName}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-amber-900 block font-bold">
                        {selectedOperatorForModal.unallocatedStatus || "Buffer Pool"}
                      </strong>
                      <span className="text-[#8C7E6E]">
                        Available for immediate line deployment &amp; bottleneck relief
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOperatorForModal(null);
                        navigate("/line-balance");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#9C5B3C] text-white font-bold text-xs shadow-2xs hover:bg-[#854B2F] transition-colors"
                    >
                      Deploy to Line
                    </button>
                  </div>
                )}
              </div>

              {/* Certified Skills List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#221912] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Certified Competency Matrix ({selectedOperatorForModal.certifiedOperations?.length || 0} Skills)</span>
                  </h4>
                  <Link
                    to="/skill-matrix"
                    className="text-xs font-bold text-[#9C5B3C] hover:underline"
                    onClick={() => setSelectedOperatorForModal(null)}
                  >
                    Update in Skill Matrix →
                  </Link>
                </div>

                <div className="space-y-2">
                  {(!selectedOperatorForModal.certifiedOperations ||
                    selectedOperatorForModal.certifiedOperations.length === 0) ? (
                    <p className="text-xs text-[#8C7E6E] italic p-4 bg-[#FAF8F5] rounded-xl text-center border border-[#E6DDCE]">
                      No individual skill assessments logged for this operator.
                    </p>
                  ) : (
                    selectedOperatorForModal.certifiedOperations.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white border border-[#E6DDCE] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-[#221912]">{c.operationName}</div>
                          <div className="text-[10.5px] text-[#8C7E6E]">{c.machineType}</div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
                            c.rating >= 5
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : c.rating >= 4
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-sky-50 text-sky-800 border-sky-200"
                          }`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              c.rating >= 4 ? "fill-amber-400 text-amber-500" : "text-slate-400"
                            }`}
                          />
                          <span>Level {c.rating}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DDCE] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOperatorForModal(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#F6F1E8] border border-[#E6DDCE] text-xs font-bold text-[#221912] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
