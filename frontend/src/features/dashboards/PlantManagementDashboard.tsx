import { useState, useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveWorkbook } from "../../utils/excel";
import {
  Users,
  Download,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowUpRight,
  ArrowRight,
  LayoutGrid,
  List,
  Check,
  Copy,
  Layers,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  DashboardHeader,
  MetaChip,
  HeaderButton,
  KpiCard,
  Section,
  SectionLink,
  StatusPill,
  CountBadge,
  Meter,
  SegmentTabs,
  EmptyHint,
  Stat,
  type Tone,
} from "./DashboardUI";
import type { ForwardPlanSkillDemand } from "./forwardSkillGap";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { Operation } from "../operations/api";
import { SKILL_LEVELS, SKILL_RATINGS, clampRating, skillLevelName } from "../skill-matrix/skillScale";
import { SkillLevelIcon } from "../../components/ui/SkillLevelIcon";
import type { SewingLine } from "../lines/api";
import type { LinePlan } from "../line-balance/api";
import { computeForwardSkillGapAnalysis } from "./forwardSkillGap";
import { toLocalDateString } from "../../utils/date";

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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

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

      const roleUpper = String(op.role || "").toUpperCase();
      const isNonMachine = ["HELPER", "QC", "QUALITY_CONTROLLER", "SUPERVISOR", "LINE_SUPERVISOR"].includes(roleUpper);

      const opSkills = isNonMachine ? [] : skillMatrix.filter(
        (s) => String(s.operatorId) === String(op.id) || s.employeeId === op.employeeId
      );
      const bestSkill = [...opSkills].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))[0];

      const certifiedOperations = isNonMachine ? [] : opSkills.map((s) => ({
        id: s.id,
        operationId: s.operationId,
        operationName: s.operationName || "Sewing Operation",
        machineType: operations.find((o) => String(o.id) === String(s.operationId))?.machineType || "Single Needle Lockstitch",
        rating: Number(s.rating) || 3,
        certifiedDate: s.effectiveDate || s.createdAt || "Active",
      }));

      const isAllocated = !!assignment;
      const skillRating = isNonMachine ? null : (bestSkill ? Number(bestSkill.rating) : 3);
      const primarySkill = isNonMachine
        ? (roleUpper.includes("SUPERVISOR") ? "Floor Oversight & Target Pacing" : roleUpper.includes("QC") ? "Quality Inspection & Inline Audit" : "Material Handling & Trimming")
        : (bestSkill ? bestSkill.operationName : "General Sewing Operations");

      return {
        id: op.id,
        employeeId: op.employeeId,
        name: op.name,
        department: op.department || "Sewing Department",
        role: op.role || "OPERATOR",
        joiningDate: op.joiningDate,
        isNonMachine,
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

    // Filter machine operators for skill metrics
    const machineDeployments = allDeployments.filter((d) => !d.isNonMachine);
    const totalMachineOps = machineDeployments.length;

    const ratedMachineOps = machineDeployments.filter((d) => d.skillRating != null && d.skillRating > 0);
    const avgSkillRating =
      ratedMachineOps.length > 0
        ? Math.round((ratedMachineOps.reduce((sum, d) => sum + (d.skillRating || 0), 0) / ratedMachineOps.length) * 10) / 10
        : 0;

    const masterReservesCount = unallocatedList.filter((d) => !d.isNonMachine && d.skillRating != null && d.skillRating >= 4).length; // Expert (level 4)

    // Multi-skilling versatility ratio (% with >= 2 certified skills among machine operators)
    const multiSkilledCount = machineDeployments.filter((d) => d.certifiedOperations.length >= 2).length;
    const multiSkilledPercent = totalMachineOps > 0 ? Math.round((multiSkilledCount / totalMachineOps) * 100) : 0;

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
        const linePlansForLine = linePlans.filter((p) => String(p.lineId) === String(line.id) || p.lineCode === line.lineCode);
        const plan = linePlansForLine.find((p) => String(p.status).toLowerCase() === "active")
          || [...linePlansForLine].sort((a, b) => Number(b.id) - Number(a.id))[0]
          || null;
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
        const matchesPrimary = (op.primarySkill || "").toLowerCase() === selectedOperationFilter.toLowerCase();
        if (!matchesAssigned && !matchesSkill && !matchesPrimary) return false;
      }

      // 4. Skill Rating Filter
      if (selectedSkillRatingFilter !== "ALL") {
        if (op.isNonMachine) return false;
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
      const todayStr = toLocalDateString();
      void saveWorkbook(wb, `Plant_Workforce_Roster_${todayStr}.xlsx`);
    } catch (err) {
      console.error("Failed to export workforce roster:", err);
      alert("Failed to export roster. Please try again.");
    }
  };

  type Deployment = (typeof workforce.allDeployments)[number];

  const selectAllocation = (value: "ALL" | "SEATED" | "NON_SEATED") => {
    setAllocationFilter(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setAllocationFilter("ALL");
    setSelectedDepartmentFilter("ALL");
    setSelectedOperationFilter("ALL");
    setSelectedSkillRatingFilter("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const filtersActive =
    allocationFilter !== "ALL" ||
    selectedDepartmentFilter !== "ALL" ||
    selectedOperationFilter !== "ALL" ||
    selectedSkillRatingFilter !== "ALL" ||
    searchQuery.trim() !== "";

  const openStation = (op: Deployment) => {
    const params = new URLSearchParams();
    if (op.assignedOrderId) params.set("orderId", String(op.assignedOrderId));
    if (op.assignedLineId) params.set("lineId", String(op.assignedLineId));
    navigate(`/line-balance?${params.toString()}`);
  };

  const rangeStart = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalItems, validCurrentPage * pageSize);

  const renderRowActions = (op: Deployment) => (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setSelectedOperatorForModal(op)}
        className={SMALL_BTN_GHOST}
        title="View operator profile"
      >
        Profile
      </button>
      {op.isAllocated ? (
        <button
          type="button"
          onClick={() => openStation(op)}
          className={SMALL_BTN}
          title="Open this operator in Line Balancing"
        >
          View station
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate("/line-balance")}
          className={SMALL_BTN}
          title="Allocate this operator to an open workstation"
        >
          Deploy
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  const renderStatus = (op: Deployment) =>
    op.isAllocated ? (
      <div className="space-y-1 min-w-0">
        <StatusPill tone="good">Seated · {op.assignedLineCode}</StatusPill>
        <div className="text-[11.5px] text-[#8C7E6E] tabular-nums truncate">
          Station {op.assignedStationNum}
          {op.assignedOrderNo && ` · ${op.assignedOrderNo}`}
        </div>
      </div>
    ) : (
      <div className="space-y-1 min-w-0">
        <StatusPill tone="warn">Non-seated</StatusPill>
        <div className="text-[11.5px] text-[#8C7E6E]">Available</div>
      </div>
    );

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <DashboardHeader
        title="Plant Management"
        subtitle="Workforce deployment, line capacity and skill coverage"
        meta={
          <>
            <MetaChip tone="good">Plant floor active</MetaChip>
            <MetaChip>
              <span className="tabular-nums">{lines.length}</span> production lines
            </MetaChip>
            <MetaChip>
              <span className="tabular-nums">{workforce.totalCount}</span> active operators
            </MetaChip>
          </>
        }
        actions={
          <>
            <HeaderButton
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportRoster}
              title="Download the filtered workforce roster in Excel format"
            >
              Export roster
            </HeaderButton>
            <HeaderButton to="/skill-matrix">
              Skill matrix
            </HeaderButton>
            <HeaderButton variant="primary" to="/line-balance">
              Balance lines
            </HeaderButton>
          </>
        }
        onRefresh={onRefresh}
        refreshing={loading}
      />

      {/* ── 2. KPI row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Seated operators"
          value={workforce.seatedCount}
          progress={workforce.seatedPercent}
          caption={`${workforce.seatedPercent}% of ${workforce.totalCount} on a line`}
          onClick={() => selectAllocation("SEATED")}
        />
        <KpiCard
          label="Non-seated operators"
          value={workforce.unallocatedCount}
          progress={workforce.unallocatedPercent}
          caption={`${workforce.unallocatedPercent}% available to deploy`}
          onClick={() => selectAllocation("NON_SEATED")}
        />
        <KpiCard
          label="Multi-skilling"
          value={`${workforce.multiSkilledPercent}%`}
          progress={workforce.multiSkilledPercent}
          caption={
            <span
              className="block whitespace-normal"
              title={`${workforce.multiSkilledCount} operators certified on 2+ operations · average plant rating ${workforce.avgSkillRating > 0 ? `L${workforce.avgSkillRating} / 4` : "—"} · ${workforce.masterReservesCount} expert reserves`}
            >
              <span className="tabular-nums">{workforce.multiSkilledCount}</span> operators with 2+ skills
              <span className="block tabular-nums">
                Avg {workforce.avgSkillRating > 0 ? `L${workforce.avgSkillRating} / 4` : "—"} · {workforce.masterReservesCount} expert reserves
              </span>
            </span>
          }
        />
        <KpiCard
          label="Daily sewing capacity"
          value={totalPlantCapacityPerDay.toLocaleString()}
          unit="pcs / day"
          caption={
            <span className="block whitespace-normal">
              Order load <span className="tabular-nums">{totalOrdersPieces.toLocaleString()}</span> pcs
              <span className="block tabular-nums">Across {linesSummary.length} active lines</span>
            </span>
          }
        />
      </div>

      {/* ── 3. Sewing lines & capacity ────────────────────────────── */}
      <Section
        title="Sewing lines & capacity"
        subtitle="Status, active order and manning against the required headcount for each line"
        badge={<CountBadge>{linesSummary.length}</CountBadge>}
        actions={<SectionLink to="/line-dashboard">Open line operations</SectionLink>}
        flush
      >
        {linesSummary.length === 0 ? (
          <EmptyHint icon={<Layers />} title="No active sewing lines">
            Add sewing lines under Settings to see their capacity and manning here.
          </EmptyHint>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-[13px]">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#F0EAE0]">
                  <th className={cn(TH, "pl-5")}>Line</th>
                  <th className={TH}>Product</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Supervisor</th>
                  <th className={TH}>Active order</th>
                  <th className={cn(TH, "text-right")}>Daily capacity</th>
                  <th className={cn(TH, "pr-5 w-[230px]")}>Manning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {linesSummary.map((line) => (
                  <tr key={line.id} className="hover:bg-[#FCFAF7] transition-colors">
                    <td className={cn(TD, "pl-5")}>
                      <div className="font-semibold text-[#221912] whitespace-nowrap">{line.lineCode}</div>
                      <div className="text-[11.5px] text-[#8C7E6E] whitespace-nowrap">{line.floor}</div>
                    </td>
                    <td className={TD}>
                      <div className="text-[#221912] truncate max-w-[220px]" title={line.lineName}>
                        {productOf(line.lineName)}
                      </div>
                    </td>
                    <td className={TD}>
                      <StatusPill tone={LINE_STATUS_TONE[line.status] ?? "neutral"}>{sentenceCase(line.status)}</StatusPill>
                    </td>
                    <td className={cn(TD, "text-[#5C4D3E] whitespace-nowrap")}>{line.supervisor}</td>
                    <td className={TD}>
                      {line.hasPlan ? (
                        <>
                          <div className="font-medium text-[#221912] tabular-nums whitespace-nowrap">{line.activeOrderNo}</div>
                          <div className="text-[11.5px] text-[#8C7E6E] truncate max-w-[180px]">{line.activeStyle}</div>
                        </>
                      ) : (
                        <span className="text-[#8C7E6E]">{line.activeOrderNo}</span>
                      )}
                    </td>
                    <td className={cn(TD, "text-right whitespace-nowrap")}>
                      <span className="font-semibold text-[#221912] tabular-nums">{line.targetCapacity.toLocaleString()}</span>
                      <span className="text-[12px] text-[#8C7E6E]"> pcs/day</span>
                    </td>
                    <td className={cn(TD, "pr-5")}>
                      <div
                        className="flex items-center gap-3"
                        title={`${line.deployedOperators} of ${line.reqOperators} required operators deployed (${line.manningPercent}%)`}
                      >
                        <Meter value={line.manningPercent} className="flex-1 min-w-[70px]" />
                        <span className="text-[12.5px] whitespace-nowrap tabular-nums w-[84px] text-right">
                          <span className="font-semibold text-[#221912]">
                            {line.deployedOperators}/{line.reqOperators}
                          </span>
                          <span className="text-[#8C7E6E]"> ops</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── 4. Workforce roster ───────────────────────────────────── */}
      <Section
        title="Workforce roster"
        subtitle="Where every active operator is deployed, their current operation and skill level"
        badge={<CountBadge>{workforce.totalCount}</CountBadge>}
        actions={
          <SegmentTabs
            value={allocationFilter}
            onChange={selectAllocation}
            options={[
              { value: "ALL", label: "All", count: workforce.totalCount },
              { value: "SEATED", label: "Seated", count: workforce.seatedCount },
              { value: "NON_SEATED", label: "Non-seated", count: workforce.unallocatedCount },
            ]}
          />
        }
        flush
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#F0EAE0] bg-[#FCFAF7]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search operators"
              title="Search by name, employee ID, department, line or operation"
              aria-label="Search operators"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={cn(CONTROL, "w-full pl-8 pr-3 placeholder:text-[#B5A897]")}
            />
          </div>

          <select
            aria-label="Filter by department"
            value={selectedDepartmentFilter}
            onChange={(e) => {
              setSelectedDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(CONTROL, SELECT_W)}
          >
            <option value="ALL">All departments ({distinctDepartments.length})</option>
            {distinctDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by operation"
            value={selectedOperationFilter}
            onChange={(e) => {
              setSelectedOperationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(CONTROL, SELECT_W)}
          >
            <option value="ALL">All operations ({distinctOperations.length})</option>
            {distinctOperations.map((opName) => (
              <option key={opName} value={opName}>
                {opName}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by skill level"
            value={selectedSkillRatingFilter}
            onChange={(e) => {
              setSelectedSkillRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={cn(CONTROL, SELECT_W)}
          >
            <option value="ALL">All skill levels</option>
            {SKILL_RATINGS.map((r) => (
              <option key={r} value={String(r)}>
                Level {r} — {SKILL_LEVELS[r].name} ({SKILL_LEVELS[r].band})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <div className="inline-flex items-center rounded-lg border border-[#E6DDCE] bg-white p-0.5" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                className={cn(VIEW_BTN, viewMode === "table" ? "bg-[#F6F1E8] text-[#221912]" : "text-[#8C7E6E] hover:text-[#221912]")}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={cn(VIEW_BTN, viewMode === "grid" ? "bg-[#F6F1E8] text-[#221912]" : "text-[#8C7E6E] hover:text-[#221912]")}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className={cn(
                "h-9 px-2.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                filtersActive ? "text-[#9C5B3C] hover:bg-[#FBF5EF]" : "text-[#B5A897] hover:text-[#8C7E6E]"
              )}
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Roster body */}
        {paginatedWorkforce.length === 0 ? (
          <EmptyHint
            icon={<Users />}
            title="No operators match these filters"
            action={
              <button type="button" onClick={resetFilters} className={SMALL_BTN}>
                Reset filters
              </button>
            }
          >
            Try a different search term or clear one of the filters.
          </EmptyHint>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#F0EAE0]">
                  <th className={cn(TH, "pl-5 w-[24%]")}>Operator</th>
                  <th className={cn(TH, "w-[20%]")}>Deployment</th>
                  <th className={TH}>Operation</th>
                  <th className={cn(TH, "w-[150px]")}>Skill level</th>
                  <th className={cn(TH, "pr-5 text-right w-[190px]")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {paginatedWorkforce.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOperatorForModal(op)}
                    className="hover:bg-[#FCFAF7] transition-colors cursor-pointer group"
                  >
                    <td className={cn(TD, "pl-5")}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[12px] font-semibold text-[#7A452D] shrink-0">
                          {initials(op.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#221912] truncate group-hover:text-[#7A452D] transition-colors">{op.name}</div>
                          <div className="text-[11.5px] text-[#8C7E6E] tabular-nums truncate">
                            {op.employeeId} · {op.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>{renderStatus(op)}</td>
                    <td className={TD}>
                      <div className="min-w-0 max-w-[340px]">
                        <div className="text-[#221912] truncate" title={op.isAllocated ? op.assignedOperationName ?? "" : op.primarySkill}>
                          {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                        </div>
                        <div className="text-[11.5px] text-[#8C7E6E]">
                          {op.isAllocated ? "Current operation" : "Primary skill"}
                          {op.certifiedOperations.length > 0 && ` · ${op.certifiedOperations.length} certified`}
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <SkillTag rating={op.skillRating} nonMachine={op.isNonMachine} />
                    </td>
                    <td className={cn(TD, "pr-5")}>{renderRowActions(op)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {paginatedWorkforce.map((op) => (
              <div
                key={op.id}
                onClick={() => setSelectedOperatorForModal(op)}
                className="rounded-xl border border-[#E6DDCE] bg-white p-4 hover:border-[#D6C7B3] hover:shadow-[0_2px_8px_rgba(34,25,18,0.06)] transition-all cursor-pointer flex flex-col gap-3 min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[12px] font-semibold text-[#7A452D] shrink-0">
                      {initials(op.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#221912] truncate">{op.name}</div>
                      <div className="text-[11.5px] text-[#8C7E6E] tabular-nums">{op.employeeId}</div>
                    </div>
                  </div>
                  {op.isAllocated ? (
                    <StatusPill tone="good">Seated · {op.assignedLineCode}</StatusPill>
                  ) : (
                    <StatusPill tone="warn">Non-seated</StatusPill>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[11.5px] text-[#8C7E6E]">
                    {op.isAllocated ? "Current operation" : "Primary skill"}
                  </div>
                  <div className="text-[13px] text-[#221912] truncate" title={op.isAllocated ? op.assignedOperationName ?? "" : op.primarySkill}>
                    {op.isAllocated ? op.assignedOperationName : op.primarySkill}
                  </div>
                  {op.isAllocated && (
                    <div className="text-[11.5px] text-[#8C7E6E] tabular-nums truncate">
                      Station {op.assignedStationNum}
                      {op.assignedOrderNo && ` · ${op.assignedOrderNo}`}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F0EAE0] mt-auto">
                  <SkillTag rating={op.skillRating} nonMachine={op.isNonMachine} />
                  {renderRowActions(op)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#F0EAE0]">
            <div className="text-[12.5px] text-[#8C7E6E] tabular-nums">
              Showing <span className="font-semibold text-[#221912]">{rangeStart}–{rangeEnd}</span> of{" "}
              <span className="font-semibold text-[#221912]">{totalItems}</span> operators
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Roster pages">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn(PAGE_BTN, "text-[#5C4D3E] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed")}
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageWindow(validCurrentPage, totalPages).map((pageNum, i) =>
                  pageNum === null ? (
                    <span key={`gap-${i}`} className="w-8 text-center text-[12.5px] text-[#B5A897]">
                      …
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      aria-current={validCurrentPage === pageNum ? "page" : undefined}
                      className={cn(
                        PAGE_BTN,
                        "tabular-nums",
                        validCurrentPage === pageNum
                          ? "bg-[#9C5B3C] border-[#9C5B3C] text-white"
                          : "text-[#5C4D3E] hover:bg-[#FAF7F2]"
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(PAGE_BTN, "text-[#5C4D3E] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed")}
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </div>
        )}
      </Section>

      {/* ── 5. Forward skill-gap analysis ─────────────────────────── */}
      <Section
        title="Forward skill-gap analysis"
        subtitle={`${forwardPlan.planMonth} · operators required per machine class versus qualified operators (Independent or better)`}
        badge={
          forwardPlan.criticalShortfallCount > 0 ? (
            <StatusPill tone="critical">
              {forwardPlan.criticalShortfallCount} critical {forwardPlan.criticalShortfallCount === 1 ? "shortfall" : "shortfalls"}
            </StatusPill>
          ) : undefined
        }
        flush
      >
        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 border-b border-[#F0EAE0] divide-[#F0EAE0] xl:divide-x">
          <SummaryTile label="Orders in plan" value={forwardPlan.activeOrdersCount}>
            <span className="tabular-nums">{forwardPlan.totalPlannedPieces.toLocaleString()}</span> pcs
          </SummaryTile>
          <SummaryTile label="Operators required" value={forwardPlan.totalOperatorsRequired}>
            Across {forwardPlan.skillDemands.length} machine classes
          </SummaryTile>
          <SummaryTile label="Operators available" value={forwardPlan.totalOperatorsAvailable}>
            Active machine operators
          </SummaryTile>
          <SummaryTile label="Critical shortfalls" value={forwardPlan.criticalShortfallCount}>
            {forwardPlan.criticalShortfallCount > 0 ? (
              <StatusPill tone="critical">Action needed</StatusPill>
            ) : (
              <StatusPill tone="good">None</StatusPill>
            )}
          </SummaryTile>
          <SummaryTile
            label="Net position"
            value={forwardPlan.overallSkillGap >= 0 ? `+${forwardPlan.overallSkillGap}` : `−${Math.abs(forwardPlan.overallSkillGap)}`}
          >
            {forwardPlan.overallSkillGap >= 0 ? (
              <StatusPill tone="good">Surplus</StatusPill>
            ) : (
              <StatusPill tone="critical">Net deficit</StatusPill>
            )}
          </SummaryTile>
        </div>

        {forwardPlan.skillDemands.length === 0 ? (
          <EmptyHint icon={<TrendingUp />} title="No planned demand yet">
            Planned orders with operation bulletins will appear here with their machine-class requirements.
          </EmptyHint>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#F0EAE0]">
                  <th className={cn(TH, "pl-5 w-[30%]")}>Machine class</th>
                  <th className={cn(TH, "text-right w-[84px]")}>Required</th>
                  <th className={cn(TH, "text-right w-[84px]")}>Qualified</th>
                  <th className={cn(TH, "pl-5 w-[150px]")}>Gap</th>
                  <th className={cn(TH, "pr-5")}>Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {forwardPlan.skillDemands.map((demand) => (
                  <tr key={demand.machineClass} className="hover:bg-[#FCFAF7] transition-colors align-top">
                    <td className={cn(TD, "pl-5")}>
                      <div className="font-semibold text-[#221912]">{demand.machineClass}</div>
                      <div className="text-[11.5px] text-[#8C7E6E]">{demand.category}</div>
                    </td>
                    <td className={cn(TD, "text-right font-semibold text-[#221912] tabular-nums")}>{demand.requiredOperators}</td>
                    <td className={cn(TD, "text-right text-[#221912] tabular-nums")}>{demand.availableQualifiedOperators}</td>
                    <td className={cn(TD, "pl-5")}>
                      <StatusPill tone={GAP_TONE[demand.status]}>
                        {demand.skillGap > 0
                          ? `+${demand.skillGap} surplus`
                          : demand.skillGap < 0
                            ? `−${Math.abs(demand.skillGap)} deficit`
                            : "Balanced"}
                      </StatusPill>
                    </td>
                    <td className={cn(TD, "pr-5")}>
                      <p className="line-clamp-2 text-[12.5px] leading-snug text-[#5C4D3E] max-w-[620px]" title={demand.actionRecommendation}>
                        {demand.actionRecommendation}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── 6. Cross-training roadmap ─────────────────────────────── */}
      {forwardPlan.trainingRoadmap.length > 0 && (
        <Section
          title="Cross-training roadmap"
          subtitle="Operators recommended for cross-training to close machine-class deficits"
          badge={<CountBadge>{forwardPlan.trainingRoadmap.length}</CountBadge>}
          actions={<SectionLink to="/skill-matrix">Open skill matrix</SectionLink>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {forwardPlan.trainingRoadmap.map((cand, idx) => (
              <div key={`${cand.operatorId}-${idx}`} className="rounded-xl border border-[#E6DDCE] bg-white p-4 flex flex-col gap-3 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[12px] font-semibold text-[#7A452D] shrink-0">
                      {initials(cand.operatorName)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#221912] truncate">{cand.operatorName}</div>
                      <div className="text-[11.5px] text-[#8C7E6E] tabular-nums">{cand.employeeId}</div>
                    </div>
                  </div>
                  <StatusPill tone={cand.status === "In Training" ? "info" : "neutral"}>{sentenceCase(cand.status)}</StatusPill>
                </div>

                <dl className="rounded-lg bg-[#FAF7F2] border border-[#F0EAE0] divide-y divide-[#F0EAE0] text-[12.5px]">
                  <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 px-3 py-2">
                    <dt className="text-[11.5px] text-[#8C7E6E] pt-px">Current</dt>
                    <dd className="min-w-0">
                      <div className="font-medium text-[#221912] leading-snug">{cand.currentMachine}</div>
                      <div className="flex items-center gap-1 text-[11.5px] text-[#5C4D3E]">
                        <SkillLevelIcon rating={cand.currentRating} size={11} decorative />
                        L{cand.currentRating} {skillLevelName(cand.currentRating)}
                      </div>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 px-3 py-2">
                    <dt className="text-[11.5px] text-[#8C7E6E] pt-px inline-flex items-start gap-1">
                      <ArrowRight className="w-3 h-3 mt-0.5 text-[#B5A897]" aria-hidden />
                      Target
                    </dt>
                    <dd className="min-w-0">
                      <div className="font-medium text-[#221912] leading-snug">{cand.targetMachine}</div>
                      <div className="text-[11.5px] text-[#5C4D3E]">{cand.targetCategory}</div>
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#8C7E6E]">Estimated training time</span>
                  <span className="font-semibold text-[#221912] tabular-nums">~{cand.trainingDaysEstimate} days</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 7. Operator skill profile modal ───────────────────────── */}
      {selectedOperatorForModal && (
        <div className="fixed inset-0 z-[9999] bg-[#221912]/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedOperatorForModal.name} profile`}
          >
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-[#F0EAE0] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-full bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[14px] font-semibold text-[#7A452D] shrink-0">
                  {initials(selectedOperatorForModal.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[17px] font-bold tracking-tight text-[#221912]">{selectedOperatorForModal.name}</h3>
                    {selectedOperatorForModal.isAllocated ? (
                      <StatusPill tone="good">Seated · {selectedOperatorForModal.assignedLineCode}</StatusPill>
                    ) : (
                      <StatusPill tone="warn">Non-seated</StatusPill>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px] text-[#8C7E6E] mt-0.5">
                    <span className="font-medium text-[#5C4D3E] tabular-nums">{selectedOperatorForModal.employeeId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOperatorForModal.employeeId);
                        setCopiedEmpId(selectedOperatorForModal.employeeId);
                        setTimeout(() => setCopiedEmpId(null), 2000);
                      }}
                      className="text-[#B5A897] hover:text-[#221912] cursor-pointer"
                      title="Copy employee ID"
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
                className="w-8 h-8 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF7F2] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F0EAE0] space-y-3">
                <div className="text-[12px] font-semibold text-[#8C7E6E]">Current floor deployment</div>
                {selectedOperatorForModal.isAllocated ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Stat label="Assigned line">
                      {selectedOperatorForModal.assignedLineCode} ({selectedOperatorForModal.assignedLineName})
                    </Stat>
                    <Stat label="Station">Station {selectedOperatorForModal.assignedStationNum}</Stat>
                    <Stat label="Active operation">{selectedOperatorForModal.assignedOperationName}</Stat>
                  </div>
                ) : selectedOperatorForModal.isNonMachine ? (
                  <div className="space-y-1">
                    <div className="text-[13px] font-semibold text-[#221912]">Non-machine workforce role</div>
                    <p className="text-[12.5px] text-[#8C7E6E] leading-relaxed">
                      Provides indirect support and floor oversight. In accordance with garment manufacturing standards, non-machine workforce are not assigned to sewing machine workstations.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] font-semibold text-[#221912]">
                        {selectedOperatorForModal.unallocatedStatus || "Buffer pool"}
                      </div>
                      <p className="text-[12.5px] text-[#8C7E6E]">Available for immediate line deployment and bottleneck relief</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOperatorForModal(null);
                        navigate("/line-balance");
                      }}
                      className="h-8 px-3 rounded-lg bg-[#9C5B3C] hover:bg-[#854B30] text-white text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    >
                      Deploy to line
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-[14px] font-bold text-[#221912] flex items-center gap-2">
                    Certified skills
                    <CountBadge>{selectedOperatorForModal.certifiedOperations?.length || 0}</CountBadge>
                  </h4>
                  {!selectedOperatorForModal.isNonMachine && (
                    <Link
                      to="/skill-matrix"
                      className="text-[12.5px] font-semibold text-[#9C5B3C] hover:text-[#7A452D]"
                      onClick={() => setSelectedOperatorForModal(null)}
                    >
                      Update in skill matrix →
                    </Link>
                  )}
                </div>

                {selectedOperatorForModal.isNonMachine ? (
                  <p className="text-[12.5px] text-[#8C7E6E] p-4 bg-[#FAF7F2] rounded-xl text-center border border-[#F0EAE0]">
                    Non-machine workforce roles (inspectors, helpers, supervisors) do not operate sewing machines and have no machine skill ratings.
                  </p>
                ) : !selectedOperatorForModal.certifiedOperations || selectedOperatorForModal.certifiedOperations.length === 0 ? (
                  <p className="text-[12.5px] text-[#8C7E6E] p-4 bg-[#FAF7F2] rounded-xl text-center border border-[#F0EAE0]">
                    No individual skill assessments logged for this operator.
                  </p>
                ) : (
                  <ul className="rounded-xl border border-[#E6DDCE] divide-y divide-[#F0EAE0]">
                    {selectedOperatorForModal.certifiedOperations.map((c: any, i: number) => (
                      <li key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#221912] truncate">{c.operationName}</div>
                          <div className="text-[11.5px] text-[#8C7E6E] truncate">{c.machineType}</div>
                        </div>
                        <SkillTag rating={c.rating} nonMachine={false} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#F0EAE0] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOperatorForModal(null)}
                className="h-9 px-4 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DDCE] text-[12.5px] font-semibold text-[#221912] cursor-pointer transition-colors"
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

/* ─── Local presentation helpers ──────────────────────────────────────────────────────────────────── */

const TH = "py-2.5 px-3 text-[12px] font-semibold text-[#8C7E6E] whitespace-nowrap";
const TD = "py-3 px-3 align-middle";
const CONTROL =
  "h-9 rounded-lg border border-[#E6DDCE] bg-white text-[13px] text-[#221912] focus:outline-none focus:border-[#9C5B3C] focus:ring-2 focus:ring-[#9C5B3C]/15 transition-colors";
const SELECT_W = "w-[160px] 2xl:w-[190px] px-2.5 pr-7 cursor-pointer truncate";
const VIEW_BTN = "w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer";
const PAGE_BTN =
  "min-w-8 h-8 px-1.5 rounded-lg border border-[#E6DDCE] bg-white text-[12.5px] font-semibold flex items-center justify-center transition-colors cursor-pointer";
const SMALL_BTN =
  "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-[#E6DDCE] bg-white text-[12px] font-semibold text-[#5C4D3E] hover:bg-[#FAF7F2] hover:text-[#221912] whitespace-nowrap transition-colors cursor-pointer";
const SMALL_BTN_GHOST =
  "inline-flex items-center h-7 px-2 rounded-md text-[12px] font-semibold text-[#8C7E6E] hover:bg-[#FAF7F2] hover:text-[#221912] whitespace-nowrap transition-colors cursor-pointer";

const LINE_STATUS_TONE: Record<string, Tone> = {
  Running: "good",
  "Needs Manning": "critical",
  "No Plan": "neutral",
};

const GAP_TONE: Record<ForwardPlanSkillDemand["status"], Tone> = {
  severe_deficit: "critical",
  moderate_deficit: "warn",
  balanced: "neutral",
  surplus: "good",
};

/** "Needs Manning" → "Needs manning" */
function sentenceCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** "Line 01 - Sports bra" → "Sports bra" (falls back to the full name) */
function productOf(lineName: string | undefined): string {
  if (!lineName) return "—";
  const m = lineName.match(/^\s*line\s*[\w-]*\s*[-–—:]\s*(.+)$/i);
  return m ? m[1].trim() : lineName;
}

function initials(name: string | undefined): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Page numbers with gaps: 1 … 4 5 6 … 11 */
function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

function SkillTag({ rating, nonMachine }: { rating: number | null; nonMachine: boolean }) {
  if (nonMachine) return <span className="text-[12.5px] text-[#8C7E6E] whitespace-nowrap">Non-machine role</span>;
  if (!rating) return <span className="text-[12.5px] text-[#8C7E6E] whitespace-nowrap">Not rated</span>;
  const lvl = SKILL_LEVELS[clampRating(rating)];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12.5px] text-[#221912] whitespace-nowrap"
      title={`${skillLevelName(rating)} (${lvl.band}) — ${lvl.description}`}
    >
      <SkillLevelIcon rating={rating} size={14} decorative />
      <span className="font-semibold tabular-nums">L{rating}</span>
      <span className="text-[#5C4D3E]">{skillLevelName(rating)}</span>
    </span>
  );
}

function SummaryTile({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="px-5 py-4 min-w-0">
      <div className="text-[12px] font-semibold text-[#8C7E6E]">{label}</div>
      <div className="mt-1 text-[20px] leading-tight font-bold tracking-tight text-[#221912] tabular-nums">{value}</div>
      {children && <div className="mt-1.5 text-[12px] text-[#8C7E6E] truncate">{children}</div>}
    </div>
  );
}
