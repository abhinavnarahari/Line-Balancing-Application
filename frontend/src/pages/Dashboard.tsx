import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, Clock, Package, Scissors, Users, ArrowRight,
  TrendingUp, Award, Activity, ChevronRight,
  RefreshCw, FileText
} from "lucide-react";
import { ordersApi, type Order } from "../features/orders/api";
import { shiftsApi as shiftApi } from "../features/shifts/api";
import { operationsApi, type Operation } from "../features/operations/api";
import { operatorsApi, type Operator } from "../features/operators/api";
import { bulletinsApi, type OperationBulletin } from "../features/bulletins/api";
import { skillApi, type SkillAssessment } from "../features/skill-matrix/api";
import { auditApi, type AuditLog } from "../lib/audit";
import { StatusBadge } from "../components/ui/PremiumUI";

function getBuyerColor(name: string) {
  const colors = [
    "bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]",
    "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]",
    "bg-[#EFE9DF] text-[#8B5E3C] border-[#D8C9B8]",
    "bg-[#E8DCC9] text-[#221912] border-[#C5B9A8]",
    "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  if (!name) return "PO";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        ordersData,
        shiftsData,
        operationsData,
        operatorsData,
        bulletinsData,
        skillData,
        logsData,
      ] = await Promise.allSettled([
        ordersApi.getOrders(),
        shiftApi.getShifts(),
        operationsApi.getOperations(),
        operatorsApi.getOperators(),
        bulletinsApi.getBulletins(),
        skillApi.getCurrentMatrix(),
        auditApi.getRecentLogs(),
      ]);

      if (ordersData.status === "fulfilled") setOrders(ordersData.value || []);
      if (shiftsData.status === "fulfilled") setShifts(shiftsData.value || []);
      if (operationsData.status === "fulfilled") setOperations(operationsData.value || []);
      if (operatorsData.status === "fulfilled") setOperators(operatorsData.value || []);
      if (bulletinsData.status === "fulfilled") setBulletins(bulletinsData.value || []);
      if (skillData.status === "fulfilled") setSkillMatrix(skillData.value || []);
      if (logsData.status === "fulfilled") setRecentLogs(logsData.value || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Calculated Executive KPIs
  const kpis = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === "IN_PRODUCTION" || o.status === "PLANNED");
    const totalPcs = orders.reduce((sum, o) => {
      const qty = o.totalQuantity || (o.sizeLines ? o.sizeLines.reduce((s, l) => s + l.quantity, 0) : 0);
      return sum + qty;
    }, 0);

    const activeShifts = shifts.filter(s => s.active);
    const activeOperators = operators.filter(o => o.active);

    const avgSmv = operations.length > 0
      ? (operations.reduce((acc, o) => acc + (o.standardSmv || 0.5), 0) / operations.length).toFixed(2)
      : "0.70";

    // Skill breakdown
    const ratings = skillMatrix.map(s => s.rating || 3);
    const avgSkill = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "4.2";

    const ratingCounts = {
      level5: ratings.filter(r => r === 5).length,
      level4: ratings.filter(r => r === 4).length,
      level3: ratings.filter(r => r === 3).length,
      level2: ratings.filter(r => r === 2).length,
      level1: ratings.filter(r => r === 1).length,
    };

    return {
      activeOrdersCount: activeOrders.length,
      totalPcs,
      activeShiftsCount: activeShifts.length,
      activeOperatorsCount: activeOperators.length,
      totalOperatorsCount: operators.length,
      totalBulletinsCount: bulletins.length,
      avgSmv,
      avgSkill,
      ratingCounts,
    };
  }, [orders, shifts, operations, operators, bulletins, skillMatrix]);

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* ── 1. Executive Plant Operations Header ───────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 sm:p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
              Plant Operations
            </span>
            <span className="text-[#E6DDCE]">/</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F3F5F2] text-[#77876F] border border-[#d4decb]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#77876F] animate-pulse" />
              Plant 1 · Sewing Floor Active
            </span>
            <span className="text-[#E6DDCE]">·</span>
            <span className="text-[11px] text-[#8C7E6E] font-mono">
              {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <h1 className="text-2xl font-black text-[#221912] tracking-tight">
            Production Overview & Line Balancing
          </h1>
          <p className="text-xs text-[#8C7E6E] font-medium max-w-2xl leading-relaxed">
            Real-time monitoring of active production orders, shift workforce allocations, takt time pacing, and line balance efficiency.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-mono font-bold text-[#221912]">
            <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} IST</span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/monitoring")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] font-bold text-xs border border-[#E6DDCE] shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Production Monitoring</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/line-balance")}
            className="px-4 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#B06C49] text-white font-bold text-xs shadow-xs shadow-[#9C5B3C]/20 transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFE5BF]" />
            <span>Line Balancing</span>
          </button>

          <button
            type="button"
            onClick={() => loadDashboardData()}
            className="p-2 rounded-xl bg-white hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] border border-[#E6DDCE] transition-colors cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9C5B3C]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 2. Executive KPI Ribbon ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Line Balancing Efficiency */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Plant Line Efficiency
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3F5F2] border border-[#d4decb] flex items-center justify-center text-[#77876F]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">82.5%</span>
              <span className="text-xs font-bold text-[#77876F] bg-[#F3F5F2] px-2 py-0.5 rounded-full border border-[#d4decb]">
                +3.2% vs target
              </span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Average line balance across active lines
            </p>
          </div>
          <div className="w-full bg-[#F6F1E8] h-2 rounded-full overflow-hidden border border-[#E6DDCE]">
            <div className="bg-[#77876F] h-full rounded-full" style={{ width: "82.5%" }} />
          </div>
        </motion.div>

        {/* Scheduled Production Volume */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Production Workload
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {kpis.totalPcs.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E]">pcs</span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium">
              Across <strong className="text-[#221912] font-mono">{kpis.activeOrdersCount}</strong> active production orders
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] flex items-center gap-1 group"
          >
            <span>Inspect Orders</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Floor Workforce Readiness */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Workforce Strength
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#EFE9DF] border border-[#D8C9B8] flex items-center justify-center text-[#8B5E3C]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {kpis.activeOperatorsCount}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E] font-mono">/ {kpis.totalOperatorsCount} active</span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium flex items-center gap-1">
              <span>Average Skill Index:</span>
              <span className="text-[#8B5E3C] font-bold font-mono">⭐ {kpis.avgSkill}</span>
            </p>
          </div>
          <Link
            to="/skill-matrix"
            className="text-xs font-bold text-[#8B5E3C] hover:text-[#221912] flex items-center gap-1 group"
          >
            <span>Skill Matrix</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Standard SMV & Operation Bulletins */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              IE Bulletins & SMV
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#E8DCC9] border border-[#C5B9A8] flex items-center justify-center text-[#221912]">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {kpis.totalBulletinsCount}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E]">OBs attached</span>
            </div>
            <p className="text-xs text-[#8C7E6E] mt-1 font-medium font-mono">
              Avg SMV: <strong className="text-[#221912]">{kpis.avgSmv} min</strong> ({(parseFloat(kpis.avgSmv) * 60).toFixed(0)}s)
            </p>
          </div>
          <Link
            to="/operation-bulletins"
            className="text-xs font-bold text-[#221912] hover:text-[#9C5B3C] flex items-center gap-1 group"
          >
            <span>View Bulletins</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* ── 3. Core Operational Cockpit (2-Column Grid) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active POs & Line Balancing Engines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Orders & Balancing Quick Cockpit */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#221912]">
                    Active Production Orders & Balancing Readiness
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]">
                    {orders.length}
                  </span>
                </div>
                <p className="text-xs text-[#8C7E6E] mt-0.5">
                  Click on any order to instantly load it into the Line Balancing calculation engine
                </p>
              </div>
              <Link
                to="/orders"
                className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] flex items-center gap-1"
              >
                <span>View All POs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#F0EAE0] mt-2">
              {orders.slice(0, 4).map((order) => {
                const totalQty = order.totalQuantity || (order.sizeLines ? order.sizeLines.reduce((s, l) => s + l.quantity, 0) : 0);

                return (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-[#FEFCF9] rounded-2xl px-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold border shadow-2xs ${getBuyerColor(order.buyer || "")}`}>
                        {getInitials(order.buyer || "")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#221912]">
                            {order.orderNo}
                          </span>
                          <span className="text-xs font-bold text-[#8C7E6E]">· {order.styleNo || `Style #${order.styleId}`}</span>
                          <StatusBadge status={order.status === "IN_PRODUCTION" ? "active" : "pending"} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C7E6E] mt-1">
                          <span>Buyer: <strong className="text-[#221912]">{order.buyer}</strong></span>
                          <span>·</span>
                          <span className="font-mono">Qty: <strong className="text-[#221912] font-bold">{totalQty.toLocaleString()} pcs</strong></span>
                          <span>·</span>
                          <span>Delivery: <strong className="text-[#221912] font-mono">{order.deliveryDate}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/line-balance?orderId=${order.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F6F1E8] hover:bg-[#9C5B3C] text-[#9C5B3C] hover:text-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-xs font-extrabold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Balance Line</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Manufacturing Modules Launchpad */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#8C7E6E]">
                Core Production & Line Balancing Modules
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Line Balancing Engine */}
              <Link
                to="/line-balance"
                className="p-5 rounded-2xl bg-white border border-[#E6DDCE] hover:border-[#9C5B3C] shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#9C5B3C] text-white flex items-center justify-center shadow-md shadow-[#9C5B3C]/25 mb-4 group-hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6 text-white fill-white" />
                  </div>
                  <h4 className="text-base font-black text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                    Line Balancing Engine
                  </h4>
                  <p className="text-xs text-[#8C7E6E] mt-1 leading-relaxed">
                    Calculate Takt Time, theoretical operator headcount, Pitch balance efficiency, and detect WIP bottlenecks with Auto-Fix.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs font-bold text-[#9C5B3C]">
                  <span>Open Line Balance Calculator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Live Production Monitoring */}
              <Link
                to="/monitoring"
                className="p-5 rounded-2xl bg-white border border-[#E6DDCE] hover:border-[#8B5E3C] shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/25 mb-4 group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-base font-black text-[#221912] group-hover:text-emerald-700 transition-colors">
                    Production Monitoring
                  </h4>
                  <p className="text-xs text-[#8C7E6E] mt-1 leading-relaxed">
                    Live execution monitor tracking hourly pitch velocity, station bottlenecks, line efficiency, and 24h floor timesheets.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Open Production Monitor</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Operator Placement & Seating */}
              <Link
                to="/operator-placement"
                className="p-5 rounded-2xl bg-white border border-[#E6DDCE] hover:border-[#77876F] shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#77876F] text-white flex items-center justify-center shadow-md shadow-[#77876F]/25 mb-4 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-base font-black text-[#221912] group-hover:text-[#77876F] transition-colors">
                    Operator Seating Placement
                  </h4>
                  <p className="text-xs text-[#8C7E6E] mt-1 leading-relaxed">
                    Visual sewing line layout mapping operators to specific machinery, station sequences, and multi-operator benches.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs font-bold text-[#77876F]">
                  <span>View Seating Plan</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Shopfloor Production Monitoring */}
              <Link
                to="/monitoring"
                className="p-5 rounded-2xl bg-white border border-[#E6DDCE] hover:border-[#0A2947] shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0A2947] text-white flex items-center justify-center shadow-md shadow-[#0A2947]/25 mb-4 group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-base font-black text-[#221912] group-hover:text-[#0A2947] transition-colors">
                    Production Monitoring
                  </h4>
                  <p className="text-xs text-[#8C7E6E] mt-1 leading-relaxed">
                    Real-time monitoring of daily line throughput, station WIP levels, and end-of-line quality inspection results.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs font-bold text-[#0A2947]">
                  <span>Open Monitoring Console</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Shifts, Skill Matrix & Activity Feed */}
        <div className="space-y-6">
          {/* Shift Capacity & Rosters Card */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9C5B3C]" />
                <h3 className="text-sm font-bold text-[#221912]">Shift Timings & Roster</h3>
              </div>
              <Link to="/settings/shifts" className="text-xs font-bold text-[#9C5B3C] hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E6DDCE] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#9C5B3C] bg-[#F6F1E8] px-2 py-0.5 rounded-md border border-[#E6DDCE]">
                        {shift.shiftCode}
                      </span>
                      <span className="text-xs font-bold text-[#221912]">{shift.shiftName}</span>
                    </div>
                    <span className="text-[11px] text-[#8C7E6E] font-mono block">
                      {shift.startTime} – {shift.endTime}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${shift.active ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]" : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]"}`}>
                    {shift.active ? "Active" : "Paused"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operator Skill Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#B48259]" />
                <h3 className="text-sm font-bold text-[#221912]">Workforce Skill Matrix</h3>
              </div>
              <Link to="/skill-matrix" className="text-xs font-bold text-[#9C5B3C] hover:underline">
                Matrix
              </Link>
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#8C7E6E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#77876F]" /> Grade 5 (Expert ⭐⭐⭐⭐⭐)
                </span>
                <span className="font-mono font-bold text-[#221912]">{kpis.ratingCounts.level5} ops</span>
              </div>
              <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
                <div className="bg-[#77876F] h-full" style={{ width: `${(kpis.ratingCounts.level5 / Math.max(operators.length, 1)) * 100}%` }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-[#8C7E6E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B3C]" /> Grade 4 (Good ⭐⭐⭐⭐)
                </span>
                <span className="font-mono font-bold text-[#221912]">{kpis.ratingCounts.level4} ops</span>
              </div>
              <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
                <div className="bg-[#9C5B3C] h-full" style={{ width: `${(kpis.ratingCounts.level4 / Math.max(operators.length, 1)) * 100}%` }} />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-[#8C7E6E] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B48259]" /> Grade 3 (Standard ⭐⭐⭐)
                </span>
                <span className="font-mono font-bold text-[#221912]">{kpis.ratingCounts.level3} ops</span>
              </div>
              <div className="w-full bg-[#F6F1E8] h-1.5 rounded-full overflow-hidden border border-[#E6DDCE]">
                <div className="bg-[#B48259] h-full" style={{ width: `${(kpis.ratingCounts.level3 / Math.max(operators.length, 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Plant Activity Feed */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE0]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C7E6E]" />
                <h3 className="text-sm font-bold text-[#221912]">Recent Plant Changes</h3>
              </div>
              <span className="text-[11px] font-mono text-[#8C7E6E]">Live Audit</span>
            </div>

            <div className="divide-y divide-[#F0EAE0] mt-2">
              {recentLogs.slice(0, 4).map((log) => {
                const actor = log.performedBy || "Admin";
                let details = log.details || `${log.action} on ${log.entityName}`;
                if (details.toLowerCase().startsWith(actor.toLowerCase())) {
                  details = details.slice(actor.length).trim();
                }

                return (
                  <div key={log.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#9C5B3C] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[#221912] font-medium leading-snug">
                        <strong className="text-[#9C5B3C] font-bold">{actor}</strong> {details}
                      </p>
                      <span className="text-[10.5px] font-mono text-[#8C7E6E]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentLogs.length === 0 && (
                <div className="py-4 text-center text-xs text-[#8C7E6E] italic">
                  No recent plant audit logs recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
