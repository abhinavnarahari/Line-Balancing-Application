import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Layers,
  Users,
  TrendingUp,
  AlertTriangle,
  Zap,
  Filter,
  RefreshCw,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import type { SewingLine } from "../lines/api";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { LinePlan } from "../line-balance/api";
import type { Operator } from "../operators/api";
import {
  computeLineLevelOperationsData,
  type LineStationCoverage,
} from "./lineLevelMetrics";

interface LineLevelDashboardProps {
  lines: SewingLine[];
  orders: Order[];
  bulletins: OperationBulletin[];
  linePlans: LinePlan[];
  operators: Operator[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function LineLevelDashboard({
  lines,
  orders,
  bulletins,
  linePlans,
  operators,
  onRefresh,
  loading = false,
}: LineLevelDashboardProps) {
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>("ALL");
  const [assigningStation, setAssigningStation] = useState<{
    lineName: string;
    station: LineStationCoverage;
  } | null>(null);

  // 1. Compute Line-Level Metrics (Required vs Deployed, Design Efficiency, etc.)
  const lineMetrics = useMemo(() => {
    return computeLineLevelOperationsData(lines, orders, bulletins, linePlans, operators);
  }, [lines, orders, bulletins, linePlans, operators]);

  // 2. Filtered Lines
  const displayedLines = useMemo(() => {
    if (selectedLineFilter === "ALL") return lineMetrics;
    return lineMetrics.filter((l) => String(l.lineId) === selectedLineFilter);
  }, [lineMetrics, selectedLineFilter]);

  // 3. Plant-wide Aggregates for Line Level
  const lineAggregates = useMemo(() => {
    const totalRequired = lineMetrics.reduce((s, l) => s + l.operatorsRequired, 0);
    const totalDeployed = lineMetrics.reduce((s, l) => s + l.operatorsDeployed, 0);
    const totalVacant = lineMetrics.reduce((s, l) => s + l.vacantStationCount, 0);
    const totalVariance = totalDeployed - totalRequired;
    const avgFulfillment = totalRequired > 0 ? Math.round((totalDeployed / totalRequired) * 100) : 0;

    const avgDesignEff =
      lineMetrics.length > 0
        ? Math.round(
            (lineMetrics.reduce((s, l) => s + l.lineDesignEfficiency, 0) / lineMetrics.length) * 10
          ) / 10
        : 82.5;

    const avgActualEff =
      lineMetrics.length > 0
        ? Math.round(
            (lineMetrics.reduce((s, l) => s + l.actualOperatingEfficiency, 0) / lineMetrics.length) * 10
          ) / 10
        : 76.0;

    const efficiencyGap = Math.round((avgActualEff - avgDesignEff) * 10) / 10;

    return {
      totalRequired,
      totalDeployed,
      totalVacant,
      totalVariance,
      avgFulfillment,
      avgDesignEff,
      avgActualEff,
      efficiencyGap,
    };
  }, [lineMetrics]);

  // Set of operators currently assigned across all line stations
  const assignedOperatorIds = useMemo(() => {
    const set = new Set<string>();
    lineMetrics.forEach((line) => {
      line.stations.forEach((st) => {
        if (st.assignedEmployeeId) {
          set.add(st.assignedEmployeeId);
        }
      });
    });
    return set;
  }, [lineMetrics]);

  // Unallocated operators pool for station assignment (excluding already assigned operators)
  const unallocatedOperators = useMemo(() => {
    return operators.filter((o) => o.active && !assignedOperatorIds.has(o.employeeId) && !assignedOperatorIds.has(String(o.id)));
  }, [operators, assignedOperatorIds]);

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. Line Operations Header ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
              Shopfloor Line Monitoring
            </span>
            <span className="text-[#E6DDCE]">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
              Line Level Governance Active
            </span>
            <span className="text-[#E6DDCE]">·</span>
            <span className="text-[11px] font-mono text-[#8C7E6E]">
              Shift 1 in Progress
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
            Line-Level Operations: Required vs. Deployed &amp; Design Efficiency
          </h2>
          <p className="text-xs text-[#8C7E6E] font-medium max-w-3xl leading-relaxed">
            Real-time shopfloor line balancing governance comparing engineered Operation Bulletin design efficiency against live floor manning fulfillment.
          </p>
        </div>

        {/* Line Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="text-[11px] font-bold text-[#8C7E6E]">Filter Line:</span>
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="bg-transparent font-bold text-[#221912] text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sewing Lines ({lineMetrics.length})</option>
              {lineMetrics.map((l) => (
                <option key={l.lineId} value={String(l.lineId)}>
                  {l.lineCode}: {l.lineName}
                </option>
              ))}
            </select>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] shadow-2xs transition-colors cursor-pointer"
              title="Refresh Line Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}

          <Link
            to="/line-balance"
            className="px-3.5 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span>Balance Lines Engine</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Line-Level Summary KPI Ribbon ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Operators Required vs Deployed */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Total Required vs. Deployed
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {lineAggregates.totalDeployed}
              </span>
              <span className="text-sm font-bold text-[#8C7E6E] font-mono">
                / {lineAggregates.totalRequired} Req
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  lineAggregates.totalVariance < 0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {lineAggregates.totalVariance < 0
                  ? `${lineAggregates.totalVariance} Deficit`
                  : "Fully Manned"}
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Manning fulfillment across lines: <strong>{lineAggregates.avgFulfillment}%</strong>
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                lineAggregates.avgFulfillment >= 95 ? "bg-emerald-600" : "bg-amber-500"
              }`}
              style={{ width: `${lineAggregates.avgFulfillment}%` }}
            />
          </div>
        </div>

        {/* Line Design Efficiency */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Line Design Efficiency (OB Target)
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {lineAggregates.avgDesignEff}%
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Engineered
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Theoretical benchmark from balanced Operation Bulletins
            </p>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center gap-1">
            <span>Target smoothness index across lines</span>
          </div>
        </div>

        {/* Actual Operating Efficiency */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Actual Floor Efficiency
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {lineAggregates.avgActualEff}%
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  lineAggregates.efficiencyGap < -5
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {lineAggregates.efficiencyGap}% Gap
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Variance caused by bottlenecks &amp; {lineAggregates.totalVacant} unmanned stations
            </p>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center gap-1">
            <span>Floor execution vs. theoretical design</span>
          </div>
        </div>

        {/* Unmanned / Vacant Workstations */}
        <div className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Vacant / Under-manned Stations
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700 font-mono">
                {lineAggregates.totalVacant} Stations
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 font-semibold">
              Choking output on active lines
            </p>
          </div>
          <div className="text-[11px] text-[#8C7E6E] font-medium flex items-center gap-1">
            <span>Buffer operators available for deployment</span>
          </div>
        </div>
      </div>

      {/* ── 3. Line-by-Line Detailed Operational Cards ─────────────── */}
      <div className="space-y-6">
        {displayedLines.map((line) => (
          <div
            key={line.lineId}
            className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-2xs space-y-5"
          >
            {/* Line Title & Status Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E6DDCE]">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-[#221912] text-white">
                    {line.lineCode}
                  </span>
                  <h3 className="text-base font-black text-[#221912]">{line.lineName}</h3>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      line.status === "Running"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : line.status === "Needs Attention"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    {line.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C7E6E] mt-1.5">
                  <span>Supervisor: <strong className="text-[#221912]">{line.supervisorName}</strong></span>
                  <span>·</span>
                  <span>Floor: <strong className="text-[#221912]">{line.floor}</strong></span>
                  <span>·</span>
                  <span>Active Style: <strong className="text-[#221912]">{line.activeStyleName}</strong></span>
                  <span>·</span>
                  <span>Buyer: <strong className="text-[#221912]">{line.buyer}</strong></span>
                </div>
              </div>

              {/* Action Buttons for this Line */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/line-balance?lineId=${line.lineId}`}
                  className="px-3 py-1.5 bg-[#F6F1E8] hover:bg-[#EAE2D5] text-[#221912] text-xs font-bold rounded-xl border border-[#E6DDCE] transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-[#9C5B3C]" />
                  <span>Rebalance Line</span>
                </Link>

                <Link
                  to="/operator-placement"
                  className="px-3 py-1.5 bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#FFE5BF]" />
                  <span>Placement Map</span>
                </Link>
              </div>
            </div>

            {/* Line Efficiency & Manning Metrics Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box A: Operators Required vs Deployed */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                    Manning Status: Required vs. Deployed
                  </span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      line.manpowerVariance < 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {line.manpowerVariance < 0 ? `${line.manpowerVariance} Unmanned` : "Full Team"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#221912] font-mono">
                    {line.operatorsDeployed}
                  </span>
                  <span className="text-xs text-[#8C7E6E] font-bold font-mono">
                    / {line.operatorsRequired} Required
                  </span>
                  <span className="text-xs font-bold text-sky-800 ml-auto font-mono">
                    {line.manningFulfillmentPercent}%
                  </span>
                </div>

                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
                  <div
                    className={`h-full rounded-full ${
                      line.manningFulfillmentPercent >= 95 ? "bg-emerald-600" : "bg-amber-500"
                    }`}
                    style={{ width: `${line.manningFulfillmentPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-[#8C7E6E] pt-1">
                  <span>Vacant Stations: <strong className="text-rose-700">{line.vacantStationCount}</strong></span>
                  <span>Pitch Time: <strong className="font-mono text-[#221912]">{line.pitchTime.toFixed(2)}m</strong></span>
                </div>
              </div>

              {/* Box B: Design Efficiency vs Actual Operating Efficiency */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                    Efficiency: Design (OB) vs. Actual
                  </span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      line.efficiencyVariance < -5
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {line.efficiencyVariance}% Variance
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#221912] font-mono">
                    {line.actualOperatingEfficiency}%
                  </span>
                  <span className="text-xs text-[#8C7E6E] font-bold font-mono">
                    (Design Target: {line.lineDesignEfficiency}%)
                  </span>
                </div>

                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E6DDCE] relative">
                  {/* Design Benchmark Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#221912] z-10"
                    style={{ left: `${line.lineDesignEfficiency}%` }}
                    title={`Design Efficiency: ${line.lineDesignEfficiency}%`}
                  />
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${line.actualOperatingEfficiency}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-[#8C7E6E] pt-1">
                  <span>Balance Delay: <strong className="font-mono text-[#221912]">{line.balanceDelay}%</strong></span>
                  <span>Takt Pace: <strong className="font-mono text-[#221912]">{line.taktTimeSec}s</strong></span>
                </div>
              </div>

              {/* Box C: Pacing Bottleneck & Hourly Run Rate */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                    Pacing Bottleneck &amp; Output
                  </span>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Pacing Station
                  </span>
                </div>

                <div>
                  <div className="font-bold text-xs text-[#221912] truncate" title={line.bottleneckOpName}>
                    {line.bottleneckOpName}
                  </div>
                  <div className="text-[11px] text-[#8C7E6E] font-mono mt-0.5">
                    Cycle: <strong className="text-amber-800">{line.bottleneckCycleTime.toFixed(2)}m</strong> · {line.bottleneckMachineType.split("(")[0]}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6DDCE]/60">
                  <span className="text-[10.5px] text-[#8C7E6E]">Hourly Run Rate:</span>
                  <span className="font-mono font-bold text-[#221912]">
                    {line.actualHourlyOutput} / {line.targetHourlyOutput} pcs/hr
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Workstation Sequential Coverage Map */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" />
                  Sequential Workstation Manning &amp; Coverage Layout ({line.stations.length} Operations):
                </span>
                <div className="flex items-center gap-3 text-[10.5px] text-[#8C7E6E]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Manned
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Bottleneck
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Vacant
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Multi-Manned (2x)
                  </span>
                </div>
              </div>

              {/* Station Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {line.stations.map((st) => {
                  const isVacant = st.status === "Vacant";
                  const isBottleneck = st.status === "Bottleneck";
                  const isMulti = st.status === "Multi-Manned";

                  return (
                    <div
                      key={st.sequence}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between space-y-1.5 transition-all ${
                        isVacant
                          ? "bg-rose-50/50 border-rose-300 ring-1 ring-rose-300/30"
                          : isBottleneck
                            ? "bg-amber-50/40 border-amber-300"
                            : isMulti
                              ? "bg-indigo-50/30 border-indigo-300"
                              : "bg-white border-[#E6DDCE]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[10px] text-[#8C7E6E]">
                          St #{st.sequence}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
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
                        <h6 className="font-bold text-[11px] text-[#221912] line-clamp-1" title={st.operationName}>
                          {st.operationName}
                        </h6>
                        <span className="text-[10px] text-[#8C7E6E] line-clamp-1">
                          {st.machineType.split("(")[0]}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-[#E6DDCE]/50">
                        {isVacant ? (
                          <button
                            type="button"
                            onClick={() =>
                              setAssigningStation({
                                lineName: line.lineName,
                                station: st,
                              })
                            }
                            className="w-full py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Assign Operator</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-[#221912] truncate max-w-[85px]" title={st.assignedOperatorName || ""}>
                              {st.assignedOperatorName?.split(" ")[0] || "Operator"}
                            </span>
                            <span className="font-mono font-bold text-[#9C5B3C]">
                              {st.effectiveCycleTime.toFixed(2)}m
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. Quick Operator Deployment Modal ──────────────────────── */}
      <AnimatePresence>
        {assigningStation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E6DDCE] rounded-3xl p-6 shadow-xl max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DDCE]">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#221912]">
                    Deploy Operator to {assigningStation.lineName}
                  </h4>
                  <p className="text-xs text-[#8C7E6E] mt-0.5">
                    Step {assigningStation.station.sequence}: {assigningStation.station.operationName} ({assigningStation.station.machineType})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningStation(null)}
                  className="text-xs font-bold text-[#8C7E6E] hover:text-[#221912] p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block mb-2">
                  Select Available Buffer Operator:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {unallocatedOperators.map((op) => (
                    <div
                      key={op.id}
                      onClick={() => {
                        alert(`Operator ${op.name} (${op.employeeId}) assigned to Station ${assigningStation.station.sequence}!`);
                        setAssigningStation(null);
                      }}
                      className="p-3 rounded-xl border border-[#E6DDCE] hover:border-[#9C5B3C] bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-[#221912]">
                          <span>{op.name}</span>
                          <span className="font-mono text-[10px] text-[#9C5B3C]">({op.employeeId})</span>
                        </div>
                        <span className="text-[11px] text-[#8C7E6E]">{op.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          ⭐ Level 4
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#8C7E6E]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
