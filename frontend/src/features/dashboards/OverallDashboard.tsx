import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Package,
  Users,
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  Layers,
  UserCheck,
  Target,
  Search,
  Factory,
  Download,
  Clock,
  Flame,
} from "lucide-react";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { SewingLine } from "../lines/api";
import type { LinePlan } from "../line-balance/api";
import type { Machine } from "../machines/api";
import type { AttendanceRecord } from "../attendance/api";
import type { Shift } from "../shifts/types";
import type { OperatorTimesheet24h, PieceProductionLog } from "../production-logs/api";
import {
  computePlantKPIs,
  computeOrderPipeline,
  computeLineStatusGrid,
  computeWorkforceSnapshot,
  computeMachineSnapshot,
  computePlantAlerts,
  computeLiveProductionSnapshot,
  type LineStatusSummary,
  type LiveProductionSnapshot,
} from "./overallDashboardMetrics";

interface OverallDashboardProps {
  orders: Order[];
  bulletins: OperationBulletin[];
  operators: Operator[];
  skillMatrix: SkillAssessment[];
  lines: SewingLine[];
  linePlans: LinePlan[];
  machines?: Machine[];
  attendance?: AttendanceRecord[];
  shifts?: Shift[];
  timesheetData?: OperatorTimesheet24h[];
  pieceLogs?: PieceProductionLog[];
  onRefresh?: () => void;
  loading?: boolean;
}

const STATUS_CONFIG: Record<
  LineStatusSummary["status"],
  { dot: string; badge: string; bar: string; label: string }
> = {
  Running: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
    label: "Running",
  },
  "Ramping Up": {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
    label: "Ramping Up",
  },
  "Needs Attention": {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    bar: "bg-rose-500",
    label: "Needs Headcount",
  },
  "No Plan": {
    dot: "bg-[#C5B9A8]",
    badge: "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]",
    bar: "bg-[#E6DDCE]",
    label: "Unplanned",
  },
  Maintenance: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    bar: "bg-blue-500",
    label: "Maintenance",
  },
};

const URGENCY_CONFIG = {
  critical: {
    border: "border-l-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Critical (<7d)",
  },
  high: {
    border: "border-l-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Urgent (<21d)",
  },
  normal: {
    border: "border-l-[#E6DDCE]",
    badge: "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]",
    label: "On Track",
  },
  completed: {
    border: "border-l-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Completed",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: i * 0.03, ease: "easeOut" as const },
  }),
};

export function OverallDashboard({
  orders = [],
  bulletins = [],
  operators = [],
  skillMatrix = [],
  lines = [],
  linePlans = [],
  machines = [],
  attendance = [],
  shifts = [],
  timesheetData = [],
  pieceLogs = [],
  onRefresh,
  loading = false,
}: OverallDashboardProps) {
  const navigate = useNavigate();

  // Search & Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "critical" | "planned" | "completed">("all");
  const [lineFilter, setLineFilter] = useState<"all" | "running" | "attention" | "unplanned">("all");

  // Real-time computations
  const liveProd = useMemo(
    () => computeLiveProductionSnapshot(timesheetData, pieceLogs, lines, linePlans, orders, shifts),
    [timesheetData, pieceLogs, lines, linePlans, orders, shifts]
  );

  const orderPipeline = useMemo(
    () => computeOrderPipeline(orders, bulletins, linePlans, lines),
    [orders, bulletins, linePlans, lines]
  );

  const lineGrid = useMemo(
    () => computeLineStatusGrid(lines, orders, linePlans),
    [lines, orders, linePlans]
  );

  const workforce = useMemo(
    () => computeWorkforceSnapshot(operators, skillMatrix, linePlans, attendance),
    [operators, skillMatrix, linePlans, attendance]
  );

  const machineSnapshot = useMemo(
    () => computeMachineSnapshot(machines),
    [machines]
  );

  const plantAlerts = useMemo(
    () => computePlantAlerts(orderPipeline, lineGrid, workforce, machineSnapshot),
    [orderPipeline, lineGrid, workforce, machineSnapshot]
  );

  const kpis = useMemo(
    () =>
      computePlantKPIs(
        orders,
        bulletins,
        operators,
        skillMatrix,
        lines,
        linePlans,
        machines,
        plantAlerts,
        liveProd
      ),
    [orders, bulletins, operators, skillMatrix, lines, linePlans, machines, plantAlerts, liveProd]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let result = orderPipeline;
    if (orderFilter === "active") result = result.filter((o) => o.status === "IN_PRODUCTION" || o.status === "IN-PRODUCTION");
    else if (orderFilter === "critical") result = result.filter((o) => o.urgency === "critical" && o.status !== "COMPLETED");
    else if (orderFilter === "planned") result = result.filter((o) => o.status === "PLANNED" || o.status === "PENDING");
    else if (orderFilter === "completed") result = result.filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED");

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.buyer.toLowerCase().includes(q) ||
          o.styleNo.toLowerCase().includes(q) ||
          (o.bulletinCode && o.bulletinCode.toLowerCase().includes(q)) ||
          (o.assignedLineName && o.assignedLineName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orderPipeline, orderFilter, orderSearch]);

  // Filtered Lines
  const filteredLines = useMemo(() => {
    if (lineFilter === "running") return lineGrid.filter((l) => l.status === "Running");
    if (lineFilter === "attention") return lineGrid.filter((l) => l.status === "Needs Attention" || l.status === "Ramping Up");
    if (lineFilter === "unplanned") return lineGrid.filter((l) => l.status === "No Plan");
    return lineGrid;
  }, [lineGrid, lineFilter]);

  const criticalCount = orderPipeline.filter((o) => o.urgency === "critical" && o.status !== "COMPLETED").length;

  // Export Executive Factory Report to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Executive Summary Sheet
    const summaryData = [
      { Metric: "Active Orders", Value: kpis.activeOrders, Details: `${kpis.totalOrders} total orders in system` },
      { Metric: "Active Lines", Value: `${kpis.runningLines}/${kpis.activeLines}`, Details: `${kpis.totalLines} total lines configured` },
      { Metric: "Plant Target Efficiency", Value: `${kpis.avgLineEfficiency}%`, Details: "Weighted target efficiency across active lines" },
      { Metric: "Today's Good Pieces Produced", Value: kpis.todayProducedGoodPcs, Details: "Live piece logs from production floor" },
      { Metric: "Today's Daily Target", Value: kpis.todayTargetPcs, Details: "Aggregate shift planned piece target" },
      { Metric: "Target Attainment %", Value: `${kpis.todayAttainmentPercent}%`, Details: "Good pieces / Daily target" },
      { Metric: "Live Hourly Run-Rate", Value: `${kpis.liveHourlyRunRate} pcs/hr`, Details: "Current factory output rate" },
      { Metric: "Active Shift", Value: kpis.activeShiftTiming, Details: "Current active shift schedule" },
      { Metric: "Workforce Present", Value: `${workforce.presentToday}/${workforce.totalActive}`, Details: `${workforce.floaterPoolCount} floaters in reserve` },
      { Metric: "Line Manning Fulfillment", Value: `${kpis.manningFulfillmentPercent}%`, Details: `${kpis.totalDeployedAcrossLines}/${kpis.totalRequiredAcrossLines} operators seated` },
      { Metric: "Total Machines in Use", Value: `${machineSnapshot.inUseCount}/${machineSnapshot.totalMachines}`, Details: `${machineSnapshot.utilizationPercent}% fleet utilization` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

    // 2. Sewing Lines Sheet
    const linesData = lineGrid.map((l) => {
      const lineProd = liveProd.perLineProduction.find((p) => String(p.lineId) === String(l.lineId));
      return {
        "Line Code": l.lineCode,
        "Line Name": l.lineName,
        "Line Type": l.lineType || "Standard",
        Status: l.status,
        "Active Order": l.activeOrderNo,
        Style: l.styleNo,
        Buyer: l.buyer,
        "Operators Deployed": l.operatorsDeployed,
        "Operators Required": l.operatorsRequired,
        "Manning %": `${l.manningPercent}%`,
        "Design Efficiency %": `${l.designEfficiency}%`,
        "Today Produced Good": lineProd?.actualGood ?? 0,
        "Today Target (pcs)": lineProd?.targetDailyPcs ?? 0,
        "Attainment %": `${lineProd?.attainmentPercent ?? 0}%`,
        "Bottlenecks Detected": l.bottleneckCount,
      };
    });
    const wsLines = XLSX.utils.json_to_sheet(linesData);
    XLSX.utils.book_append_sheet(wb, wsLines, "Sewing Lines Matrix");

    // 3. Orders Pipeline Sheet
    const ordersData = orderPipeline.map((o) => ({
      "Order No": o.orderNo,
      Buyer: o.buyer,
      "Style No": o.styleNo,
      "Quantity (pcs)": o.totalQuantity,
      Status: o.status,
      "Delivery Date": o.deliveryDate,
      "Days Until Delivery": o.daysUntilDelivery === 999 ? "N/A" : o.daysUntilDelivery,
      Urgency: o.urgency,
      "OB Available": o.hasOB ? "YES" : "NO",
      "Bulletin Code": o.bulletinCode || "—",
      "Line Plan Ready": o.hasPlan ? "YES" : "NO",
      "Assigned Line": o.assignedLineName || "—",
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders Pipeline");

    // 4. Workforce & Skills Sheet
    const skillsData = workforce.skillDistribution.map((s) => ({
      "Skill Level": `L${s.rating} - ${s.label}`,
      "Certified Operators": s.count,
      Percentage: `${s.percentage}%`,
    }));
    const wsSkills = XLSX.utils.json_to_sheet(skillsData);
    XLSX.utils.book_append_sheet(wb, wsSkills, "Skill Distribution");

    // 5. Machine Fleet Sheet
    const machineData = machineSnapshot.byType.map((m) => ({
      "Machine Type": m.type,
      "Total Fleet": m.total,
      "In Use on Lines": m.inUse,
      "Available Pool": m.available,
    }));
    const wsMachines = XLSX.utils.json_to_sheet(machineData);
    XLSX.utils.book_append_sheet(wb, wsMachines, "Machine Fleet");

    const todayStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Factory_Overview_Report_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── 1. Executive Factory Command Header ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#9C5B3C] flex items-center gap-1.5 shrink-0">
              <Factory className="w-3.5 h-3.5" />
              Factory Overview Command Center
            </span>
            <span className="text-[#E6DDCE] hidden sm:inline">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Floor Operations
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF8F5] text-[#8C7E6E] border border-[#E6DDCE] shrink-0">
              <Clock className="w-3 h-3 text-[#9C5B3C]" />
              {kpis.activeShiftTiming}
            </span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {criticalCount} Critical Delivery Risk{criticalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
            Factory Overview Dashboard
          </h1>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#221912] text-xs font-bold border border-[#E6DDCE] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Export full executive factory report to Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span className="whitespace-nowrap">Export Excel</span>
          </button>
          <Link
            to="/line-balance"
            className="h-9 px-3.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B2F] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span className="whitespace-nowrap">Line Balancing</span>
          </Link>
          <Link
            to="/monitoring"
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] text-xs font-bold border border-[#E6DDCE] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="whitespace-nowrap">Live Monitoring</span>
          </Link>
          <Link
            to="/operator-placement"
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] text-xs font-bold border border-[#E6DDCE] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className="whitespace-nowrap">Operator Placement</span>
          </Link>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="h-9 w-9 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Refresh Live Factory Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Critical Plant Alerts Bar (if any) ────────────────────── */}
      {plantAlerts.length > 0 && (
        <div className="space-y-2">
          {plantAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                alert.severity === "critical"
                  ? "bg-rose-50/80 border-rose-200 text-rose-900"
                  : alert.severity === "warning"
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : "bg-blue-50/80 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.severity === "critical"
                      ? "bg-rose-100 text-rose-700"
                      : alert.severity === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">{alert.title}</span> —{" "}
                  <span className="opacity-90">{alert.description}</span>
                </div>
              </div>
              <Link
                to={alert.actionHref}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors shrink-0 flex items-center gap-1 self-start sm:self-auto ${
                  alert.severity === "critical"
                    ? "bg-white text-rose-700 border-rose-300 hover:bg-rose-100"
                    : alert.severity === "warning"
                    ? "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-white text-blue-800 border-blue-300 hover:bg-blue-100"
                }`}
              >
                <span>{alert.actionText}</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Executive KPI Scorecards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Active Orders",
            value: kpis.activeOrders,
            sub: `${kpis.totalOrders} total · ${kpis.plannedOrders} planned`,
            icon: <Package className="w-4 h-4" />,
            color: "text-[#9C5B3C]",
            bg: "bg-[#F6F1E8] border-[#E6DDCE]",
            link: "/orders",
          },
          {
            label: "Active Lines",
            value: `${kpis.runningLines}/${kpis.activeLines}`,
            sub: `${kpis.totalLines} lines in factory`,
            icon: <Layers className="w-4 h-4" />,
            color: "text-indigo-700",
            bg: "bg-indigo-50 border-indigo-200",
            link: "/settings/lines",
          },
          {
            label: "Plant Efficiency",
            value: `${kpis.avgLineEfficiency}%`,
            sub: `${kpis.effectiveBulletins} active OBs`,
            icon: <TrendingUp className="w-4 h-4" />,
            color: "text-[#77876F]",
            bg: "bg-[#F3F5F2] border-[#d4decb]",
            link: "/operation-bulletins",
          },
          {
            label: "Floor Workforce",
            value: `${workforce.presentToday}/${workforce.totalActive}`,
            sub: `${workforce.floaterPoolCount} floaters ready`,
            icon: <Users className="w-4 h-4" />,
            color: "text-[#8B5E3C]",
            bg: "bg-[#EFE9DF] border-[#D8C9B8]",
            link: "/skill-matrix",
          },
          {
            label: "Line Manning %",
            value: kpis.manningFulfillmentPercent > 0 ? `${kpis.manningFulfillmentPercent}%` : "—",
            sub: `${kpis.totalDeployedAcrossLines}/${kpis.totalRequiredAcrossLines} seated`,
            icon: <UserCheck className="w-4 h-4" />,
            color: kpis.manningFulfillmentPercent >= 80 ? "text-emerald-700" : "text-amber-700",
            bg: kpis.manningFulfillmentPercent >= 80 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
            link: "/operator-placement",
          },
          {
            label: "Planned PCs",
            value: kpis.totalPlannedPcs > 0 ? kpis.totalPlannedPcs.toLocaleString() : "—",
            sub: `${kpis.completedOrders} orders shipped`,
            icon: <Target className="w-4 h-4" />,
            color: "text-[#221912]",
            bg: "bg-[#E8DCC9] border-[#C5B9A8]",
            link: "/orders",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl border border-[#E6DDCE] p-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} border flex items-center justify-center ${kpi.color}`}>
                {kpi.icon}
              </div>
              {kpi.link && (
                <Link to={kpi.link} className="text-[#8C7E6E] hover:text-[#9C5B3C] transition-colors" title={`Open ${kpi.label}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-[#221912] font-mono leading-tight">
                {loading ? (
                  <div className="h-6 w-16 bg-[#F0EAE0] rounded animate-pulse" />
                ) : (
                  kpi.value
                )}
              </div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C7E6E] mt-0.5">
                {kpi.label}
              </div>
              <div className="text-[10px] text-[#8C7E6E] mt-0.5 truncate">{kpi.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 4. Live Production Output Pulse & Factory Hourly Pace ─────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EAE0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#221912]">Live Floor Production Output Pulse</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync (15s)
                </span>
              </div>
              <p className="text-xs text-[#8C7E6E] mt-0.5">
                Today's actual piece output logged vs planned shift targets across all active sewing lines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/monitoring"
              className="text-xs font-bold text-[#9C5B3C] hover:text-[#854B2F] flex items-center gap-1"
            >
              <span>Detailed Floor Boards</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Output KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6DDCE]">
            <div className="text-[10.5px] font-extrabold uppercase text-[#8C7E6E] tracking-wider">
              Good Pieces Produced
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
              {liveProd.totalGoodToday.toLocaleString()} <span className="text-xs font-bold text-[#8C7E6E]">pcs</span>
            </div>
            <div className="text-[10px] text-[#8C7E6E] mt-0.5">
              {liveProd.totalRejectToday > 0 ? `${liveProd.totalRejectToday} rejects logged` : "0 defect rejects"}
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6DDCE]">
            <div className="text-[10.5px] font-extrabold uppercase text-[#8C7E6E] tracking-wider">
              Shift Daily Target
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#221912] mt-1">
              {liveProd.dailyPlannedTarget.toLocaleString()} <span className="text-xs font-bold text-[#8C7E6E]">pcs</span>
            </div>
            <div className="text-[10px] text-[#8C7E6E] mt-0.5">
              Across {lines.filter((l) => l.active !== false).length} active lines
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6DDCE]">
            <div className="text-[10.5px] font-extrabold uppercase text-[#8C7E6E] tracking-wider">
              Target Attainment
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
              liveProd.targetAttainmentPercent >= 80
                ? "text-emerald-700"
                : liveProd.targetAttainmentPercent >= 50
                ? "text-amber-700"
                : "text-[#9C5B3C]"
            }`}>
              {liveProd.targetAttainmentPercent}%
            </div>
            <div className="w-full bg-[#E6DDCE] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#9C5B3C] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, liveProd.targetAttainmentPercent)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6DDCE]">
            <div className="text-[10.5px] font-extrabold uppercase text-[#8C7E6E] tracking-wider">
              Hourly Run-Rate
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#9C5B3C] mt-1">
              {liveProd.liveHourlyRunRate} <span className="text-xs font-bold text-[#8C7E6E]">pcs/hr</span>
            </div>
            <div className="text-[10px] text-[#8C7E6E] mt-0.5">
              Factory pace per elapsed hr
            </div>
          </div>
        </div>

        {/* Per-Line Mini Attainment Status Bar */}
        {liveProd.perLineProduction.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] mb-2">
              Per-Line Target Fulfillment Progress
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {liveProd.perLineProduction.map((lp) => (
                <div
                  key={lp.lineId}
                  className="bg-white p-3 rounded-xl border border-[#E6DDCE] hover:border-[#9C5B3C] transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-xs text-[#221912]">
                      {lp.lineCode} ({lp.lineName})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#9C5B3C]">
                      {lp.attainmentPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lp.attainmentPercent >= 80 ? "bg-emerald-500" : "bg-[#9C5B3C]"
                      }`}
                      style={{ width: `${Math.min(100, lp.attainmentPercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8C7E6E]">
                    <span>
                      <strong className="text-[#221912] font-mono">{lp.actualGood}</strong> / {lp.targetDailyPcs} pcs
                    </span>
                    {lp.isBottlenecked && (
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Bottleneck
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Main 2-Column Operational Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left 2 Columns: Lines Status & Order Pipeline ──────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Production Lines Matrix ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#221912]">Sewing Lines Operational Status</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                  {lineGrid.length} lines
                </span>
              </div>

              {/* Line filters */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E6DDCE] text-xs">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "running", label: "Running" },
                    { id: "attention", label: "Needs Manning" },
                    { id: "unplanned", label: "Unplanned" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLineFilter(f.id)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      lineFilter === f.id
                        ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                        : "text-[#8C7E6E] hover:text-[#221912]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredLines.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8C7E6E] italic">
                No sewing lines match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-[#F0EAE0]">
                {filteredLines.map((line, idx) => {
                  const conf = STATUS_CONFIG[line.status] || STATUS_CONFIG["No Plan"];
                  const lineProd = liveProd.perLineProduction.find((p) => String(p.lineId) === String(line.lineId));
                  return (
                    <motion.div
                      key={line.lineId}
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-4 sm:px-5 hover:bg-[#FEFCF9] transition-colors"
                    >
                      {/* Row 1: Line identity, status, and action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${conf.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${line.status === "Running" ? "animate-pulse" : ""}`} />
                            {conf.label}
                          </span>

                          <span className="font-mono font-black text-sm text-[#221912]">
                            {line.lineCode}
                          </span>
                          <span className="text-sm font-bold text-[#221912]">
                            {line.lineName}
                          </span>
                          {line.lineType && (
                            <span className="text-[10px] font-bold text-[#8C7E6E] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6DDCE] shrink-0">
                              {line.lineType}
                            </span>
                          )}
                          {line.bottleneckCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              {line.bottleneckCount} Bottleneck{line.bottleneckCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/line-balance?lineId=${line.lineId}`)}
                            className="px-3 py-1.5 rounded-xl bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Open in Line Balancing Engine"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Balance</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/monitoring?lineId=${line.lineId}`)}
                            className="p-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Live Monitoring"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/operator-placement`)}
                            className="p-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Assign Operators"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Order context & Manning / Eff KPIs */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0EAE0]/80 text-xs text-[#8C7E6E]">
                        <div className="flex items-center gap-2 truncate">
                          {line.hasPlan ? (
                            <>
                              <span>Order: <strong className="text-[#221912] font-mono">{line.activeOrderNo}</strong></span>
                              <span>·</span>
                              <span>Style: <strong className="text-[#221912]">{line.styleNo}</strong></span>
                              {line.buyer && line.buyer !== "—" && (
                                <>
                                  <span>·</span>
                                  <span>Buyer: <strong className="text-[#221912]">{line.buyer}</strong></span>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="italic text-[#A89A8A]">No production order assigned to line</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#8C7E6E] font-sans font-medium">Manning:</span>
                            <div className="w-20 h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${conf.bar}`}
                                style={{ width: `${Math.min(100, line.manningPercent)}%` }}
                              />
                            </div>
                            <strong className="text-[#221912] text-xs">{line.operatorsDeployed}/{line.operatorsRequired}</strong>
                            <span className={`text-[11px] font-bold ${line.manningPercent >= 80 ? "text-emerald-700" : "text-amber-700"}`}>
                              ({line.manningPercent}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pl-3 border-l border-[#E6DDCE]">
                            <span className="text-[11px] text-[#8C7E6E] font-sans font-medium">Target Eff:</span>
                            <strong className="text-[#221912] text-xs">{line.designEfficiency}%</strong>
                            {lineProd && lineProd.actualGood > 0 && (
                              <span className="text-[11px] font-bold text-emerald-700">· {lineProd.actualGood} pcs</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Order Delivery & Readiness Pipeline ──────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="p-5 pb-4 border-b border-[#F0EAE0] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-[#221912]">Order Delivery & Readiness Pipeline</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                    {orderPipeline.length}
                  </span>
                  {criticalCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {criticalCount} critical
                    </span>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E6DDCE] text-xs">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "active", label: "In Production" },
                      { id: "critical", label: "Critical" },
                      { id: "planned", label: "Planned" },
                      { id: "completed", label: "Done" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderFilter(f.id)}
                      className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                        orderFilter === f.id
                          ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                          : "text-[#8C7E6E] hover:text-[#221912]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order No, Buyer (Nike, Zara...), Style, Line, or Bulletin..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] text-xs text-[#221912] placeholder-[#A89A8A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9C5B3C]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#F0EAE0]">
              <AnimatePresence mode="wait">
                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C7E6E] italic">
                    No orders match the selected search or filter criteria.
                  </div>
                ) : (
                  filteredOrders.slice(0, 10).map((order, idx) => {
                    const urgConf = URGENCY_CONFIG[order.urgency] || URGENCY_CONFIG.normal;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-4 sm:px-5 hover:bg-[#FEFCF9] transition-colors border-l-4 ${urgConf.border}`}
                      >
                        {/* Row 1: Order header, Style, Urgency, and Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-sm text-[#221912]">
                              {order.orderNo}
                            </span>
                            <span className="text-xs text-[#8C7E6E] font-medium">· Style: <strong className="text-[#221912]">{order.styleNo}</strong></span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgConf.badge}`}>
                              {urgConf.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* OB Status */}
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                order.hasOB
                                  ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                              title={order.bulletinCode ? `Linked to ${order.bulletinCode}` : "No Operation Bulletin linked"}
                            >
                              {order.hasOB ? `OB ✓ ${order.bulletinCode ? `(${order.bulletinCode})` : ""}` : "No OB"}
                            </span>

                            {/* Plan / Line Assignment */}
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                order.hasPlan
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {order.hasPlan
                                ? `Plan ✓ · ${order.assignedLineName || "Assigned"}`
                                : "Unplanned"}
                            </span>

                            {/* Balance Action */}
                            <button
                              type="button"
                              onClick={() => navigate(`/line-balance?orderId=${order.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Balance Order</span>
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Buyer, Quantity, and Delivery Countdown */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#8C7E6E]">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span>Buyer: <strong className="text-[#221912]">{order.buyer}</strong></span>
                            <span>·</span>
                            <span className="font-mono">
                              Quantity: <strong className="text-[#221912]">{order.totalQuantity.toLocaleString()}</strong> pcs
                            </span>
                          </div>

                          <div className="font-mono text-xs">
                            Delivery: <strong className="text-[#221912]">{order.deliveryDate}</strong> ({order.daysUntilDelivery === 999
                              ? "No Date"
                              : order.daysUntilDelivery < 0
                              ? `${Math.abs(order.daysUntilDelivery)}d overdue`
                              : `${order.daysUntilDelivery}d remaining`})
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {filteredOrders.length > 10 && (
              <div className="p-4 border-t border-[#F0EAE0] text-center">
                <Link
                  to="/orders"
                  className="text-xs font-bold text-[#9C5B3C] hover:text-[#854B2F] flex items-center justify-center gap-1"
                >
                  View all {filteredOrders.length} orders in Master Order Directory
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right 1 Column: Workforce, Machines, OB Coverage & Shortcuts ─ */}
        <div className="space-y-6">
          {/* ── Workforce & Skill Matrix Snapshot ─────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8B5E3C]" />
                <h3 className="text-sm font-bold text-[#221912]">Workforce & Skill Matrix</h3>
              </div>
              <Link to="/skill-matrix" className="text-xs font-bold text-[#9C5B3C] hover:underline">
                Skill Matrix
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {/* Seated vs Unallocated Floaters */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Seated On Lines ({workforce.seatedCount})
                  </span>
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Floaters / Buffer ({workforce.unallocatedCount})
                  </span>
                </div>
                <div className="h-3 w-full bg-[#F6F1E8] rounded-full overflow-hidden flex border border-[#E6DDCE]">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${workforce.seatedPercent}%` }}
                    title={`${workforce.seatedPercent}% Seated`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${100 - workforce.seatedPercent}%` }}
                    title={`${100 - workforce.seatedPercent}% Floater / Available`}
                  />
                </div>
                <div className="text-center text-[10px] text-[#8C7E6E] mt-1.5">
                  <strong>{workforce.presentToday}</strong> present today ({workforce.totalActive} active) · <strong>{workforce.seatedPercent}%</strong> on production lines
                </div>
              </div>

              {/* Workforce Key Metrics */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Active", value: workforce.totalActive, color: "text-[#221912]" },
                  { label: "Avg Skill Rating", value: `⭐ ${workforce.avgSkillRating}`, color: "text-[#8B5E3C]" },
                  { label: "Floater Pool", value: workforce.floaterPoolCount, color: "text-amber-700" },
                ].map((m) => (
                  <div key={m.label} className="bg-[#FAF8F5] rounded-xl p-2.5 border border-[#E6DDCE] text-center">
                    <div className={`text-base font-black font-mono ${m.color}`}>{m.value}</div>
                    <div className="text-[9.5px] font-bold uppercase text-[#8C7E6E] leading-tight mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Skill Matrix L1–L5 Distribution */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                    Skill Matrix Rating Distribution
                  </span>
                  <span className="text-[10px] font-mono text-[#8C7E6E]">
                    {workforce.totalCertifiedOperations} ratings
                  </span>
                </div>
                {workforce.skillDistribution.map((s) => {
                  const barColors = ["bg-[#77876F]", "bg-[#9C5B3C]", "bg-[#B48259]", "bg-amber-400", "bg-slate-400"];
                  return (
                    <div key={s.rating}>
                      <div className="flex items-center justify-between text-[10.5px] mb-0.5">
                        <span className="text-[#8C7E6E] font-medium flex items-center gap-1">
                          <strong className="text-[#221912]">L{s.rating}</strong>
                          <span className="text-[9.5px] text-[#A89A8A]">{s.label}</span>
                        </span>
                        <span className="font-mono font-bold text-[#221912]">
                          {s.count} ({s.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[5 - s.rating]}`}
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
