import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveWorkbook } from "../../utils/excel";
import {
  Users,
  Zap,
  Activity,
  AlertTriangle,
  Search,
  Download,
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
import { SKILL_LEVELS, clampRating } from "../skill-matrix/skillScale";
import {
  computePlantKPIs,
  computeOrderPipeline,
  computeLineStatusGrid,
  computeWorkforceSnapshot,
  computeMachineSnapshot,
  computePlantAlerts,
  computeLiveProductionSnapshot,
  type LineStatusSummary,
  type OrderPipelineItem,
  type PlantAlert,
} from "./overallDashboardMetrics";
import { toLocalDateString } from "../../utils/date";
import { cn } from "../../utils/cn";
import {
  DashboardHeader,
  MetaChip,
  HeaderButton,
  AlertRow,
  KpiCard,
  Section,
  SectionLink,
  StatusPill,
  CountBadge,
  Meter,
  SegmentTabs,
  BarList,
  BarLegend,
  EmptyHint,
  Stat,
  type BarRow,
} from "./DashboardUI";
import { TONE, type Tone } from "./dashboardTheme";

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

type OrderFilter = "all" | "active" | "critical" | "planned" | "completed";
type LineFilter = "all" | "running" | "attention" | "unplanned";

/** Filter predicates shared by the order list and the tab counts. */
function orderMatchesFilter(o: OrderPipelineItem, filter: OrderFilter): boolean {
  if (filter === "active") return o.status === "IN_PRODUCTION" || o.status === "IN-PRODUCTION";
  if (filter === "critical") return o.urgency === "critical" && o.status !== "COMPLETED";
  if (filter === "planned") return o.status === "PLANNED" || o.status === "PENDING";
  if (filter === "completed") return o.status === "COMPLETED" || o.status === "DELIVERED";
  return true;
}

/** Filter predicates shared by the line list and the tab counts. */
function lineMatchesFilter(l: LineStatusSummary, filter: LineFilter): boolean {
  if (filter === "running") return l.status === "Running";
  if (filter === "attention") return l.status === "Needs Attention" || l.status === "Ramping Up";
  if (filter === "unplanned") return l.status === "No Plan";
  return true;
}

const LINE_STATUS: Record<LineStatusSummary["status"], { tone: Tone; label: string }> = {
  Running: { tone: "good", label: "Running" },
  "Ramping Up": { tone: "warn", label: "Ramping up" },
  "Needs Attention": { tone: "critical", label: "Needs headcount" },
  "No Plan": { tone: "neutral", label: "Unplanned" },
  Maintenance: { tone: "info", label: "Maintenance" },
};

const URGENCY: Record<OrderPipelineItem["urgency"], { tone: Tone; label: string; hint: string }> = {
  critical: { tone: "critical", label: "Critical", hint: "Delivery in under 7 days" },
  high: { tone: "warn", label: "Urgent", hint: "Delivery in under 21 days" },
  normal: { tone: "neutral", label: "On track", hint: "Delivery 21+ days away" },
  completed: { tone: "good", label: "Completed", hint: "Order completed" },
};

const ALERT_TONE: Record<PlantAlert["severity"], "critical" | "warn" | "info"> = {
  critical: "critical",
  warning: "warn",
  info: "info",
};

/* ─── Local presentational helpers (same tokens as DashboardUI) ───────────────────────────────────── */

const TH = "px-3 py-2.5 text-left text-[12px] font-semibold text-[#8C7E6E] whitespace-nowrap";
const TD = "px-3 py-3 align-middle";

function SkeletonValue() {
  return <span className="inline-block h-6 w-16 rounded bg-[#F0EAE0] animate-pulse align-middle" />;
}

function AlertAction({ to, tone, children }: { to: string; tone: "critical" | "warn" | "info"; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center h-8 px-3 rounded-lg border bg-white text-[12.5px] font-semibold whitespace-nowrap transition-colors hover:bg-[#FAF7F2]",
        TONE[tone].border,
        TONE[tone].text
      )}
    >
      {children}
    </Link>
  );
}

function IconAction({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E6DDCE] bg-white text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF7F2] transition-colors cursor-pointer [&>svg]:w-3.5 [&>svg]:h-3.5"
    >
      {children}
    </button>
  );
}

/** Compact figure used inside the "Today's output" section. */
function OutputStat({ label, value, unit, children }: { label: string; value: ReactNode; unit?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div className="text-[12px] font-semibold text-[#8C7E6E]">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[22px] leading-none font-bold tracking-tight text-[#221912] tabular-nums">{value}</span>
        {unit && <span className="text-[12px] font-medium text-[#8C7E6E]">{unit}</span>}
      </div>
      {children && <div className="mt-2 text-[12px] text-[#8C7E6E] leading-snug">{children}</div>}
    </div>
  );
}

function daysLabel(days: number): string {
  if (days === 999) return "No date";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `${days}d left`;
}

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
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [lineFilter, setLineFilter] = useState<LineFilter>("all");

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
    let result = orderFilter === "all" ? orderPipeline : orderPipeline.filter((o) => orderMatchesFilter(o, orderFilter));

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          (o.buyer || "").toLowerCase().includes(q) ||
          o.styleNo.toLowerCase().includes(q) ||
          (o.bulletinCode && o.bulletinCode.toLowerCase().includes(q)) ||
          (o.assignedLineName && o.assignedLineName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orderPipeline, orderFilter, orderSearch]);

  // Filtered Lines
  const filteredLines = useMemo(
    () => (lineFilter === "all" ? lineGrid : lineGrid.filter((l) => lineMatchesFilter(l, lineFilter))),
    [lineGrid, lineFilter]
  );

  // Tab counts (presentation only — same predicates as the lists above)
  const lineFilterCounts = useMemo(() => {
    const count = (f: LineFilter) => lineGrid.filter((l) => lineMatchesFilter(l, f)).length;
    return { all: lineGrid.length, running: count("running"), attention: count("attention"), unplanned: count("unplanned") };
  }, [lineGrid]);

  const orderFilterCounts = useMemo(() => {
    const count = (f: OrderFilter) => orderPipeline.filter((o) => orderMatchesFilter(o, f)).length;
    return {
      all: orderPipeline.length,
      active: count("active"),
      critical: count("critical"),
      planned: count("planned"),
      completed: count("completed"),
    };
  }, [orderPipeline]);

  const outputRows = useMemo<BarRow[]>(
    () =>
      liveProd.perLineProduction.map((lp) => ({
        id: lp.lineId,
        label: lp.lineCode,
        sublabel: lp.isBottlenecked ? `${lp.lineName} · bottleneck` : lp.lineName,
        value: lp.actualGood,
        target: lp.targetDailyPcs,
      })),
    [liveProd.perLineProduction]
  );

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

    const todayStr = toLocalDateString();
    void saveWorkbook(wb, `Factory_Overview_Report_${todayStr}.xlsx`);
  };

  const activeLineCount = lines.filter((l) => l.active !== false).length;
  const kv = (v: ReactNode) => (loading ? <SkeletonValue /> : v);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <DashboardHeader
        title="Factory Overview"
        subtitle={<>Orders, lines & workforce · <span className="tabular-nums">{kpis.activeShiftTiming}</span></>}
        meta={
          <>
            <MetaChip tone="good" title="Live data, refreshed every 15 seconds">Live · syncs every 15s</MetaChip>
            {criticalCount > 0 && (
              <MetaChip tone="critical">
                {criticalCount} critical delivery risk{criticalCount !== 1 ? "s" : ""}
              </MetaChip>
            )}
          </>
        }
        actions={
          <>
            <HeaderButton variant="primary" to="/line-balance" icon={<Zap className="w-3.5 h-3.5" />}>
              Line balancing
            </HeaderButton>
            <HeaderButton to="/monitoring" icon={<Activity className="w-3.5 h-3.5" />}>
              Live monitoring
            </HeaderButton>
            <HeaderButton to="/operator-placement" icon={<Users className="w-3.5 h-3.5" />}>
              Operator placement
            </HeaderButton>
            <HeaderButton
              onClick={handleExportExcel}
              icon={<Download className="w-3.5 h-3.5" />}
              title="Export full executive factory report to Excel"
            >
              Export Excel
            </HeaderButton>
          </>
        }
        onRefresh={onRefresh}
        refreshing={loading}
      />

      {/* ── 2. Alerts ─────────────────────────────────────────────────── */}
      {plantAlerts.length > 0 && (
        <div className="space-y-2">
          {plantAlerts.slice(0, 2).map((alert) => {
            const tone = ALERT_TONE[alert.severity];
            return (
              <AlertRow
                key={alert.id}
                tone={tone}
                icon={<AlertTriangle className="w-4 h-4" />}
                title={alert.title}
                action={<AlertAction to={alert.actionHref} tone={tone}>{alert.actionText}</AlertAction>}
              >
                {alert.description}
              </AlertRow>
            );
          })}
        </div>
      )}

      {/* ── 3. KPI row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Active orders"
          value={kv(kpis.activeOrders)}
          caption={`${kpis.totalOrders} total · ${kpis.plannedOrders} planned`}
          to="/orders"
        />
        <KpiCard
          label="Active lines"
          value={kv(`${kpis.runningLines}/${kpis.activeLines}`)}
          caption={`${kpis.totalLines} lines in factory`}
          to="/settings/lines"
        />
        <KpiCard
          label="Plant efficiency"
          value={kv(`${kpis.avgLineEfficiency}%`)}
          caption={`${kpis.effectiveBulletins} active OBs`}
          progress={kpis.avgLineEfficiency}
          to="/operation-bulletins"
        />
        <KpiCard
          label="Floor workforce"
          value={kv(`${workforce.presentToday}/${workforce.totalActive}`)}
          caption={`${workforce.floaterPoolCount} floaters ready`}
          to="/skill-matrix"
        />
        <KpiCard
          label="Line manning"
          value={kv(kpis.manningFulfillmentPercent > 0 ? `${kpis.manningFulfillmentPercent}%` : "—")}
          caption={`${kpis.totalDeployedAcrossLines}/${kpis.totalRequiredAcrossLines} seated`}
          progress={kpis.manningFulfillmentPercent}
          to="/operator-placement"
        />
        <KpiCard
          label="Planned pieces"
          value={kv(kpis.totalPlannedPcs > 0 ? kpis.totalPlannedPcs.toLocaleString() : "—")}
          caption={`${kpis.completedOrders} orders shipped`}
          to="/orders"
        />
      </div>

      {/* ── 4. Today's output + workforce ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Section
          className="xl:col-span-2"
          title="Today's output vs target"
          subtitle="Good pieces logged on the floor against each line's shift target"
          actions={
<SectionLink to="/monitoring">Detailed floor boards</SectionLink>
          }
          flush
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#F0EAE0] divide-x divide-[#F0EAE0]">
            <OutputStat label="Good pieces" value={liveProd.totalGoodToday.toLocaleString()} unit="pcs">
              {liveProd.totalRejectToday > 0 ? `${liveProd.totalRejectToday} rejects logged` : "0 defect rejects"}
            </OutputStat>
            <OutputStat label="Shift target" value={liveProd.dailyPlannedTarget.toLocaleString()} unit="pcs">
              Across {activeLineCount} active lines
            </OutputStat>
            <OutputStat label="Attainment" value={`${liveProd.targetAttainmentPercent}%`}>
              <Meter value={liveProd.targetAttainmentPercent} className="mt-1" />
            </OutputStat>
            <OutputStat label="Hourly run-rate" value={liveProd.liveHourlyRunRate} unit="pcs/hr">
              Per elapsed hour
            </OutputStat>
          </div>
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[12px] font-semibold text-[#8C7E6E]">By line</span>
              <BarLegend unit="pcs" />
            </div>
            <BarList rows={outputRows} unit="pcs" emptyText="No lines have a shift target yet" />
          </div>
        </Section>

        <Section title="Workforce & skills" actions={<SectionLink to="/skill-matrix">Skill matrix</SectionLink>}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-2.5">
              {[
                { label: "Total active", value: workforce.totalActive },
                { label: "Present today", value: workforce.presentToday },
                { label: "Avg skill level", value: `L${workforce.avgSkillRating} / 4` },
                { label: "Floater pool", value: workforce.floaterPoolCount },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-[#FAF7F2] border border-[#F0EAE0] px-3 py-2.5">
                  <Stat label={m.label}>
                    <span className="text-[17px] font-bold tracking-tight">{m.value}</span>
                  </Stat>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[12px] font-semibold text-[#8C7E6E]">Deployment</span>
                <span className="text-[12px] text-[#8C7E6E] tabular-nums">{workforce.seatedPercent}% on production lines</span>
              </div>
              <div
                className="flex h-2.5 w-full rounded-full overflow-hidden bg-[#EFE8DD]"
                role="img"
                aria-label={`${workforce.seatedCount} seated on lines, ${workforce.unallocatedCount} floaters`}
              >
                <div className="h-full bg-[#9C5B3C]" style={{ width: `${workforce.seatedPercent}%` }} title={`${workforce.seatedPercent}% seated`} />
                <div
                  className="h-full bg-[#DDBFA6]"
                  style={{ width: `${100 - workforce.seatedPercent}%` }}
                  title={`${100 - workforce.seatedPercent}% floater / available`}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#5C4D3E]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#9C5B3C]" />
                  Seated on lines <strong className="font-semibold text-[#221912] tabular-nums">{workforce.seatedCount}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DDBFA6]" />
                  Floaters / buffer <strong className="font-semibold text-[#221912] tabular-nums">{workforce.unallocatedCount}</strong>
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2.5">
                <span className="text-[12px] font-semibold text-[#8C7E6E]">Skill rating distribution</span>
                <span className="text-[12px] text-[#8C7E6E] tabular-nums">{workforce.totalCertifiedOperations} ratings</span>
              </div>
              <ul className="space-y-2.5">
                {workforce.skillDistribution.map((s) => (
                  <li key={s.rating}>
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px] mb-1">
                      <span className="min-w-0 truncate">
                        <strong className="font-semibold text-[#221912]">L{s.rating}</strong>
                        <span className="text-[#8C7E6E]"> · {SKILL_LEVELS[clampRating(s.rating)].name}</span>
                      </span>
                      <span className="tabular-nums text-[#221912] font-semibold whitespace-nowrap">
                        {s.count}
                        <span className="font-normal text-[#8C7E6E]"> · {s.percentage}%</span>
                      </span>
                    </div>
                    <Meter value={s.percentage} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* ── 5. Sewing lines ──────────────────────────────────────────── */}
      <Section
        title="Sewing lines"
        badge={<CountBadge>{lineGrid.length}</CountBadge>}
        actions={
          <SegmentTabs<LineFilter>
            value={lineFilter}
            onChange={setLineFilter}
            options={[
              { value: "all", label: "All", count: lineFilterCounts.all },
              { value: "running", label: "Running", count: lineFilterCounts.running },
              { value: "attention", label: "Needs manning", count: lineFilterCounts.attention },
              { value: "unplanned", label: "Unplanned", count: lineFilterCounts.unplanned },
            ]}
          />
        }
        flush
      >
        {filteredLines.length === 0 ? (
          <EmptyHint title="No sewing lines match the selected filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-[#FAF7F2] border-b border-[#F0EAE0]">
                <tr>
                  <th className={cn(TH, "pl-5")}>Line</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Order / style</th>
                  <th className={TH}>Manning</th>
                  <th className={cn(TH, "text-right")}>Target eff.</th>
                  <th className={cn(TH, "pr-5 text-right")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {filteredLines.map((line) => {
                  const st = LINE_STATUS[line.status] ?? LINE_STATUS["No Plan"];
                  const lineProd = liveProd.perLineProduction.find((p) => String(p.lineId) === String(line.lineId));
                  return (
                    <tr key={line.lineId} className="hover:bg-[#FDFBF8] transition-colors">
                      <td className={cn(TD, "pl-5")}>
                        <div className="font-semibold text-[#221912] whitespace-nowrap">{line.lineCode}</div>
                        <div className="text-[12px] text-[#8C7E6E] truncate max-w-[260px]" title={line.lineName}>
                          {line.lineName}
                          {line.lineType ? ` · ${line.lineType}` : ""}
                        </div>
                      </td>
                      <td className={TD}>
                        <div className="flex flex-col items-start gap-1">
                          <StatusPill tone={st.tone}>{st.label}</StatusPill>
                          {line.bottleneckCount > 0 && (
                            <span className="text-[11.5px] font-semibold text-rose-700">
                              {line.bottleneckCount} bottleneck{line.bottleneckCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={TD}>
                        {line.hasPlan ? (
                          <>
                            <div className="font-semibold text-[#221912] tabular-nums whitespace-nowrap">{line.activeOrderNo}</div>
                            <div className="text-[12px] text-[#8C7E6E] truncate max-w-[240px]">
                              {line.styleNo}
                              {line.buyer && line.buyer !== "—" ? ` · ${line.buyer}` : ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-[12.5px] text-[#A89A8A] whitespace-nowrap">No order assigned</span>
                        )}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-3">
                          <Meter value={line.manningPercent} className="w-24 shrink-0" />
                          <span className="tabular-nums font-semibold text-[#221912] whitespace-nowrap">
                            {line.operatorsDeployed}/{line.operatorsRequired}
                          </span>
                          <span className="tabular-nums text-[12px] text-[#8C7E6E] w-10">{line.manningPercent}%</span>
                        </div>
                      </td>
                      <td className={cn(TD, "text-right")}>
                        <div className="tabular-nums font-semibold text-[#221912]">{line.designEfficiency}%</div>
                        {lineProd && lineProd.actualGood > 0 && (
                          <div className="tabular-nums text-[12px] text-[#8C7E6E] whitespace-nowrap">
                            {lineProd.actualGood.toLocaleString()} pcs today
                          </div>
                        )}
                      </td>
                      <td className={cn(TD, "pr-5")}>
                        <div className="flex items-center justify-end gap-1.5">
                          <IconAction title="Balance this line" onClick={() => navigate(`/line-balance?lineId=${line.lineId}`)}>
                            <Zap />
                          </IconAction>
                          <IconAction title="Live Monitoring" onClick={() => navigate(`/monitoring?lineId=${line.lineId}`)}>
                            <Activity />
                          </IconAction>
                          <IconAction title="Assign Operators" onClick={() => navigate(`/operator-placement`)}>
                            <Users />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── 6. Orders & delivery readiness ───────────────────────────── */}
      <Section
        title="Orders & delivery readiness"
        badge={
          <>
            <CountBadge>{orderPipeline.length}</CountBadge>
            {criticalCount > 0 && <StatusPill tone="critical">{criticalCount} critical</StatusPill>}
          </>
        }
        flush
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#F0EAE0]">
          <SegmentTabs<OrderFilter>
            value={orderFilter}
            onChange={setOrderFilter}
            options={[
              { value: "all", label: "All", count: orderFilterCounts.all },
              { value: "active", label: "In production", count: orderFilterCounts.active },
              { value: "critical", label: "Critical", count: orderFilterCounts.critical },
              { value: "planned", label: "Planned", count: orderFilterCounts.planned },
              { value: "completed", label: "Done", count: orderFilterCounts.completed },
            ]}
          />
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#B5A897] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order, buyer, style, line or bulletin"
              aria-label="Search orders"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-[#E6DDCE] text-[13px] text-[#221912] placeholder-[#A89A8A] focus:outline-none focus:border-[#9C5B3C] focus:ring-2 focus:ring-[#9C5B3C]/15"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyHint title="No orders match the selected search or filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-[13px]">
              <thead className="bg-[#FAF7F2] border-b border-[#F0EAE0]">
                <tr>
                  <th className={cn(TH, "pl-5")}>Order</th>
                  <th className={TH}>Style</th>
                  <th className={TH}>Buyer</th>
                  <th className={cn(TH, "text-right")}>Qty (pcs)</th>
                  <th className={TH}>Delivery</th>
                  <th className={TH}>Bulletin</th>
                  <th className={TH}>Line plan</th>
                  <th className={cn(TH, "pr-5 text-right")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {filteredOrders.slice(0, 10).map((order) => {
                  const urg = URGENCY[order.urgency] ?? URGENCY.normal;
                  const overdue = order.daysUntilDelivery !== 999 && order.daysUntilDelivery < 0;
                  return (
                    <tr key={order.id} className="hover:bg-[#FDFBF8] transition-colors">
                      <td className={cn(TD, "pl-5 font-semibold text-[#221912] tabular-nums whitespace-nowrap")}>{order.orderNo}</td>
                      <td className={cn(TD, "text-[#221912] whitespace-nowrap")}>{order.styleNo}</td>
                      <td className={cn(TD, "text-[#5C4D3E]")}>
                        <span className="block truncate max-w-[160px]" title={order.buyer}>{order.buyer}</span>
                      </td>
                      <td className={cn(TD, "text-right tabular-nums font-semibold text-[#221912]")}>
                        {order.totalQuantity.toLocaleString()}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <div>
                            <div className="tabular-nums text-[#221912]">{order.deliveryDate}</div>
                            <div className={cn("text-[12px] tabular-nums", overdue ? "text-rose-700 font-semibold" : "text-[#8C7E6E]")}>
                              {daysLabel(order.daysUntilDelivery)}
                            </div>
                          </div>
                          <StatusPill tone={urg.tone} title={urg.hint}>{urg.label}</StatusPill>
                        </div>
                      </td>
                      <td className={TD}>
                        {order.hasOB ? (
                          <StatusPill
                            tone="good"
                            title={order.bulletinCode ? `Linked to ${order.bulletinCode}` : "Operation Bulletin linked"}
                          >
                            {order.bulletinCode || "OB linked"}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="critical" title="No Operation Bulletin linked">No OB</StatusPill>
                        )}
                      </td>
                      <td className={TD}>
                        {order.hasPlan ? (
                          <StatusPill tone="good" title={order.assignedLineName ?? "Line plan ready"}>
                            {order.assignedLineCode || order.assignedLineName || "Assigned"}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="warn">Unplanned</StatusPill>
                        )}
                      </td>
                      <td className={cn(TD, "pr-5 text-right")}>
                        <button
                          type="button"
                          title="Balance this order in the Line Balancing Engine"
                          onClick={() => navigate(`/line-balance?orderId=${order.id}`)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E6DDCE] bg-white text-[12.5px] font-semibold text-[#5C4D3E] hover:text-[#221912] hover:bg-[#FAF7F2] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Balance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredOrders.length > 10 && (
          <div className="px-5 py-3 border-t border-[#F0EAE0] text-center">
            <SectionLink to="/orders">View all {filteredOrders.length} orders in the order directory</SectionLink>
          </div>
        )}
      </Section>
    </div>
  );
}
