import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  FileText,
  Layers,
  UserCheck,
  Target,
  Cpu,
} from "lucide-react";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { SewingLine } from "../lines/api";
import type { LinePlan } from "../line-balance/api";
import {
  computePlantKPIs,
  computeOrderPipeline,
  computeLineStatusGrid,
  computeWorkforceSnapshot,
} from "./overallDashboardMetrics";

interface OverallDashboardProps {
  orders: Order[];
  bulletins: OperationBulletin[];
  operators: Operator[];
  skillMatrix: SkillAssessment[];
  lines: SewingLine[];
  linePlans: LinePlan[];
  onRefresh?: () => void;
  loading?: boolean;
}

const STATUS_CONFIG = {
  Running: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
  },
  "Ramping Up": {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
  },
  "Needs Attention": {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    bar: "bg-rose-500",
  },
  "No Plan": {
    dot: "bg-[#C5B9A8]",
    badge: "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]",
    bar: "bg-[#E6DDCE]",
  },
};

const URGENCY_CONFIG = {
  critical: { border: "border-l-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Critical" },
  high: { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Urgent" },
  normal: { border: "border-l-[#E6DDCE]", badge: "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]", label: "On Track" },
  completed: { border: "border-l-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Done" },
};

function getBuyerInitials(name: string) {
  if (!name || name === "—") return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const BUYER_COLORS = [
  "bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]",
  "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]",
  "bg-[#EFE9DF] text-[#8B5E3C] border-[#D8C9B8]",
  "bg-[#E8DCC9] text-[#221912] border-[#C5B9A8]",
  "bg-indigo-50 text-indigo-800 border-indigo-200",
];

function getBuyerColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return BUYER_COLORS[Math.abs(hash) % BUYER_COLORS.length];
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: "easeOut" as const },
  }),
};

export function OverallDashboard({
  orders,
  bulletins,
  operators,
  skillMatrix,
  lines,
  linePlans,
  onRefresh,
  loading = false,
}: OverallDashboardProps) {
  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "critical">("all");

  const kpis = useMemo(
    () => computePlantKPIs(orders, bulletins, operators, skillMatrix, lines, linePlans),
    [orders, bulletins, operators, skillMatrix, lines, linePlans]
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
    () => computeWorkforceSnapshot(operators, skillMatrix, linePlans),
    [operators, skillMatrix, linePlans]
  );

  const filteredOrders = useMemo(() => {
    if (orderFilter === "active") return orderPipeline.filter((o) => o.status !== "COMPLETED");
    if (orderFilter === "critical") return orderPipeline.filter((o) => o.urgency === "critical");
    return orderPipeline;
  }, [orderPipeline, orderFilter]);

  const criticalCount = orderPipeline.filter((o) => o.urgency === "critical").length;

  return (
    <div className="space-y-6 w-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
              Executive Command Center
            </span>
            <span className="text-[#E6DDCE]">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Plant 1 — Live Operations
            </span>
            {criticalCount > 0 && (
              <>
                <span className="text-[#E6DDCE]">·</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} Critical Order{criticalCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#221912] tracking-tight">
            Overall Plant Dashboard
          </h2>
          <p className="text-xs text-[#8C7E6E] font-medium max-w-3xl leading-relaxed">
            Consolidated real-time view of production orders, line manning status, workforce deployment, and operation bulletin coverage across all sewing lines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Link
            to="/line-balance"
            className="px-3.5 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span>Line Balancing</span>
          </Link>
          <Link
            to="/monitoring"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] text-xs font-bold border border-[#E6DDCE] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Monitoring</span>
          </Link>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] border border-[#E6DDCE] transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── Plant KPI Scorecards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Active Orders",
            value: kpis.activeOrders,
            sub: `${kpis.totalOrders} total`,
            icon: <Package className="w-4 h-4" />,
            color: "text-[#9C5B3C]",
            bg: "bg-[#F6F1E8] border-[#E6DDCE]",
            link: "/orders",
          },
          {
            label: "Active Lines",
            value: kpis.activeLines,
            sub: `${kpis.totalLines} configured`,
            icon: <Layers className="w-4 h-4" />,
            color: "text-indigo-700",
            bg: "bg-indigo-50 border-indigo-200",
            link: null,
          },
          {
            label: "Line Efficiency",
            value: kpis.avgLineEfficiency > 0 ? `${kpis.avgLineEfficiency}%` : "—",
            sub: kpis.effectiveBulletins > 0 ? `${kpis.effectiveBulletins} OBs` : "No OBs",
            icon: <TrendingUp className="w-4 h-4" />,
            color: "text-[#77876F]",
            bg: "bg-[#F3F5F2] border-[#d4decb]",
            link: "/operation-bulletins",
          },
          {
            label: "Active Operators",
            value: kpis.activeOperators,
            sub: `${kpis.seatedOperators} seated`,
            icon: <Users className="w-4 h-4" />,
            color: "text-[#8B5E3C]",
            bg: "bg-[#EFE9DF] border-[#D8C9B8]",
            link: "/skill-matrix",
          },
          {
            label: "Manning %",
            value: kpis.manningFulfillmentPercent > 0 ? `${kpis.manningFulfillmentPercent}%` : "—",
            sub: `${kpis.totalDeployedAcrossLines}/${kpis.totalRequiredAcrossLines} deployed`,
            icon: <UserCheck className="w-4 h-4" />,
            color: kpis.manningFulfillmentPercent >= 80 ? "text-emerald-700" : "text-amber-700",
            bg: kpis.manningFulfillmentPercent >= 80 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200",
            link: "/operator-placement",
          },
          {
            label: "Planned PCs",
            value: kpis.totalPlannedPcs > 0 ? kpis.totalPlannedPcs.toLocaleString() : "—",
            sub: `${kpis.completedOrders} orders done`,
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
                <Link to={kpi.link} className="text-[#8C7E6E] hover:text-[#9C5B3C] transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div>
              <div className="text-2xl font-black text-[#221912] font-mono leading-tight">
                {loading ? (
                  <div className="h-6 w-12 bg-[#F0EAE0] rounded animate-pulse" />
                ) : (
                  kpi.value
                )}
              </div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C7E6E] mt-0.5">
                {kpi.label}
              </div>
              <div className="text-[10px] text-[#8C7E6E] mt-0.5">{kpi.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main 2-Column Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Order Pipeline ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4 border-b border-[#F0EAE0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#221912]">Order Pipeline</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                    {orderPipeline.length}
                  </span>
                  {criticalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {criticalCount} urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8C7E6E] mt-0.5">
                  Sorted by delivery proximity · OB and plan readiness indicators
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E6DDCE] text-[11px]">
                {(["all", "active", "critical"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOrderFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      orderFilter === f
                        ? "bg-white text-[#9C5B3C] shadow-sm border border-[#E6DDCE]"
                        : "text-[#8C7E6E] hover:text-[#221912]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#F0EAE0]">
              <AnimatePresence mode="wait">
                {filteredOrders.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#8C7E6E] italic">
                    No orders match the selected filter.
                  </div>
                ) : (
                  filteredOrders.slice(0, 8).map((order, idx) => {
                    const urgConf = URGENCY_CONFIG[order.urgency];
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FEFCF9] transition-colors border-l-4 ${urgConf.border}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-extrabold border flex-shrink-0 ${getBuyerColor(order.buyer)}`}>
                            {getBuyerInitials(order.buyer)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-black text-xs text-[#221912]">
                                {order.orderNo}
                              </span>
                              <span className="text-[10.5px] text-[#8C7E6E]">· {order.styleNo}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${urgConf.badge}`}>
                                {urgConf.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-[#8C7E6E] mt-0.5">
                              <span>{order.buyer}</span>
                              <span className="font-mono">
                                {order.totalQuantity.toLocaleString()} pcs
                              </span>
                              <span className="font-mono">
                                {order.daysUntilDelivery === 999
                                  ? "No delivery date"
                                  : order.daysUntilDelivery < 0
                                  ? `${Math.abs(order.daysUntilDelivery)}d overdue`
                                  : `${order.daysUntilDelivery}d left`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* OB status */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            order.hasOB
                              ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {order.hasOB ? "OB ✓" : "No OB"}
                          </span>
                          {/* Plan status */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            order.hasPlan
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {order.hasPlan
                              ? `Plan ✓ · ${order.assignedLineName || "Assigned"}`
                              : "Unplanned"}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate(`/line-balance?orderId=${order.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-[10px] font-extrabold transition-all cursor-pointer"
                          >
                            <Zap className="w-3 h-3" />
                            Balance
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {orderPipeline.length > 8 && (
              <div className="p-4 border-t border-[#F0EAE0] text-center">
                <Link
                  to="/orders"
                  className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] flex items-center justify-center gap-1"
                >
                  View all {orderPipeline.length} orders
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ── Line Status Grid ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-[#F0EAE0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#221912]">Production Line Status</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                    {lineGrid.length} lines
                  </span>
                </div>
                <p className="text-xs text-[#8C7E6E] mt-0.5">
                  Real-time manning fulfillment vs. required headcount per line
                </p>
              </div>
              <Link
                to="/operator-placement"
                className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] flex items-center gap-1"
              >
                Manage Placement
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lineGrid.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#8C7E6E] italic">
                No active sewing lines configured.
              </div>
            ) : (
              <div className="divide-y divide-[#F0EAE0]">
                {lineGrid.map((line, idx) => {
                  const conf = STATUS_CONFIG[line.status];
                  return (
                    <motion.div
                      key={line.lineId}
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="px-5 py-4 hover:bg-[#FEFCF9] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Line identity */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} ${line.status === "Running" ? "animate-pulse" : ""}`} />
                              {line.status}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#221912] truncate">{line.lineName}</div>
                            <div className="text-[10.5px] text-[#8C7E6E] truncate">
                              {line.hasPlan ? `${line.activeOrderNo} · ${line.buyer}` : "No plan assigned"}
                            </div>
                          </div>
                        </div>

                        {/* Manning bar */}
                        <div className="flex items-center gap-3 sm:w-56">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-[#8C7E6E]">Manning</span>
                              <span className="text-[#221912] font-mono">
                                {line.operatorsDeployed}/{line.operatorsRequired}
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${conf.bar}`}
                                style={{ width: `${line.manningPercent}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-black font-mono ${
                            line.manningPercent >= 80 ? "text-emerald-700" : "text-amber-700"
                          }`}>
                            {line.hasPlan ? `${line.manningPercent}%` : "—"}
                          </span>
                        </div>

                        {/* Efficiency */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-[#8C7E6E] font-bold uppercase">Design Eff</div>
                            <div className="text-xs font-black font-mono text-[#221912]">
                              {line.designEfficiency}%
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/line-balance`)}
                            className="p-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] transition-all cursor-pointer"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* ── Workforce Snapshot ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8B5E3C]" />
                <h3 className="text-sm font-bold text-[#221912]">Workforce Snapshot</h3>
              </div>
              <Link to="/skill-matrix" className="text-xs font-bold text-[#9C5B3C] hover:underline">
                Skill Matrix
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {/* Seated / Unallocated split */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Seated ({workforce.seatedCount})
                  </span>
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Unallocated ({workforce.unallocatedCount})
                  </span>
                </div>
                <div className="h-3 w-full bg-[#F6F1E8] rounded-full overflow-hidden flex border border-[#E6DDCE]">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${workforce.seatedPercent}%` }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${100 - workforce.seatedPercent}%` }}
                  />
                </div>
                <div className="text-center text-[10px] text-[#8C7E6E] mt-1">
                  {workforce.totalActive} active operators · {workforce.seatedPercent}% on production
                </div>
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Active", value: workforce.totalActive, color: "text-[#221912]" },
                  { label: "Avg Skill ⭐", value: workforce.avgSkillRating || "—", color: "text-[#8B5E3C]" },
                  { label: "Unallocated", value: workforce.unallocatedCount, color: "text-amber-700" },
                ].map((m) => (
                  <div key={m.label} className="bg-[#FDFCFB] rounded-xl p-2.5 border border-[#E6DDCE] text-center">
                    <div className={`text-base font-black font-mono ${m.color}`}>{m.value}</div>
                    <div className="text-[9.5px] font-bold uppercase text-[#8C7E6E] leading-tight mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Skill distribution bars */}
              <div className="space-y-2">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                  Skill Distribution
                </span>
                {workforce.skillDistribution.map((s) => {
                  const pct = workforce.totalActive > 0
                    ? Math.round((s.count / workforce.totalActive) * 100)
                    : 0;
                  const barColors = ["bg-[#77876F]", "bg-[#9C5B3C]", "bg-[#B48259]", "bg-amber-400", "bg-slate-400"];
                  return (
                    <div key={s.rating}>
                      <div className="flex items-center justify-between text-[10.5px] mb-0.5">
                        <span className="text-[#8C7E6E] font-medium flex items-center gap-1">
                          <span>L{s.rating}</span>
                          <span className="text-[9.5px] text-[#B0A090]">{s.label}</span>
                        </span>
                        <span className="font-mono font-bold text-[#221912]">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-[#F0EAE0] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[5 - s.rating]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── OB Coverage ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C7E6E]" />
                <h3 className="text-sm font-bold text-[#221912]">OB Coverage</h3>
              </div>
              <Link to="/operation-bulletins" className="text-xs font-bold text-[#9C5B3C] hover:underline">
                Manage
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {orders.length === 0 ? (
                <p className="text-xs text-[#8C7E6E] italic text-center py-4">No orders yet.</p>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="flex items-center gap-3 p-3 bg-[#FDFCFB] rounded-xl border border-[#E6DDCE]">
                    <div className="text-center flex-1 border-r border-[#E6DDCE]">
                      <div className="text-base font-black font-mono text-emerald-700">
                        {orderPipeline.filter((o) => o.hasOB).length}
                      </div>
                      <div className="text-[9.5px] font-bold uppercase text-[#8C7E6E]">With OB</div>
                    </div>
                    <div className="text-center flex-1 border-r border-[#E6DDCE]">
                      <div className="text-base font-black font-mono text-rose-700">
                        {orderPipeline.filter((o) => !o.hasOB).length}
                      </div>
                      <div className="text-[9.5px] font-bold uppercase text-[#8C7E6E]">Missing OB</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-base font-black font-mono text-[#221912]">
                        {orders.length > 0
                          ? `${Math.round((orderPipeline.filter((o) => o.hasOB).length / orders.length) * 100)}%`
                          : "—"}
                      </div>
                      <div className="text-[9.5px] font-bold uppercase text-[#8C7E6E]">Coverage</div>
                    </div>
                  </div>

                  {/* Orders missing OB (up to 4) */}
                  {orderPipeline.filter((o) => !o.hasOB).slice(0, 4).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#221912]">{o.orderNo}</span>
                        <span className="text-[#8C7E6E] ml-2 text-[10.5px]">{o.buyer}</span>
                      </div>
                      <Link
                        to="/operation-bulletins"
                        className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                      >
                        Create OB <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* ── Quick Actions ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F0EAE0]">
              <Cpu className="w-4 h-4 text-[#9C5B3C]" />
              <h3 className="text-sm font-bold text-[#221912]">Quick Actions</h3>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { label: "Line Balancing Engine", sub: "Balance a production order", to: "/line-balance", icon: <Zap className="w-4 h-4 text-white" />, bg: "bg-[#9C5B3C]" },
                { label: "Production Monitoring", sub: "Live floor tracking", to: "/monitoring", icon: <Activity className="w-4 h-4 text-white" />, bg: "bg-emerald-700" },
                { label: "Operator Placement", sub: "Assign operators to stations", to: "/operator-placement", icon: <Users className="w-4 h-4 text-white" />, bg: "bg-[#77876F]" },
                { label: "Skill Matrix", sub: "Manage operator competencies", to: "/skill-matrix", icon: <BarChart3 className="w-4 h-4 text-white" />, bg: "bg-indigo-700" },
                { label: "Attendance", sub: "Mark today's attendance", to: "/attendance", icon: <CheckCircle2 className="w-4 h-4 text-white" />, bg: "bg-[#8B5E3C]" },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#E6DDCE] hover:border-[#9C5B3C] hover:bg-[#FAF8F5] transition-all group"
                >
                  <div className={`w-8 h-8 rounded-xl ${action.bg} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                      {action.label}
                    </div>
                    <div className="text-[10.5px] text-[#8C7E6E]">{action.sub}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8C7E6E] group-hover:text-[#9C5B3C] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
