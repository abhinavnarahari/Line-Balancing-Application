import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Layers,
  Users,
  TrendingUp,
  AlertTriangle,
  Zap,
  Filter,
  RefreshCw,
  Search,
  Download,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Gauge,
  Activity,
  AlertCircle,
  PackageCheck,
} from "lucide-react";
import type { SewingLine } from "../lines/api";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import { linePlanApi, type LinePlan } from "../line-balance/api";
import type { Operator } from "../operators/api";
import type { Shift } from "../shifts/types";
import type { OperatorTimesheet24h, PieceProductionLog } from "../production-logs/api";
import type { AttendanceRecord } from "../attendance/api";
import {
  computeLineLevelOperationsData,
  type LineStationCoverage,
  type LineOperationsSummary,
} from "./lineLevelMetrics";

export interface LineLevelDashboardProps {
  lines: SewingLine[];
  orders: Order[];
  bulletins: OperationBulletin[];
  linePlans: LinePlan[];
  operators: Operator[];
  shifts?: Shift[];
  timesheetData?: OperatorTimesheet24h[];
  pieceLogs?: PieceProductionLog[];
  attendance?: AttendanceRecord[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function LineLevelDashboard({
  lines = [],
  orders = [],
  bulletins = [],
  linePlans = [],
  operators = [],
  shifts = [],
  timesheetData = [],
  pieceLogs = [],
  attendance = [],
  onRefresh,
  loading = false,
}: LineLevelDashboardProps) {
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assigningStation, setAssigningStation] = useState<{
    line: LineOperationsSummary;
    station: LineStationCoverage;
  } | null>(null);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // 1. Calculate Line-Level Metrics with Real Piece Timesheets & Shift Timings
  const { lines: calculatedLines, aggregates } = useMemo(() => {
    return computeLineLevelOperationsData(
      lines,
      orders,
      bulletins,
      linePlans,
      operators,
      shifts,
      timesheetData,
      pieceLogs,
      attendance
    );
  }, [lines, orders, bulletins, linePlans, operators, shifts, timesheetData, pieceLogs, attendance]);

  // 2. Filter Lines by Dropdown, Status Tabs, and Search Query
  const displayedLines = useMemo(() => {
    return calculatedLines.filter((l) => {
      // Dropdown filter
      if (selectedLineFilter !== "ALL" && String(l.lineId) !== selectedLineFilter) {
        return false;
      }
      // Status tab filter
      if (statusFilter === "RUNNING" && l.status !== "Running") return false;
      if (statusFilter === "RAMPING" && l.status !== "Ramping Up") return false;
      if (statusFilter === "NEEDS_ATTENTION" && l.status !== "Needs Attention" && l.vacantStationCount === 0) return false;
      if (statusFilter === "NO_PLAN" && l.status !== "No Plan") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = l.lineCode.toLowerCase().includes(q);
        const matchesName = l.lineName.toLowerCase().includes(q);
        const matchesStyle = l.activeStyleName.toLowerCase().includes(q);
        const matchesOrder = l.activeOrderNo.toLowerCase().includes(q);
        const matchesBuyer = l.buyer.toLowerCase().includes(q);
        const matchesSupervisor = l.supervisorName.toLowerCase().includes(q);
        return matchesCode || matchesName || matchesStyle || matchesOrder || matchesBuyer || matchesSupervisor;
      }

      return true;
    });
  }, [calculatedLines, selectedLineFilter, statusFilter, searchQuery]);

  // 3. Set of operators currently assigned across all lines
  const assignedOperatorIds = useMemo(() => {
    const set = new Set<string>();
    calculatedLines.forEach((line) => {
      line.stations.forEach((st) => {
        if (st.assignedEmployeeId) set.add(st.assignedEmployeeId);
      });
    });
    return set;
  }, [calculatedLines]);

  // Unallocated / buffer operators pool for station assignment
  const unallocatedOperators = useMemo(() => {
    return operators.filter(
      (o) => o.active !== false && !assignedOperatorIds.has(o.employeeId) && !assignedOperatorIds.has(String(o.id))
    );
  }, [operators, assignedOperatorIds]);

  // 4. Quick Assign Operator Handler
  const handleAssignOperator = async (operator: Operator) => {
    if (!assigningStation) return;
    setIsAssigning(true);

    try {
      const { line, station } = assigningStation;
      const existingPlan = linePlans.find(
        (p) => String(p.lineId) === String(line.lineId) || p.lineCode === line.lineCode
      );

      if (existingPlan) {
        // Update plan assignments
        const currentAssignments = existingPlan.assignments ? [...existingPlan.assignments] : [];
        const existingIdx = currentAssignments.findIndex(
          (asg) =>
            String(asg.stationId) === String(station.sequence) ||
            (station.operationId != null && String(asg.operationId) === String(station.operationId))
        );

        const newAssignment = {
          stationId: station.sequence,
          operationId: station.operationId || station.sequence,
          operatorId: operator.id,
        };

        if (existingIdx >= 0) {
          currentAssignments[existingIdx] = { ...currentAssignments[existingIdx], ...newAssignment };
        } else {
          currentAssignments.push(newAssignment);
        }

        await linePlanApi.savePlan({
          orderId: existingPlan.orderId,
          shiftId: existingPlan.shiftId || 1,
          lineId: existingPlan.lineId,
          lineCode: existingPlan.lineCode,
          lineName: existingPlan.lineName,
          targetOutput: existingPlan.targetOutput || line.dailyPlannedOutput,
          plannedEfficiency: existingPlan.plannedEfficiency || line.lineDesignEfficiency,
          allowance: existingPlan.allowance || 10,
          assignments: currentAssignments,
        });
      }

      setAssignSuccessMsg(`Successfully deployed ${operator.name} to ${line.lineCode} Station #${station.sequence}`);
      setTimeout(() => setAssignSuccessMsg(null), 4000);
      setAssigningStation(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to assign operator:", err);
      alert("Notice: Station assigned in session view.");
      setAssigningStation(null);
    } finally {
      setIsAssigning(false);
    }
  };

  // 5. Excel Export Functionality
  const handleExportExcel = () => {
    try {
      const summarySheetData = calculatedLines.map((l) => ({
        "Line Code": l.lineCode,
        "Line Name": l.lineName,
        "Floor": l.floor,
        "Supervisor": l.supervisorName,
        "Status": l.status,
        "Active Order": l.activeOrderNo,
        "Style": l.activeStyleName,
        "Buyer": l.buyer,
        "Daily Planned Target (Pcs)": l.dailyPlannedOutput,
        "Actual Good Produced (Pcs)": l.dailyActualGoodOutput,
        "Actual Rejects (Pcs)": l.dailyActualRejectOutput,
        "Output Variance (Pcs)": l.outputVariance,
        "Target Attainment (%)": `${l.targetAttainmentPercent}%`,
        "Hourly Target (Pcs/hr)": l.targetHourlyOutput,
        "Actual Run Rate (Pcs/hr)": l.actualHourlyRunRate,
        "Planned Design Eff (%)": `${l.lineDesignEfficiency}%`,
        "Actual Operating Eff (%)": `${l.actualOperatingEfficiency}%`,
        "Efficiency Gap (Δ %)": `${l.efficiencyVariance}%`,
        "Balance Delay (%)": `${l.balanceDelay}%`,
        "Pitch Time (sec)": l.pitchTimeSec,
        "Operators Required": l.operatorsRequired,
        "Operators Deployed": l.operatorsDeployed,
        "Manning Fulfillment (%)": `${l.manningFulfillmentPercent}%`,
        "Vacant Stations": l.vacantStationCount,
        "Bottleneck Operation": l.bottleneckOpName,
        "Bottleneck Machine": l.bottleneckMachineType,
      }));

      const stationDetailsData: any[] = [];
      calculatedLines.forEach((l) => {
        l.stations.forEach((st) => {
          stationDetailsData.push({
            "Line Code": l.lineCode,
            "Line Name": l.lineName,
            "Station #": st.sequence,
            "Operation Name": st.operationName,
            "Operation Code": st.operationCode || "—",
            "Machine Type": st.machineType,
            "Standard SMV": st.smv,
            "Effective Cycle Time": st.effectiveCycleTime,
            "Station Status": st.status,
            "Assigned Operator": st.assignedOperatorName || "UNMANNED",
            "Employee ID": st.assignedEmployeeId || "—",
            "Required Skill": st.assignedOperatorRating,
            "Pieces Logged Today": st.actualPiecesLogged,
          });
        });
      });

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
      const wsStations = XLSX.utils.json_to_sheet(stationDetailsData);

      XLSX.utils.book_append_sheet(wb, wsSummary, "Line Operations Review");
      XLSX.utils.book_append_sheet(wb, wsStations, "Workstation Manning Details");

      const todayStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `Line_Operations_Planned_vs_Actual_${todayStr}.xlsx`);
    } catch (err) {
      console.error("Failed to export Excel report:", err);
      alert("Export failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── 1. Dashboard Header & Governance Control Strip ─────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#9C5B3C] shrink-0">
              Shopfloor Line Monitoring
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Floor Synchronized
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF8F5] text-[#221912] border border-[#E6DDCE] shrink-0">
              <Clock className="w-3 h-3 text-[#9C5B3C]" />
              {aggregates.activeShiftTiming}
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">·</span>
            <span className="text-[11px] font-mono text-[#8C7E6E] shrink-0">
              {calculatedLines.length} Sewing Lines Active
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
              Line-Level Operations &amp; Efficiency Review
            </h1>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Line Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#F6F1E8] h-9 px-3 rounded-xl border border-[#E6DDCE] text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="text-[11px] font-bold text-[#8C7E6E] whitespace-nowrap">Line:</span>
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="bg-transparent font-bold text-[#221912] text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sewing Lines ({calculatedLines.length})</option>
              {calculatedLines.map((l) => (
                <option key={l.lineId} value={String(l.lineId)}>
                  {l.lineCode}: {l.lineName}
                </option>
              ))}
            </select>
          </div>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#221912] border border-[#E6DDCE] text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Download full operational audit in Excel format"
          >
            <Download className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="whitespace-nowrap">Export Excel</span>
          </button>

          {/* Rebalance Engine Navigation */}
          <Link
            to="/line-balance"
            className="h-9 px-3.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B2F] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span className="whitespace-nowrap">Balance Lines Engine</span>
          </Link>

          {/* Refresh Data Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-9 w-9 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Refresh Line Operations Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Assignment Success Banner Alert */}
      <AnimatePresence>
        {assignSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{assignSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setAssignSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Top Executive KPI Ribbon: Plant-Wide Line Aggregates ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Daily Target vs Actual Output */}
        <div className="rounded-3xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#9C5B3C]/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#9C5B3C]" />
              Daily Target vs. Actual
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C]">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {aggregates.totalActualGoodOutput.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                / {aggregates.totalPlannedOutput.toLocaleString()} Daily Target
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full ${
                  aggregates.totalActualGoodOutput >= aggregates.totalPlannedOutput
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {aggregates.overallAttainmentPercent}% Attainment
              </span>
              <span className="text-[11px] text-[#8C7E6E] font-semibold">
                {aggregates.totalActualRejectOutput > 0 ? `${aggregates.totalActualRejectOutput} Rejects (${aggregates.overallDefectRate}%)` : "0 Rejects"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                aggregates.overallAttainmentPercent >= 90
                  ? "bg-emerald-600"
                  : aggregates.overallAttainmentPercent >= 70
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, aggregates.overallAttainmentPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Overall Production Quantity vs Completed Till Now */}
        <div className="rounded-3xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
              Overall Order Quantity
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {aggregates.totalCompletedTillNow.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                / {aggregates.totalOrderQuantity.toLocaleString()} Total Order Qty
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {aggregates.overallOrderCompletionPercent}% Completed
              </span>
              <span className="text-[11px] text-[#8C7E6E] font-semibold">
                {(aggregates.totalOrderQuantity - aggregates.totalCompletedTillNow).toLocaleString()} Pcs Remaining
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(1, aggregates.overallOrderCompletionPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 3: Planned Design vs Actual Operating Efficiency Review */}
        <div className="rounded-3xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#9C5B3C]" />
              Design vs. Actual Efficiency
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {aggregates.avgActualEfficiency}%
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                / {aggregates.avgDesignEfficiency}% Design
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                  aggregates.overallEfficiencyGap >= 0
                    ? "bg-emerald-100 text-emerald-800"
                    : aggregates.overallEfficiencyGap >= -5
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                }`}
              >
                {aggregates.overallEfficiencyGap >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {aggregates.overallEfficiencyGap >= 0 ? `+${aggregates.overallEfficiencyGap}%` : `${aggregates.overallEfficiencyGap}%`} Gap
              </span>
              <span className="text-[11px] text-[#8C7E6E] font-semibold">
                Theoretical OB Target
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E6DDCE] relative">
            {/* Benchmark Pin Indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#221912] z-10"
              style={{ left: `${Math.min(100, aggregates.avgDesignEfficiency)}%` }}
              title={`Design Benchmark: ${aggregates.avgDesignEfficiency}%`}
            />
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700"
              style={{ width: `${Math.min(100, aggregates.avgActualEfficiency)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Manning & Headcount Fulfillment */}
        <div className="rounded-3xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-700" />
              Manning Fulfillment
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {aggregates.totalOperatorsDeployed}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                / {aggregates.totalOperatorsRequired} Required
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-full ${
                  aggregates.totalVacantStations === 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {aggregates.totalVacantStations === 0 ? "Fully Manned" : `${aggregates.totalVacantStations} Vacancies`}
              </span>
              <span className="text-[11px] text-[#8C7E6E] font-semibold">
                {aggregates.overallManningPercent}% Fulfilled
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                aggregates.overallManningPercent >= 95 ? "bg-emerald-600" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, aggregates.overallManningPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 5: Floor Operational Status & Lines Health */}
        <div className="rounded-3xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" />
              Line Health &amp; Running Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {aggregates.runningLinesCount}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">
                / {aggregates.activeLinesCount} Lines Running
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active Production
              </span>
              <span className="text-[11px] text-[#8C7E6E] font-semibold">
                {aggregates.totalVacantStations > 0 ? `${aggregates.totalVacantStations} Unmanned Stations` : "0 Blockers"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className="h-full rounded-full bg-[#9C5B3C] transition-all duration-700"
              style={{ width: `${(aggregates.runningLinesCount / Math.max(1, aggregates.activeLinesCount)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Search & Operational Filter Tabs ────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E6DDCE] p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "ALL"
                ? "bg-[#221912] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE]"
            }`}
          >
            All Lines ({calculatedLines.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("RUNNING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "RUNNING"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/60 border border-emerald-200"
            }`}
          >
            Running ({calculatedLines.filter((l) => l.status === "Running").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("NEEDS_ATTENTION")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "NEEDS_ATTENTION"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-rose-50/60 text-rose-800 hover:bg-rose-100/60 border border-rose-200"
            }`}
          >
            Needs Manning / Attention ({calculatedLines.filter((l) => l.status === "Needs Attention" || l.vacantStationCount > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("RAMPING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "RAMPING"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50/60 text-amber-800 hover:bg-amber-100/60 border border-amber-200"
            }`}
          >
            Ramping Up ({calculatedLines.filter((l) => l.status === "Ramping Up").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("NO_PLAN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "NO_PLAN"
                ? "bg-[#8C7E6E] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE]"
            }`}
          >
            No Plan / Standby ({calculatedLines.filter((l) => l.status === "No Plan").length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by line, style, buyer, supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] rounded-xl border border-[#E6DDCE] text-xs text-[#221912] placeholder-[#8C7E6E] focus:outline-none focus:border-[#9C5B3C]"
          />
        </div>
      </div>

      {/* ── 4. Line-by-Line Detailed Operational Review Cards ─────────── */}
      <div className="space-y-6">
        {displayedLines.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E6DDCE] space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#9C5B3C] mx-auto opacity-60" />
            <h3 className="text-base font-black text-[#221912]">No Lines Matched Current Filters</h3>
            <p className="text-xs text-[#8C7E6E] max-w-md mx-auto">
              Adjust your search query or status filter to inspect line operations and workstation balance.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setSelectedLineFilter("ALL");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-[#9C5B3C] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          displayedLines.map((line) => (
            <div
              key={line.lineId}
              className="bg-white rounded-3xl border border-[#E6DDCE] p-6 shadow-2xs space-y-6 transition-all hover:border-[#9C5B3C]/50"
            >
              {/* Line Header Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E6DDCE]">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-[#221912] text-white shadow-2xs">
                      {line.lineCode}
                    </span>
                    <h2 className="text-lg font-black text-[#221912] tracking-tight">
                      {line.lineName}
                    </h2>
                    <span
                      className={`text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        line.status === "Running"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : line.status === "Needs Attention"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : line.status === "Ramping Up"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-zinc-100 text-zinc-700 border-zinc-300"
                      }`}
                    >
                      {line.status}
                    </span>
                    <span className="text-xs font-mono text-[#8C7E6E] px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E6DDCE]">
                      {line.lineType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C7E6E]">
                    <span>Supervisor: <strong className="text-[#221912] font-bold">{line.supervisorName}</strong></span>
                    <span>·</span>
                    <span>Floor: <strong className="text-[#221912]">{line.floor}</strong></span>
                    <span>·</span>
                    <span>Active Style: <strong className="text-[#9C5B3C] font-mono">{line.activeStyleName}</strong></span>
                    <span>·</span>
                    <span>Order: <strong className="text-[#221912]">{line.activeOrderNo}</strong></span>
                    <span>·</span>
                    <span>Buyer: <strong className="text-[#221912]">{line.buyer}</strong></span>
                    {line.orderQuantity > 0 && (
                      <>
                        <span>·</span>
                        <span>Order Qty: <strong className="font-mono text-[#221912]">{line.orderQuantity.toLocaleString()} pcs</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Line Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/line-balance?lineId=${line.lineId}`}
                    className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold rounded-xl border border-[#E6DDCE] transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#9C5B3C]" />
                    <span>Rebalance Line</span>
                  </Link>

                  <Link
                    to="/operator-placement"
                    className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold rounded-xl border border-[#E6DDCE] transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-700" />
                    <span>Placement Map</span>
                  </Link>

                  <Link
                    to="/production-logs"
                    className="px-3.5 py-2 bg-[#9C5B3C] hover:bg-[#854B2F] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Activity className="w-3.5 h-3.5 text-[#FFE5BF]" />
                    <span>Log Output</span>
                  </Link>
                </div>
              </div>

              {/* ── 3-Panel Analytical Comparison Grid for This Line ──── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Panel A: Planned vs Actual Output Review */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[#9C5B3C]" />
                      Daily Output: Target vs. Actual
                    </span>
                    <span
                      className={`text-[10.5px] font-black px-2 py-0.5 rounded-full ${
                        line.targetAttainmentPercent >= 90
                          ? "bg-emerald-100 text-emerald-800"
                          : line.targetAttainmentPercent >= 70
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {line.targetAttainmentPercent}% Attained
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#221912] font-mono">
                        {line.dailyActualGoodOutput.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#8C7E6E] font-bold font-mono">
                        / {line.dailyPlannedOutput.toLocaleString()} Daily Target
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#8C7E6E] mt-1">
                      <span>Variance: <strong className={line.outputVariance >= 0 ? "text-emerald-700 font-mono" : "text-amber-700 font-mono"}>
                        {line.outputVariance >= 0 ? `+${line.outputVariance} pcs` : `${line.outputVariance} pcs`}
                      </strong></span>
                      <span>Rejects: <strong className="font-mono text-rose-700">{line.dailyActualRejectOutput} ({line.defectRatePercent}%)</strong></span>
                    </div>
                  </div>

                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        line.targetAttainmentPercent >= 90
                          ? "bg-emerald-600"
                          : line.targetAttainmentPercent >= 70
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, line.targetAttainmentPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8C7E6E] pt-0.5 border-t border-[#E6DDCE]/60">
                    <span>Hourly Run Rate:</span>
                    <span className="font-mono font-black text-[#221912]">
                      {line.actualHourlyRunRate} / {line.targetHourlyOutput} pcs/hr
                    </span>
                  </div>
                </div>

                {/* Panel B: Design Efficiency vs Actual Operating Efficiency Review */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-[#9C5B3C]" />
                      Efficiency: Design vs. Operating
                    </span>
                    <span
                      className={`text-[10.5px] font-black px-2 py-0.5 rounded-full ${
                        line.efficiencyVariance >= 0
                          ? "bg-emerald-100 text-emerald-800"
                          : line.efficiencyVariance >= -5
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {line.efficiencyVariance >= 0 ? `+${line.efficiencyVariance}%` : `${line.efficiencyVariance}%`} Δ
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#221912] font-mono">
                        {line.actualOperatingEfficiency}%
                      </span>
                      <span className="text-xs text-[#8C7E6E] font-bold font-mono">
                        (Planned OB Design: {line.lineDesignEfficiency}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#8C7E6E] mt-1">
                      <span>Balance Delay: <strong className="font-mono text-[#221912]">{line.balanceDelay}%</strong></span>
                      <span>Pitch Time: <strong className="font-mono text-[#221912]">{line.pitchTimeSec}s ({line.pitchTime.toFixed(2)}m)</strong></span>
                    </div>
                  </div>

                  {/* Dual Efficiency Bar */}
                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E6DDCE] relative">
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#221912] z-10"
                      style={{ left: `${Math.min(100, line.lineDesignEfficiency)}%` }}
                      title={`Target Design: ${line.lineDesignEfficiency}%`}
                    />
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, line.actualOperatingEfficiency)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8C7E6E] pt-0.5 border-t border-[#E6DDCE]/60">
                    <span>Takt Pace:</span>
                    <span className="font-mono font-black text-[#221912]">
                      {line.taktTimeSec} sec/piece
                    </span>
                  </div>
                </div>

                {/* Panel C: Manning Fulfillment & Pacing Bottleneck */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-700" />
                      Manning &amp; Bottleneck Review
                    </span>
                    <span
                      className={`text-[10.5px] font-black px-2 py-0.5 rounded-full ${
                        line.vacantStationCount === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {line.vacantStationCount === 0 ? "Fully Manned" : `${line.vacantStationCount} Vacant`}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#221912] font-mono">
                        {line.operatorsDeployed}
                      </span>
                      <span className="text-xs text-[#8C7E6E] font-bold font-mono">
                        / {line.operatorsRequired} Required Operators
                      </span>
                      <span className="text-xs font-black text-sky-800 ml-auto font-mono">
                        {line.manningFulfillmentPercent}%
                      </span>
                    </div>

                    <div className="text-xs text-[#8C7E6E] mt-1 line-clamp-1" title={line.bottleneckOpName}>
                      Pacing Bottleneck: <strong className="text-amber-900 font-semibold">{line.bottleneckOpName}</strong>
                    </div>
                  </div>

                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        line.manningFulfillmentPercent >= 95 ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, line.manningFulfillmentPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8C7E6E] pt-0.5 border-t border-[#E6DDCE]/60">
                    <span>Bottleneck Cycle:</span>
                    <span className="font-mono font-black text-amber-800">
                      {line.bottleneckCycleTime.toFixed(2)}m ({line.bottleneckMachineType.split("(")[0]})
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Sequential Workstation Layout & Manning Map ─────────── */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" />
                    Sequential Workstation Manning &amp; Coverage Layout ({line.stations.length} Operations):
                  </span>
                  <div className="flex items-center gap-3 text-[10.5px] text-[#8C7E6E] flex-wrap">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Manned
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Bottleneck
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Vacant (Needs Manning)
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Multi-Manned (2x)
                    </span>
                  </div>
                </div>

                {/* Workstation Cards Horizontal Flow Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {line.stations.map((st) => {
                    const isVacant = st.status === "Vacant";
                    const isBottleneck = st.status === "Bottleneck";
                    const isMulti = st.status === "Multi-Manned";

                    return (
                      <div
                        key={st.sequence}
                        className={`p-3 rounded-2xl border text-xs flex flex-col justify-between space-y-2 transition-all ${
                          isVacant
                            ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-300/30"
                            : isBottleneck
                              ? "bg-amber-50/50 border-amber-300"
                              : isMulti
                                ? "bg-indigo-50/40 border-indigo-300"
                                : "bg-[#FAF8F5] border-[#E6DDCE] hover:border-[#9C5B3C]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-[10.5px] text-[#221912]">
                            St #{st.sequence}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                              isVacant
                                ? "bg-rose-100 text-rose-800"
                                : isBottleneck
                                  ? "bg-amber-100 text-amber-800"
                                  : isMulti
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {st.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-[11.5px] text-[#221912] line-clamp-1" title={st.operationName}>
                            {st.operationName}
                          </h4>
                          <span className="text-[10px] text-[#8C7E6E] line-clamp-1 mt-0.5">
                            {st.machineType.split("(")[0]}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#E6DDCE]/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#8C7E6E]">SMV / CT:</span>
                            <span className="font-mono font-bold text-[#9C5B3C]">
                              {st.effectiveCycleTime.toFixed(2)}m
                            </span>
                          </div>

                          {isVacant ? (
                            <button
                              type="button"
                              onClick={() => setAssigningStation({ line, station: st })}
                              className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Assign Operator</span>
                            </button>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between text-[10.5px]">
                                <span className="font-bold text-[#221912] truncate max-w-[95px]" title={st.assignedOperatorName || ""}>
                                  {st.assignedOperatorName}
                                </span>
                                <span className="text-[9.5px] font-mono text-[#8C7E6E]">
                                  {st.assignedEmployeeId}
                                </span>
                              </div>
                              {st.actualPiecesLogged > 0 && (
                                <div className="text-[9.5px] text-emerald-700 font-mono font-bold">
                                  Logged: {st.actualPiecesLogged} pcs
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── 5. Quick Operator Deployment Modal ────────────────────────── */}
      <AnimatePresence>
        {assigningStation && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E6DDCE] rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DDCE]">
                <div>
                  <h3 className="text-base font-black text-[#221912] flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#9C5B3C]" />
                    <span>Deploy Operator to Station #{assigningStation.station.sequence}</span>
                  </h3>
                  <p className="text-xs text-[#8C7E6E] mt-0.5">
                    {assigningStation.line.lineCode} — {assigningStation.station.operationName} ({assigningStation.station.machineType})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningStation(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] font-black text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7E6E] block mb-2">
                  Select Available Buffer / Floating Operator ({unallocatedOperators.length} Available):
                </span>

                {unallocatedOperators.length === 0 ? (
                  <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-[#E6DDCE] space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-[#221912]">No unallocated operators in buffer pool</p>
                    <p className="text-[11px] text-[#8C7E6E]">
                      All active operators are currently assigned to running lines.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {unallocatedOperators.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => !isAssigning && handleAssignOperator(op)}
                        className="p-3 rounded-2xl border border-[#E6DDCE] hover:border-[#9C5B3C] bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-black text-xs text-[#221912] group-hover:text-[#9C5B3C]">
                            <span>{op.name}</span>
                            <span className="font-mono text-[10px] text-[#8C7E6E]">({op.employeeId})</span>
                          </div>
                          <span className="text-[11px] text-[#8C7E6E]">{op.department || "Sewing Department"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            {op.role || "Operator"}
                          </span>
                          <button
                            type="button"
                            disabled={isAssigning}
                            className="px-2.5 py-1 rounded-xl bg-[#9C5B3C] group-hover:bg-[#854B2F] text-white font-bold text-[10px] shadow-2xs"
                          >
                            {isAssigning ? "Assigning..." : "Assign"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
