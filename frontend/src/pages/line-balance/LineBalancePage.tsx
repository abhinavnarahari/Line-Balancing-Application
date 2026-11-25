import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PlanSetupChain } from "../../features/line-balance/PlanSetupChain";
import { YamazumiChart } from "../../features/line-balance/YamazumiChart";
import { flowThroughStations } from "../../features/line-balance/stationFlow";
import { ExcelImportDialog } from "../../components/ui/ExcelImportDialog";
import { LINE_PLAN_TEMPLATE, applyLinePlanRows, pickPlanBlock } from "../../features/line-balance/linePlanImport";
import { readFromExcel } from "../../utils/excel";
import * as XLSX from "xlsx";
import { lineRunsStyle, lineStyleNo } from "../../features/lines/lineStyle";
import { ordersForLine, bestOrderForLine, orderFitForLine, checkPlanSave, type SelectionContext } from "../../features/line-balance/planSelection";
import {
  CheckCircle2, ChevronDown, Sparkles,
  Plus, Minus, X, Activity, Clock, ShieldAlert,
  Check, RefreshCw, Zap, Users, Cpu, Download, RotateCcw,
  Filter, Calendar, CalendarClock,
  Gauge, TrendingUp, Layers, AlertTriangle,
  Network, Upload, Save
} from "lucide-react";
import { operationsApi, type Operation, type OperationAffinity } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { skillApi, cycleTimeToRating, type SkillAssessment, type PerformanceLog } from "../../features/skill-matrix/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../../features/production-logs/api";
import { notificationsApi } from "../../features/notifications/api";
import type { Shift } from "../../features/shifts/types";
import { DataCard } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { OperatorCombobox } from "../../components/ui/OperatorCombobox";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { exportToExcel } from "../../utils/excel";
import { lineDesignApi, type LineDesign } from "../../features/linedesign/api";
import { 
  getAppliedBulletinScenarioForLine, 
  SCENARIO_APPLIED_EVENT 
} from "../../features/bulletins/bulletinScenarioStore";
import { runGlobalPoolOptimization, relativeSkillSpeed } from "../../features/line-balance/globalPoolOptimizer";
import { clampRating, INDEPENDENT_RATING, MAX_SKILL_RATING, MIN_SKILL_RATING, SKILL_LEVELS, SKILL_RATINGS } from "../../features/skill-matrix/skillScale";
import { SkillLevelIcon } from "../../components/ui/SkillLevelIcon";
import { useMasterDataSubscription } from "../../utils/masterDataEvents";
import { toLocalDateString } from "../../utils/date";
import { loadFailed } from "../../components/common/GlobalErrorToaster";
import { usePolling } from "../../utils/usePolling";
import { toAllocationCounts } from "../../features/line-balance/allocations";


// ─── Station Row Interface ───────────────────────────────────────────────────
interface StationRow {
  stationNum: number;
  bulletinLineId?: string | number | null;
  operationId: string | number;
  operationCode: string;
  operationName: string;
  machineType: string;
  smvSeconds: number;
  operatorIds: (string | number | null)[];
  isQcCheckpoint?: boolean;
  requiredSkillRating?: number | string;
  wipThreshold?: number;
  actualOutput?: number;
}

interface LineBalancePageProps {
  fixedMode?: "DELIVERY" | "SHIFT_TARGET";
}

export function LineBalancePage({ fixedMode }: LineBalancePageProps = {}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const paramOrderId = searchParams.get("orderId");
  const paramLineId = searchParams.get("lineId");
  const paramShiftId = searchParams.get("shiftId");
  const paramBulletinId = searchParams.get("bulletinId");
  const paramMode = searchParams.get("mode") || searchParams.get("taktMode");
  const paramLineDesignId = searchParams.get("lineDesignId");

  const isFixedShiftRoute = fixedMode === "SHIFT_TARGET" || location.pathname.includes("fixed-shift") || location.pathname.includes("shift-target");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoBalancing, setAutoBalancing] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Master Data
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [affinities, setAffinities] = useState<OperationAffinity[]>([]);

  // Selections
  const [selectedOrderId, setSelectedOrderId] = useState<string>(paramOrderId || "");
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>(paramBulletinId || "");
  const [selectedShiftId, setSelectedShiftId] = useState<string>(paramShiftId || "");
  const [selectedLineId, setSelectedLineId] = useState<string>(paramLineId || "");
  const [customShiftTarget, setCustomShiftTarget] = useState<number | null>(null);
  const [plannedEfficiency, setPlannedEfficiency] = useState<number>(80); // Expected Line Efficiency % (IE standard 80.0%)
  const [activeLineDesign, setActiveLineDesign] = useState<LineDesign | null>(null);
  const [allLineDesigns, setAllLineDesigns] = useState<LineDesign[]>([]);

  // Takt Time Calculation Strategy
  const [taktMode, setTaktMode] = useState<"DELIVERY" | "SHIFT_TARGET">(() => {
    if (fixedMode) return fixedMode;
    if (isFixedShiftRoute) return "SHIFT_TARGET";
    if (paramMode?.toUpperCase() === "SHIFT_TARGET" || paramMode?.toUpperCase() === "FIXED" || paramMode?.toUpperCase() === "SHIFT") {
      return "SHIFT_TARGET";
    }
    return "DELIVERY";
  });

  // A design opened from the URL (?lineDesignId=) sets the selections once; the user can then change them freely.
  useEffect(() => {
    if (!paramLineDesignId) return;
    lineDesignApi.getDesignById(paramLineDesignId).then(design => {
      if (design) {
        setActiveLineDesign(design);
        if (design.orderId) setSelectedOrderId(String(design.orderId));
        if (design.lineId) setSelectedLineId(String(design.lineId));
        if (design.shiftId) setSelectedShiftId(String(design.shiftId));
        if (design.bulletinId) setSelectedBulletinId(String(design.bulletinId));
        setPlannedEfficiency(Number(design.plannedEfficiency || 80));
      }
    }).catch(err => console.warn("Failed to load line design:", err));
  }, [paramLineDesignId]);

  // The active design must belong to the selected order AND line (a design without a line fits any line).
  // Never fall back to another line's design: its pitch and allocations would drive this line, and saving would overwrite it.
  useEffect(() => {
    const fits = (d: LineDesign) =>
      String(d.orderId) === String(selectedOrderId) && (!d.lineId || !selectedLineId || String(d.lineId) === String(selectedLineId));
    if (activeLineDesign && fits(activeLineDesign)) return;
    const match = selectedOrderId ? allLineDesigns.find(fits) ?? null : null;
    if (match?.id === activeLineDesign?.id) return;
    setActiveLineDesign(match);
    setPlannedEfficiency(Number(match?.plannedEfficiency || 80));
  }, [selectedOrderId, selectedLineId, allLineDesigns, activeLineDesign]);

  useEffect(() => {
    if (fixedMode) {
      setTaktMode(fixedMode);
    } else if (isFixedShiftRoute) {
      setTaktMode("SHIFT_TARGET");
    } else if (paramMode?.toUpperCase() === "SHIFT_TARGET" || paramMode?.toUpperCase() === "FIXED" || paramMode?.toUpperCase() === "SHIFT") {
      setTaktMode("SHIFT_TARGET");
    } else if (paramMode?.toUpperCase() === "DELIVERY" || paramMode?.toUpperCase() === "PLANNED") {
      setTaktMode("DELIVERY");
    }
  }, [fixedMode, isFixedShiftRoute, paramMode]);

  useEffect(() => {
    if (paramOrderId) setSelectedOrderId(paramOrderId);
    if (paramLineId) setSelectedLineId(paramLineId);
    if (paramShiftId) setSelectedShiftId(paramShiftId);
    if (paramBulletinId) setSelectedBulletinId(paramBulletinId);
  }, [paramOrderId, paramLineId, paramShiftId, paramBulletinId]);

  const [workDaysOnly, setWorkDaysOnly] = useState<boolean>(true); // 6-day factory week (excl Sundays)

  // Live ticking clock for real-time delivery countdown & live second-by-second takt pacing
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Attendance Constraints
  const [filterPresentOnly, setFilterPresentOnly] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [allPieceLogs, setAllPieceLogs] = useState<PieceProductionLog[]>([]);
  /** Runs recorded without an order (from the full load): they don't count toward any order, so they are reported */
  const [orderlessLogs, setOrderlessLogs] = useState<PieceProductionLog[]>([]);
  const [allLinePlans, setAllLinePlans] = useState<LinePlan[]>([]);

  // Station Rows
  const [stations, setStationRows] = useState<StationRow[]>([]);
  // True once the user edits stations; cleared when stations are rebuilt, saved or reset
  const stationsDirtyRef = useRef(false);
  const builtSelectionKeyRef = useRef("");
  const setStations: typeof setStationRows = (update) => {
    stationsDirtyRef.current = true;
    setStationRows(update);
  };

  const fetchAll = useCallback(async () => {
    try {
      const today = toLocalDateString();
      const [ops, oprs, shfts, ords, bulls, skills, lns, atts, ts, logs, plans, affs, designs, perfLogs] = await Promise.all([
        operationsApi.getOperations().catch(loadFailed([])),
        operatorsApi.getOperators().catch(loadFailed([])),
        shiftsApi.getShifts().catch(loadFailed([])),
        ordersApi.getOrders().catch(loadFailed([])),
        bulletinsApi.getBulletins().catch(loadFailed([])),
        skillApi.getCurrentMatrix().catch(loadFailed([])),
        linesApi.getLines(true).catch(loadFailed([])),
        attendanceApi.getAttendanceByDate(today).catch(loadFailed([])),
        pieceProductionApi.get24hTimesheet(today).catch(loadFailed([])),
        pieceProductionApi.getLogs().catch(loadFailed([])),
        linePlanApi.getAllPlans().catch(loadFailed([])),
        operationsApi.getAllAffinities().catch(loadFailed([])),
        lineDesignApi.getDesigns().catch(loadFailed([])),
        skillApi.getPerformanceLogs().catch(loadFailed([])),
      ]);
      setOperations(ops || []);
      // Only machine operators (dedicated sewers and floaters) can be assigned to operations
      // Non-machine workforce (Quality Checkers, Helpers, Supervisors) cannot be assigned to operations
      setOperators((oprs || []).filter(o => o && o.active && (o.role === "OPERATOR" || o.role === "FLOATER" || !o.role)));
      setSkillAssessments(skills || []);
      setPerformanceLogs(perfLogs || []);
      setAffinities(affs || []);
      setLines(lns || []);
      setAttendanceRecords(atts || []);
      setTimesheetData(ts || []);
      setAllPieceLogs(logs || []);
      setOrderlessLogs((logs || []).filter(l => !l.orderId));
      setAllLinePlans(plans || []);
      setAllLineDesigns(designs || []);

      if (lns && lns.length > 0) {
        setSelectedLineId(prev => {
          if (prev && lns.some(l => String(l.id) === String(prev))) return prev;
          const matchLine = paramLineId ? lns.find(l => String(l.id) === String(paramLineId)) : null;
          return String((matchLine || lns[0]).id);
        });
      }

      const activeShifts = (shfts || []).filter(s => s.active);
      setShifts(activeShifts);
      if (activeShifts.length > 0) {
        setSelectedShiftId(prev => {
          if (prev && activeShifts.some(s => String(s.id) === String(prev))) return prev;
          const matchShift = paramShiftId ? activeShifts.find(s => String(s.id) === String(paramShiftId)) : null;
          return String((matchShift || activeShifts[0]).id);
        });
      }

      setOrders(ords || []);
      setBulletins(bulls || []);

      if (ords && ords.length > 0) {
        setSelectedOrderId(prev => {
          if (prev && ords.some(o => String(o.id) === String(prev))) return prev;
          const match = paramOrderId ? ords.find(o => String(o.id) === String(paramOrderId)) : null;
          const initialOrder = match || ords[0];
          return String(initialOrder.id);
        });
      }
    } catch (err) {
      console.error("Failed to fetch line balance dependencies:", err);
    } finally {
      setLoading(false);
    }
  }, [paramOrderId, paramLineId, paramShiftId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live floor refresh (paused while hidden). With an order selected only that order's logs are fetched —
  // cumulative progress needs every date, but not every order's history on each tick.
  usePolling(async (isCurrent) => {
    const today = toLocalDateString();
    const [logs, ts, atts] = await Promise.all([
      (selectedOrderId ? pieceProductionApi.getLogsByOrder(selectedOrderId) : pieceProductionApi.getLogs()).catch(() => null),
      pieceProductionApi.get24hTimesheet(today).catch(() => null),
      attendanceApi.getAttendanceByDate(today).catch(() => null),
    ]);
    if (!isCurrent()) return;
    if (logs) setAllPieceLogs(logs);
    if (ts) setTimesheetData(ts);
    if (atts) setAttendanceRecords(atts);
  }, 15000, [selectedOrderId]);

  // App-wide Master Data sync
  useMasterDataSubscription(["shift", "operation", "operator", "line", "bulletin", "order", "attendance", "all"], fetchAll);

  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);
  const selectedShift = useMemo(() => shifts.find(s => String(s.id) === String(selectedShiftId)), [shifts, selectedShiftId]);
  const selectedLine = useMemo(() => lines.find(l => String(l.id) === String(selectedLineId)), [lines, selectedLineId]);

  const selectedBulletin = useMemo(() => {
    if (selectedBulletinId) {
      const match = bulletins.find(b => String(b.id) === String(selectedBulletinId) || b.bulletinCode === selectedBulletinId);
      if (match) return match;
    }
    if (!selectedOrder) return null;
    // 1. By styleId
    const byStyle = bulletins.find(b => (b.styles || []).some(s => String(s.id) === String(selectedOrder.styleId)));
    if (byStyle) return byStyle;
    // 2. By styleNo
    const byStyleNo = bulletins.find(b => (b.styles || []).some(s => s.styleNo?.toLowerCase() === selectedOrder.styleNo?.toLowerCase()));
    if (byStyleNo) return byStyleNo;
    return null;
  }, [bulletins, selectedOrder, selectedBulletinId]);

  // Bulletins linked to the selected order's style: the only link from an order to its operations
  const bulletinsForOrderStyle = useMemo(() => {
    if (!selectedOrder) return [];
    return bulletins.filter(b => (b.styles || []).some(s =>
      String(s.id) === String(selectedOrder.styleId) ||
      (s.styleNo && selectedOrder.styleNo && s.styleNo.toLowerCase() === selectedOrder.styleNo.toLowerCase())));
  }, [bulletins, selectedOrder]);

  // How many open orders are already planned on each line (completed orders don't count)
  const planCountByLine = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of allLinePlans) {
      if (!p.lineId) continue;
      const o = orders.find(x => String(x.id) === String(p.orderId));
      if (o?.status === "COMPLETED") continue;
      counts.set(String(p.lineId), (counts.get(String(p.lineId)) ?? 0) + 1);
    }
    return counts;
  }, [allLinePlans, orders]);

  /** Lines set up for a style, least loaded first (then by line code). */
  const linesForStyle = useCallback((styleNo?: string | null) =>
    lines
      .filter(l => lineRunsStyle(l, styleNo))
      .sort((a, b) => (planCountByLine.get(String(a.id)) ?? 0) - (planCountByLine.get(String(b.id)) ?? 0)
        || String(a.lineCode).localeCompare(String(b.lineCode), undefined, { numeric: true })),
  [lines, planCountByLine]);

  const selectedOrderPlan = useMemo(
    () => allLinePlans.find(p => String(p.orderId) === String(selectedOrderId) && p.lineId) ?? null,
    [allLinePlans, selectedOrderId]);

  // ── Line ↔ order validation (style is the link; one plan per order) ──
  const selectionCtx: SelectionContext = useMemo(() => ({
    plans: allLinePlans,
    lines: lines.map(l => ({ id: l.id, lineCode: String(l.lineCode), currentStyle: l.currentStyle })),
    styleHasBulletin: (styleId, styleNo) => bulletins.some(b => (b.styles || []).some(st =>
      String(st.id) === String(styleId) || (!!styleNo && st.styleNo?.toLowerCase() === styleNo.toLowerCase()))),
  }), [allLinePlans, lines, bulletins]);

  /** Orders offered for the selected line (its style's orders; the ones that can't be picked are greyed out with a reason). */
  const orderChoicesForLine = useMemo(
    () => ordersForLine(orders.map(o => ({ ...o, id: o.id, styleNo: o.styleNo, styleId: o.styleId })), selectedLine ? { id: selectedLine.id, lineCode: String(selectedLine.lineCode), currentStyle: selectedLine.currentStyle } : undefined, selectionCtx),
    [orders, selectedLine, selectionCtx]);

  /** Picking a line: keep the order if it belongs on that line, otherwise show the line's planned / most urgent order. */
  const handleLineChange = (lineId: string) => {
    const line = lines.find(l => String(l.id) === String(lineId));
    const selLine = line ? { id: line.id, lineCode: String(line.lineCode), currentStyle: line.currentStyle } : undefined;
    setSelectedLineId(lineId);
    const current = orders.find(o => String(o.id) === String(selectedOrderId));
    if (current && orderFitForLine(current, selLine, selectionCtx).selectable) return;
    const best = bestOrderForLine(orders, selLine, selectionCtx);
    const nextId = best?.id !== undefined ? String(best.id) : "";
    lineFollowedOrderRef.current = nextId; // the line was chosen by the user: don't move it to follow the order
    setSelectedOrderId(nextId);
  };

  // The line follows the order: when an order with a saved plan is picked, show the line it was planned on
  const lineFollowedOrderRef = useRef<string>("");
  useEffect(() => {
    if (!selectedOrderId || lineFollowedOrderRef.current === selectedOrderId) return;
    const plan = allLinePlans.find(p => String(p.orderId) === String(selectedOrderId) && p.lineId);
    if (loading || lines.length === 0) return; // wait until orders, lines and plans are loaded
    lineFollowedOrderRef.current = selectedOrderId;
    const isFirstFromUrl = paramOrderId && paramLineId && String(paramOrderId) === String(selectedOrderId);
    if (isFirstFromUrl) return;
    if (plan?.lineId && lines.some(l => String(l.id) === String(plan.lineId))) {
      setSelectedLineId(String(plan.lineId));
      return;
    }
    // Not planned yet: stay on the current line if it runs the order's style; otherwise suggest the least-loaded
    // line set up for that style (Sewing Lines → Active Style)
    const order = orders.find(o => String(o.id) === String(selectedOrderId));
    const current = lines.find(l => String(l.id) === String(selectedLineId));
    if (order?.styleNo && lineRunsStyle(current, order.styleNo)) return;
    const best = linesForStyle(order?.styleNo)[0];
    if (best) setSelectedLineId(String(best.id));
  }, [selectedOrderId, allLinePlans, lines, orders, loading, paramOrderId, paramLineId, linesForStyle]);

  // If paramBulletinId is present, auto-select matching order
  useEffect(() => {
    if (paramBulletinId && bulletins.length > 0) {
      setSelectedBulletinId(paramBulletinId);
      const b = bulletins.find(x => String(x.id) === String(paramBulletinId) || x.bulletinCode === paramBulletinId);
      if (b && b.styles && b.styles.length > 0) {
        const styleIds = b.styles.map(s => String(s.id));
        const styleNos = b.styles.map(s => s.styleNo?.toLowerCase()).filter(Boolean);
        const matchingOrder = orders.find(o =>
          styleIds.includes(String(o.styleId)) ||
          (o.styleNo && styleNos.includes(o.styleNo.toLowerCase()))
        );
        if (matchingOrder) {
          setSelectedOrderId(String(matchingOrder.id));
        }
      }
    }
  }, [paramBulletinId, bulletins, orders]);

  // When order changes and no explicit bulletinId was forced via URL, auto-align selectedBulletinId
  useEffect(() => {
    if (selectedOrder && bulletins.length > 0 && !paramBulletinId) {
      const b = bulletins.find(x =>
        (x.styles || []).some(s => String(s.id) === String(selectedOrder.styleId) || (s.styleNo && s.styleNo.toLowerCase() === selectedOrder.styleNo?.toLowerCase()))
      );
      // No bulletin for this order's style: clear it rather than keep showing (and saving) the previous style's operations
      setSelectedBulletinId(b ? String(b.id) : "");
    }
  }, [selectedOrder, bulletins, paramBulletinId]);





  // Attendance status helper for today
  const getOperatorAttendance = (opId: string | number | null): string | null => {
    if (!opId) return null;
    const rec = attendanceRecords.find(a => String(a.operatorId) === String(opId));
    return rec?.status || "PRESENT"; // Default to present if not marked
  };

  const presentOperatorCount = useMemo(() => {
    return operators.filter(op => {
      const st = getOperatorAttendance(op.id);
      return st === "PRESENT" || st === "LATE";
    }).length;
  }, [operators, attendanceRecords]);

  useEffect(() => {
    // Master-data refreshes (any tab, e.g. attendance) re-run this effect with new object references.
    // Rebuild only when the selection itself changed or there are no unsaved edits, so manual work is not lost.
    const selectionKey = `${selectedOrder?.id ?? ""}|${selectedBulletin?.id ?? ""}|${selectedLineId}|${activeLineDesign?.id ?? ""}`;
    if (stationsDirtyRef.current && builtSelectionKeyRef.current === selectionKey) return;

    let cancelled = false;
    const setStations = (rows: StationRow[]) => {
      if (cancelled) return; // a newer selection started loading; drop this stale result
      builtSelectionKeyRef.current = selectionKey;
      stationsDirtyRef.current = false;
      setStationRows(rows);
    };

    const initStations = async () => {
      if (!selectedOrder && !selectedBulletin) {
        setStations([]);
        return;
      }

      const currentApplied = getAppliedBulletinScenarioForLine(
        selectedLineId,
        selectedBulletin?.id,
        selectedBulletin?.bulletinCode,
        selectedOrder?.styleId
      );

      let existingPlan: LinePlan | null = null;
      try {
        if (selectedOrder) {
          existingPlan = await linePlanApi.getPlanForOrder(String(selectedOrder.id));
        }
      } catch (e) {
        console.warn("No existing plan or error fetching plan for order:", e);
      }
      if (cancelled) return;

      const isPlanForThisLine = existingPlan && (!existingPlan.lineId || String(existingPlan.lineId) === String(selectedLineId));

      if (isPlanForThisLine && existingPlan) {
        if (!activeLineDesign && existingPlan.plannedEfficiency !== undefined && existingPlan.plannedEfficiency !== null && existingPlan.plannedEfficiency > 0) {
          setPlannedEfficiency(Number(existingPlan.plannedEfficiency));
        }
        if (existingPlan.shiftId) {
          setSelectedShiftId(String(existingPlan.shiftId));
        }
      }

      // Collect existing assignments from plan by bulletinLineId and operationId
      const existingAssignmentsByBLine = new Map<string, (string | number | null)[]>();
      const existingAssignmentsByOp = new Map<string, (string | number | null)[]>();
      const existingQcByBLine = new Map<string, boolean>();
      const existingQcByOp = new Map<string, boolean>();

      if (isPlanForThisLine && existingPlan?.assignments) {
        for (const a of existingPlan.assignments) {
          if (a.bulletinLineId) {
            const bKey = String(a.bulletinLineId);
            if (!existingAssignmentsByBLine.has(bKey)) existingAssignmentsByBLine.set(bKey, []);
            existingAssignmentsByBLine.get(bKey)!.push(a.operatorId !== null && a.operatorId !== undefined ? a.operatorId : null);
            if (a.isQcCheckpoint) existingQcByBLine.set(bKey, true);
          }
          if (a.operationId) {
            const oKey = String(a.operationId);
            if (!existingAssignmentsByOp.has(oKey)) existingAssignmentsByOp.set(oKey, []);
            existingAssignmentsByOp.get(oKey)!.push(a.operatorId !== null && a.operatorId !== undefined ? a.operatorId : null);
            if (a.isQcCheckpoint) existingQcByOp.set(oKey, true);
          }
        }
      }

      if (selectedBulletin && selectedBulletin.lines && selectedBulletin.lines.length > 0) {
        const rows: StationRow[] = selectedBulletin.lines
          .sort((a, b) => a.sequence - b.sequence)
          .map(line => {
            const op = operations.find(o => String(o.id) === String(line.operationId) || (line.operationCode && o.operationCode === line.operationCode));
            // The bulletin's SMV is the style-specific time; the operation master's standard SMV is only a fallback
            const smvVal = Number(line.smv && Number(line.smv) > 0 ? line.smv : (op?.standardSmv || 0.5));

            // Multi-index resolution for stationAllocations:
            // Prioritize activeLineDesign, then currentApplied
            let allocCount = 1;
            let allocSource: Record<string | number, number> | null = null;
            if (activeLineDesign?.stationAllocations) {
              try {
                allocSource = toAllocationCounts(
                  typeof activeLineDesign.stationAllocations === "string"
                    ? JSON.parse(activeLineDesign.stationAllocations)
                    : activeLineDesign.stationAllocations
                );
              } catch (e) {
                allocSource = currentApplied?.stationAllocations || null;
              }
            } else if (currentApplied?.stationAllocations) {
              allocSource = currentApplied.stationAllocations;
            }

            if (allocSource) {
              const lineAlloc = line.id !== undefined ? (allocSource[line.id] ?? allocSource[String(line.id)]) : undefined;
              allocCount = lineAlloc ??
                allocSource[line.sequence] ??
                allocSource[String(line.sequence)] ??
                (line.operationId ? allocSource[line.operationId] ?? allocSource[String(line.operationId)] : undefined) ??
                (line.operationCode ? allocSource[line.operationCode] ?? allocSource[String(line.operationCode)] : undefined) ??
                1;
            }

            // Retrieve any existing assigned operators from the plan
            const rawAssigned = (line.id && existingAssignmentsByBLine.get(String(line.id))) ||
              (line.operationId && existingAssignmentsByOp.get(String(line.operationId))) ||
              [];

            // Extract assigned operator IDs
            const assignedOps = rawAssigned.filter(id => id !== null && id !== undefined && id !== "");

            // Total slots must accommodate scenario allocation, preserving any existing assigned operators
            const slotCount = Math.max(allocCount, assignedOps.length);

            // Populate slots: assigned operators first, then remaining slots as null
            const operatorIds: (string | number | null)[] = Array(slotCount).fill(null).map((_, i) => {
              if (i < assignedOps.length) return assignedOps[i];
              return null;
            });

            const isQc = (line.id && existingQcByBLine.get(String(line.id))) ||
              (line.operationId && existingQcByOp.get(String(line.operationId))) ||
              false;

            return {
              stationNum: line.sequence,
              bulletinLineId: line.id,
              operationId: line.operationId,
              operationCode: line.operationCode || op?.operationCode || "OP",
              operationName: line.operationName || op?.name || "Operation",
              machineType: line.machineType || op?.machineType || "Single Needle Lockstitch",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds,
              isQcCheckpoint: isQc,
              requiredSkillRating: line.skillRatingRequired ? String(line.skillRatingRequired) : (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3"),
              wipThreshold: line.wipThreshold ?? 20,
            };
          });

        // If existing plan had operations not in the bulletin lines, append them
        if (isPlanForThisLine && existingPlan?.assignments) {
          for (const a of existingPlan.assignments) {
            const alreadyInRows = rows.some(
              r => (a.bulletinLineId && String(r.bulletinLineId) === String(a.bulletinLineId)) ||
                   String(r.operationId) === String(a.operationId)
            );
            if (!alreadyInRows) {
              const op = operations.find(o => String(o.id) === String(a.operationId));
              const smvVal = Number(op?.standardSmv || 0.5);
              const assignedOps = (a.bulletinLineId && existingAssignmentsByBLine.get(String(a.bulletinLineId))) ||
                (a.operationId && existingAssignmentsByOp.get(String(a.operationId))) ||
                (a.operatorId ? [a.operatorId] : [null]);

              rows.push({
                stationNum: rows.length + 1,
                bulletinLineId: a.bulletinLineId || null,
                operationId: a.operationId,
                operationCode: op?.operationCode || "OP",
                operationName: op?.name || "Operation",
                machineType: op?.machineType || "Single Needle Lockstitch",
                smvSeconds: Math.round(smvVal * 60 * 10) / 10,
                operatorIds: assignedOps.length > 0 ? assignedOps : [null],
                isQcCheckpoint: a.isQcCheckpoint ?? false,
                requiredSkillRating: (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating) ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3",
                wipThreshold: 20,
              });
            }
          }
        }

        setStations(rows.sort((a, b) => a.stationNum - b.stationNum));
        return;
      }

      // No bulletin for this order's style. A plan saved earlier still shows its own operations;
      // otherwise the table stays empty and the setup strip explains what is missing.
      if (isPlanForThisLine && existingPlan?.assignments && existingPlan.assignments.length > 0) {
        const byOp = new Map<string, { opId: string | number; operatorIds: (string | number | null)[]; qc: boolean }>();
        for (const a of existingPlan.assignments) {
          const key = String(a.operationId);
          if (!byOp.has(key)) byOp.set(key, { opId: a.operationId, operatorIds: [], qc: false });
          const entry = byOp.get(key)!;
          entry.operatorIds.push(a.operatorId ?? null);
          entry.qc = entry.qc || !!a.isQcCheckpoint;
        }
        const rows: StationRow[] = [...byOp.values()].map((entry, idx) => {
          const op = operations.find(o => String(o.id) === String(entry.opId));
          const smvVal = Number(op?.standardSmv || 0.5);
          const assigned = entry.operatorIds.filter(id => id !== null && id !== undefined && id !== "");
          return {
            stationNum: idx + 1,
            bulletinLineId: null,
            operationId: entry.opId,
            operationCode: op?.operationCode || "OP",
            operationName: op?.name || "Operation",
            machineType: op?.machineType || "Single Needle Lockstitch",
            smvSeconds: Math.round(smvVal * 60 * 10) / 10,
            operatorIds: assigned.length > 0 ? assigned : [null],
            isQcCheckpoint: entry.qc,
            requiredSkillRating: (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating) ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3",
          };
        });
        setStations(rows);
        return;
      }
      setStations([]);
    };

    initStations();
    return () => {
      cancelled = true;
    };
  }, [selectedOrder, selectedBulletin, operations, selectedLineId, activeLineDesign]);

  // Real-time synchronization when a scenario is saved or updated in Operation Bulletins
  useEffect(() => {
    const handleScenarioEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) {
        return;
      }
      
      const isTargetMatch = 
        !detail.targetLineId ||
        detail.targetLineId === "all" ||
        String(detail.targetLineId) === String(selectedLineId) ||
        (selectedBulletin?.id && String(detail.bulletinId) === String(selectedBulletin.id)) ||
        (selectedBulletin?.bulletinCode && detail.bulletinCode === selectedBulletin.bulletinCode);

      if (isTargetMatch) {
        const applied = getAppliedBulletinScenarioForLine(
          selectedLineId,
          selectedBulletin?.id,
          selectedBulletin?.bulletinCode,
          selectedOrder?.styleId
        );

        if (selectedBulletin && selectedBulletin.lines && selectedBulletin.lines.length > 0) {
          setStations(prev => {
            return selectedBulletin.lines
              .sort((a, b) => a.sequence - b.sequence)
              .map(line => {
                const prevStation = prev.find(s => 
                  (s.bulletinLineId && String(s.bulletinLineId) === String(line.id)) || 
                  String(s.operationId) === String(line.operationId) ||
                  (s.stationNum === line.sequence)
                );
                const op = operations.find(o => String(o.id) === String(line.operationId));
                const smvVal = Number(line.smv || 0.5);

                let allocCount = 1;
                if (applied && applied.stationAllocations) {
                  const lineAlloc = line.id !== undefined ? (applied.stationAllocations[line.id] ?? applied.stationAllocations[String(line.id)]) : undefined;
                  allocCount = lineAlloc ??
                    applied.stationAllocations[line.sequence] ??
                    applied.stationAllocations[String(line.sequence)] ??
                    (line.operationId ? applied.stationAllocations[line.operationId] ?? applied.stationAllocations[String(line.operationId)] : undefined) ??
                    (line.operationCode ? applied.stationAllocations[line.operationCode] ?? applied.stationAllocations[String(line.operationCode)] : undefined) ??
                    1;
                }

                const prevAssigned = prevStation ? prevStation.operatorIds.filter(id => id !== null && id !== undefined && id !== "") : [];
                const slotCount = Math.max(allocCount, prevAssigned.length);
                const operatorIds = Array(slotCount).fill(null).map((_, i) => prevAssigned[i] ?? null);

                return {
                  stationNum: line.sequence,
                  bulletinLineId: line.id,
                  operationId: line.operationId,
                  operationCode: line.operationCode || op?.operationCode || "OP",
                  operationName: line.operationName || op?.name || "Operation",
                  machineType: line.machineType || op?.machineType || "Single Needle Lockstitch",
                  smvSeconds: Math.round(smvVal * 60 * 10) / 10,
                  operatorIds,
                  isQcCheckpoint: prevStation?.isQcCheckpoint || false,
                  requiredSkillRating: line.skillRatingRequired ? String(line.skillRatingRequired) : (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3"),
                  wipThreshold: line.wipThreshold ?? 20,
                };
              });
          });
        }
      }
    };

    window.addEventListener(SCENARIO_APPLIED_EVENT, handleScenarioEvent);
    return () => {
      window.removeEventListener(SCENARIO_APPLIED_EVENT, handleScenarioEvent);
    };
  }, [selectedLineId, selectedBulletin, selectedOrder, operations]);

  // ─── Shift & Real-Time Second-by-Second Available Time Engine ─────────────────
  const grossShiftMins = useMemo(() => {
    if (!selectedShift) return 480;
    const [sh, sm] = (selectedShift.startTime || "08:00").split(":").map(Number);
    const [eh, em] = (selectedShift.endTime || "17:00").split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }, [selectedShift]);

  // Deduct scheduled break minutes (lunch + tea breaks)
  const breakDurationMins = Number(selectedShift?.breakDurationMinutes ?? 60);
  const netWorkingMins = Math.max(60, grossShiftMins - breakDurationMins);
  const shiftHours = netWorkingMins / 60;
  const dailyNetWorkingSecs = netWorkingMins * 60;
  const dailyAvailableTimeSecs = dailyNetWorkingSecs;

  // Real-Time Second-by-Second Shift Countdown & Available Production Seconds
  const shiftScheduleMetrics = useMemo(() => {
    const [sh, sm] = (selectedShift?.startTime || "08:00").split(":").map(Number);
    const [eh, em] = (selectedShift?.endTime || "17:00").split(":").map(Number);

    const now = currentTime;
    const nowMs = now.getTime();

    // Construct today's shift start and end timestamps
    const shiftStartToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0, 0);
    const shiftEndToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0, 0);
    if (shiftEndToday.getTime() <= shiftStartToday.getTime()) {
      shiftEndToday.setDate(shiftEndToday.getDate() + 1);
    }

    const startMs = shiftStartToday.getTime();
    const endMs = shiftEndToday.getTime();
    const netRatio = grossShiftMins > 0 ? netWorkingMins / grossShiftMins : 1;
    const fullShiftDurationGrossSecs = Math.max(1, (endMs - startMs) / 1000);

    let remainingGrossSecs = 0;
    let isShiftActive = false;
    let isUpcoming = false;
    let isEnded = false;

    if (nowMs < startMs) {
      // Shift has not started yet today -> full shift available
      remainingGrossSecs = fullShiftDurationGrossSecs;
      isUpcoming = true;
    } else if (nowMs >= startMs && nowMs <= endMs) {
      // Currently within active shift window -> countdown to shift end
      remainingGrossSecs = Math.max(1, (endMs - nowMs) / 1000);
      isShiftActive = true;
    } else {
      // Today's shift ended -> full shift duration for baseline planning
      remainingGrossSecs = fullShiftDurationGrossSecs;
      isEnded = true;
    }

    // Effective live net available production seconds with micro-second live tick
    const liveRemainingNetSecs = isShiftActive
      ? Math.min(dailyNetWorkingSecs, Math.max(1, remainingGrossSecs * netRatio))
      : dailyNetWorkingSecs;
    const liveShiftAvailableSecs = liveRemainingNetSecs;

    // Format remaining countdown
    const remSecTotal = Math.round(remainingGrossSecs);
    const hours = Math.floor(remSecTotal / 3600);
    const mins = Math.floor((remSecTotal % 3600) / 60);
    const secs = remSecTotal % 60;
    const countdownFormatted = `${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;

    return {
      isShiftActive,
      isUpcoming,
      isEnded,
      remainingGrossSecs,
      liveShiftAvailableSecs,
      countdownFormatted,
    };
  }, [currentTime, selectedShift, grossShiftMins, netWorkingMins, dailyNetWorkingSecs]);

  // ─── Real-Time Delivery Schedule & Working Days Calculation ─────────────────
  const deliveryScheduleMetrics = useMemo(() => {
    if (!selectedOrder?.deliveryDate && !selectedOrder?.plannedCompletionDate) {
      return {
        calendarDaysRemaining: 1,
        workingDaysRemaining: 1,
        liveWorkingDaysExact: 1,
        noTimeLeft: false,
        daysOverdue: 0,
        isOverdue: false,
        isDueToday: false,
        countdownFormatted: "1 Day (Default)",
        progressPct: 0,
        deliveryFormatted: "Not Specified",
        plannedCompletionFormatted: "Not Specified",
      };
    }

    // Pacing Target is governed by Planned Completion Date (if set), else Delivery Date
    const targetCompStr = selectedOrder.plannedCompletionDate || selectedOrder.deliveryDate;
    const targetDate = new Date(targetCompStr);
    targetDate.setHours(23, 59, 59, 999);

    const deliveryDateObj = new Date(selectedOrder.deliveryDate || targetCompStr);
    deliveryDateObj.setHours(23, 59, 59, 999);

    const diffMs = targetDate.getTime() - currentTime.getTime();
    const isOverdue = diffMs < 0;
    const isDueToday = !isOverdue && diffMs <= 24 * 60 * 60 * 1000;

    const calendarDaysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // Count full remaining working days from tomorrow to planned completion date
    let futureWorkingDays = 0;
    const tomorrowCursor = new Date(currentTime);
    tomorrowCursor.setDate(tomorrowCursor.getDate() + 1);
    tomorrowCursor.setHours(0, 0, 0, 0);
    const endCursor = new Date(targetDate);
    endCursor.setHours(0, 0, 0, 0);

    if (endCursor >= tomorrowCursor) {
      const cur = new Date(tomorrowCursor);
      while (cur <= endCursor) {
        const dayOfWeek = cur.getDay(); // 0 = Sunday
        if (!workDaysOnly || dayOfWeek !== 0) {
          futureWorkingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Today counts only the production time still left in today's shift (none once it has ended, none on a
    // Sunday in a 6-day week), not the share of the 24-hour day left.
    const todayIsWorkingDay = !workDaysOnly || currentTime.getDay() !== 0;
    const todayShiftFraction = !todayIsWorkingDay || shiftScheduleMetrics.isEnded
      ? 0
      : Math.max(0, Math.min(1, shiftScheduleMetrics.liveShiftAvailableSecs / Math.max(1, dailyNetWorkingSecs)));
    const liveWorkingDaysExact = isOverdue ? 0 : futureWorkingDays + todayShiftFraction;
    // No working time left before the planned completion date (overdue, or due today after the shift ended)
    const noTimeLeft = liveWorkingDaysExact <= 0;
    const workingDaysRemaining = noTimeLeft ? 0 : Math.max(1, Math.ceil(liveWorkingDaysExact));
    const daysOverdue = isOverdue ? Math.max(1, Math.floor(-diffMs / (1000 * 60 * 60 * 24)) + 1) : 0;

    const absMs = Math.abs(diffMs);
    const d = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((absMs % (1000 * 60)) / 1000);

    const countdownFormatted = isOverdue
      ? `${d}d ${h}h overdue`
      : `${d}d ${h}h ${m}m ${s}s`;

    let progressPct = 0;
    if (selectedOrder?.orderDate) {
      const start = new Date(selectedOrder.orderDate).getTime();
      const end = targetDate.getTime();
      const totalLead = end - start;
      if (totalLead > 0) {
        progressPct = Math.min(100, Math.max(0, Math.round(((currentTime.getTime() - start) / totalLead) * 100)));
      }
    }

    const deliveryFormatted = deliveryDateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const plannedCompletionFormatted = targetDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      calendarDaysRemaining,
      workingDaysRemaining,
      liveWorkingDaysExact,
      noTimeLeft,
      daysOverdue,
      isOverdue,
      isDueToday,
      countdownFormatted,
      progressPct,
      deliveryFormatted,
      plannedCompletionFormatted,
    };
  }, [selectedOrder, currentTime, workDaysOnly, shiftScheduleMetrics, dailyNetWorkingSecs]);

  // Total Customer Demand (Order Quantity)
  const totalOrderQuantity = selectedOrder?.totalQuantity && selectedOrder.totalQuantity > 0
    ? selectedOrder.totalQuantity
    : 1000;

  // Live Available Production Time across remaining delivery window (ticking second-by-second)
  const liveAvailableProductionSecs = useMemo(() => {
    return deliveryScheduleMetrics.liveWorkingDaysExact * dailyAvailableTimeSecs;
  }, [deliveryScheduleMetrics.liveWorkingDaysExact, dailyAvailableTimeSecs]);

  // With no working time left before the planned completion date (overdue), a delivery pace cannot be calculated;
  // the line's configured pace is used instead (line design target/hr × net shift hours, else the line's daily
  // capacity) and the page asks the planner for a new completion date.
  const deliveryPaceUnavailable = deliveryScheduleMetrics.noTimeLeft;
  const configuredDailyTarget = activeLineDesign?.targetHourlyOutput && activeLineDesign.targetHourlyOutput > 0
    ? Math.round(activeLineDesign.targetHourlyOutput * shiftHours)
    : (selectedLine?.capacityPerDay && selectedLine.capacityPerDay > 0 ? selectedLine.capacityPerDay : 0);

  // Live Required Daily Output to meet delivery on time:
  const liveDeliveryDailyTarget = useMemo(() => {
    if (deliveryPaceUnavailable) return configuredDailyTarget;
    const days = Math.max(1, deliveryScheduleMetrics.workingDaysRemaining);
    return Math.max(1, Math.ceil(totalOrderQuantity / days));
  }, [totalOrderQuantity, deliveryScheduleMetrics.workingDaysRemaining, deliveryPaceUnavailable, configuredDailyTarget]);

  // ─── Live Floor Output & End-Line Throughput (Theory of Constraints / Bottleneck Flow) ──
  const { stationActuals, todayStationActuals } = useMemo(() => {
    const todayStr = toLocalDateString();

    // Ensure stations are processed in their true physical sequence (1 -> 2 -> ... -> N)
    const sortedStations = [...stations].sort((a, b) => a.stationNum - b.stationNum);

    // 1. Calculate raw output per station from piece logs and timesheets
    const rawCumMap = new Map<number, { good: number; reject: number }>();
    const rawTodayMap = new Map<number, { good: number; reject: number }>();

    sortedStations.forEach(st => {
      const opIdStr = String(st.operationId);
      const assignedOpIds = st.operatorIds.filter(Boolean).map(String);
      let cumGood = 0;
      let cumReject = 0;
      let todayGood = 0;
      let todayReject = 0;
      const countedLogIds = new Set<number>();
      const countedTodayIds = new Set<number>();

      // Piece logs
      allPieceLogs.forEach(log => {
        // Only runs recorded against this order count; runs with no order are reported separately (see orderlessForPlan)
        const matchesOrder = !selectedOrderId || String(log.orderId ?? "") === String(selectedOrderId);
        const matchesOp = String(log.operationId) === opIdStr || log.operationName === st.operationName;
        const matchesAssignee = assignedOpIds.length === 0 || assignedOpIds.includes(String(log.operatorId));
        
        if (matchesOrder && matchesOp && matchesAssignee) {
          if (!countedLogIds.has(log.id)) {
            countedLogIds.add(log.id);
            cumGood += log.goodQty || 0;
            cumReject += log.rejectQty || 0;
          }
          const matchesDate = Boolean(log.logDate && (log.logDate === todayStr || log.logDate.startsWith(todayStr)));
          if (matchesDate && !countedTodayIds.has(log.id)) {
            countedTodayIds.add(log.id);
            todayGood += log.goodQty || 0;
            todayReject += log.rejectQty || 0;
          }
        }
      });

      // Timesheet data
      timesheetData.forEach(row => {
        if (assignedOpIds.includes(String(row.operatorId)) || assignedOpIds.length === 0) {
          (row.rawLogs || []).forEach(log => {
            const logId = (log as any).id;
            if (!logId || !countedLogIds.has(logId)) {
              if (logId) countedLogIds.add(logId);
              const logForOrder = !selectedOrderId || String(log.orderId ?? "") === String(selectedOrderId);
              if (logForOrder && (String(log.operationId) === opIdStr || (!log.operationId && row.department === st.operationName))) {
                cumGood += log.goodQty || 0;
                cumReject += log.rejectQty || 0;
                todayGood += log.goodQty || 0;
                todayReject += log.rejectQty || 0;
              }
            }
          });
        }
      });

      rawCumMap.set(st.stationNum, { good: cumGood, reject: cumReject });
      rawTodayMap.set(st.stationNum, { good: todayGood, reject: todayReject });
    });

    // 2. Flow through the line in station order; stations with no records at all are "not recorded", not blockages
    const cumFlow = flowThroughStations(sortedStations.map(st => (rawCumMap.get(st.stationNum) || { good: 0 }).good));
    const todayFlow = flowThroughStations(sortedStations.map(st => (rawTodayMap.get(st.stationNum) || { good: 0 }).good));
    const cumActuals = sortedStations.map((st, i) => ({
      stationNum: st.stationNum,
      operationId: st.operationId,
      actualGood: cumFlow.good[i],
      actualReject: (rawCumMap.get(st.stationNum) || { reject: 0 }).reject,
      rawGood: (rawCumMap.get(st.stationNum) || { good: 0 }).good,
      queueWip: cumFlow.wip[i],
      notRecorded: cumFlow.notRecorded[i],
    }));
    const todayActuals = sortedStations.map((st, i) => ({
      stationNum: st.stationNum,
      operationId: st.operationId,
      actualGood: todayFlow.good[i],
      actualReject: (rawTodayMap.get(st.stationNum) || { reject: 0 }).reject,
      rawGood: (rawTodayMap.get(st.stationNum) || { good: 0 }).good,
      queueWip: todayFlow.wip[i],
      notRecorded: todayFlow.notRecorded[i],
    }));

    return { stationActuals: cumActuals, todayStationActuals: todayActuals };
  }, [stations, timesheetData, allPieceLogs, selectedOrderId]);

  // Production on this plan's stations by its operators that was recorded without an order (not counted above)
  const orderlessForPlan = useMemo(() => {
    const opIds = new Set(stations.map(st => String(st.operationId)));
    const people = new Set(stations.flatMap(st => st.operatorIds.filter(Boolean).map(String)));
    const runs = orderlessLogs.filter(l => opIds.has(String(l.operationId)) && people.has(String(l.operatorId)));
    const dates = runs.map(l => l.logDate).sort();
    return { runs: runs.length, pieces: runs.reduce((n, l) => n + (l.goodQty || 0), 0), from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" };
  }, [orderlessLogs, stations]);

  // Cumulative Completed Finished Output across all days/shifts (Order Level - Overall Delivery Window)
  const cumulativeOrderOutput = useMemo(() => {
    if (stations.length === 0) return 0;
    const outputs = stationActuals.map(s => s.actualGood);
    if (outputs.length === 0) return 0;
    return Math.min(...outputs);
  }, [stations, stationActuals]);

  // Today's Completed Shift Output (Shift Level - strictly today's present-day flow)
  const todayShiftOutput = useMemo(() => {
    if (stations.length === 0) return 0;
    const outputs = todayStationActuals.map(s => s.actualGood);
    if (outputs.length === 0) return 0;
    return Math.min(...outputs);
  }, [stations, todayStationActuals]);

  // Active End-Line Output: in Planned Pace mode it represents total cumulative pieces done across delivery window,
  // in Fixed Shift Target mode it represents today's shift pieces completed
  const endLineOutput = taktMode === "DELIVERY" ? cumulativeOrderOutput : todayShiftOutput;

  // Remaining Order Demand Balance (Overall Delivery Window: Total Demand - Cumulative Finished Pieces)
  const remainingOrderBalance = Math.max(0, totalOrderQuantity - cumulativeOrderOutput);

  // Dynamic Required Daily Output accounting for completed output across remaining working days:
  const dynamicRemainingDeliveryDailyTarget = useMemo(() => {
    if (deliveryPaceUnavailable) return configuredDailyTarget;
    const days = Math.max(1, deliveryScheduleMetrics.workingDaysRemaining);
    return Math.ceil(remainingOrderBalance / days);
  }, [remainingOrderBalance, deliveryScheduleMetrics.workingDaysRemaining, deliveryPaceUnavailable, configuredDailyTarget]);

  // Real-time Planned Pace Required Daily Target
  const plannedPaceDailyTarget = cumulativeOrderOutput > 0 ? dynamicRemainingDeliveryDailyTarget : liveDeliveryDailyTarget;

  // Active Base Shift Target (dynamically mirrors Planned Pace's Required Daily Target in real-time or custom override)
  const activeShiftTarget = (customShiftTarget !== null && customShiftTarget > 0)
    ? customShiftTarget
    : plannedPaceDailyTarget;

  // Remaining Balance Target to Produce for Today's Shift (Today's Quota - Today's Completed Output)
  const remainingShiftBalance = Math.max(0, activeShiftTarget - todayShiftOutput);

  // ─── Real-Time Dynamic Takt & Pitch Engine (Live Second-by-Second Dynamic Balancing) ───
  // Real-Time Base Planned Delivery Takt Time
  const liveDeliveryTaktSecs = useMemo(() => {
    if (liveDeliveryDailyTarget <= 0 || dailyAvailableTimeSecs <= 0) return 0;
    return Math.round((dailyAvailableTimeSecs / liveDeliveryDailyTarget) * 100) / 100;
  }, [dailyAvailableTimeSecs, liveDeliveryDailyTarget]);

  // Dynamic Remaining Delivery Takt Time (Live available production seconds remaining ÷ Remaining pieces):
  // 0 when nothing is left to make or no time is left, so the base delivery / design takt applies instead of
  // dividing by a placeholder balance of 1 (which produced takt values of thousands of seconds).
  const dynamicRemainingDeliveryTaktSecs = useMemo(() => {
    if (deliveryPaceUnavailable || remainingOrderBalance <= 0 || liveAvailableProductionSecs <= 0) return 0;
    return Math.round((liveAvailableProductionSecs / remainingOrderBalance) * 100) / 100;
  }, [liveAvailableProductionSecs, remainingOrderBalance, deliveryPaceUnavailable]);

  // Real-Time Live Shift-Driven Takt Time (ticks second-by-second with live available seconds)
  const shiftDrivenTaktSecs = useMemo(() => {
    const target = activeShiftTarget > 0 ? activeShiftTarget : 1;
    if (target <= 0 || shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return Math.round((shiftScheduleMetrics.liveShiftAvailableSecs / target) * 100) / 100;
  }, [shiftScheduleMetrics.liveShiftAvailableSecs, activeShiftTarget]);

  // Dynamic Remaining Shift-Driven Takt Time (Live available seconds ÷ Remaining Shift Balance):
  const dynamicRemainingShiftTaktSecs = useMemo(() => {
    if (remainingShiftBalance <= 0 || shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return Math.round((shiftScheduleMetrics.liveShiftAvailableSecs / remainingShiftBalance) * 100) / 100;
  }, [shiftScheduleMetrics.liveShiftAvailableSecs, remainingShiftBalance]);

  // Industrial Engineering Line Efficiency fraction (default 80.0%, clamped 10% to 100%)
  const plannedEfficiencyFraction = Math.max(0.1, Math.min(1.0, (plannedEfficiency || 80) / 100));

  // Baseline Architecture Plan reference from Line Design (for engineering baseline comparison)
  const baselineDesignTaktSecs = activeLineDesign?.targetHourlyOutput && activeLineDesign.targetHourlyOutput > 0
    ? Math.round((3600 / activeLineDesign.targetHourlyOutput) * 10) / 10
    : (liveDeliveryTaktSecs > 0 ? Math.round(liveDeliveryTaktSecs * 10) / 10 : 0);

  const baselineDesignPitchSecs = activeLineDesign?.designedPitchSecs && activeLineDesign.designedPitchSecs > 0
    ? activeLineDesign.designedPitchSecs
    : (baselineDesignTaktSecs > 0 ? Math.round((baselineDesignTaktSecs * plannedEfficiencyFraction) * 10) / 10 : 0);

  // Active Live Dynamic Takt Time (Dynamic real-time seconds ticking second-by-second!)
  const liveDynamicTaktSecs = taktMode === "DELIVERY"
    ? (dynamicRemainingDeliveryTaktSecs > 0 ? dynamicRemainingDeliveryTaktSecs : liveDeliveryTaktSecs)
    : (dynamicRemainingShiftTaktSecs > 0 ? dynamicRemainingShiftTaktSecs : shiftDrivenTaktSecs);

  // Active Live Dynamic Pitch Time (Dynamic real-time seconds ticking second-by-second!)
  const liveDynamicPitchSecs = liveDynamicTaktSecs > 0
    ? Math.round((liveDynamicTaktSecs * plannedEfficiencyFraction) * 100) / 100
    : (baselineDesignPitchSecs > 0 ? baselineDesignPitchSecs : 0);

  // Operational Active Takt Time (Continuously dynamic in real-time)
  const taktTimeSecs = liveDynamicTaktSecs > 0
    ? liveDynamicTaktSecs
    : (baselineDesignTaktSecs > 0 ? baselineDesignTaktSecs : 51.4);

  // Operational Active Pitch Time (Continuously dynamic in real-time)
  const designedPitchTimeSecs = liveDynamicPitchSecs > 0
    ? liveDynamicPitchSecs
    : (baselineDesignPitchSecs > 0 ? baselineDesignPitchSecs : (taktTimeSecs > 0 ? Math.round(taktTimeSecs * plannedEfficiencyFraction * 100) / 100 : 41.1));

  // Operational Active Daily Target
  const requiredDailyTarget = taktMode === "DELIVERY" ? plannedPaceDailyTarget : activeShiftTarget;

  // Operational Active Hourly Target (pcs/hr)
  const requiredHourlyTarget = taktTimeSecs > 0
    ? Math.round((3600 / taktTimeSecs) * 10) / 10
    : (activeLineDesign?.targetHourlyOutput || 70);

  // Required Theoretical / Design Capacity (pieces/hour) = Target Output / Expected Line Efficiency
  const requiredDesignCapacity = designedPitchTimeSecs > 0
    ? Math.round((3600 / designedPitchTimeSecs) * 10) / 10
    : (requiredHourlyTarget > 0 ? Math.round((requiredHourlyTarget / plannedEfficiencyFraction) * 10) / 10 : 0);

  // Reset custom shift target override on order change so shift target mirrors the new order's delivery pace
  useEffect(() => {
    setCustomShiftTarget(null);
  }, [selectedOrderId]);

  // ─── Operator Skill Lookup Helper (Synchronized with Sewing Skill Matrix) ───
  const getOperatorSkill = useCallback((operatorId: string | number | null, operationId: string | number): number | null => {
    if (!operatorId || !operationId) return null;
    const opIdStr = String(operatorId);
    const targetOpIdStr = String(operationId);
    const targetOp = operations.find(o => String(o.id) === targetOpIdStr || o.operationCode === targetOpIdStr);
    const targetOpCode = targetOp?.operationCode || targetOpIdStr;
    const targetOpName = targetOp?.name?.toLowerCase().trim();

    // 1. Check submitted performance test logs (matches Sewing Skill Matrix dynamic calculation)
    const submittedLogs = performanceLogs.filter(
      l => String(l.operatorId) === opIdStr &&
           (String(l.operationId) === targetOpIdStr || (targetOp && String(l.operationId) === String(targetOp.id)) ||
            (targetOpCode && l.operationCode === targetOpCode) ||
            (targetOpName && l.operationName && l.operationName.toLowerCase().trim() === targetOpName)) &&
           (l.status === "SUBMITTED" || !l.status)
    );
    if (submittedLogs.length > 0) {
      const avg = submittedLogs.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / submittedLogs.length;
      return cycleTimeToRating(avg, targetOp?.name, targetOp?.standardSmv);
    }

    // 2. Check current skill assessment matrix
    const assessment = skillAssessments.find(a => {
      const matchOp = String(a.operatorId) === opIdStr;
      if (!matchOp) return false;
      return (
        String(a.operationId) === targetOpIdStr ||
        (targetOp && String(a.operationId) === String(targetOp.id)) ||
        (a.operationCode && (a.operationCode === targetOpCode || a.operationCode === targetOpIdStr)) ||
        (targetOpName && a.operationName && a.operationName.toLowerCase().trim() === targetOpName)
      );
    });

    if (assessment) {
      if (assessment.cycleTimeSeconds && assessment.cycleTimeSeconds > 0) {
        return cycleTimeToRating(assessment.cycleTimeSeconds, targetOp?.name || assessment.operationName, targetOp?.standardSmv);
      }
      return assessment.rating ? clampRating(assessment.rating) : null;
    }
    return null;
  }, [skillAssessments, performanceLogs, operations]);

  // Helper to filter operators based on required skill rating
  const getEligibleOpsForSkill = (operationId: string | number, reqRating?: number | string) => {
    const baseOps = filterPresentOnly
      ? operators.filter(o => {
          const st = getOperatorAttendance(o.id);
          return st === "PRESENT" || st === "LATE";
        })
      : operators;

    if (!reqRating || reqRating === "ANY") {
      return baseOps;
    }
    if (reqRating === "3_PLUS") {
      return baseOps.filter(o => {
        const r = getOperatorSkill(o.id, operationId);
        return r !== null && r >= INDEPENDENT_RATING;
      });
    }
    if (reqRating === "4_PLUS") {
      return baseOps.filter(o => {
        const r = getOperatorSkill(o.id, operationId);
        return r !== null && r >= MAX_SKILL_RATING;
      });
    }
    // Legacy 1–5 requirement values (e.g. 5) clamp to the 4-level scale
    const numericRating = clampRating(Number(reqRating));
    return baseOps.filter(o => {
      const r = getOperatorSkill(o.id, operationId);
      return r !== null && r >= numericRating;
    });
  };

  const handleUpdateRequiredSkill = (stationIdx: number, rating: string) => {
    setStations(prev => {
      const next = [...prev];
      next[stationIdx] = {
        ...next[stationIdx],
        requiredSkillRating: rating,
      };
      return next;
    });
  };

  // ─── Track Operators Already Assigned to Other Operations or Plans ──────────
  // 1. Operators assigned across OTHER line plans (for different orders or lines)
  const operatorsAssignedInOtherPlans = useMemo(() => {
    const map = new Map<string, { lineCode?: string; lineName?: string; orderId?: string | number }>();
    allLinePlans.forEach(plan => {
      // Exclude the current order plan being edited
      if (selectedOrder && String(plan.orderId) === String(selectedOrder.id)) return;
      (plan.assignments || []).forEach(asg => {
        if (asg.operatorId) {
          map.set(String(asg.operatorId), {
            lineCode: plan.lineCode,
            lineName: plan.lineName,
            orderId: plan.orderId,
          });
        }
      });
    });
    return map;
  }, [allLinePlans, selectedOrder]);

  // 2. Operators assigned in the CURRENT plan table across all stations
  // Maps operatorId -> { stationIndex, slotIndex, stationNum, operationName }
  const operatorsAssignedInCurrentPlan = useMemo(() => {
    const map = new Map<string, { stationIndex: number; slotIndex: number; stationNum: number; operationName: string }>();
    stations.forEach((s, sIdx) => {
      s.operatorIds.forEach((id, slIdx) => {
        if (id !== null && id !== undefined && id !== "") {
          map.set(String(id), {
            stationIndex: sIdx,
            slotIndex: slIdx,
            stationNum: s.stationNum,
            operationName: s.operationName,
          });
        }
      });
    });
    return map;
  }, [stations]);

  // Helper to check if a candidate operator is already assigned to another station/slot or line
  const isOperatorAssignedToAnother = (
    candidateId: string | number,
    currentStationIdx: number,
    currentSlotIdx: number,
    currentOpIdInSlot?: string | number | null
  ) => {
    const strId = String(candidateId);
    // If this candidate is the operator currently assigned to this exact slot, they are NOT assigned to another!
    if (currentOpIdInSlot && String(currentOpIdInSlot) === strId) {
      return false;
    }
    // Check if assigned to another station or slot within this line
    const curAssign = operatorsAssignedInCurrentPlan.get(strId);
    if (curAssign && !(curAssign.stationIndex === currentStationIdx && curAssign.slotIndex === currentSlotIdx)) {
      return true;
    }
    // Check if assigned in another active line plan
    if (operatorsAssignedInOtherPlans.has(strId)) {
      return true;
    }
    return false;
  };

  // ─── Per-Station Metrics in Seconds (Live Linked to Operations Library) ───
  const stationMetrics = useMemo(() => {
    return stations.map(s => {
      const op = operations.find(o => String(o.id) === String(s.operationId));
      const bLine = selectedBulletin?.lines?.find(l => String(l.id) === String(s.bulletinLineId))
        || selectedBulletin?.lines?.find(l => String(l.operationId) === String(s.operationId));
      // Bulletin SMV (the style's own time) first, then the operation master, then the station's stored value
      const smvMin = bLine?.smv !== undefined && bLine.smv !== null && Number(bLine.smv) > 0
        ? Number(bLine.smv)
        : (op?.standardSmv !== undefined && op?.standardSmv !== null ? Number(op.standardSmv) : (s.smvSeconds > 0 ? s.smvSeconds / 60 : 0.5));
      const smvSeconds = Math.round(smvMin * 60 * 10) / 10;

      const allocatedOps = Math.max(1, s.operatorIds.length);

      // Real Operator Pool effective speed multiplier:
      // Evaluates real skill ratings and calibrated affinity transfers across assigned operators
      let totalAssignedEfficiency = 0;
      s.operatorIds.forEach(id => {
        if (!id) {
          totalAssignedEfficiency += 1.0; // Standard benchmark pace if slot unfilled
          return;
        }
        // Check direct skill rating
        const direct = getOperatorSkill(id, s.operationId);
        if (direct) {
          // Relative speed vs a standard Independent (level 3) operator = 1.0
          totalAssignedEfficiency += relativeSkillSpeed(direct);
          return;
        }
        // Check affinitized alternative skills
        const opAffs = affinities.filter(a => String(a.primaryOperationId) === String(s.operationId));
        let bestAffEff = 0;
        for (const aff of opAffs) {
          const altRating = getOperatorSkill(id, aff.alternativeOperationId);
          if (altRating) {
            const effRating = altRating;
            const baseMult = relativeSkillSpeed(effRating);
            const affMult = baseMult * ((Number(aff.efficiencyTransferPct) || 85) / 100);
            if (affMult > bestAffEff) bestAffEff = affMult;
          }
        }
        totalAssignedEfficiency += (bestAffEff > 0 ? bestAffEff : 0.70);
      });

      const effectiveTimeSecs = totalAssignedEfficiency > 0 
        ? Math.round((smvSeconds / totalAssignedEfficiency) * 10) / 10 
        : smvSeconds / allocatedOps;
      const capacityPerHour = effectiveTimeSecs > 0 ? Math.round(3600 / effectiveTimeSecs) : 0;
      const capacityPerShift = Math.round(capacityPerHour * shiftHours);
      const matchedCumulative = stationActuals.find(
        a => a.stationNum === s.stationNum && String(a.operationId) === String(s.operationId)
      );
      const actualOutputTillDate = matchedCumulative ? matchedCumulative.actualGood : 0;
      const outputNotRecorded = taktMode === "SHIFT_TARGET"
        ? !!todayStationActuals.find(a => a.stationNum === s.stationNum && String(a.operationId) === String(s.operationId))?.notRecorded
        : !!matchedCumulative?.notRecorded;

      const matchedToday = todayStationActuals.find(
        a => a.stationNum === s.stationNum && String(a.operationId) === String(s.operationId)
      );
      const todayActualGood = matchedToday ? matchedToday.actualGood : 0;

      // ─── Dynamic Takt Time & Dynamic Required Ops based on Remaining Pieces ───
      let remainingPieces = 0;
      let exactRemainingManpower = 0;
      let dynamicTaktSecs = 0;
      let dynamicPitchSecs = 0;
      let dynamicRequiredOps = 1;

      if (taktMode === "DELIVERY") {
        remainingPieces = Math.max(0, totalOrderQuantity - actualOutputTillDate);
        const availableSecs = Math.max(1, liveAvailableProductionSecs);
        
        dynamicTaktSecs = remainingPieces > 0 && availableSecs > 0
          ? Math.round((availableSecs / remainingPieces) * 10) / 10
          : 0;

        dynamicPitchSecs = dynamicTaktSecs > 0
          ? dynamicTaktSecs * plannedEfficiencyFraction
          : designedPitchTimeSecs;

        exactRemainingManpower = availableSecs > 0
          ? (remainingPieces * smvSeconds) / (availableSecs * plannedEfficiencyFraction)
          : 0;
        
        dynamicRequiredOps = remainingPieces === 0
          ? 0
          : dynamicPitchSecs > 0
            ? Math.max(1, Math.ceil(smvSeconds / dynamicPitchSecs))
            : (designedPitchTimeSecs > 0 ? Math.max(1, Math.ceil(smvSeconds / designedPitchTimeSecs)) : 1);
      } else {
        const shiftQuota = activeShiftTarget > 0 ? activeShiftTarget : 500;
        remainingPieces = Math.max(0, shiftQuota - todayActualGood);
        const shiftAvailableSecs = Math.max(1, shiftScheduleMetrics.liveShiftAvailableSecs);
        
        dynamicTaktSecs = remainingPieces > 0 && shiftAvailableSecs > 0
          ? Math.round((shiftAvailableSecs / remainingPieces) * 10) / 10
          : 0;

        dynamicPitchSecs = dynamicTaktSecs > 0
          ? dynamicTaktSecs * plannedEfficiencyFraction
          : designedPitchTimeSecs;

        exactRemainingManpower = shiftAvailableSecs > 0
          ? (remainingPieces * smvSeconds) / (shiftAvailableSecs * plannedEfficiencyFraction)
          : 0;

        dynamicRequiredOps = remainingPieces === 0
          ? 0
          : dynamicPitchSecs > 0
            ? Math.max(1, Math.ceil(smvSeconds / dynamicPitchSecs))
            : (designedPitchTimeSecs > 0 ? Math.max(1, Math.ceil(smvSeconds / designedPitchTimeSecs)) : 1);
      }

      const requiredOps = dynamicRequiredOps;
      const gap = allocatedOps - requiredOps;
      const isBottleneck = dynamicPitchSecs > 0
        ? effectiveTimeSecs > dynamicPitchSecs
        : (designedPitchTimeSecs > 0 && (effectiveTimeSecs > designedPitchTimeSecs || capacityPerHour < requiredDesignCapacity));
      const deficitPerHour = Math.max(0, Math.round(requiredDesignCapacity - capacityPerHour));
      const loadPercent = dynamicPitchSecs > 0
        ? Math.round((effectiveTimeSecs / dynamicPitchSecs) * 100)
        : (designedPitchTimeSecs > 0 ? Math.round((effectiveTimeSecs / designedPitchTimeSecs) * 100) : 100);
      const requiredSkillRating = s.requiredSkillRating || (bLine?.skillRatingRequired ? String(bLine.skillRatingRequired) : "ANY");

      const operatorNames = s.operatorIds
        .map(id => operators.find(o => String(o.id) === String(id))?.name)
        .filter(Boolean) as string[];

      const actualRequiredOps = dynamicRequiredOps;
      const actualRequiredGap = gap;
      const dynamicLoadPercent = dynamicPitchSecs > 0
        ? Math.round((effectiveTimeSecs / dynamicPitchSecs) * 100)
        : 0;

      const actualGood = taktMode === "SHIFT_TARGET" ? todayActualGood : actualOutputTillDate;
      const isEndLineBottleneck = stations.length > 1 && actualGood === endLineOutput;

      const rawGood = taktMode === "SHIFT_TARGET" ? (matchedToday?.rawGood || 0) : (matchedCumulative?.rawGood || 0);
      const queueWip = taktMode === "SHIFT_TARGET" ? (matchedToday?.queueWip || 0) : (matchedCumulative?.queueWip || 0);

      const wipThreshold = Number(s.wipThreshold ?? bLine?.wipThreshold) >= 0
        ? Number(s.wipThreshold ?? bLine?.wipThreshold)
        : 20;

      const isCycleBottleneck = isBottleneck;
      const isWipBottleneck = (queueWip || 0) > wipThreshold;
      const combinedBottleneck = isCycleBottleneck || isWipBottleneck;

      return {
        ...s,
        bulletinLineId: s.bulletinLineId || bLine?.id || null,
        smvSeconds,
        operationName: bLine?.operationName || op?.name || s.operationName,
        operationCode: bLine?.operationCode || op?.operationCode || s.operationCode,
        machineType: bLine?.machineType || s.machineType || op?.machineType || "Single Needle Lockstitch",
        allocatedOps,
        effectiveTimeSecs,
        capacityPerHour,
        capacityPerShift,
        isBottleneck: combinedBottleneck,
        isCycleBottleneck,
        isWipBottleneck,
        wipThreshold,
        deficitPerHour,
        requiredOps,
        gap,
        loadPercent,
        requiredSkillRating,
        operatorNames,
        actualGood,
        actualOutputTillDate,
        outputNotRecorded,
        todayActualGood,
        rawGood,
        queueWip,
        remainingPieces,
        exactRemainingManpower,
        actualRequiredOps,
        actualRequiredGap,
        dynamicTaktSecs,
        dynamicPitchSecs,
        dynamicLoadPercent,
        isEndLineBottleneck,
      };
    });
  }, [
    stations,
    operations,
    selectedBulletin,
    affinities,
    getOperatorSkill,
    shiftHours,
    stationActuals,
    todayStationActuals,
    taktMode,
    totalOrderQuantity,
    liveAvailableProductionSecs,
    plannedEfficiencyFraction,
    designedPitchTimeSecs,
    activeShiftTarget,
    shiftScheduleMetrics,
    requiredDesignCapacity,
    operators,
    endLineOutput,
  ]);

  // ─── Line Metrics in Seconds ─────────────────────────────────────────────────
  const totalLineSMVSecs = useMemo(() => stationMetrics.reduce((sum, s) => sum + s.smvSeconds, 0), [stationMetrics]);
  const totalTheoreticalManpower = taktTimeSecs > 0 ? totalLineSMVSecs / taktTimeSecs : 0;
  const totalPlannedManpower = designedPitchTimeSecs > 0 ? totalLineSMVSecs / designedPitchTimeSecs : totalTheoreticalManpower;
  const totalAllocatedOps = useMemo(() => stations.reduce((sum, s) => sum + Math.max(1, s.operatorIds.length), 0), [stations]);
  const maxStationTimeSecs = useMemo(() => Math.max(...stationMetrics.map(m => m.effectiveTimeSecs), 0), [stationMetrics]);
  const bottleneckStations = useMemo(() => stationMetrics.filter(m => m.isBottleneck), [stationMetrics]);
  const bottleneckCount = bottleneckStations.length;

  const lineBalanceEfficiency = useMemo(() => {
    if (maxStationTimeSecs <= 0 || totalAllocatedOps <= 0) return 0;
    return Math.min(100, Math.round((totalLineSMVSecs / (maxStationTimeSecs * totalAllocatedOps)) * 1000) / 10);
  }, [totalLineSMVSecs, maxStationTimeSecs, totalAllocatedOps]);

  // ── Bottleneck Manager Notification Dispatch ──────────────────────────────
  const lastDispatchedKeyRef = useRef<string>("");

  const handleDispatchBottleneckNotification = useCallback(async () => {
    if (bottleneckCount === 0 || !selectedOrder) return;
    const summary = bottleneckStations
      .map(b => {
        const parts: string[] = [];
        if (b.isWipBottleneck) {
          parts.push(`WIP Overflow: ${b.queueWip} pcs queue > ${b.wipThreshold} limit`);
        }
        if (b.isCycleBottleneck) {
          parts.push(`Cycle: ${b.effectiveTimeSecs.toFixed(1)}s > ${taktTimeSecs.toFixed(1)}s Takt`);
        }
        return `#${b.stationNum} ${b.operationName} (${parts.join(", ") || "Bottleneck"}; Cap: ${b.capacityPerHour} pcs/hr)`;
      })
      .join("; ");

    try {
      await notificationsApi.triggerBottleneckAlert({
        lineName: selectedLine ? `${selectedLine.lineCode} · ${selectedLine.lineName}` : "Sewing Line",
        orderNo: selectedOrder.orderNo,
        bottleneckSummary: summary,
        bottleneckCount,
        taktTimeSecs,
        referenceId: Number(selectedOrder.id) || undefined,
      });
    } catch (e) {
      console.error("Failed to dispatch bottleneck notification:", e);
    }
  }, [bottleneckCount, selectedOrder, bottleneckStations, taktTimeSecs, selectedLine]);

  useEffect(() => {
    if (bottleneckCount > 0 && selectedOrder?.id && stations.length > 0) {
      const bottleneckStationKeys = bottleneckStations
        .map(b => `${b.stationNum}:${b.isWipBottleneck ? `wip${b.queueWip}` : ''}:${b.isCycleBottleneck ? 'pace' : ''}`)
        .sort()
        .join(",");
      const key = `bottleneck-${selectedOrder.id}-${selectedLineId || "default"}-${bottleneckStationKeys}`;

      const alreadySent = sessionStorage.getItem(key);
      if (lastDispatchedKeyRef.current !== key && !alreadySent) {
        lastDispatchedKeyRef.current = key;
        sessionStorage.setItem(key, "true");
        handleDispatchBottleneckNotification();
      }
    } else if (bottleneckCount === 0) {
      lastDispatchedKeyRef.current = "";
    }
  }, [bottleneckCount, selectedOrder?.id, selectedLineId, stations.length, bottleneckStations, handleDispatchBottleneckNotification]);

  // ─── Interactive Actions ─────────────────────────────────────────────────────
  const handleAddOperator = (index: number) => {
    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, operatorIds: [...s.operatorIds, null] } : s))
    );
  };

  const handleRemoveOperator = (index: number, slotIdx: number) => {
    setStations(prev =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.operatorIds.length <= 1) {
          return { ...s, operatorIds: [null] };
        }
        const updated = [...s.operatorIds];
        updated.splice(slotIdx, 1);
        return { ...s, operatorIds: updated };
      })
    );
  };

  const handleAssignOperator = (index: number, slotIdx: number, operatorIdStr: string) => {
    setStations(prev =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const updated = [...s.operatorIds];
        updated[slotIdx] = operatorIdStr ? operatorIdStr : null;
        return { ...s, operatorIds: updated };
      })
    );
  };

  // Quick-fix bottleneck: automatically adds required operator and assigns best skilled operator
  const handleQuickFixBottleneck = (index: number) => {
    const station = stations[index];
    const pitchPace = designedPitchTimeSecs > 0 ? designedPitchTimeSecs : taktTimeSecs;
    const needed = Math.max(1, Math.ceil(station.smvSeconds / pitchPace));
    
    // Best-rated operators for this operation first; never operators marked absent or on leave today
    const isAvailableToday = (opId: string | number) => {
      const st = getOperatorAttendance(opId);
      return st !== "ABSENT" && st !== "ON_LEAVE";
    };
    const matchingOps = getEligibleOpsForSkill(station.operationId, station.requiredSkillRating);
    const candidateOps = (matchingOps.length > 0 ? matchingOps : operators).filter(op => isAvailableToday(op.id));
    const sortedCandidates = [...candidateOps].sort((a, b) => {
      const rA = getOperatorSkill(a.id, station.operationId) || 0;
      const rB = getOperatorSkill(b.id, station.operationId) || 0;
      return rB - rA;
    });

    const updatedSlots = [...station.operatorIds];
    const addedSlots = Math.max(0, needed - updatedSlots.length);
    while (updatedSlots.length < needed) updatedSlots.push(null);

    // Fill every empty slot (new and existing) with the best free operator
    let filled = 0;
    for (let i = 0; i < updatedSlots.length; i++) {
      if (updatedSlots[i] !== null && updatedSlots[i] !== "") continue;
      const free = sortedCandidates.find(op => {
        const strId = String(op.id);
        return !updatedSlots.some(sId => String(sId) === strId) &&
          !operatorsAssignedInCurrentPlan.has(strId) &&
          !operatorsAssignedInOtherPlans.has(strId);
      });
      if (!free) break;
      updatedSlots[i] = free.id;
      filled++;
    }
    const stillEmpty = updatedSlots.filter(id => id === null || id === "").length;

    if (addedSlots === 0 && filled === 0) {
      setErrorMessage(stillEmpty > 0
        ? `Station #${station.stationNum} (${station.operationName}): no free operator with the required skill is available today.`
        : `Station #${station.stationNum} (${station.operationName}) already has ${updatedSlots.length} operator${updatedSlots.length === 1 ? "" : "s"}; nothing to change.`);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, operatorIds: updatedSlots } : s))
    );

    const parts = [
      addedSlots > 0 ? `${addedSlots} slot${addedSlots === 1 ? "" : "s"} added` : "",
      filled > 0 ? `${filled} operator${filled === 1 ? "" : "s"} assigned` : "",
      stillEmpty > 0 ? `${stillEmpty} still unassigned (no free skilled operator)` : "",
    ].filter(Boolean);
    setSuccessMessage(`Station #${station.stationNum} (${station.operationName}): ${parts.join(", ")}.`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleAutoBalance = () => {
    const pitchPace = designedPitchTimeSecs > 0 ? designedPitchTimeSecs : taktTimeSecs;
    if (pitchPace <= 0) return;
    setAutoBalancing(true);

    const assignedOpIds = new Set<string>(Array.from(operatorsAssignedInOtherPlans.keys()));

    const getSkillWeight = (ratingStr?: string | number) => {
      const r = String(ratingStr || "ANY").trim();
      if (r === "5") return 4000; // legacy 1–5 value, treated as Expert (4)
      if (r === "4_PLUS") return 4500;
      if (r === "4") return 4000;
      if (r === "3_PLUS") return 3500;
      if (r === "3") return 3000;
      if (r === "2") return 2000;
      if (r === "1") return 1000;
      return 0;
    };

    const stationIndices = stations.map((_, i) => i).sort((a, b) => {
      const wA = getSkillWeight(stations[a].requiredSkillRating);
      const wB = getSkillWeight(stations[b].requiredSkillRating);
      if (wB !== wA) return wB - wA;
      return stations[b].smvSeconds - stations[a].smvSeconds;
    });

    const newStationOpIds: (string | number | null)[][] = stations.map(() => []);

    stationIndices.forEach(idx => {
      const s = stations[idx];
      const neededOps = Math.max(1, Math.ceil(s.smvSeconds / pitchPace));
      const allocated: (string | number | null)[] = [];

      const reqRatingStr = String(s.requiredSkillRating || "ANY").trim();
      let targetRating: number | null = null;
      if (reqRatingStr === "3_PLUS") targetRating = INDEPENDENT_RATING;
      else if (reqRatingStr === "4_PLUS") targetRating = MAX_SKILL_RATING;
      else {
        const num = Number(reqRatingStr);
        if (!isNaN(num) && num >= MIN_SKILL_RATING) targetRating = clampRating(num);
      }

      // Free operators who are not marked absent / on leave today
      const availableOps = operators.filter(o => {
        if (assignedOpIds.has(String(o.id))) return false;
        const st = getOperatorAttendance(o.id);
        return st !== "ABSENT" && st !== "ON_LEAVE";
      });
      const sortedCandidates = [...availableOps].sort((a, b) => {
        const rA = getOperatorSkill(a.id, s.operationId) || 0;
        const rB = getOperatorSkill(b.id, s.operationId) || 0;
        if (targetRating !== null) {
          const isExactA = rA === targetRating ? 1 : 0;
          const isExactB = rB === targetRating ? 1 : 0;
          if (isExactB !== isExactA) return isExactB - isExactA;

          const meetsA = rA >= targetRating ? 1 : 0;
          const meetsB = rB >= targetRating ? 1 : 0;
          if (meetsB !== meetsA) return meetsB - meetsA;
          if (meetsA && meetsB) return rA - rB; // Closer to target is better to conserve higher star operators
        }
        return rB - rA;
      });

      for (let k = 0; k < neededOps; k++) {
        const unassigned = sortedCandidates[k];
        if (unassigned) {
          allocated.push(unassigned.id);
          assignedOpIds.add(String(unassigned.id));
        } else {
          allocated.push(null);
        }
      }
      newStationOpIds[idx] = allocated.length > 0 ? allocated : [null];
    });

    const balanced = stations.map((s, idx) => ({
      ...s,
      operatorIds: newStationOpIds[idx] && newStationOpIds[idx].length > 0 ? newStationOpIds[idx] : [null],
    }));

    setStations(balanced);
    setAutoBalancing(false);
    const unfilled = balanced.reduce((n, st) => n + st.operatorIds.filter(id => id === null).length, 0);
    setSuccessMessage(unfilled === 0
      ? `Line auto-balanced for ${requiredDesignCapacity.toFixed(1)} pcs/hr at ${plannedEfficiency}% efficiency; every slot has an operator.`
      : `Line auto-balanced for ${requiredDesignCapacity.toFixed(1)} pcs/hr at ${plannedEfficiency}% efficiency; ${unfilled} slot${unfilled === 1 ? "" : "s"} still need an operator (not enough free operators with the right skill today).`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // ─── Global Pool Optimization & Affinitized Coverage ───
  const handleAutoAssignOperators = (forceFullReassign = false) => {
    if (stations.length === 0) return;
    setAutoAssigning(true);

    // If stations have some assigned operators and some empty slots, default to filling empty slots seamlessly
    const hasAssigned = stations.some(s => s.operatorIds.some(Boolean));
    const hasUnassigned = stations.some(s => s.operatorIds.some(id => !id));
    const fillOnlyEmpty = !forceFullReassign && hasAssigned && hasUnassigned;

    const externalAssignedIds = new Set<string>(Array.from(operatorsAssignedInOtherPlans.keys()));

    const result = runGlobalPoolOptimization({
      stations,
      operators,
      skillAssessments,
      affinities,
      attendanceRecords,
      externalAssignedOperatorIds: externalAssignedIds,
      taktTimeSecs,
      shiftHours,
      fillOnlyEmpty,
    });

    const updatedStations = stations.map((s, idx) => ({
      ...s,
      operatorIds: result.updatedStationAssignments[idx] || s.operatorIds,
    }));

    setStations(updatedStations);
    setAutoAssigning(false);

    const m = result.metrics;
    setSuccessMessage(
      `Auto-Assignment Completed: Achieved ${m.realPoolAchievableEfficiency}% Line Efficiency (${m.realizationRatio}% Realization of Designed OB). Assigned ${m.directSkillMatchCount} direct skills, ${m.affinityMatchCount} via affinities${m.unfulfilledSlotCount > 0 ? ` (${m.unfulfilledSlotCount} unfilled)` : ""}.`
    );
    setTimeout(() => setSuccessMessage(""), 6000);
  };

  /** release=false: just save (a new plan stays a draft); release=true: save and approve/release it to the floor. */
  const handleSave = async (release = true) => {
    // Never fall back to "the first order / line / shift": a plan must be saved for exactly what is selected
    const check = checkPlanSave({
      order: selectedOrder,
      line: selectedLine ? { id: selectedLine.id, lineCode: String(selectedLine.lineCode), currentStyle: selectedLine.currentStyle } : undefined,
      shiftSelected: !!selectedShift,
      stationCount: stations.length,
      ctx: selectionCtx,
    });
    if (check.errors.length > 0) {
      setErrorMessage(`Plan not saved: ${check.errors.join(" ")}`);
      return;
    }
    if (check.confirm && !window.confirm(check.confirm)) return;
    const targetOrder = selectedOrder!;
    const shiftIdToUse = String(selectedShift!.id);
    const lineIdToUse = Number(selectedLine!.id);

    setSaving(true);
    setErrorMessage(null);
    try {
      const flatAssignments: any[] = [];
      for (const s of stations) {
        for (const opId of s.operatorIds) {
          flatAssignments.push({
            bulletinLineId: s.bulletinLineId ? Number(s.bulletinLineId) : null,
            operationId: Number(s.operationId),
            operatorId: opId ? Number(opId) : null,
            isQcCheckpoint: s.isQcCheckpoint ?? false,
          });
        }
      }

      await linePlanApi.savePlan({
        orderId: String(targetOrder.id),
        shiftId: Number(shiftIdToUse),
        lineId: lineIdToUse,
        allowance: 0,
        targetOutput: activeShiftTarget || requiredHourlyTarget || targetOrder.totalQuantity || 500,
        plannedEfficiency,
        assignments: flatAssignments,
        release,
      } as any);

      // If activeLineDesign exists, also update Line Design with the latest station allocations
      if (activeLineDesign?.id) {
        try {
          // stationAllocations is a map "bulletin line id (or operation id) → operator count", the format
          // Line Architecture writes and this page reads back. workstationsJson stays as Line Architecture saved it.
          const allocationCounts: Record<string, number> = {};
          for (const s of stations) {
            allocationCounts[String(s.bulletinLineId ?? s.operationId)] = s.operatorIds.length;
          }
          await lineDesignApi.updateDesign(activeLineDesign.id, {
            ...activeLineDesign,
            lineId: lineIdToUse || activeLineDesign.lineId,
            shiftId: Number(shiftIdToUse),
            stationAllocations: JSON.stringify(allocationCounts),
          } as any);
        } catch (ldErr) {
          console.warn("Could not update line design allocations:", ldErr);
        }
      }

      const refreshedPlans = await linePlanApi.getAllPlans().catch(loadFailed([]));
      setAllLinePlans(refreshedPlans || []);
      stationsDirtyRef.current = false;
      setSuccessMessage(release
        ? "✓ Plan approved and released to the floor. It is connected with Live Production Monitoring & the Hourly Operation Board."
        : "✓ Plan saved. Approve & Release it when it is ready for the floor.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e: any) {
      console.error("Failed to save line plan:", e);
      const errMsg = e?.response?.data?.message || e?.message || "Failed to save line plan. Please try again.";
      setErrorMessage(`❌ ${errMsg}`);
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPlan = () => {
    if (!selectedOrder) return;
    const exportData = stationMetrics.map(m => ({
      "Station #": m.stationNum,
      "Operation Code": m.operationCode,
      "Operation Name": m.operationName,
      "Machine Type": m.machineType,
      "SMV (Sec)": m.smvSeconds,
      "Benchmark Required Ops": m.requiredOps,
      "Allocated Operators": m.allocatedOps,
      "Assigned Operators": m.operatorNames.join(", ") || "Unassigned",
      "Effective Time (Sec)": m.effectiveTimeSecs.toFixed(1),
      "Capacity / Hr": m.capacityPerHour,
      "Capacity / Shift": m.capacityPerShift,
      "Design Pitch (Sec)": designedPitchTimeSecs.toFixed(1),
      "Customer Takt (Sec)": taktTimeSecs.toFixed(1),
      "Planned Efficiency %": `${plannedEfficiency}%`,
      "Required Design Capacity / Hr": requiredDesignCapacity.toFixed(1),
      "Customer Target / Hr": requiredHourlyTarget.toFixed(1),
      "Load %": `${m.loadPercent}%`,
      "Actual Output Till Date": m.actualOutputTillDate,
      "Remaining Pieces": m.remainingPieces,
      "Dynamic Pitch (Sec)": m.dynamicPitchSecs > 0 ? m.dynamicPitchSecs.toFixed(1) : "N/A (Done)",
      "Actual Required Ops (Remaining)": m.actualRequiredOps,
      "Exact Manpower Needed": m.exactRemainingManpower.toFixed(2),
      "Today Actual Output": m.todayActualGood,
      "Bottleneck": m.isBottleneck ? "YES - DEFICIT" : "NO - BALANCED",
    }));

    exportToExcel(
      exportData,
      `Line_Plan_${selectedOrder.orderNo}_${toLocalDateString()}`
    );
  };

  // ── Import a line plan (Export Plan layout) into the selected order + line; the user reviews and saves ──
  const [planImportOpen, setPlanImportOpen] = useState(false);

  /** Template = this plan's stations in the import layout, with the current operators filled in. */
  const handleDownloadPlanTemplate = () => {
    const opName = (id: string | number | null) => operators.find(o => String(o.id) === String(id))?.name ?? "";
    const rows = stations.map(st => ({
      "Station #": st.stationNum,
      "Operation Code": st.operationCode,
      "Operation Name": st.operationName,
      "Machine Type": st.machineType,
      "SMV (Sec)": st.smvSeconds,
      "Assigned Operators": st.operatorIds.map(opName).filter(Boolean).join(" / "),
      "Allocated Operators": st.operatorIds.length,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [10, 14, 46, 30, 10, 40, 18].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Line Plan");
    XLSX.writeFile(wb, `Line_Plan_Template_${selectedOrder?.orderNo ?? "plan"}_${selectedLine?.lineCode ?? ""}.xlsx`);
  };

  const handleImportPlan = async (file: File) => {
    setErrorMessage(null);
    let rows: Record<string, unknown>[];
    try {
      rows = await readFromExcel<Record<string, unknown>>(file);
    } catch (err) {
      setErrorMessage(`Could not read the file: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    const block = pickPlanBlock(rows, operators, selectedLine?.lineCode);
    const result = applyLinePlanRows(block.rows, stations, operators, selectedLine?.lineCode, block.offset);
    if (result.matchedStations === 0) {
      setErrorMessage(`Nothing was imported: no row matches an operation of ${selectedBulletin?.bulletinCode ?? "this plan's bulletin"}.`
        + (result.problems.length ? ` ${result.problems.slice(0, 3).join("; ")}` : ""));
      return;
    }
    setStations(result.stations);
    const fromBlock = block.blockCount > 1 ? ` The file holds ${block.blockCount} plans; used plan ${block.chosen + 1} (its operators are on ${selectedLine?.lineCode}).` : "";
    setSuccessMessage(`Imported ${result.matchedStations} station${result.matchedStations === 1 ? "" : "s"} and ${result.assignedOperators} operator${result.assignedOperators === 1 ? "" : "s"} for ${selectedOrder?.orderNo} on ${selectedLine?.lineCode}.${fromBlock} Review the table, then save the plan.`);
    setTimeout(() => setSuccessMessage(""), 8000);
    if (result.problems.length > 0) {
      setErrorMessage(`${result.problems.length} item${result.problems.length === 1 ? "" : "s"} could not be imported: ${result.problems.slice(0, 6).join("; ")}${result.problems.length > 6 ? "; …" : ""}`);
    }
  };

  const handleResetPlan = async () => {
    if (!selectedOrder || !selectedOrder.id) return;
    if (!window.confirm("Are you sure you want to reset this line plan back to default operation bulletin / master operations?")) {
      return;
    }
    try {
      await linePlanApi.deletePlanByOrderId(selectedOrder.id);
      linePlanApi.getAllPlans().then(plans => setAllLinePlans(plans || [])).catch(() => {});
      setSuccessMessage("Line plan reset to defaults.");
      setTimeout(() => setSuccessMessage(""), 4000);

      // Re-initialize stations
      if (selectedBulletin && selectedBulletin.lines && selectedBulletin.lines.length > 0) {
        const rows: StationRow[] = selectedBulletin.lines
          .sort((a, b) => a.sequence - b.sequence)
          .map(line => {
            const op = operations.find(o => String(o.id) === String(line.operationId) || (line.operationCode && o.operationCode === line.operationCode));
            // The bulletin's SMV is the style-specific time; the operation master's standard SMV is only a fallback
            const smvVal = Number(line.smv && Number(line.smv) > 0 ? line.smv : (op?.standardSmv || 0.5));

            return {
              stationNum: line.sequence,
              bulletinLineId: line.id,
              operationId: line.operationId,
              operationCode: op?.operationCode || "OP",
              operationName: op?.name || "Operation",
              machineType: line.machineType || "Single Needle",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              wipThreshold: line.wipThreshold ?? 20,
              operatorIds: [null],
              requiredSkillRating: line.skillRatingRequired ? String(line.skillRatingRequired) : (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3"),
            };
          });
        setStationRows(rows);
        stationsDirtyRef.current = false;
      } else if (operations.length > 0) {
        const rows: StationRow[] = operations
          .filter(o => o.active)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          .map((op, idx) => {
            const smvVal = Number(op.standardSmv || 0.5);
            return {
              stationNum: idx + 1,
              bulletinLineId: null,
              operationId: op.id,
              operationCode: op.operationCode,
              operationName: op.name,
              machineType: "Single Needle",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds: [null],
              requiredSkillRating: (op?.skillLevelRequired || op?.skillLevel || op?.defaultSkillRating) ? String(op.skillLevelRequired || op.skillLevel || op.defaultSkillRating) : "3",
            };
          });
        setStationRows(rows);
        stationsDirtyRef.current = false;
      }
    } catch (e) {
      console.error("Failed to reset line plan:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Loading line balancing data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] px-5 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {/* Title + context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-[#9C5B3C] to-[#7A452D] shadow-sm shadow-[#9C5B3C]/20">
            {taktMode === "SHIFT_TARGET" ? <Gauge className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-[#221912]">
                {taktMode === "SHIFT_TARGET" ? "Fixed Shift Target Balancing" : "Planned Lines & Balancing"}
              </h1>
              {selectedOrder && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    !selectedOrderPlan ? "bg-slate-50 text-slate-600 border-slate-200"
                    : selectedOrderPlan.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"}`}
                  title="Status of the saved plan for this order"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${!selectedOrderPlan ? "bg-slate-400" : selectedOrderPlan.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {!selectedOrderPlan ? "Not saved" : selectedOrderPlan.status === "active" ? "Released" : selectedOrderPlan.status === "completed" ? "Completed" : "Draft"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C7E6E] truncate">
              {selectedOrder
                ? [selectedOrder.orderNo, selectedOrder.styleNo, selectedLine?.lineCode, selectedShift?.shiftName].filter(Boolean).join(" · ")
                : "Select a line and a production order"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Secondary: file and reset actions, grouped and quiet */}
          <div className="inline-flex items-stretch rounded-xl border border-[#E6DDCE] bg-white shadow-2xs overflow-hidden" role="group" aria-label="Plan file actions">
            <button
              type="button"
              onClick={() => setPlanImportOpen(true)}
              disabled={stations.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-[#5C4A3A] hover:bg-[#FAF7F2] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={stations.length === 0 ? "Select an order whose style has a bulletin first" : "Import operators per station from Excel into this plan"}
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button
              type="button"
              onClick={handleExportPlan}
              disabled={stations.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-[#5C4A3A] hover:bg-[#FAF7F2] border-l border-[#E6DDCE] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export the line balancing sheet to Excel"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              type="button"
              onClick={handleResetPlan}
              disabled={!selectedOrder}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 border-l border-[#E6DDCE] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Reset the plan back to the bulletin's defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <ExcelImportDialog
            isOpen={planImportOpen}
            onClose={() => setPlanImportOpen(false)}
            title={`Import Line Plan · ${selectedOrder?.orderNo ?? ""} on ${selectedLine?.lineCode ?? ""}`}
            template={LINE_PLAN_TEMPLATE}
            onDownloadTemplate={handleDownloadPlanTemplate}
            onImport={handleImportPlan}
          />

          <Link
            to={`/monitoring?orderId=${selectedOrderId || ""}&lineId=${selectedLineId || ""}&shiftId=${selectedShiftId || ""}&tab=line-monitoring`}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-emerald-800 rounded-xl hover:bg-emerald-50 transition-colors"
            title="Open live execution tracking and the hourly pitch monitor"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" /> Live Monitor
          </Link>

          <span className="hidden sm:block w-px h-6 bg-[#E6DDCE] mx-1" aria-hidden />

          {/* Primary actions */}
          <Button
            variant="outline"
            onClick={handleAutoBalance}
            loading={autoBalancing}
            size="sm"
            className="h-9 gap-1.5 border-[#E6DDCE] bg-white text-[#5C4A3A] hover:bg-[#FAF7F2] font-semibold text-xs px-3"
            title="Fill and balance operators automatically"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#9C5B3C]" /> Auto-Balance
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            loading={saving}
            size="sm"
            className="h-9 gap-1.5 border-[#9C5B3C] text-[#9C5B3C] bg-white hover:bg-[#FAF7F2] font-bold text-xs px-3.5"
            title="Save stations, operators and targets without releasing the plan to the floor"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
          <Button
            onClick={() => handleSave(true)}
            loading={saving}
            size="sm"
            className="h-9 gap-1.5 bg-[#9C5B3C] hover:bg-[#854B30] text-white shadow-sm shadow-[#9C5B3C]/25 font-bold text-xs px-3.5"
            title="Save and approve & release the line plan to the sewing floor"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Release
          </Button>
        </div>
      </header>

      {/* Success & Error Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-[#F3F5F2] border border-[#d4decb] text-[#77876F] rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-[#77876F] shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Line Design Ribbon Banner */}
      {activeLineDesign && (
        <div className="p-4 bg-gradient-to-r from-[#FFFDFB] to-[#FBF7F0] border border-[#E6DDCE] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9C5B3C]/10 text-[#9C5B3C] flex items-center justify-center font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-[#221912] tracking-wider">
                  Line Architecture Design Applied: <span className="font-mono text-[#9C5B3C]">{activeLineDesign.designCode}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  {activeLineDesign.strategyName?.toUpperCase() || "OPTIMIZED"} STRATEGY
                </span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5">
                {activeLineDesign.totalWorkstations} Workstations ({activeLineDesign.totalOperators} Sewing Operators) · Target {activeLineDesign.targetHourlyOutput} pcs/hr @ {activeLineDesign.plannedEfficiency}% Planned Efficiency{activeLineDesign.lineBalanceEfficiency ? ` · ${activeLineDesign.lineBalanceEfficiency.toFixed(1)}% LBE` : ""} (Pitch: {activeLineDesign.designedPitchSecs ? activeLineDesign.designedPitchSecs.toFixed(1) : "—"}s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/line_design?orderId=${activeLineDesign.orderId || selectedOrderId || ""}&capacityPlanId=${activeLineDesign.capacityPlanId || ""}`}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E6DDCE] hover:border-[#9C5B3C] text-xs font-bold text-[#221912] transition-colors shadow-2xs"
            >
              Reconfigure Architecture →
            </Link>
          </div>
        </div>
      )}

      {/* Overdue / no time left: a delivery pace cannot be calculated, so explain what the page uses instead */}
      {taktMode === "DELIVERY" && selectedOrder && deliveryScheduleMetrics.noTimeLeft && (
        <div className="bg-white border border-rose-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)]" role="alert">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-bold text-[#221912]">
              {deliveryScheduleMetrics.isOverdue
                ? `${selectedOrder.orderNo} is ${deliveryScheduleMetrics.daysOverdue} day${deliveryScheduleMetrics.daysOverdue === 1 ? "" : "s"} overdue`
                : `${selectedOrder.orderNo} is due today and today's shift has ended`}
              <span className="font-semibold text-rose-700"> · {remainingOrderBalance.toLocaleString()} pcs still open</span>
            </p>
            <p className="text-xs text-[#8C7E6E] leading-relaxed">
              Planned completion was {deliveryScheduleMetrics.plannedCompletionFormatted}.{" "}
              {configuredDailyTarget > 0
                ? `Targets below use the line's planned pace (${configuredDailyTarget.toLocaleString()} pcs/day) until a new date is set.`
                : "No line design or line capacity is set, so no target can be calculated."}
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-800 shrink-0"
          >
            <CalendarClock className="w-3.5 h-3.5" /> Update dates
          </Link>
        </div>
      )}

      {/* ── 1. Target & Shift Configuration Panel ─────────────────── */}
      <div className="bg-white border border-[#E6DDCE] rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] space-y-4">
        <div className="space-y-3.5 pb-1 border-b border-[#F0EAE0]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#221912]">Line Target & Floor Configuration</h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Dedicated Page Link Switcher */}
            <div className="flex items-center bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE] shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setTaktMode("DELIVERY");
                  navigate(`/line-balance${selectedOrderId ? `?orderId=${selectedOrderId}` : ""}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taktMode === "DELIVERY"
                    ? "bg-[#9C5B3C] text-white shadow-xs"
                    : "text-[#8C7E6E] hover:text-[#221912]"
                }`}
                title="Open Planned Lines (Delivery Schedule Window Pacing)"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Planned Pace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaktMode("SHIFT_TARGET");
                  navigate(`/fixed-shift-target${selectedOrderId ? `?orderId=${selectedOrderId}` : ""}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  taktMode === "SHIFT_TARGET"
                    ? "bg-[#9C5B3C] text-white shadow-xs"
                    : "text-[#8C7E6E] hover:text-[#221912]"
                }`}
                title="Open Fixed Shift Target Page (Daily Shift Target Pacing)"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Fixed Shift Target</span>
              </button>
            </div>

            {/* Attendance Filter Toggle */}
            <button
              type="button"
              onClick={() => setFilterPresentOnly(!filterPresentOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                filterPresentOnly
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Present Only</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                filterPresentOnly ? "bg-emerald-200 text-emerald-900" : "bg-slate-100 text-slate-600"
              }`}>
                {presentOperatorCount}/{operators.length}
              </span>
            </button>
          </div>
        </div>

        {/* How this plan is connected: Order -> Style -> Bulletin (operations) -> Line -> Shift */}
        <PlanSetupChain
          order={selectedOrder}
          bulletins={bulletinsForOrderStyle}
          bulletin={selectedBulletin}
          onPickBulletin={id => setSelectedBulletinId(id)}
          line={selectedLine}
          plannedLineName={(() => {
            const plan = selectedOrderPlan;
            if (!plan || String(plan.lineId) === String(selectedLineId)) return null;
            const l = lines.find(x => String(x.id) === String(plan.lineId));
            return l ? `${l.lineCode} · ${l.lineName}` : null;
          })()}
          isPlanned={!!selectedOrderPlan}
          lineChoices={linesForStyle(selectedOrder?.styleNo)
            .slice()
            .sort((a, b) => String(a.lineCode).localeCompare(String(b.lineCode), undefined, { numeric: true }))
            .map(l => ({ id: String(l.id), code: String(l.lineCode), planned: planCountByLine.get(String(l.id)) ?? 0 }))}
          onPickLine={handleLineChange}
          shift={selectedShift}
          shiftHours={shiftHours}
        />

        {/* Floor Configuration Grid: Render customized panels for Planned Pace vs Fixed Shift Target */}
        {taktMode === "DELIVERY" ? (
          /* ── Mode A: Planned Pace (Master Delivery Plan) ──────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Sewing Line Selection */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Physical Sewing Line</label>
                <CustomSelect
                  value={selectedLineId}
                  onChange={handleLineChange}
                  options={[...lines]
                    .sort((a, b) => Number(lineRunsStyle(b, selectedOrder?.styleNo)) - Number(lineRunsStyle(a, selectedOrder?.styleNo))
                      || String(a.lineCode).localeCompare(String(b.lineCode), undefined, { numeric: true }))
                    .map(l => {
                      const planned = planCountByLine.get(String(l.id)) ?? 0;
                      const load = `${planned} order${planned === 1 ? "" : "s"} planned`;
                      return {
                        value: String(l.id),
                        label: `${l.lineCode} · ${l.lineName}`,
                        sublabel: lineStyleNo(l)
                          ? (lineRunsStyle(l, selectedOrder?.styleNo) ? `✓ Runs ${lineStyleNo(l)} · ${load}` : `Runs ${lineStyleNo(l)} · ${load}`)
                          : `No active style set · ${load}`,
                      };
                    })}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                {selectedLine ? `${selectedLine.floor || "Main Floor"} · ${selectedLine.supervisorName || "Supervisor: Unassigned"}` : "Select line"}
              </span>
            </div>

            {/* 2. Order Selection */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Production Order (PO)</label>
                <CustomSelect
                  value={selectedOrderId}
                  onChange={val => setSelectedOrderId(val)}
                  options={orderChoicesForLine.map(({ order: ord, fit }) => ({
                    value: String(ord.id),
                    label: ord.orderNo,
                    sublabel: [ord.styleNo, ord.color, fit.note].filter(Boolean).join(" · "),
                    disabled: !fit.selectable,
                  }))}
                  placeholder={selectedLine && lineStyleNo(selectedLine) ? `No open ${lineStyleNo(selectedLine)} orders` : "Select an order"}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#77876F] font-bold block truncate min-h-[16px]">
                {selectedOrder ? `Demand: ${totalOrderQuantity.toLocaleString()} pcs (${selectedOrder.color || "Standard"})` : "No order selected"}
              </span>
            </div>

            {/* 3. Real-Time Planned Completion & Delivery Window */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Planned Complete Target</label>
                <div className="h-11 bg-white border border-[#E6DDCE] rounded-xl px-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[#9C5B3C] shrink-0" />
                    <span className="text-xs font-bold text-[#221912] font-mono truncate">
                      {deliveryScheduleMetrics.plannedCompletionFormatted || "—"}
                    </span>
                  </div>
                  {deliveryScheduleMetrics.isOverdue ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 shrink-0">
                      {deliveryScheduleMetrics.daysOverdue}d overdue
                    </span>
                  ) : deliveryScheduleMetrics.noTimeLeft ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 shrink-0">
                      Due today
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] shrink-0">
                      {deliveryScheduleMetrics.workingDaysRemaining}d left
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] min-h-[16px]">
                <button
                  type="button"
                  onClick={() => setWorkDaysOnly(!workDaysOnly)}
                  className={`font-semibold hover:text-[#9C5B3C] transition-colors cursor-pointer flex items-center gap-1 ${
                    workDaysOnly ? "text-[#9C5B3C]" : "text-[#8C7E6E]"
                  }`}
                  title="Toggle between 6-day work week (excluding Sundays) and 7-day continuous schedule"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${workDaysOnly ? "bg-[#9C5B3C]" : "bg-slate-400"}`} />
                  <span>{workDaysOnly ? "6-Day Wk (Excl Sun)" : "7-Day Wk"}</span>
                </button>
              </div>
            </div>

            {/* 4. Production Shift */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Production Shift</label>
                <CustomSelect
                  value={selectedShiftId}
                  onChange={val => setSelectedShiftId(val)}
                  options={shifts.map(s => ({
                    value: String(s.id),
                    label: `${s.shiftCode} (${s.startTime} - ${s.endTime})`
                  }))}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                {selectedShift ? `${selectedShift.shiftName || "Shift"} · ${shiftHours.toFixed(1)}h working (after breaks)` : "Select a shift"}
              </span>
            </div>

            {/* 5. Required Daily Target */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Required Daily Target</label>
                <div className="h-11 bg-white border border-[#E6DDCE] rounded-xl px-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-mono text-xs font-black text-[#221912]">
                      {requiredDailyTarget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#8C7E6E] font-normal font-sans shrink-0">pcs/day</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-[#77876F] bg-[#F3F5F2] px-2 py-0.5 rounded-md font-bold border border-[#d4decb] font-mono shadow-2xs shrink-0">
                    <TrendingUp className="w-3 h-3 text-[#77876F]" />
                    {requiredHourlyTarget.toFixed(1)} pcs/hr
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                {deliveryPaceUnavailable ? "Line's planned pace (order past due date)" : "Pace target for on-time delivery"}
              </span>
            </div>
          </div>
        ) : (
          /* ── Mode B: Fixed Shift Target (Live Shift Execution) ─────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Sewing Line Selection */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Physical Sewing Line</label>
                <CustomSelect
                  value={selectedLineId}
                  onChange={handleLineChange}
                  options={[...lines]
                    .sort((a, b) => Number(lineRunsStyle(b, selectedOrder?.styleNo)) - Number(lineRunsStyle(a, selectedOrder?.styleNo))
                      || String(a.lineCode).localeCompare(String(b.lineCode), undefined, { numeric: true }))
                    .map(l => {
                      const planned = planCountByLine.get(String(l.id)) ?? 0;
                      const load = `${planned} order${planned === 1 ? "" : "s"} planned`;
                      return {
                        value: String(l.id),
                        label: `${l.lineCode} · ${l.lineName}`,
                        sublabel: lineStyleNo(l)
                          ? (lineRunsStyle(l, selectedOrder?.styleNo) ? `✓ Runs ${lineStyleNo(l)} · ${load}` : `Runs ${lineStyleNo(l)} · ${load}`)
                          : `No active style set · ${load}`,
                      };
                    })}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                {selectedLine ? `${selectedLine.floor || "Main Floor"} · ${selectedLine.supervisorName || "Supervisor: Unassigned"}` : "Select line"}
              </span>
            </div>

            {/* 2. Order Selection */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Production Order (PO)</label>
                <CustomSelect
                  value={selectedOrderId}
                  onChange={val => setSelectedOrderId(val)}
                  options={orderChoicesForLine.map(({ order: ord, fit }) => ({
                    value: String(ord.id),
                    label: ord.orderNo,
                    sublabel: [ord.styleNo, ord.color, fit.note].filter(Boolean).join(" · "),
                    disabled: !fit.selectable,
                  }))}
                  placeholder={selectedLine && lineStyleNo(selectedLine) ? `No open ${lineStyleNo(selectedLine)} orders` : "Select an order"}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#77876F] font-bold block truncate min-h-[16px]">
                {selectedOrder ? `Demand: ${totalOrderQuantity.toLocaleString()} pcs (${selectedOrder.color || "Standard"})` : "No order selected"}
              </span>
            </div>

            {/* 3. Production Shift with Live Countdown */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Production Shift</label>
                <CustomSelect
                  value={selectedShiftId}
                  onChange={val => setSelectedShiftId(val)}
                  options={shifts.map(s => ({
                    value: String(s.id),
                    label: `${s.shiftCode} (${s.startTime} - ${s.endTime})`
                  }))}
                  size="lg"
                />
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                {selectedShift ? `${selectedShift.shiftName || "Shift"} · ${shiftHours.toFixed(1)}h working (after breaks)` : "Select a shift"}
              </span>
            </div>

            {/* 4. Shift Target Output Input */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-[#221912] block truncate mb-1.5">Shift Target Output</label>
                <input
                  type="number"
                  min={1}
                  value={customShiftTarget !== null ? customShiftTarget : plannedPaceDailyTarget}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setCustomShiftTarget(val > 0 ? val : null);
                  }}
                  className="w-full h-11 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-mono font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8C7E6E] min-h-[16px]">
                <span className="font-mono text-[10.5px]">Pace: {plannedPaceDailyTarget} pcs</span>
                {customShiftTarget !== null && customShiftTarget !== plannedPaceDailyTarget && (
                  <button
                    type="button"
                    onClick={() => setCustomShiftTarget(null)}
                    className="text-[10px] text-[#9C5B3C] font-bold hover:underline cursor-pointer"
                    title="Reset to Planned Pace Target"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* 5. End-Line Output & Remaining Shift Balance */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#221912] block truncate">End-Line Output</label>
                  <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 font-mono shrink-0" title="Governed by the bottleneck minimum completed station pace">
                    Min Flow
                  </span>
                </div>
                <div className="h-11 bg-white border border-[#E6DDCE] rounded-xl px-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono text-xs font-black text-[#221912]">
                      {endLineOutput} <span className="text-[10px] text-[#8C7E6E] font-normal font-sans">pcs</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300/80 shadow-2xs shrink-0">
                    Bal: {remainingShiftBalance} pcs
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate min-h-[16px]">
                Shift completed balance
              </span>
            </div>
          </div>
        )}
      </div>



      {/* ── 2. Live Calculation Summary Cards (Differentiated by Mode) ── */}
      {taktMode === "DELIVERY" ? (
        /* ── Mode A: Planned Pace Summary Cards ─────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: PLANNED / DYNAMIC TAKT & DESIGNED PITCH TIME */}
          <div className="bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C] truncate">
                  LIVE DYNAMIC TAKT & PITCH
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#9C5B3C] bg-white px-2.5 py-0.5 rounded-lg border border-[#E6DDCE] shrink-0 shadow-2xs">
                Pitch: {designedPitchTimeSecs > 0 ? designedPitchTimeSecs.toFixed(2) : "0.00"}s
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {taktTimeSecs > 0 ? taktTimeSecs.toFixed(2) : "0.00"}
              </span>
              <span className="text-xs font-bold text-[#9C5B3C]">sec / pc takt</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/70 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className="truncate">
                Pitch: <strong className="text-[#221912] font-bold">{designedPitchTimeSecs.toFixed(2)}s</strong> (@ {plannedEfficiency}% Eff)
                {baselineDesignPitchSecs > 0 && Math.abs(baselineDesignPitchSecs - designedPitchTimeSecs) > 0.05 && (
                  <span className="text-[10px] text-[#A89F91] ml-1.5">(Plan: {baselineDesignPitchSecs.toFixed(1)}s)</span>
                )}
              </span>
              <span className={`shrink-0 font-sans font-semibold ${endLineOutput > 0 ? "text-emerald-700" : "text-[#9C5B3C]"}`}>
                {endLineOutput > 0 ? `${endLineOutput.toLocaleString()} / ${totalOrderQuantity.toLocaleString()} pcs` : `${totalOrderQuantity.toLocaleString()} pcs total`}
              </span>
            </div>
          </div>

          {/* Card 2: REQUIRED RUN RATE & DESIGN CAPACITY */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                REQUIRED RUN RATE & CAPACITY
              </span>
              <span 
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#9C5B3C] bg-[#F6F1E8] px-2.5 py-0.5 rounded-lg border border-[#E6DDCE] shrink-0 shadow-2xs" 
                title={`Required Design Capacity = ${requiredHourlyTarget.toFixed(1)} / (${plannedEfficiency}%) = ${requiredDesignCapacity.toFixed(1)} pcs/hr`}
              >
                <TrendingUp className="w-3 h-3 text-[#9C5B3C]" />
                <span>Cap: {requiredDesignCapacity.toFixed(1)}/hr</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {requiredDailyTarget.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">pcs / day</span>
              <span className="text-xs font-mono font-bold text-[#9C5B3C]">({requiredHourlyTarget.toFixed(1)} pcs/hr)</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className="truncate">
                Design Cap: <strong className="text-[#9C5B3C] font-bold">{requiredDesignCapacity.toFixed(1)} pcs/hr</strong>
              </span>
              <span className="shrink-0 text-slate-600">
                {(requiredHourlyTarget / 60).toFixed(2)} pcs/min
              </span>
            </div>
          </div>

          {/* Card 3: TOTAL WORK CONTENT (SMV) */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                TOTAL WORK CONTENT (SMV)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-lg border border-slate-200/80 shrink-0 shadow-2xs">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{stations.length} Operations</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {totalLineSMVSecs.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E]">sec</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span>Avg Pitch: <strong className="text-slate-800">{(totalLineSMVSecs / Math.max(1, stations.length)).toFixed(1)}s</strong></span>
              <span>Max: <strong className="text-rose-700 font-bold">{maxStationTimeSecs.toFixed(1)}s</strong></span>
            </div>
          </div>

          {/* Card 4: MANPOWER ALLOCATION & EFFICIENCY */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                MANPOWER ALLOCATION
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold shadow-2xs border shrink-0 ${
                lineBalanceEfficiency >= 85
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                  : lineBalanceEfficiency >= 70
                  ? "bg-sky-50 text-sky-800 border-sky-200/90"
                  : "bg-rose-50 text-rose-800 border-rose-200/90"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  lineBalanceEfficiency >= 85 ? "bg-emerald-500" : lineBalanceEfficiency >= 70 ? "bg-sky-500" : "bg-rose-500"
                }`} />
                <span>{lineBalanceEfficiency.toFixed(1)}% Eff</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {totalAllocatedOps}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">allocated operators</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className={totalAllocatedOps >= totalPlannedManpower ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                {totalAllocatedOps >= totalPlannedManpower ? "✓ Design Capacity Met" : `⚠️ ${Math.max(0, Math.ceil(totalPlannedManpower - totalAllocatedOps))} Ops Deficit`}
              </span>
              <span title={`Theoretical: ${totalTheoreticalManpower.toFixed(1)} ops, Planned @ ${plannedEfficiency}%: ${totalPlannedManpower.toFixed(1)} ops`}>
                Plan: <strong className="text-[#221912] font-bold">{totalPlannedManpower.toFixed(1)}</strong> ({totalTheoreticalManpower.toFixed(1)} theor)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mode B: Fixed Shift Target Summary Cards ────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: DYNAMIC REMAINING TAKT & PITCH */}
          <div className="bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C] truncate">
                  LIVE DYNAMIC SHIFT TAKT
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#9C5B3C] bg-white px-2.5 py-0.5 rounded-lg border border-[#E6DDCE] shrink-0 shadow-2xs">
                Pitch: {designedPitchTimeSecs > 0 ? designedPitchTimeSecs.toFixed(2) : "0.00"}s
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {taktTimeSecs > 0 ? taktTimeSecs.toFixed(2) : "0.00"}
              </span>
              <span className="text-xs font-bold text-[#9C5B3C]">sec / pc</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/70 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className="truncate">
                Pitch: <strong className="text-[#221912] font-bold">{designedPitchTimeSecs.toFixed(2)}s</strong> (@ {plannedEfficiency}% Eff)
                {baselineDesignPitchSecs > 0 && Math.abs(baselineDesignPitchSecs - designedPitchTimeSecs) > 0.05 && (
                  <span className="text-[10px] text-[#A89F91] ml-1.5">(Plan: {baselineDesignPitchSecs.toFixed(1)}s)</span>
                )}
              </span>
              {todayShiftOutput > 0 && (
                <span className="shrink-0 text-emerald-700 font-bold font-sans">
                  Today: {todayShiftOutput} pcs
                </span>
              )}
            </div>
          </div>

          {/* Card 2: REMAINING SHIFT BALANCE & DESIGN CAPACITY */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                REMAINING SHIFT BALANCE
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#9C5B3C] bg-[#F6F1E8] px-2.5 py-0.5 rounded-lg border border-[#E6DDCE] shrink-0 shadow-2xs">
                <TrendingUp className="w-3 h-3 text-[#9C5B3C]" />
                <span>Cap: {requiredDesignCapacity.toFixed(1)}/hr</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {remainingShiftBalance.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">pcs balance</span>
              <span className="text-xs font-mono font-bold text-[#9C5B3C]">({requiredHourlyTarget.toFixed(1)} pcs/hr)</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className="truncate">
                Design Cap: <strong className="text-[#9C5B3C] font-bold">{requiredDesignCapacity.toFixed(1)} pcs/hr</strong>
              </span>
              <span className={`shrink-0 font-bold ${remainingShiftBalance === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                {remainingShiftBalance === 0 ? "✓ Quota Met" : `${remainingShiftBalance} pcs left`}
              </span>
            </div>
          </div>

          {/* Card 3: TOTAL WORK CONTENT (SMV) */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                TOTAL WORK CONTENT (SMV)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-lg border border-slate-200/80 shrink-0 shadow-2xs">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{stations.length} Operations</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {totalLineSMVSecs.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#8C7E6E]">sec</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span>Avg Pitch: <strong className="text-slate-800">{(totalLineSMVSecs / Math.max(1, stations.length)).toFixed(1)}s</strong></span>
              <span>Max: <strong className="text-rose-700 font-bold">{maxStationTimeSecs.toFixed(1)}s</strong></span>
            </div>
          </div>

          {/* Card 4: END-LINE THROUGHPUT & PROGRESS */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] hover:border-[#9C5B3C]/40 transition-all flex flex-col justify-between min-h-[142px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] truncate">
                SHIFT PROGRESS & FLOW
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold shadow-2xs border shrink-0 ${
                lineBalanceEfficiency >= 85
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                  : lineBalanceEfficiency >= 70
                  ? "bg-sky-50 text-sky-800 border-sky-200/90"
                  : "bg-rose-50 text-rose-800 border-rose-200/90"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  lineBalanceEfficiency >= 85 ? "bg-emerald-500" : lineBalanceEfficiency >= 70 ? "bg-sky-500" : "bg-rose-500"
                }`} />
                <span>{lineBalanceEfficiency.toFixed(1)}% Eff</span>
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {todayShiftOutput}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">/ {activeShiftTarget} pcs</span>
              <span className="text-xs font-mono font-bold text-emerald-700">({((todayShiftOutput / Math.max(1, activeShiftTarget)) * 100).toFixed(1)}%)</span>
            </div>

            <div className="pt-2 border-t border-[#E6DDCE]/50 flex items-center justify-between text-[11px] font-mono text-[#8C7E6E] gap-2">
              <span className={remainingShiftBalance === 0 ? "text-emerald-700 font-bold" : "text-slate-600"}>
                {remainingShiftBalance === 0 ? "✓ Shift Target Achieved" : `Balance: ${remainingShiftBalance} pcs`}
              </span>
              <span>{totalAllocatedOps} Ops (Plan: {totalPlannedManpower.toFixed(1)})</span>
            </div>
          </div>
        </div>
      )}


      {orderlessForPlan.runs > 0 && selectedOrder && (
        <div role="status" className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
          <strong>{orderlessForPlan.pieces.toLocaleString()} good pieces</strong> ({orderlessForPlan.runs.toLocaleString()} runs, {orderlessForPlan.from}
          {orderlessForPlan.to !== orderlessForPlan.from ? ` to ${orderlessForPlan.to}` : ""}) were recorded on this plan's stations by its operators
          <strong> without an order</strong>, so they don't count toward {selectedOrder.orderNo}. If they were for this order, record them with its
          Order No (Production Monitoring → Import Production, "Order No" column).
        </div>
      )}

      {/* ── 3. Bottleneck Alert Banner ────────────────────────────── */}
      {bottleneckCount > 0 ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs flex-1">
            <h4 className="font-bold text-rose-900 text-sm">
              Line Balancing Alert: {bottleneckCount} Bottleneck Operation{bottleneckCount > 1 ? "s" : ""} Detected (Pace &amp; WIP Buffer Limits)
            </h4>
            <p className="text-rose-700">
              The stations below have exceeded operating constraints (cycle time &gt; <strong>{taktTimeSecs.toFixed(1)}s Takt</strong> and/or queued inventory &gt; <strong>WIP Threshold limit</strong>). This causes line starvation and delivery delay risks:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {bottleneckStations.map(b => (
                <span
                  key={b.stationNum}
                  className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-xl font-mono font-bold flex flex-wrap items-center gap-1.5 shadow-2xs"
                >
                  <span>#{b.stationNum} {b.operationName}:</span>
                  {b.isWipBottleneck && (
                    <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px] font-bold border border-rose-300 animate-pulse">
                      ⚠️ WIP {b.queueWip} pcs (&gt; {b.wipThreshold} limit)
                    </span>
                  )}
                  {b.isCycleBottleneck && (
                    <span className="text-rose-600">
                      {b.effectiveTimeSecs.toFixed(1)}s ({b.capacityPerHour} pcs/hr)
                    </span>
                  )}
                  <span className="text-amber-800 font-sans font-medium">→ Allocate +{Math.max(1, b.requiredOps - b.allocatedOps)} op</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">Line is Perfectly Balanced for Delivery Deadline!</h4>
              <p className="text-xs text-emerald-700">
                All station cycle times are within Takt Time (<strong>{taktTimeSecs.toFixed(1)} sec</strong>). Daily required output of <strong>{requiredDailyTarget.toLocaleString()} pcs/day</strong> ({totalOrderQuantity.toLocaleString()} pcs total order) is fully on schedule.
              </p>
            </div>
          </div>
          <div className="px-3.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-emerald-800 font-mono font-bold text-xs shadow-2xs">
            Pitch Efficiency: {lineBalanceEfficiency}%
          </div>
        </div>
      )}



      {/* ── 4. Main Operations Balancing Table ────────────────────── */}
      <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
        {/* Table Header with Benchmark Context Ribbon */}
        <div className="p-4 sm:p-5 border-b border-[#F0EAE0] bg-[#FDFBF7] flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-3 sm:gap-4">
          <div className="shrink-0">
            <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              Operation Manpower Allocation & Capacity Table
            </h3>
          </div>

          {/* Benchmark Context Pills - strictly side-by-side single row */}
          <div className="flex items-center gap-2 text-xs flex-nowrap overflow-x-auto max-w-full pb-0.5 custom-scrollbar">
            <div className="px-2.5 py-1 bg-white border border-[#E6DDCE] rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" />
              <span className="text-slate-500">Takt Pace:</span>
              <strong className="text-slate-900 font-mono">{taktTimeSecs.toFixed(1)}s / pc</strong>
            </div>
            <div className="px-2.5 py-1 bg-white border border-[#E6DDCE] rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">Daily Target:</span>
              <strong className="text-slate-900 font-mono">{requiredDailyTarget} pcs/day</strong>
            </div>
            <div className="px-2.5 py-1 bg-white border border-[#E6DDCE] rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-[#9C5B3C]" />
              <span className="text-slate-500">Total Manpower:</span>
              <strong className="text-slate-900 font-mono">{totalAllocatedOps} ops</strong>
            </div>
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm" style={{ minWidth: "1100px" }}>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] uppercase font-bold tracking-wider text-slate-500 select-none">
                <th className="py-3.5 px-4 w-16 text-center whitespace-nowrap">Seq</th>
                <th className="py-3.5 px-4 w-60 whitespace-nowrap">Operation & Machine</th>
                <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Work Content (SMV)</th>
                <th className="py-3.5 px-4 w-32 text-center bg-slate-100/70 whitespace-nowrap border-l border-r border-slate-200" title="Required Operators calculated dynamically: ⌈Work Content (SMV Sec) ÷ Dynamic Takt Pace⌉">
                  Required Ops (Dynamic)
                </th>
                <th className="py-3.5 px-4 w-44 text-center whitespace-nowrap">Required Skill Rating</th>
                <th className="py-3.5 px-5 w-80 bg-[#FAF8F5] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-2">
                    <span>Manpower Allocation</span>
                    <button
                      type="button"
                      onClick={() => handleAutoAssignOperators(false)}
                      disabled={stations.length === 0 || autoAssigning}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#9C5B3C] hover:bg-[#854B2F] active:scale-95 text-white text-[10.5px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      title="Auto-assign available operators based on required skill rating and availability"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{autoAssigning ? "Assigning..." : "Auto-Assign"}</span>
                    </button>
                  </div>
                </th>
                {taktMode === "DELIVERY" && (
                  <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap bg-[#FAF8F5]">Actual Output Till Date</th>
                )}
                {taktMode === "SHIFT_TARGET" && (
                  <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap">Actual Output (Today)</th>
                )}
                <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap bg-amber-50/40 text-amber-950 border-l border-r border-amber-200/70" title="Dynamic Operation Takt Time: Available Working Time ÷ Remaining Pieces for this operation">
                  Dynamic Takt Pace
                </th>
                <th className="py-3.5 px-4 w-44 text-center whitespace-nowrap">Station Load & Cycle Time</th>
                <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Hourly Capacity</th>
                <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap">Line Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stationMetrics.length === 0 && (
                <tr>
                  <td colSpan={20} className="py-12 px-6 text-center">
                    <p className="text-sm font-bold text-[#221912]">No operations to balance yet</p>
                    <p className="text-xs text-[#8C7E6E] mt-1 max-w-xl mx-auto leading-relaxed">
                      {!selectedOrder
                        ? "Select a production order."
                        : `The operations come from the operation bulletin linked to style ${selectedOrder.styleNo || ""}. `
                          + "Link a bulletin to that style (or import one) in Operation Bulletins, then come back."}
                    </p>
                    {selectedOrder && (
                      <Link to="/operation-bulletins" className="inline-block mt-3 text-xs font-bold text-[#9C5B3C] hover:underline">
                        Open Operation Bulletins
                      </Link>
                    )}
                  </td>
                </tr>
              )}
              {stationMetrics.map((row, idx) => {
                const loadPct = row.loadPercent;
                const qualifiedOps = getEligibleOpsForSkill(row.operationId, row.requiredSkillRating);

                return (
                  <tr
                    key={row.stationNum}
                    className={`group transition-colors duration-150 ${
                      row.isBottleneck ? "bg-rose-50/30 hover:bg-rose-50/50" : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Column 1: Seq */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <span
                        className={`w-8 h-8 rounded-xl inline-flex items-center justify-center font-mono font-bold text-xs border shadow-2xs ${
                          row.isBottleneck
                            ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                            : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        #{row.stationNum}
                      </span>
                    </td>

                    {/* Column 2: Operation & Machine */}
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {row.operationName}
                          </span>
                          <span className="text-[10px] text-[#9C5B3C] bg-[#FAF8F5] px-1.5 py-0.2 rounded border border-[#E6DDCE] font-mono font-bold">
                            {row.operationCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-medium">
                          <Cpu className="w-3 h-3 text-slate-400" />
                          <span>{row.machineType}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Work Content (SMV) - Read-Only Display Linked to Operations Library */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {(row.smvSeconds / 60).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">min</span>
                        </span>
                        <span className="text-[10px] text-[#8C7E6E] font-mono font-medium">
                          ({row.smvSeconds.toFixed(1)} sec)
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Required Ops (Calculated Dynamically from Dynamic Takt Pace) */}
                    <td className="py-3 px-4 text-center align-middle bg-slate-50/50 border-l border-r border-slate-200/60 whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        {(row.remainingPieces || 0) === 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200 shadow-2xs">
                            0 Ops (Done)
                          </span>
                        ) : (
                          <>
                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs border shadow-2xs ${
                              row.allocatedOps < row.requiredOps
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : row.allocatedOps > row.requiredOps
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}>
                              {row.requiredOps} {row.requiredOps > 1 ? "Ops" : "Op"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 mt-0.5 font-mono" title="⌈Work Content (Sec) ÷ Dynamic Pitch (Sec) @ Planned Efficiency⌉">
                              ⌈{row.smvSeconds.toFixed(1)}s ÷ {(row.dynamicPitchSecs > 0 ? row.dynamicPitchSecs : (designedPitchTimeSecs > 0 ? designedPitchTimeSecs : taktTimeSecs)).toFixed(1)}s⌉
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Column 5: REQUIRED SKILL RATING SELECTOR (Matching Table Theme) */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="relative w-full max-w-[145px] mx-auto space-y-1.5">
                        <div className="relative">
                          <select
                            value={(() => {
                              // Legacy 1–5 values: 5 and "4+" are both Expert (4) on the 4-level scale
                              const req = String(row.requiredSkillRating || "ANY");
                              return req === "5" || req === "4_PLUS" ? String(MAX_SKILL_RATING) : req;
                            })()}
                            onChange={e => handleUpdateRequiredSkill(idx, e.target.value)}
                            className="w-full h-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-2.5 pr-7 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer appearance-none transition-colors"
                          >
                            <option value="ANY">Any Level (All)</option>
                            {[...SKILL_RATINGS].reverse().map(r => (
                              <option key={r} value={String(r)}>Level {r} · {SKILL_LEVELS[r].name}</option>
                            ))}
                            <option value="3_PLUS">Level 3+ · {SKILL_LEVELS[INDEPENDENT_RATING].name} & up</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Available Operators Indicator */}
                        {(() => {
                          const availCount = qualifiedOps.filter(o => {
                            const strId = String(o.id);
                            const cur = operatorsAssignedInCurrentPlan.get(strId);
                            if (cur && cur.stationIndex !== idx) return false;
                            if (operatorsAssignedInOtherPlans.has(strId)) return false;
                            return true;
                          }).length;

                          return (
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-medium px-2 py-0.5 rounded-full border shadow-2xs ${
                                availCount > 0
                                  ? "bg-slate-100/90 text-slate-600 border-slate-200/80"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${availCount > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                                <span>{availCount} avail ops</span>
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Column 6: Allocated Operators (Multi-Operator Stepper + Filtered Selectors) */}
                    <td className="py-3 px-5 align-middle bg-[#FAF8F5]/60">
                      <div className="space-y-2">
                        {/* Stepper + Mode Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleRemoveOperator(idx, row.operatorIds.length - 1)}
                              disabled={row.operatorIds.length <= 1}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
                              title="Decrease operator count"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-xs text-slate-900">
                              {row.allocatedOps}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddOperator(idx)}
                              className="w-7 h-7 flex items-center justify-center text-[#9C5B3C] hover:text-[#854B2F] hover:bg-[#F6F1E8] cursor-pointer transition-colors"
                              title="Add another operator to this station"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                row.allocatedOps > 1
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {row.allocatedOps > 1 ? `${row.allocatedOps} Operators Split` : "Single Operator"}
                            </span>

                            {/* Operator Skill Qualification / Deficit Status Badge */}
                            {(() => {
                              const assignedOpIds = row.operatorIds.filter(Boolean);
                              if (assignedOpIds.length === 0) return null;
                              const req = row.requiredSkillRating;
                              if (!req || req === "ANY") return null;

                              const skillChecks = assignedOpIds.map(opId => {
                                const r = getOperatorSkill(opId, row.operationId);
                                if (r === null) return { r: 0, gap: true };
                                if (req === "3_PLUS") return { r, gap: r < INDEPENDENT_RATING };
                                if (req === "4_PLUS") return { r, gap: r < MAX_SKILL_RATING };
                                return { r, gap: r < clampRating(Number(req)) };
                              });

                              const hasGap = skillChecks.some(c => c.gap);
                              if (hasGap) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#fffbeb] text-[#b45309] border border-[#fde68a] shadow-2xs"
                                    title="One or more assigned operators do not meet the required skill rating for this operation"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-[#b45309]" />
                                    <span>Skill Deficit</span>
                                  </span>
                                );
                              }

                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#F3F5F2] text-[#77876F] border border-[#d4decb] shadow-2xs"
                                  title="All assigned operators meet or exceed the station's required skill rating"
                                >
                                  <Check className="w-2.5 h-2.5 text-[#77876F]" />
                                  <span>Qualified</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Dropdowns for Each Operator Slot filtered strictly by Required Skill Rating & Excluding Already Assigned Operators */}
                        <div className="space-y-1.5">
                          {row.operatorIds.map((opId, slotIdx) => {
                            const currentOp = opId ? operators.find(o => String(o.id) === String(opId)) : null;

                            const basePool = filterPresentOnly
                              ? operators.filter(o => {
                                  const st = getOperatorAttendance(o.id);
                                  return st === "PRESENT" || st === "LATE";
                                })
                              : operators;

                            // Filter out any operator who has already been assigned to another station or another line
                            const availableForSlot = basePool.filter(op =>
                              !isOperatorAssignedToAnother(op.id, idx, slotIdx, opId)
                            );

                            // If this slot currently has an operator assigned, ensure they are in the dropdown so their name displays!
                            const slotOps = currentOp && !availableForSlot.some(o => String(o.id) === String(opId))
                              ? [currentOp, ...availableForSlot]
                              : availableForSlot;

                            return (
                              <div key={slotIdx} className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <OperatorCombobox
                                    value={opId ? String(opId) : ""}
                                    onChange={newOpId => handleAssignOperator(idx, slotIdx, newOpId)}
                                    availableOperators={slotOps}
                                    currentOperator={currentOp}
                                    operationId={row.operationId}
                                    getOperatorSkill={getOperatorSkill}
                                    getOperatorAttendance={getOperatorAttendance}
                                    requiredSkillRating={String(row.requiredSkillRating || "ANY")}
                                    slotIndex={slotIdx}
                                    totalSlots={row.operatorIds.length}
                                  />

                                  {/* Affinity Coverage Indicator */}
                                  {(() => {
                                    if (!opId) return null;
                                    const direct = getOperatorSkill(opId, row.operationId);
                                    if (direct) return null;

                                    const opAffs = affinities.filter(a => String(a.primaryOperationId) === String(row.operationId));
                                    for (const aff of opAffs) {
                                      const altRating = getOperatorSkill(opId, aff.alternativeOperationId);
                                      if (altRating) {
                                        return (
                                          <div key="affinity-badge" className="mt-1 flex items-center gap-1 text-[9.5px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                                            <Network className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                            <span className="inline-flex items-center gap-1">Covering via {aff.alternativeOperationName || "Alt Skill"} (<SkillLevelIcon rating={altRating} size={10} />{SKILL_LEVELS[clampRating(altRating)].name}, {aff.efficiencyTransferPct}% Eff)</span>
                                          </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                </div>

                                {row.operatorIds.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOperator(idx, slotIdx)}
                                    className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0"
                                    title="Remove this slot"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Column: Actual Output Till Date (in Planned Pace / Delivery Horizon Mode) */}
                    {taktMode === "DELIVERY" && (
                      <td className="py-3 px-4 text-center align-middle whitespace-nowrap bg-[#FAF8F5]/50">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {row.outputNotRecorded
                              ? <span className="text-[11px] font-semibold text-amber-700" title="No production is recorded for this station; it takes the output of the next recorded station">Not recorded</span>
                              : <>{(row.actualOutputTillDate || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span></>}
                          </span>
                          {(totalOrderQuantity || 0) > 0 && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className="h-full bg-[#9C5B3C] rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.round(((row.actualOutputTillDate || 0) / Math.max(1, totalOrderQuantity || 1)) * 100))}%`
                                  }}
                                />
                              </div>
                              <span className="text-[9.5px] font-mono font-bold text-slate-500">
                                {Math.min(100, Math.round(((row.actualOutputTillDate || 0) / Math.max(1, totalOrderQuantity || 1)) * 100))}%
                              </span>
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {Math.max(0, (totalOrderQuantity || 0) - (row.actualOutputTillDate || 0)).toLocaleString()} pcs bal
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Column: Actual Output (Today) with Sequential Flow Precedence & Queue WIP */}
                    {taktMode === "SHIFT_TARGET" && (
                      <td className={`py-3 px-4 text-center align-middle whitespace-nowrap ${
                        row.isEndLineBottleneck ? "bg-amber-50/40" : ""
                      }`}>
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-black text-sm ${
                            row.isEndLineBottleneck ? "text-amber-900" : "text-slate-900"
                          }`}>
                            {row.todayActualGood ?? 0} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                          </span>
                          {idx === 0 ? (
                            <span className="text-[9px] text-emerald-700 font-mono font-bold mt-0.5">
                              Line Inflow
                            </span>
                          ) : idx === stations.length - 1 ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              End-Line Completed ({row.todayActualGood} pcs)
                            </span>
                          ) : (row.queueWip || 0) > 0 ? (
                            row.isWipBottleneck ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 shadow-2xs mt-0.5 animate-pulse" title={`Queue WIP (${row.queueWip} pcs) exceeds threshold limit (${row.wipThreshold} pcs)`}>
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                ⚠️ +{row.queueWip} WIP (&gt; {row.wipThreshold} max)
                              </span>
                            ) : (
                              <span className="text-[9.5px] text-amber-700 font-mono font-semibold mt-0.5" title={`Queue WIP: ${row.queueWip} pcs (Threshold: ${row.wipThreshold} pcs)`}>
                                +{row.queueWip} WIP in queue (Max: {row.wipThreshold})
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                              Synchronized flow
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Column: Dynamic Takt Pace (Operation specific pace based on remaining balance) */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap bg-amber-50/15 border-l border-r border-amber-100/70">
                      <div className="flex flex-col items-center">
                        {(row.remainingPieces || 0) === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold text-[10.5px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>0s (Done)</span>
                          </span>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-sm text-slate-900">
                                {(row.dynamicTaktSecs || 0).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">s/pc</span>
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                              {row.dynamicTaktSecs > 0 ? (3600 / row.dynamicTaktSecs).toFixed(0) : "0"} pcs/hr
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Column 7: Station Load & Effective Time */}
                    <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              row.isBottleneck ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {row.effectiveTimeSecs.toFixed(1)}s
                          </span>
                          <span className="text-[10px] text-slate-400">/ pc</span>
                        </div>

                        {row.allocatedOps > 1 && (
                          <span className="text-[9.5px] text-[#8C7E6E] font-mono block">
                            ({row.smvSeconds.toFixed(1)}s ÷ {row.allocatedOps} ops)
                          </span>
                        )}

                        {/* Visual Station Load Meter */}
                        <div className="w-28 mx-auto space-y-0.5">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                row.isBottleneck
                                  ? "bg-rose-500 animate-pulse"
                                  : loadPct > 85
                                  ? "bg-[#9C5B3C]"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, loadPct)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[9.5px] font-mono font-bold block ${
                              row.isBottleneck ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {loadPct}% Load {row.isBottleneck && "⚠️"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 7: Hourly Capacity */}
                    <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span
                          className={`font-mono font-bold text-sm ${
                            row.isBottleneck ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {row.capacityPerHour}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">pcs/hr</span>
                        </span>
                        {row.isBottleneck ? (
                          <span className="text-[9px] text-rose-600 font-bold block">
                            {row.isWipBottleneck && row.isCycleBottleneck
                              ? `Dual: Pace & WIP > ${row.wipThreshold}`
                              : row.isWipBottleneck
                              ? `WIP Buffer Overflow (${row.queueWip} > ${row.wipThreshold})`
                              : `Deficit: +${row.deficitPerHour} pcs/hr`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                            +{Math.max(0, Math.round(row.capacityPerHour - requiredHourlyTarget))} buffer
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 8: Line Status & Quick Action */}
                    <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                      {row.isBottleneck ? (
                        <div className="inline-flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Bottleneck
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickFixBottleneck(idx)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                            title="Add 1 Operator to relieve station bottleneck"
                          >
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>Auto-Fix (+1 Op)</span>
                          </button>
                        </div>
                      ) : row.capacityPerHour >= requiredHourlyTarget * 1.4 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F6F1E8] text-[#9C5B3C] text-[10px] font-bold border border-[#E6DDCE] shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B3C]" />
                          Buffer ({row.capacityPerHour}/hr)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Balanced (≤ Takt)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 border-t border-[#E6DDCE] bg-[#FDFBF7] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#8C7E6E]">
          <div className="flex flex-wrap items-center gap-5">
            <span>Total Stations: <strong className="text-[#221912] font-mono">{stations.length}</strong></span>
            <span>Allocated Manpower: <strong className="text-[#221912] font-mono">{totalAllocatedOps} ops</strong></span>
            <span>Balance Efficiency: <strong className="text-[#77876F] font-mono">{lineBalanceEfficiency}%</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9C5B3C]" />
              <span>Design Speed: <strong className="text-[#9C5B3C] font-mono">{requiredDesignCapacity.toFixed(1)} pcs/hr</strong> <span className="text-[11px] text-[#A89F91]">(Pitch: {designedPitchTimeSecs.toFixed(1)}s)</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8C7E6E]" />
              <span>Customer Target: <strong className="text-[#221912] font-mono">{requiredHourlyTarget.toFixed(0)} pcs/hr</strong> <span className="text-[11px] text-[#A89F91]">(Takt: {taktTimeSecs.toFixed(1)}s)</span></span>
            </div>
          </div>
        </div>
      </DataCard>

      {/* ── 5. Yamazumi / Pitch Line Balance Chart ────────────────── */}
      {stations.length > 0 && (
        <YamazumiChart
          data={stationMetrics}
          taktTimeSecs={taktTimeSecs}
          designedPitchTimeSecs={designedPitchTimeSecs}
          requiredHourlyTarget={requiredHourlyTarget}
          requiredDesignCapacity={requiredDesignCapacity}
          plannedEfficiency={plannedEfficiency}
          lineBalanceEfficiency={lineBalanceEfficiency}
          onAddOperator={handleAddOperator}
        />
      )}
    </div>
  );
}
