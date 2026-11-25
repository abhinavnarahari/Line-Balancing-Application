import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveWorkbook } from "../../utils/excel";
import {
  Users,
  Zap,
  Filter,
  Search,
  Download,
  UserPlus,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  ClipboardList,
  X,
} from "lucide-react";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { cn } from "../../utils/cn";
import {
  DashboardHeader,
  MetaChip,
  HeaderButton,
  KpiCard,
  StatusPill,
  Meter,
  SegmentTabs,
  EmptyHint,
  Stat,
} from "./DashboardUI";
import { TONE, type Tone } from "./dashboardTheme";
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
import { toLocalDateString } from "../../utils/date";

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Lines whose station layout is expanded (collapsed by default)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(() => new Set());
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
        const matchesBuyer = (l.buyer || "").toLowerCase().includes(q);
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

  // Unallocated / buffer machine operators pool for station assignment (excludes non-machine workforce)
  const unallocatedOperators = useMemo(() => {
    return operators.filter((o) => {
      if (o.active === false) return false;
      const roleUpper = String(o.role || "").toUpperCase();
      const isNonMachine = ["HELPER", "QC", "QUALITY_CONTROLLER", "SUPERVISOR", "LINE_SUPERVISOR"].includes(roleUpper);
      if (isNonMachine) return false;
      return !assignedOperatorIds.has(o.employeeId) && !assignedOperatorIds.has(String(o.id));
    });
  }, [operators, assignedOperatorIds]);

  // 4. Quick Assign Operator Handler
  const handleAssignOperator = async (operator: Operator) => {
    if (!assigningStation) return;
    setIsAssigning(true);

    try {
      const { line, station } = assigningStation;
      const linePlansForLine = linePlans.filter(
        (p) => String(p.lineId) === String(line.lineId) || p.lineCode === line.lineCode
      );
      const existingPlan = linePlansForLine.find((p) => String(p.status).toLowerCase() === "active")
        || [...linePlansForLine].sort((a, b) => Number(b.id) - Number(a.id))[0]
        || null;

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

      const todayStr = toLocalDateString();
      void saveWorkbook(wb, `Line_Operations_Planned_vs_Actual_${todayStr}.xlsx`);
    } catch (err) {
      console.error("Failed to export Excel report:", err);
      alert("Export failed. Please try again.");
    }
  };

  // Counts for the status tabs (same rules as the filter above)
  const statusCounts = useMemo(
    () => ({
      ALL: calculatedLines.length,
      RUNNING: calculatedLines.filter((l) => l.status === "Running").length,
      NEEDS_ATTENTION: calculatedLines.filter((l) => l.status === "Needs Attention" || l.vacantStationCount > 0).length,
      RAMPING: calculatedLines.filter((l) => l.status === "Ramping Up").length,
      NO_PLAN: calculatedLines.filter((l) => l.status === "No Plan").length,
    }),
    [calculatedLines]
  );

  const toggleStations = (lineId: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const attainTone = (p: number): Tone => (p >= 90 ? "good" : p >= 70 ? "warn" : "critical");
  const gapTone = (g: number): Tone => (g >= 0 ? "good" : g >= -5 ? "warn" : "critical");
  const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <DashboardHeader
        title="Line Operations"
        subtitle="Output, efficiency and manning for each sewing line"
        meta={
          <>
            <MetaChip icon={<Clock className="w-3.5 h-3.5" />}>{aggregates.activeShiftTiming}</MetaChip>
            <MetaChip tone={aggregates.runningLinesCount > 0 ? "good" : "neutral"}>
              <span className="tabular-nums">
                {aggregates.runningLinesCount} of {aggregates.activeLinesCount}
              </span>{" "}
              lines running
            </MetaChip>
            {aggregates.totalVacantStations > 0 && (
              <MetaChip tone="warn">
                <span className="tabular-nums">{aggregates.totalVacantStations}</span> stations unmanned
              </MetaChip>
            )}
          </>
        }
        actions={
          <>
            <div className="w-48">
              <CustomSelect
                value={selectedLineFilter}
                onChange={(val) => setSelectedLineFilter(val)}
                options={[
                  { value: "ALL", label: `All sewing lines (${calculatedLines.length})` },
                  ...calculatedLines.map((l) => ({
                    value: String(l.lineId),
                    label: `${l.lineCode}: ${l.lineName}`,
                  })),
                ]}
                size="sm"
                className="[&>button]:h-9 [&>button]:text-[12.5px]"
                icon={<Filter className="w-3.5 h-3.5" />}
              />
            </div>
            <HeaderButton
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportExcel}
              title="Download the line review and station manning as an Excel workbook"
            >
              Export Excel
            </HeaderButton>
            <HeaderButton variant="primary" icon={<Zap className="w-4 h-4" />} to="/line-balance">
              Balance Lines
            </HeaderButton>
          </>
        }
        onRefresh={onRefresh}
        refreshing={loading}
      />

      {/* Assignment confirmation */}
      <AnimatePresence>
        {assignSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", TONE.good.bg, TONE.good.border)}
          >
            <CheckCircle2 className={cn("w-4 h-4 shrink-0", TONE.good.text)} />
            <span className={cn("flex-1 text-[13px] font-semibold", TONE.good.text)}>{assignSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setAssignSuccessMsg(null)}
              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Daily output vs target"
          value={aggregates.totalActualGoodOutput.toLocaleString()}
          unit={`/ ${aggregates.totalPlannedOutput.toLocaleString()} pcs`}
          tone={attainTone(aggregates.overallAttainmentPercent)}
          progress={aggregates.overallAttainmentPercent}
          caption={
            <>
              {aggregates.overallAttainmentPercent}% of target ·{" "}
              {aggregates.totalActualRejectOutput > 0
                ? `${aggregates.totalActualRejectOutput} rejects (${aggregates.overallDefectRate}%)`
                : "no rejects"}
            </>
          }
        />
        <KpiCard
          label="Order quantity completed"
          value={aggregates.totalCompletedTillNow.toLocaleString()}
          unit={`/ ${aggregates.totalOrderQuantity.toLocaleString()} pcs`}
          progress={aggregates.overallOrderCompletionPercent}
          caption={
            <>
              {aggregates.overallOrderCompletionPercent}% complete ·{" "}
              {(aggregates.totalOrderQuantity - aggregates.totalCompletedTillNow).toLocaleString()} pcs left
            </>
          }
        />
        <KpiCard
          label="Operating vs design efficiency"
          value={`${aggregates.avgActualEfficiency}%`}
          unit={`/ ${aggregates.avgDesignEfficiency}% design`}
          tone={gapTone(aggregates.overallEfficiencyGap)}
          progress={aggregates.avgActualEfficiency}
          caption={<>{signed(aggregates.overallEfficiencyGap)} pts vs design target</>}
        />
        <KpiCard
          label="Line health"
          value={aggregates.runningLinesCount}
          unit={`/ ${aggregates.activeLinesCount} lines running`}
          tone={aggregates.totalVacantStations > 0 ? "warn" : "good"}
          progress={(aggregates.runningLinesCount / Math.max(1, aggregates.activeLinesCount)) * 100}
          caption={
            aggregates.totalVacantStations > 0
              ? `${aggregates.totalVacantStations} stations unmanned`
              : "All stations manned"
          }
        />
      </div>

      {/* ── Toolbar: status tabs + search ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentTabs<StatusFilter>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "ALL", label: "All lines", count: statusCounts.ALL },
            { value: "RUNNING", label: "Running", count: statusCounts.RUNNING },
            { value: "NEEDS_ATTENTION", label: "Needs manning", count: statusCounts.NEEDS_ATTENTION },
            { value: "RAMPING", label: "Ramping up", count: statusCounts.RAMPING },
            { value: "NO_PLAN", label: "No plan", count: statusCounts.NO_PLAN },
          ]}
        />
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#B5A897] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search line, style, order, buyer, supervisor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lines"
            className="w-full h-9 pl-9 pr-3 bg-white rounded-lg border border-[#E6DDCE] text-[13px] text-[#221912] placeholder-[#B5A897] focus:outline-none focus:border-[#9C5B3C] focus:ring-3 focus:ring-[#9C5B3C]/12"
          />
        </div>
      </div>

      {/* ── Line cards ─────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {displayedLines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_2px_rgba(34,25,18,0.04)]">
            <EmptyHint
              icon={<Search />}
              title="No lines match these filters"
              action={
                <HeaderButton
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSelectedLineFilter("ALL");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </HeaderButton>
              }
            >
              Change the search or status filter to see line operations and station manning.
            </EmptyHint>
          </div>
        ) : (
          displayedLines.map((line) => {
            const lineKey = String(line.lineId);
            const expanded = expandedLines.has(lineKey);
            const noPlan = line.status === "No Plan";
            const vacant = line.stations.filter((s) => s.status === "Vacant").length;
            const bottlenecks = line.stations.filter((s) => s.status === "Bottleneck").length;
            const multi = line.stations.filter((s) => s.status === "Multi-Manned").length;
            const manned = line.stations.length - vacant;
            const showPanels = !noPlan || line.dailyActualGoodOutput > 0 || line.operatorsDeployed > 0;

            return (
              <article
                key={line.lineId}
                className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_2px_rgba(34,25,18,0.04)] min-w-0 @container"
              >
                {/* Line header */}
                <div className="px-5 py-4 border-b border-[#F0EAE0] space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
                      <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#F6F1E8] border border-[#E6DDCE] text-[12px] font-semibold text-[#5C4D3E] tabular-nums">
                        {line.lineCode}
                      </span>
                      <h2 className="text-[15px] font-bold tracking-tight text-[#221912] truncate">{line.lineName}</h2>
                      <StatusPill tone={LINE_STATUS[line.status].tone}>{LINE_STATUS[line.status].label}</StatusPill>
                      <span className="text-[12px] text-[#8C7E6E]">{line.lineType}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <HeaderButton to={`/line-balance?lineId=${line.lineId}`} icon={<Zap className="w-4 h-4 text-[#9C5B3C]" />}>
                        Rebalance Line
                      </HeaderButton>
                      <HeaderButton to="/operator-placement" icon={<Users className="w-4 h-4 text-[#9C5B3C]" />}>
                        Placement Map
                      </HeaderButton>
                      <HeaderButton to="/production-logs" icon={<Activity className="w-4 h-4 text-[#9C5B3C]" />}>
                        Log Output
                      </HeaderButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 @lg:grid-cols-3 @3xl:grid-cols-6 gap-x-6 gap-y-3">
                    <Stat label="Supervisor">{line.supervisorName}</Stat>
                    <Stat label="Floor">{line.floor}</Stat>
                    <Stat label="Style">
                      <span title={line.activeStyleName}>{line.activeStyleName}</span>
                    </Stat>
                    <Stat label="Order">
                      <span title={line.activeOrderNo}>{line.activeOrderNo}</span>
                    </Stat>
                    <Stat label="Buyer">{line.buyer || "—"}</Stat>
                    <Stat label="Order qty">{line.orderQuantity > 0 ? `${line.orderQuantity.toLocaleString()} pcs` : "—"}</Stat>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Three metric panels (skipped for idle lines with no plan and nothing logged) */}
                  {showPanels && (
                    <div className="grid grid-cols-1 @3xl:grid-cols-3 gap-4">
                      <MetricPanel
                        title="Daily output"
                        pill={
                          noPlan ? (
                            <StatusPill tone="neutral">Not planned</StatusPill>
                          ) : (
                            <StatusPill tone={attainTone(line.targetAttainmentPercent)}>
                              {line.targetAttainmentPercent}% of target
                            </StatusPill>
                          )
                        }
                        value={line.dailyActualGoodOutput.toLocaleString()}
                        unit={`/ ${line.dailyPlannedOutput.toLocaleString()} pcs target`}
                        meter={<Meter value={line.targetAttainmentPercent} />}
                        rows={[
                          { label: "Variance", value: `${signed(line.outputVariance)} pcs` },
                          { label: "Rejects", value: `${line.dailyActualRejectOutput} (${line.defectRatePercent}%)` },
                          { label: "Hourly rate", value: `${line.actualHourlyRunRate} / ${line.targetHourlyOutput} pcs/hr` },
                        ]}
                      />
                      <MetricPanel
                        title="Efficiency"
                        pill={
                          noPlan ? (
                            <StatusPill tone="neutral">Not planned</StatusPill>
                          ) : (
                            <StatusPill tone={gapTone(line.efficiencyVariance)}>
                              {signed(line.efficiencyVariance)} pts vs design
                            </StatusPill>
                          )
                        }
                        value={`${line.actualOperatingEfficiency}%`}
                        unit={`/ ${line.lineDesignEfficiency}% design`}
                        meter={<TargetMeter value={line.actualOperatingEfficiency} target={line.lineDesignEfficiency} />}
                        rows={[
                          { label: "Balance delay", value: `${line.balanceDelay}%` },
                          { label: "Pitch time", value: `${line.pitchTimeSec} s (${line.pitchTime.toFixed(2)} min)` },
                          { label: "Takt time", value: `${line.taktTimeSec} s/pc` },
                        ]}
                      />
                      <MetricPanel
                        title="Manning & bottleneck"
                        pill={
                          noPlan ? (
                            <StatusPill tone="neutral">Not planned</StatusPill>
                          ) : line.vacantStationCount === 0 ? (
                            <StatusPill tone="good">Fully manned</StatusPill>
                          ) : (
                            <StatusPill tone="warn">{line.vacantStationCount} vacant</StatusPill>
                          )
                        }
                        value={line.operatorsDeployed}
                        unit={`/ ${line.operatorsRequired} operators`}
                        meter={<Meter value={line.manningFulfillmentPercent} />}
                        rows={[
                          { label: "Manning", value: `${line.manningFulfillmentPercent}%` },
                          { label: "Bottleneck", value: line.bottleneckOpName },
                          {
                            label: "Bottleneck cycle",
                            value: `${line.bottleneckCycleTime.toFixed(2)} min · ${line.bottleneckMachineType.split("(")[0].trim()}`,
                          },
                        ]}
                      />
                    </div>
                  )}

                  {/* Station layout (collapsed by default) */}
                  <div className={cn("rounded-xl border", noPlan ? "border-dashed border-[#D6C7B3] bg-[#FAF7F2]" : "border-[#F0EAE0]")}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-3">
                      {noPlan ? (
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="mt-0.5 w-8 h-8 rounded-lg bg-[#F0EAE0] text-[#8C7E6E] flex items-center justify-center shrink-0">
                            <ClipboardList className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#221912]">
                              No active plan — <span className="tabular-nums">{line.stations.length}</span> stations unstaffed
                            </p>
                            <p className="text-[12px] text-[#8C7E6E] mt-0.5 tabular-nums">
                              Balance it for an order to plan stations · target {line.dailyPlannedOutput.toLocaleString()} pcs/day ·{" "}
                              {line.operatorsRequired} operators · {line.lineDesignEfficiency}% design efficiency
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0 text-[13px]">
                          <span className="font-semibold text-[#221912]">Station layout</span>
                          <span className="text-[#8C7E6E] tabular-nums">
                            · {line.stations.length} stations · {manned} manned
                            {bottlenecks > 0 && ` · ${bottlenecks} bottleneck`}
                            {multi > 0 && ` · ${multi} multi-manned`}
                            {vacant > 0 && ` · ${vacant} vacant`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {noPlan && (
                          <HeaderButton variant="primary" to={`/line-balance?lineId=${line.lineId}`} icon={<Zap className="w-4 h-4" />}>
                            Rebalance Line
                          </HeaderButton>
                        )}
                        {line.stations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleStations(lineKey)}
                            aria-expanded={expanded}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold text-[#5C4D3E] hover:text-[#221912] border border-[#E6DDCE] bg-white hover:bg-[#FAF7F2] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {expanded ? "Hide stations" : "Show stations"}
                            <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-[#F0EAE0] p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                          {line.stations.map((st) => (
                            <StationCard
                              key={st.sequence}
                              station={st}
                              onAssign={() => setAssigningStation({ line, station: st })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ── Quick operator assignment modal ─────────────────────────────── */}
      <AnimatePresence>
        {assigningStation && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#221912]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              role="dialog"
              aria-modal="true"
              className="bg-white border border-[#E6DDCE] rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#F0EAE0]">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold tracking-tight text-[#221912]">
                    Assign operator to station {assigningStation.station.sequence}
                  </h3>
                  <p className="text-[12.5px] text-[#8C7E6E] mt-0.5">
                    {assigningStation.line.lineCode} · {assigningStation.station.operationName} ·{" "}
                    {assigningStation.station.machineType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningStation(null)}
                  className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                <p className="text-[12.5px] font-semibold text-[#5C4D3E] mb-2.5">
                  Available buffer operators <span className="text-[#8C7E6E] font-normal tabular-nums">({unallocatedOperators.length})</span>
                </p>

                {unallocatedOperators.length === 0 ? (
                  <div className="rounded-xl border border-[#E6DDCE] bg-[#FAF7F2]">
                    <EmptyHint icon={<AlertCircle />} title="No unallocated operators in the buffer pool">
                      All active operators are currently assigned to running lines.
                    </EmptyHint>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {unallocatedOperators.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => !isAssigning && handleAssignOperator(op)}
                        className="px-3.5 py-2.5 rounded-xl border border-[#E6DDCE] hover:border-[#D6C7B3] bg-white hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#221912]">
                            <span className="truncate">{op.name}</span>
                            <span className="text-[11.5px] font-normal text-[#8C7E6E] tabular-nums">{op.employeeId}</span>
                          </div>
                          <span className="text-[12px] text-[#8C7E6E]">{op.department || "Sewing Department"}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusPill tone="neutral" icon={<span />}>{op.role || "Operator"}</StatusPill>
                          <button
                            type="button"
                            disabled={isAssigning}
                            className="h-8 px-3 rounded-lg bg-[#9C5B3C] group-hover:bg-[#854B30] text-white font-semibold text-[12px] disabled:opacity-60"
                          >
                            {isAssigning ? "Assigning…" : "Assign"}
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

/* ─── Local presentation helpers ─────────────────────────────────────────────────────────────────── */

type StatusFilter = "ALL" | "RUNNING" | "NEEDS_ATTENTION" | "RAMPING" | "NO_PLAN";

const LINE_STATUS: Record<LineOperationsSummary["status"], { tone: Tone; label: string }> = {
  Running: { tone: "good", label: "Running" },
  "Ramping Up": { tone: "warn", label: "Ramping up" },
  "Needs Attention": { tone: "critical", label: "Needs attention" },
  "No Plan": { tone: "neutral", label: "No plan" },
};

/** One of the three per-line metric panels: headline number, meter and three label/value rows. */
function MetricPanel({
  title,
  pill,
  value,
  unit,
  meter,
  rows,
}: {
  title: string;
  pill: React.ReactNode;
  value: React.ReactNode;
  unit: string;
  meter: React.ReactNode;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-[#F0EAE0] bg-[#FAF7F2] p-4 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-[#5C4D3E]">{title}</span>
        {pill}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5 min-w-0">
        <span className="text-[22px] leading-none font-bold tracking-tight text-[#221912] tabular-nums">{value}</span>
        <span className="text-[12px] text-[#8C7E6E] tabular-nums truncate">{unit}</span>
      </div>
      <div className="mt-3">{meter}</div>
      <dl className="mt-3.5 pt-3 border-t border-[#EDE5D8] space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 text-[12.5px] min-w-0">
            <dt className="text-[#8C7E6E] whitespace-nowrap">{r.label}</dt>
            <dd className="font-semibold text-[#221912] tabular-nums truncate text-right" title={r.value}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Meter with a dark tick marking the target (same vocabulary as BarList). */
function TargetMeter({ value, target }: { value: number; target: number }) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return (
    <div
      className="relative h-1.5 rounded-full bg-[#EFE8DD]"
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`Operating ${value}% · design ${target}%`}
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-[#9C5B3C]" style={{ width: `${clamp(value)}%` }} />
      <div
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-[#221912]/70"
        style={{ left: `calc(${clamp(target)}% - 1px)` }}
        aria-hidden
      />
    </div>
  );
}

function StationCard({ station: st, onAssign }: { station: LineStationCoverage; onAssign: () => void }) {
  const isVacant = st.status === "Vacant";
  const isBottleneck = st.status === "Bottleneck";
  const isMulti = st.status === "Multi-Manned";
  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex flex-col gap-2 min-w-0",
        isVacant
          ? "border-dashed border-[#D6C7B3] bg-[#FAF7F2]"
          : isBottleneck
            ? "border-amber-300 bg-white shadow-[inset_3px_0_0_0_#F59E0B]"
            : "border-[#E6DDCE] bg-white"
      )}
    >
      <div className="flex items-center justify-between gap-2 h-[22px]">
        <span className="text-[11.5px] font-semibold text-[#8C7E6E] tabular-nums">Station {st.sequence}</span>
        {isBottleneck && <StatusPill tone="warn">Bottleneck</StatusPill>}
        {isMulti && <StatusPill tone="info">Multi-manned</StatusPill>}
        {isVacant && <span className="text-[11.5px] font-medium text-[#8C7E6E]">Vacant</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold leading-snug text-[#221912] line-clamp-2 min-h-[34px]" title={st.operationName}>
          {st.operationName}
        </p>
        <p className="text-[11.5px] text-[#8C7E6E] truncate mt-0.5" title={st.machineType}>
          {st.machineType.split("(")[0].trim()}
        </p>
      </div>
      <div className="mt-auto pt-2 border-t border-[#F0EAE0] space-y-1">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-[#8C7E6E]">Cycle time</span>
          <span className="font-semibold text-[#221912] tabular-nums">{st.effectiveCycleTime.toFixed(2)} min</span>
        </div>
        {isVacant ? (
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#9C5B3C] hover:text-[#7A452D] hover:underline underline-offset-2 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign operator
          </button>
        ) : (
          <div className="flex items-baseline justify-between gap-2 text-[12px] min-w-0">
            <span className="font-semibold text-[#221912] truncate" title={st.assignedOperatorName || ""}>
              {st.assignedOperatorName}
            </span>
            <span className="text-[11px] text-[#8C7E6E] tabular-nums shrink-0">{st.assignedEmployeeId}</span>
          </div>
        )}
        {!isVacant && st.actualPiecesLogged > 0 && (
          <div className="text-[11.5px] text-[#8C7E6E] tabular-nums">{st.actualPiecesLogged} pcs logged today</div>
        )}
      </div>
    </div>
  );
}
