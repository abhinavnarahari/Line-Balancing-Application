import { useState, useEffect, useMemo, Fragment } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Activity, 
  FileSpreadsheet, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Edit2, 
  Trash2, 
  UserCheck, 
  Layers, 
  Sliders, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Gauge 
} from "lucide-react";
import * as XLSX from "xlsx";
import { ordersApi, type Order } from "../../features/orders/api";
import { shiftsApi as shiftApi } from "../../features/shifts/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { operationsApi, type Operation } from "../../features/operations/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../../features/production-logs/api";
import { RecordPieceModal } from "../../features/production-logs/RecordPieceModal";
import type { Shift } from "../../features/shifts/types";
import { DataCard, DataCardHeader, EmptyState } from "../../components/ui/PremiumUI";

// 24 Hours array (0 to 23)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
// Standard 8 hours for line order monitor
const SHIFT_HOURS = Array.from({ length: 8 }, (_, i) => i + 1);

export function ProductionMonitoringPage() {
  const [searchParams] = useSearchParams();
  const paramOrderId = searchParams.get("orderId");
  const paramLineId = searchParams.get("lineId");
  const paramShiftId = searchParams.get("shiftId");
  const paramTab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"24h-timesheet" | "line-monitoring">(
    paramTab === "line-monitoring" ? "line-monitoring" : "24h-timesheet"
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Master data
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  // 24h Timesheet data & Filters
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<PieceProductionLog | null>(null);
  const [preselectedOperatorId, setPreselectedOperatorId] = useState<string>("");
  const [preselectedOperationId, setPreselectedOperationId] = useState<string>("");
  const [preselectedOrderIdForModal, setPreselectedOrderIdForModal] = useState<string>("");
  const [preselectedMachineCode, setPreselectedMachineCode] = useState<string>("");
  const [preselectedTime, setPreselectedTime] = useState<string>("10:00");
  
  // Interactive UI Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>(paramShiftId || "ALL");
  const [selectedLineId, setSelectedLineId] = useState<string>(paramLineId || "ALL");
  const [onlyActiveOperators, setOnlyActiveOperators] = useState<boolean>(false);
  const [expandedOperatorIds, setExpandedOperatorIds] = useState<Record<number, boolean>>({});

  // Line monitoring data
  const [selectedOrderId, setSelectedOrderId] = useState<string>(paramOrderId || "");
  const [linePlan, setLinePlan] = useState<LinePlan | null>(null);
  const [hourlyOutput, setHourlyOutput] = useState<Record<number, number>>({});

  const currentLiveHour = new Date().getHours();

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, shfts, oprsList, opsList, lns, ts, bulls, skills] = await Promise.all([
        ordersApi.getOrders(),
        shiftApi.getShifts(),
        operatorsApi.getOperators(),
        operationsApi.getOperations(),
        linesApi.getLines().catch(() => []),
        pieceProductionApi.get24hTimesheet(selectedDate).catch(() => []),
        bulletinsApi.getBulletins().catch(() => []),
        skillApi.getCurrentMatrix().catch(() => []),
      ]);
      setOrders(ords);
      setShifts(shfts.filter(s => s.active));
      setOperators(oprsList);
      setOperations(opsList);
      setLines(lns.filter(l => l.active));
      setTimesheetData(ts);
      setBulletins(bulls);
      setSkillAssessments(skills);

      if (ords.length > 0 && !selectedOrderId) {
        const match = paramOrderId ? ords.find(o => String(o.id) === String(paramOrderId)) : null;
        setSelectedOrderId(String((match || ords[0]).id));
      }
    } catch (err) {
      console.error("Failed to load production monitoring data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedOrderId) {
        setLinePlan(null);
        return;
      }
      try {
        const plan = await linePlanApi.getPlanForOrder(selectedOrderId);
        setLinePlan(plan);
        setHourlyOutput({});
      } catch (err) {
        console.warn("Failed to fetch plan for order:", err);
        setLinePlan(null);
      }
    };
    fetchPlan();
  }, [selectedOrderId]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Selected Order & Line Details
  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);
  const selectedLine = useMemo(() => lines.find(l => String(l.id) === String(selectedLineId) || l.lineCode === selectedLineId), [lines, selectedLineId]);

  // Active Shift for the Line
  const activeShiftObj = useMemo(() => {
    if (linePlan?.shiftId) {
      return shifts.find(s => s.id === linePlan.shiftId) || shifts[0] || null;
    }
    if (selectedShiftId !== "ALL") {
      return shifts.find(s => String(s.id) === selectedShiftId || s.shiftCode === selectedShiftId) || shifts[0] || null;
    }
    return shifts[0] || null;
  }, [shifts, linePlan, selectedShiftId]);

  // ─── Shift & Takt Calculations (Synced with Line Balancing Engine) ───────────
  const grossShiftMins = useMemo(() => {
    if (!activeShiftObj) return 480;
    const [sh = 8, sm = 0] = (activeShiftObj.startTime || "08:00").split(":").map(Number);
    const [eh = 17, em = 0] = (activeShiftObj.endTime || "17:00").split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }, [activeShiftObj]);

  const breakDurationMins = Number(activeShiftObj?.breakDurationMinutes ?? 60);
  const netWorkingMins = Math.max(60, grossShiftMins - breakDurationMins);
  const shiftHours = netWorkingMins / 60;
  const dailyNetWorkingSecs = netWorkingMins * 60;
  const allowance = linePlan?.allowance ?? 10;
  const dailyAvailableTimeSecs = dailyNetWorkingSecs * (1 - allowance / 100);

  const targetOutput = linePlan?.targetOutput || selectedOrder?.totalQuantity || 480;
  const taktTimeSecs = targetOutput > 0 ? dailyAvailableTimeSecs / targetOutput : 0;
  const hourlyTarget = taktTimeSecs > 0 ? Math.round(3600 / taktTimeSecs) : Math.round(targetOutput / shiftHours);

  // Delivery countdown metrics for selected order
  const deliveryCountdown = useMemo(() => {
    if (!selectedOrder?.deliveryDate) return { days: 0, formatted: "Not Set", isDueSoon: false };
    const deliv = new Date(selectedOrder.deliveryDate);
    const now = new Date();
    const diffMs = deliv.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));
    return {
      days,
      formatted: deliv.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      isDueSoon: days <= 3,
    };
  }, [selectedOrder]);

  // Map of operator IDs to operator entity
  const operatorMap = useMemo(() => {
    const map = new Map<number | string, Operator>();
    operators.forEach(op => {
      map.set(Number(op.id), op);
      map.set(String(op.id), op);
    });
    return map;
  }, [operators]);

  // Map Planned Line Balance Stations from LinePlan
  const plannedStations = useMemo(() => {
    if (!linePlan || !linePlan.assignments || linePlan.assignments.length === 0) return [];
    const styleBulletin = bulletins.find(b =>
      (b.styles || []).some(s => String(s.id) === String(selectedOrder?.styleId))
    );

    const grouped: Record<string, {
      stationNum: number;
      bulletinLineId?: string | number | null;
      operationId: number | string;
      operationCode: string;
      operationName: string;
      machineType: string;
      smvSeconds: number;
      operatorIds: (number | string)[];
      isQcCheckpoint?: boolean;
    }> = {};

    let seq = 1;
    linePlan.assignments.forEach(a => {
      const opId = String(a.operationId);
      const op = operations.find(o => String(o.id) === opId);
      const bLine = styleBulletin?.lines.find(l => String(l.id) === String(a.bulletinLineId));
      const smvVal = Number(bLine?.smv || op?.standardSmv || 0.5);

      if (!grouped[opId]) {
        grouped[opId] = {
          stationNum: bLine?.sequence ? Number(bLine.sequence) : (seq++),
          bulletinLineId: a.bulletinLineId ?? bLine?.id ?? null,
          operationId: a.operationId,
          operationCode: op?.operationCode || "OP",
          operationName: op?.name || "Operation",
          machineType: bLine?.machineType || op?.machineType || "Single Needle Lockstitch",
          smvSeconds: Math.round(smvVal * 60 * 10) / 10,
          operatorIds: a.operatorId ? [a.operatorId] : [],
          isQcCheckpoint: !!a.isQcCheckpoint,
        };
      } else {
        if (a.operatorId && !grouped[opId].operatorIds.includes(a.operatorId)) {
          grouped[opId].operatorIds.push(a.operatorId);
        }
        if (a.isQcCheckpoint) grouped[opId].isQcCheckpoint = true;
      }
    });

    return Object.values(grouped).sort((a, b) => a.stationNum - b.stationNum);
  }, [linePlan, operations, bulletins, selectedOrder]);

  const totalLineSMVSecs = useMemo(() => plannedStations.reduce((sum, s) => sum + s.smvSeconds, 0), [plannedStations]);
  const totalAllocatedOps = useMemo(() => plannedStations.reduce((sum, s) => sum + Math.max(1, s.operatorIds.length), 0), [plannedStations]);
  const plannedLineEfficiency = (totalAllocatedOps > 0 && taktTimeSecs > 0)
    ? Math.min(100, Math.round((totalLineSMVSecs / (totalAllocatedOps * taktTimeSecs)) * 100 * 10) / 10)
    : 85.0;

  // Station Execution Matrix with Live Actual Performance from Floor Logs
  const stationLiveExecution = useMemo(() => {
    return plannedStations.map(st => {
      const opIdStr = String(st.operationId);
      const assignedOpIds = st.operatorIds.map(String);

      let totalGood = 0;
      let totalReject = 0;
      let totalWorkMins = 0;

      timesheetData.forEach(row => {
        if (assignedOpIds.includes(String(row.operatorId))) {
          (row.rawLogs || []).forEach(log => {
            if (String(log.operationId) === opIdStr || (!log.operationId && row.department === st.operationName)) {
              totalGood += log.goodQty || 0;
              totalReject += log.rejectQty || 0;
              totalWorkMins += Number(log.actualTimeMinutes || 0);
            }
          });
        }
      });

      const allocatedOps = Math.max(1, st.operatorIds.length);
      const plannedCycleSecs = st.smvSeconds / allocatedOps;
      const plannedCapacityPerHour = plannedCycleSecs > 0 ? Math.round(3600 / plannedCycleSecs) : 0;

      const actualCycleSecs = (totalGood > 0 && totalWorkMins > 0)
        ? (totalWorkMins * 60) / totalGood
        : 0;

      const isBottleneck = (actualCycleSecs > 0 && actualCycleSecs > taktTimeSecs) || (plannedCycleSecs > taktTimeSecs);

      const operatorDetails = st.operatorIds.map(id => {
        const op = operators.find(o => String(o.id) === String(id));
        const assessment = skillAssessments.find(a => String(a.operatorId) === String(id) && String(a.operationId) === opIdStr);
        return {
          id,
          name: op?.name || `Op #${id}`,
          empId: op?.employeeId || "EMP",
          rating: assessment?.rating || null,
        };
      });

      return {
        ...st,
        allocatedOps,
        plannedCycleSecs,
        plannedCapacityPerHour,
        totalGood,
        totalReject,
        actualCycleSecs,
        isBottleneck,
        operatorDetails,
      };
    });
  }, [plannedStations, timesheetData, operators, skillAssessments, taktTimeSecs]);

  // End-Line Throughput Output (Theory of Constraints minimum completed pieces)
  const endLineOutput = useMemo(() => {
    if (stationLiveExecution.length === 0) return 0;
    const outputs = stationLiveExecution.map(s => s.totalGood);
    return Math.min(...outputs);
  }, [stationLiveExecution]);

  const remainingShiftBalance = Math.max(0, targetOutput - endLineOutput);

  const dynamicRemainingTaktSecs = useMemo(() => {
    const balance = remainingShiftBalance > 0 ? remainingShiftBalance : 1;
    if (dailyAvailableTimeSecs <= 0) return 0;
    return dailyAvailableTimeSecs / balance;
  }, [dailyAvailableTimeSecs, remainingShiftBalance]);

  const effectiveTaktSecs = endLineOutput > 0 ? dynamicRemainingTaktSecs : taktTimeSecs;
  const effectiveHourlyTarget = effectiveTaktSecs > 0 ? Math.round(3600 / effectiveTaktSecs) : hourlyTarget;

  // Hourly Pitch Output Handler
  const handleOutputChange = (hour: number, value: string) => {
    const num = parseInt(value, 10);
    setHourlyOutput(prev => ({
      ...prev,
      [hour]: isNaN(num) ? 0 : num
    }));
  };

  // Active columns to render based on shift timings
  const displayedHours = useMemo(() => {
    const selectedShiftObj = selectedShiftId !== "ALL"
      ? shifts.find(s => String(s.id) === selectedShiftId || s.shiftCode === selectedShiftId)
      : null;

    if (!selectedShiftObj) return HOURS_24;
    const [sh = 8] = selectedShiftObj.startTime.split(":").map(Number);
    const [eh = 16] = selectedShiftObj.endTime.split(":").map(Number);
    const hrs: number[] = [];
    if (sh <= eh) {
      for (let h = sh; h < eh; h++) hrs.push(h);
    } else {
      for (let h = sh; h < 24; h++) hrs.push(h);
      for (let h = 0; h < eh; h++) hrs.push(h);
    }
    return hrs.length > 0 ? hrs : HOURS_24;
  }, [shifts, selectedShiftId]);

  // Dynamic Shift Bands Super-Headers
  const shiftBands = useMemo(() => {
    if (displayedHours.length === 0) return [];

    const getShiftForHour = (hour: number) => {
      for (const s of shifts) {
        const [sh = 0] = s.startTime.split(":").map(Number);
        const [eh = 0] = s.endTime.split(":").map(Number);
        if (sh <= eh) {
          if (hour >= sh && hour < eh) return s;
        } else {
          if (hour >= sh || hour < eh) return s;
        }
      }
      return null;
    };

    const bands: { title: string; subTitle: string; colSpan: number; colorClass: string }[] = [];
    let currentShift: Shift | null = null;
    let currentStartHour = displayedHours[0];
    let currentCount = 0;

    displayedHours.forEach((h, idx) => {
      const matchedShift = getShiftForHour(h);
      const isSameShift = matchedShift && currentShift && (matchedShift.id === currentShift.id);

      if (idx === 0 || isSameShift) {
        if (idx === 0) {
          currentShift = matchedShift;
          currentStartHour = h;
        }
        currentCount++;
      } else {
        const startStr = `${String(currentStartHour).padStart(2, "0")}:00`;
        const endH = (displayedHours[idx - 1] + 1) % 24;
        const endStr = `${String(endH).padStart(2, "0")}:00`;

        const isNight = currentShift?.shiftCode?.includes("C") || currentShift?.shiftName?.toLowerCase().includes("night") || currentStartHour >= 23 || currentStartHour < 7;
        const isEvening = currentShift?.shiftCode?.includes("B") || currentShift?.shiftName?.toLowerCase().includes("evening") || (currentStartHour >= 15 && currentStartHour < 23);

        const colorClass = isNight
          ? "bg-indigo-500/10 text-indigo-950 border-l border-[#E6DDCE]"
          : isEvening
            ? "bg-amber-500/10 text-amber-950 border-l border-[#E6DDCE]"
            : "bg-emerald-500/10 text-emerald-950 border-l border-[#E6DDCE]";

        bands.push({
          title: currentShift ? currentShift.shiftName : "General Hours",
          subTitle: `${startStr} – ${endStr}`,
          colSpan: currentCount,
          colorClass
        });

        currentShift = matchedShift;
        currentStartHour = h;
        currentCount = 1;
      }
    });

    if (currentCount > 0) {
      const startStr = `${String(currentStartHour).padStart(2, "0")}:00`;
      const lastHour = displayedHours[displayedHours.length - 1];
      const endH = (lastHour + 1) % 24;
      const endStr = `${String(endH).padStart(2, "0")}:00`;

      const isNight = currentShift?.shiftCode?.includes("C") || currentShift?.shiftName?.toLowerCase().includes("night") || currentStartHour >= 23 || currentStartHour < 7;
      const isEvening = currentShift?.shiftCode?.includes("B") || currentShift?.shiftName?.toLowerCase().includes("evening") || (currentStartHour >= 15 && currentStartHour < 23);

      const colorClass = isNight
        ? "bg-indigo-500/10 text-indigo-950 border-l border-[#E6DDCE]"
        : isEvening
          ? "bg-amber-500/10 text-amber-950 border-l border-[#E6DDCE]"
          : "bg-emerald-500/10 text-emerald-950 border-l border-[#E6DDCE]";

      bands.push({
        title: currentShift ? currentShift.shiftName : "General Hours",
        subTitle: `${startStr} – ${endStr}`,
        colSpan: currentCount,
        colorClass
      });
    }

    return bands;
  }, [displayedHours, shifts]);

  // Filtered Timesheet Rows
  const filteredTimesheet = useMemo(() => {
    return timesheetData.filter(row => {
      const opEntity = operatorMap.get(row.operatorId);

      if (selectedLineId !== "ALL") {
        const lineCode = lines.find(l => String(l.id) === selectedLineId)?.lineCode;
        if (lineCode && row.department !== lineCode && opEntity?.department !== lineCode) {
          return false;
        }
      }

      if (onlyActiveOperators && row.totalCompleted === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = row.operatorName?.toLowerCase().includes(q);
        const matchEmp = row.employeeId?.toLowerCase().includes(q);
        const matchDept = row.department?.toLowerCase().includes(q);
        const matchMachine = row.machineCode?.toLowerCase().includes(q);
        if (!matchName && !matchEmp && !matchDept && !matchMachine) return false;
      }

      return true;
    });
  }, [timesheetData, operatorMap, selectedLineId, onlyActiveOperators, searchQuery, lines]);

  // 24h Timesheet Industrial Engineering Aggregates
  const kpis24h = useMemo(() => {
    let totalTarget = 0;
    let totalCompleted = 0;
    let totalGood = 0;
    let totalReject = 0;
    let totalWorkMins = 0;
    let totalEarnedMins = 0;

    timesheetData.forEach(row => {
      totalTarget += row.totalTarget || 0;
      totalCompleted += row.totalCompleted || 0;
      totalGood += row.totalGood || 0;
      totalReject += row.totalReject || 0;
      totalWorkMins += Number(row.totalWorkMinutes || 0);
      totalEarnedMins += Number(row.totalEarnedMinutes || 0);
    });

    const efficiency = totalWorkMins > 0 ? ((totalEarnedMins / totalWorkMins) * 100).toFixed(1) : "0.0";
    const qualityRate = totalCompleted > 0 ? ((totalGood / totalCompleted) * 100).toFixed(1) : "100.0";
    const defectDhu = totalGood > 0 ? ((totalReject / (totalGood + totalReject)) * 100).toFixed(2) : "0.00";

    return {
      totalTarget,
      totalCompleted,
      totalGood,
      totalReject,
      totalWorkMins: totalWorkMins.toFixed(1),
      totalEarnedMins: totalEarnedMins.toFixed(1),
      efficiency,
      qualityRate,
      defectDhu,
      activeOperatorsCount: timesheetData.filter(t => t.totalCompleted > 0).length,
      totalOperatorsCount: timesheetData.length,
    };
  }, [timesheetData]);

  // Hourly Totals Matrix Calculation (Footer Row)
  const hourlyTotals = useMemo(() => {
    const totals: Record<number, { good: number; reject: number; completed: number; workMins: number; earnedMins: number }> = {};
    
    HOURS_24.forEach(h => {
      totals[h] = { good: 0, reject: 0, completed: 0, workMins: 0, earnedMins: 0 };
    });

    timesheetData.forEach(row => {
      HOURS_24.forEach(h => {
        const slot = row.hourlySlots?.[h];
        if (slot) {
          totals[h].good += slot.goodQty || 0;
          totals[h].reject += slot.rejectQty || 0;
          totals[h].completed += slot.completedQty || 0;
          totals[h].workMins += Number(slot.workMinutes || 0);
          totals[h].earnedMins += Number(slot.earnedMinutes || 0);
        }
      });
    });

    return totals;
  }, [timesheetData]);

  // Quick cell click to log piece output
  const handleQuickCellClick = (operatorId: number, hour: number) => {
    const assignedStation = plannedStations.find(s => s.operatorIds.map(String).includes(String(operatorId)));

    setEditingLog(null);
    setPreselectedOperatorId(String(operatorId));
    setPreselectedOperationId(assignedStation ? String(assignedStation.operationId) : "");
    setPreselectedOrderIdForModal(selectedOrderId || "");
    setPreselectedMachineCode(assignedStation ? assignedStation.machineType : "");
    setPreselectedTime(`${String(hour).padStart(2, "0")}:00`);
    setIsRecordModalOpen(true);
  };

  const handleEditPieceLog = (logItem: PieceProductionLog) => {
    setEditingLog(logItem);
    setIsRecordModalOpen(true);
  };

  const handleDeletePieceLog = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this piece production log?")) return;
    try {
      await pieceProductionApi.deleteLog(id);
      setIsRecordModalOpen(false);
      setEditingLog(null);
      loadData();
    } catch (err) {
      console.error("Failed to delete piece production log:", err);
    }
  };

  const toggleRowExpansion = (operatorId: number) => {
    setExpandedOperatorIds(prev => ({
      ...prev,
      [operatorId]: !prev[operatorId]
    }));
  };

  // Export 24h Timesheet to Excel
  const handleExport24hExcel = () => {
    if (timesheetData.length === 0) return;

    const rows = timesheetData.map(row => {
      const op = operatorMap.get(row.operatorId);
      const rowObj: Record<string, any> = {
        "Emp ID": row.employeeId,
        "Operator Name": row.operatorName,
        "Role": op?.role || "OPERATOR",
        "Department / Line": row.department,
        "Machine Code": row.machineCode || "—",
        "Total Target": row.totalTarget || 0,
        "Total Completed": row.totalCompleted || 0,
        "Total Good": row.totalGood || 0,
        "Total Reject": row.totalReject || 0,
        "Work Minutes": row.totalWorkMinutes || 0,
        "Earned Minutes": row.totalEarnedMinutes || 0,
        "Pass %": row.totalCompleted > 0 ? `${((row.totalGood / row.totalCompleted) * 100).toFixed(1)}%` : "—",
      };

      displayedHours.forEach(h => {
        const slot = row.hourlySlots?.[h];
        rowObj[`${String(h).padStart(2, "0")}:00`] = slot && slot.completedQty > 0
          ? `${slot.goodQty} ok${slot.rejectQty > 0 ? ` (-${slot.rejectQty})` : ""}`
          : "—";
      });

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Timesheet_${selectedDate}`);
    XLSX.writeFile(workbook, `Production_Monitoring_Timesheet_${selectedDate}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Activity className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading production monitoring & line balance data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* ── Header & Module Switcher ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Production Monitoring</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Line-Balancing Integrated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track hourly pitch pace, live operator execution, station bottlenecks, and 24h floor timesheets
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/line-balance?orderId=${selectedOrderId || ""}&lineId=${selectedLineId !== "ALL" ? selectedLineId : ""}&shiftId=${selectedShiftId !== "ALL" ? selectedShiftId : ""}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Open this plan in Planned Lines & Balancing to adjust allocations & Takt Time"
          >
            <Sliders className="w-4 h-4 text-[#9C5B3C]" />
            <span>Edit in Line Balancing</span>
          </Link>

          <button
            type="button"
            onClick={handleExport24hExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Export full timesheet data to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Timesheet
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLog(null);
              setPreselectedOperatorId(operators.length > 0 ? String(operators[0].id) : "");
              setPreselectedOperationId("");
              setPreselectedOrderIdForModal(selectedOrderId || "");
              setPreselectedMachineCode("");
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9C5B3C] hover:bg-[#B06C49] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#9C5B3C]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Piece Run
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("24h-timesheet")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "24h-timesheet"
              ? "bg-white text-slate-900 border border-slate-200 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>24-Hour Operator Timesheet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("line-monitoring")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "line-monitoring"
              ? "bg-white text-slate-900 border border-slate-200 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Gauge className="w-4 h-4 text-[#9C5B3C]" />
          <span>Live Line Balancing & Execution Monitor</span>
          {linePlan && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-bold">
              Plan #{linePlan.id}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: 24-HOUR OPERATOR TIMESHEET                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "24h-timesheet" && (
        <div className="space-y-6">
          {/* Filter Toolbar & Date Navigation */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date Controls */}
              <div className="flex items-center gap-1.5 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1.5 rounded-lg hover:bg-white text-[#8C7E6E] hover:text-[#221912] transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-bold text-[#221912] focus:outline-none cursor-pointer font-mono px-1"
                />
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1.5 rounded-lg hover:bg-white text-[#8C7E6E] hover:text-[#221912] transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-1 rounded-lg bg-white text-[10px] font-bold text-[#9C5B3C] border border-[#E6DDCE] hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              {/* Shift Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedShiftId}
                  onChange={e => setSelectedShiftId(e.target.value)}
                  className="h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Shifts (24 Hours)</option>
                  {shifts.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.shiftName} ({s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedLineId}
                  onChange={e => setSelectedLineId(e.target.value)}
                  className="h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Physical Lines</option>
                  {lines.map(l => (
                    <option key={l.id} value={String(l.id)}>
                      {l.lineCode} · {l.lineName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Box & Active Filter Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search operator, EMP ID, line..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-56 h-10 bg-white border border-[#E6DDCE] rounded-xl pl-9 pr-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs placeholder:text-[#A09383]"
                />
              </div>

              <button
                type="button"
                onClick={() => setOnlyActiveOperators(!onlyActiveOperators)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                  onlyActiveOperators
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Active Operators Only</span>
              </button>
            </div>
          </div>

          {/* 24h KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">Active Operators</p>
              <p className="text-2xl font-black text-[#221912] font-mono mt-1">
                {kpis24h.activeOperatorsCount} <span className="text-xs text-[#8C7E6E] font-normal">/ {kpis24h.totalOperatorsCount}</span>
              </p>
            </div>
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">Pieces Completed</p>
              <p className="text-2xl font-black text-[#221912] font-mono mt-1">{kpis24h.totalCompleted.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#77876F]">Good Pieces</p>
              <p className="text-2xl font-black text-[#77876F] font-mono mt-1">{kpis24h.totalGood.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Rejects / Rework</p>
              <p className="text-2xl font-black text-rose-600 font-mono mt-1">{kpis24h.totalReject.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Pass Percentage</p>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">{kpis24h.qualityRate}%</p>
            </div>
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Defect Rate (DHU)</p>
              <p className="text-2xl font-black text-rose-600 font-mono mt-1">{kpis24h.defectDhu}%</p>
            </div>
          </div>

          {/* 24h Timesheet Table */}
          <DataCard noPad>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: "1200px" }}>
                <thead>
                  {/* Super Header: Shift Windows */}
                  <tr className="border-b border-[#E6DDCE] select-none text-left">
                    <th colSpan={2} className="p-3 bg-[#F6F1E8] text-[11px] font-extrabold uppercase text-[#221912] sticky left-0 z-20 shadow-[1px_0_0_#E6DDCE]">
                      Operator & Machine
                    </th>
                    {shiftBands.map((band, bIdx) => (
                      <th
                        key={bIdx}
                        colSpan={band.colSpan}
                        className={`p-2.5 text-center font-bold text-xs border-r border-[#E6DDCE] ${band.colorClass}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-extrabold uppercase tracking-wider text-[11px]">{band.title}</span>
                          <span className="text-[10px] font-mono opacity-80">({band.subTitle})</span>
                        </div>
                      </th>
                    ))}
                    <th colSpan={5} className="p-3 bg-[#F6F1E8] text-center font-extrabold text-xs uppercase text-[#221912] border-l-2 border-[#E6DDCE]">
                      Daily Summary
                    </th>
                  </tr>

                  {/* Sub Header: Individual Hourly Columns */}
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] uppercase font-bold tracking-wider text-slate-500 select-none">
                    <th className="p-3 w-56 sticky left-0 z-20 bg-slate-50 shadow-[1px_0_0_#E6DDCE]">Operator Name / Role</th>
                    <th className="p-3 w-24">Machine</th>
                    {displayedHours.map(h => {
                      const isLive = h === currentLiveHour;
                      return (
                        <th
                          key={h}
                          className={`p-2 text-center font-mono border-l border-slate-200 ${
                            isLive ? "bg-emerald-100/60 text-emerald-900 font-black ring-1 ring-emerald-400" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{String(h).padStart(2, "0")}:00</span>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-0.5" />}
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-3 w-20 text-center border-l-2 border-slate-200 font-mono">Total</th>
                    <th className="p-3 w-16 text-center text-emerald-700 font-mono">Good</th>
                    <th className="p-3 w-16 text-center text-rose-600 font-mono">Rej</th>
                    <th className="p-3 w-20 text-center font-mono">Work(m)</th>
                    <th className="p-3 w-24 text-center font-mono text-emerald-800 font-extrabold">Pass %</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTimesheet.length === 0 ? (
                    <tr>
                      <td colSpan={displayedHours.length + 7} className="p-12 text-center text-slate-400 italic">
                        No operator production records found for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredTimesheet.map(row => {
                      const isExpanded = !!expandedOperatorIds[row.operatorId];
                      const opEntity = operatorMap.get(row.operatorId);
                      const hasProduction = row.totalCompleted > 0;
                      const operatorLogs = row.rawLogs || [];

                      const renderedHourCells: React.ReactNode[] = [];
                      let skipUntilHourIndex = -1;

                      for (let i = 0; i < displayedHours.length; i++) {
                        const h = displayedHours[i];
                        if (i <= skipUntilHourIndex) continue;

                        const matchingLogs = operatorLogs.filter(r => {
                          const [sh = 0] = (r.startTime || "").split(":").map(Number);
                          return sh === h || r.hourSlot === h;
                        });

                        if (matchingLogs.length === 1) {
                          const matchingRun = matchingLogs[0];
                          const [sh = 0, sm = 0] = (matchingRun.startTime || "").split(":").map(Number);
                          const [eh = 0, em = 0] = (matchingRun.endTime || "").split(":").map(Number);
                          const startDec = sh + sm / 60;
                          let endDec = eh + em / 60;
                          if (endDec < startDec) endDec += 24;
                          
                          let spanCount = 1;
                          for (let j = i + 1; j < displayedHours.length; j++) {
                            let nextH = displayedHours[j];
                            if (nextH < startDec) nextH += 24;
                            if (nextH < endDec) {
                              spanCount++;
                            } else {
                              break;
                            }
                          }

                          if (spanCount > 1) {
                            skipUntilHourIndex = i + spanCount - 1;
                            renderedHourCells.push(
                              <td
                                key={`span-${row.operatorId}-${h}`}
                                colSpan={spanCount}
                                onClick={() => handleEditPieceLog(matchingRun)}
                                className="p-1.5 border-l border-slate-100 transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-100"
                              >
                                <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-[#9C5B3C]/50 rounded-xl shadow-2xs w-full min-h-[38px] hover:border-[#9C5B3C] transition-all">
                                  <div className="flex items-center gap-2 truncate text-left">
                                    <span className="px-1.5 py-0.5 rounded bg-[#F6F1E8] text-[#9C5B3C] font-bold text-[9px] uppercase tracking-wider shrink-0 font-mono border border-[#E6DDCE]">
                                      {spanCount}h Run
                                    </span>
                                    <div className="truncate">
                                      <span className="font-extrabold text-[#221912] text-xs truncate mr-1.5">
                                        {matchingRun.operationName || "Sewing"}
                                      </span>
                                      <span className="text-[10px] text-[#8C7E6E] font-mono font-medium">
                                        ({matchingRun.startTime.slice(0,5)}–{matchingRun.endTime.slice(0,5)} · {matchingRun.actualTimeMinutes}m)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 pl-2">
                                    <span className="font-extrabold text-emerald-700 text-xs font-mono">{matchingRun.goodQty}</span>
                                    {(() => {
                                      const runTotal = matchingRun.goodQty + (matchingRun.rejectQty || 0);
                                      const runPass = runTotal > 0 ? Number(((matchingRun.goodQty / runTotal) * 100).toFixed(1)) : 100;
                                      return (
                                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] border ${
                                          runPass >= 95 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                                        }`}>
                                          {runPass}%
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            );
                          } else {
                            renderedHourCells.push(
                              <td
                                key={`single-${row.operatorId}-${h}`}
                                onClick={() => handleEditPieceLog(matchingRun)}
                                className="p-1.5 text-center border-l border-slate-100 transition-all cursor-pointer bg-slate-50/30 hover:bg-slate-100"
                              >
                                <div className="inline-flex flex-col items-center justify-center p-1 bg-white border border-emerald-200/90 rounded-lg shadow-2xs w-full min-h-[38px] hover:border-emerald-500 transition-all">
                                  <div className="flex items-center gap-1 font-mono">
                                    <span className="font-extrabold text-slate-900 text-xs">{matchingRun.goodQty}</span>
                                    {matchingRun.rejectQty > 0 && (
                                      <span className="px-1 py-0.2 bg-rose-100 text-rose-700 rounded text-[8.5px] font-bold">
                                        -{matchingRun.rejectQty}
                                      </span>
                                    )}
                                  </div>
                                  {(() => {
                                    const runTotal = matchingRun.goodQty + (matchingRun.rejectQty || 0);
                                    const runPass = runTotal > 0 ? Number(((matchingRun.goodQty / runTotal) * 100).toFixed(1)) : 100;
                                    return (
                                      <span className={`text-[9px] font-bold font-mono ${runPass >= 95 ? "text-emerald-700" : "text-amber-700"}`}>
                                        {runPass}%
                                      </span>
                                    );
                                  })()}
                                </div>
                              </td>
                            );
                          }
                        } else if (matchingLogs.length > 1) {
                          const totalGood = matchingLogs.reduce((acc, l) => acc + (l.goodQty || 0), 0);
                          const totalRej = matchingLogs.reduce((acc, l) => acc + (l.rejectQty || 0), 0);
                          renderedHourCells.push(
                            <td
                              key={`multi-${row.operatorId}-${h}`}
                              onClick={() => handleEditPieceLog(matchingLogs[0])}
                              className="p-1.5 text-center border-l border-slate-100 transition-all cursor-pointer bg-amber-50/30 hover:bg-amber-50"
                            >
                              <div className="inline-flex flex-col items-center justify-center p-1 bg-white border border-amber-300 rounded-lg shadow-2xs w-full min-h-[38px] hover:border-amber-500 transition-all">
                                <div className="flex items-center gap-1 font-mono">
                                  <span className="font-extrabold text-emerald-700 text-xs">{totalGood}</span>
                                  {totalRej > 0 && (
                                    <span className="px-1 py-0.2 bg-rose-100 text-rose-700 rounded text-[8.5px] font-bold">
                                      -{totalRej}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[8.5px] font-bold text-amber-800 font-mono">
                                  {matchingLogs.length} runs · {(() => {
                                    const tot = totalGood + totalRej;
                                    return tot > 0 ? Number(((totalGood / tot) * 100).toFixed(1)) : 100;
                                  })()}% pass
                                </span>
                              </div>
                            </td>
                          );
                        } else {
                          const slot = row.hourlySlots?.[h];
                          const hasSlotData = slot && slot.completedQty > 0;
                          const isLive = h === currentLiveHour;
                          const matchingLogForSlot = operatorLogs.find(r => r.hourSlot === h || Number(r.startTime?.split(":")[0]) === h);

                          const onCellClick = () => {
                            if (matchingLogForSlot) {
                              handleEditPieceLog(matchingLogForSlot);
                            } else if (hasSlotData && operatorLogs.length > 0) {
                              handleEditPieceLog(operatorLogs[0]);
                            } else {
                              handleQuickCellClick(row.operatorId, h);
                            }
                          };

                          renderedHourCells.push(
                            <td 
                              key={`slot-${row.operatorId}-${h}`} 
                              onClick={onCellClick}
                              className={`p-1.5 text-center border-l border-slate-100 transition-all cursor-pointer relative ${
                                isLive ? "bg-emerald-50/40" : ""
                              } ${hasSlotData ? "bg-slate-50/40 hover:bg-slate-100" : "hover:bg-slate-50"}`}
                            >
                              {hasSlotData ? (
                                <div className="inline-flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs w-full min-h-[36px]">
                                  <div className="flex items-center gap-1">
                                    <span className="font-extrabold text-slate-900 font-mono text-xs">
                                      {slot.goodQty}
                                    </span>
                                    {slot.rejectQty > 0 && (
                                      <span className="px-1 py-0.2 bg-rose-100 text-rose-700 rounded text-[8.5px] font-bold">
                                        -{slot.rejectQty}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[8.5px] text-slate-500 font-medium truncate max-w-[55px]">
                                    {slot.workMinutes}m · {(() => {
                                      const sTot = slot.goodQty + (slot.rejectQty || 0);
                                      return sTot > 0 ? Number(((slot.goodQty / sTot) * 100).toFixed(1)) : 100;
                                    })()}%
                                  </span>
                                </div>
                              ) : (
                                <div className="h-8 flex items-center justify-center text-slate-300 group/cell hover:text-[#9C5B3C]">
                                  <span className="group-hover/cell:hidden">·</span>
                                  <Plus className="w-3.5 h-3.5 hidden group-hover/cell:inline-block text-[#9C5B3C]" />
                                </div>
                              )}
                            </td>
                          );
                        }
                      }

                      return (
                        <Fragment key={row.operatorId}>
                          <tr className={`group transition-colors ${hasProduction ? "bg-white hover:bg-slate-50/80" : "bg-slate-50/30 hover:bg-white"}`}>
                            {/* Sticky Operator Column */}
                            <td className="p-3 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_#E6DDCE]">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpansion(row.operatorId)}
                                  className="text-slate-400 hover:text-slate-900 p-0.5 cursor-pointer"
                                  title="Toggle Run Details"
                                >
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#9C5B3C]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                                
                                <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0">
                                  {row.operatorName?.slice(0, 2).toUpperCase()}
                                </div>

                                <div className="truncate flex-1">
                                  <div className="font-bold text-slate-900 truncate text-xs group-hover:text-[#9C5B3C] transition-colors" title={row.operatorName}>
                                    {row.operatorName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                    <span>{row.employeeId}</span>
                                    <span>·</span>
                                    <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                      {opEntity?.role || "OPERATOR"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Machine Column */}
                            <td className="p-3 font-mono text-[11px]">
                              {row.machineCode ? (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[10.5px]">
                                  {row.machineCode}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Rendered Hourly Columns */}
                            {renderedHourCells}

                            {/* Summary Columns */}
                            <td className="p-3 text-center border-l-2 border-slate-200 font-mono font-bold text-xs text-slate-900">
                              {row.totalCompleted > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {row.totalCompleted}
                                </span>
                              ) : "—"}
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-emerald-700 text-xs">
                              {row.totalGood > 0 ? row.totalGood : "—"}
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-rose-600 text-xs">
                              {row.totalReject > 0 ? row.totalReject : "—"}
                            </td>

                            <td className="p-3 text-center font-mono text-slate-500 text-xs">
                              {row.totalWorkMinutes > 0 ? `${row.totalWorkMinutes}m` : "—"}
                            </td>

                            <td className="p-3 text-center">
                              {row.totalCompleted > 0 ? (
                                (() => {
                                  const passPct = Number(((row.totalGood / row.totalCompleted) * 100).toFixed(1));
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono shadow-2xs border ${
                                      passPct >= 95 
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                                        : passPct >= 90
                                          ? "bg-sky-50 text-sky-800 border-sky-300"
                                          : "bg-rose-50 text-rose-800 border-rose-300"
                                    }`}>
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      {passPct}%
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Drawer for Detailed Batch Runs */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-y border-slate-200">
                              <td colSpan={displayedHours.length + 7} className="p-4 pl-12">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" />
                                      Production Run Records for {row.operatorName} ({row.rawLogs?.length || 0} batches)
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLog(null);
                                        setPreselectedOperatorId(String(row.operatorId));
                                        setIsRecordModalOpen(true);
                                      }}
                                      className="text-xs font-bold text-[#9C5B3C] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" /> Log New Batch
                                    </button>
                                  </div>

                                  {row.rawLogs && row.rawLogs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {row.rawLogs.map(logItem => (
                                        <div key={logItem.id} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between hover:border-[#9C5B3C]/40 transition-all">
                                          <div>
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                              <span>{logItem.operationName || "Sewing Operation"}</span>
                                              <span className="font-mono text-emerald-700">{logItem.goodQty} ok / {logItem.rejectQty} rej</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                                              <span>Time: {logItem.startTime?.slice(0, 5)}–{logItem.endTime?.slice(0, 5)}</span>
                                              <span>{logItem.actualTimeMinutes} mins</span>
                                            </div>
                                            <div className="text-[10.5px] text-slate-500 mt-1 flex items-center justify-between">
                                              <span>Machine: {logItem.machineCode || "—"}</span>
                                              {(() => {
                                                const tQty = (logItem.goodQty || 0) + (logItem.rejectQty || 0);
                                                const pPct = tQty > 0 ? Number(((logItem.goodQty / tQty) * 100).toFixed(1)) : 100;
                                                return <span className="font-bold text-emerald-700 font-mono">{pPct}% Pass</span>;
                                              })()}
                                            </div>
                                          </div>
                                          
                                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">Target: {logItem.targetQty} pcs</span>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => handleEditPieceLog(logItem)}
                                                className="text-[#9C5B3C] hover:text-[#B06C49] flex items-center gap-1 font-bold cursor-pointer"
                                                title="Edit Run"
                                              >
                                                <Edit2 className="w-3 h-3" /> Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeletePieceLog(logItem.id)}
                                                className="text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold cursor-pointer"
                                                title="Delete Run"
                                              >
                                                <Trash2 className="w-3 h-3" /> Delete
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">No detailed piece logs recorded for today.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer Summary Row */}
                {filteredTimesheet.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/90 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                      <td colSpan={2} className="p-3 sticky left-0 z-20 bg-slate-100 shadow-[1px_0_0_#E6DDCE]">
                        Factory Floor Hourly Totals
                      </td>

                      {displayedHours.map(h => {
                        const tot = hourlyTotals[h];
                        return (
                          <td key={`tot-${h}`} className="p-2 text-center border-l border-slate-200 font-mono text-[10px]">
                            {tot.completed > 0 ? (
                              <div>
                                <span className="font-extrabold text-emerald-700">{tot.good}</span>
                                {tot.reject > 0 && <span className="text-rose-600 ml-0.5">(-{tot.reject})</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center border-l-2 border-slate-200 font-mono text-[#9C5B3C]">
                        {kpis24h.totalCompleted}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-700">
                        {kpis24h.totalGood}
                      </td>
                      <td className="p-3 text-center font-mono text-rose-600">
                        {kpis24h.totalReject}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">
                        {kpis24h.totalWorkMins}m
                      </td>
                      <td className="p-3 text-center font-mono text-[#9C5B3C]">
                        {kpis24h.efficiency}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </DataCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: LIVE LINE BALANCING & EXECUTION MONITOR               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "line-monitoring" && (
        <div className="space-y-6">
          {/* Order & Line Balance Selection Header */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#221912]">Live Line Plan & Production Execution</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                    linePlan ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${linePlan ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {linePlan ? `Active Plan Linked (#${linePlan.id})` : "No Saved Plan Found"}
                  </span>
                </div>
                <p className="text-xs text-[#8C7E6E] mt-0.5">
                  Synchronized live with Planned Lines & Balancing: compare Planned Takt Time and Station Capacity with real-time floor piece output
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  to={`/line-balance?orderId=${selectedOrderId || ""}&lineId=${selectedLineId !== "ALL" ? selectedLineId : ""}&shiftId=${selectedShiftId !== "ALL" ? selectedShiftId : ""}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E6DDCE] bg-[#F6F1E8] text-[#9C5B3C] text-xs font-bold hover:bg-[#EFE9DF] transition-colors cursor-pointer shadow-2xs"
                  title="Open Planned Lines & Balancing to modify station headcount and Takt Time"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure in Line Balancing</span>
                </Link>
              </div>
            </div>

            {/* Context Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Order Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#221912] block">Production Order (PO)</label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                >
                  <option value="">— Select Production Order —</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} · {o.buyer || "General"} ({o.totalQuantity} pcs)
                    </option>
                  ))}
                </select>
                {selectedOrder && (
                  <span className="text-[11px] text-slate-500 block truncate font-medium">
                    Due: <strong>{deliveryCountdown.formatted}</strong> ({deliveryCountdown.days}d left)
                  </span>
                )}
              </div>

              {/* 2. Sewing Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#221912] block">Physical Sewing Line</label>
                <select
                  value={selectedLineId}
                  onChange={e => setSelectedLineId(e.target.value)}
                  className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Lines</option>
                  {lines.map(l => (
                    <option key={l.id} value={String(l.id)}>
                      {l.lineCode} · {l.lineName}
                    </option>
                  ))}
                </select>
                {selectedLine && (
                  <span className="text-[11px] text-slate-500 block truncate">
                    {selectedLine.floor || "Main Floor"} · {selectedLine.supervisorName || "Supervisor: Unassigned"}
                  </span>
                )}
              </div>

              {/* 3. Shift */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#221912] block">Active Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={e => setSelectedShiftId(e.target.value)}
                  className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Shifts</option>
                  {shifts.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.shiftName} ({s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)})
                    </option>
                  ))}
                </select>
                {activeShiftObj && (
                  <span className="text-[11px] text-slate-500 block truncate font-mono">
                    Net Work: <strong>{netWorkingMins}m</strong> (Breaks: {breakDurationMins}m)
                  </span>
                )}
              </div>

              {/* 4. Monitoring Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#221912] block">Execution Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-mono font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
                />
                <span className="text-[11px] text-[#77876F] font-bold block truncate">
                  PFD Allowance: {allowance}%
                </span>
              </div>
            </div>
          </div>

          {!linePlan ? (
            <DataCard>
              <EmptyState 
                title="No Line Plan Found for this Order" 
                description="To start live monitoring, open Planned Lines & Balancing to allocate workstations, operators, and save the line balance plan."
                action={
                  <Link
                    to={`/line-balance?orderId=${selectedOrderId || ""}&lineId=${selectedLineId !== "ALL" ? selectedLineId : ""}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#9C5B3C] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#B06C49] transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Create Line Plan Now</span>
                  </Link>
                }
              />
            </DataCard>
          ) : (
            <>
              {/* ── 2. Live Calculation Summary Cards (Synced with Planned Lines & Balancing) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: TAKT TIME */}
                <div className="bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
                        {endLineOutput > 0 ? "DYNAMIC REMAINING TAKT" : "PLANNED TAKT TIME"}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold shadow-2xs border ${
                      effectiveTaktSecs >= 60
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                        : effectiveTaktSecs >= 30
                        ? "bg-sky-50 text-sky-800 border-sky-200/90"
                        : effectiveTaktSecs >= 15
                        ? "bg-amber-50 text-amber-800 border-amber-200/90"
                        : "bg-rose-50 text-rose-800 border-rose-200/90"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        effectiveTaktSecs >= 60
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                          : effectiveTaktSecs >= 30
                          ? "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]"
                          : effectiveTaktSecs >= 15
                          ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                          : "bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                      }`} />
                      <span>
                        {effectiveTaktSecs >= 60
                          ? "Comfortable Pace"
                          : effectiveTaktSecs >= 30
                          ? "Standard Pace"
                          : effectiveTaktSecs >= 15
                          ? "High Velocity"
                          : "Critical Rush"}
                      </span>
                    </span>
                  </div>

                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                      {effectiveTaktSecs > 0 ? effectiveTaktSecs.toFixed(2) : "0.00"}
                    </span>
                    <span className="text-xs font-bold text-[#9C5B3C]">sec / pc</span>
                  </div>

                  <div className="text-[10.5px] text-[#8C7E6E] font-mono border-t border-[#E6DDCE]/60 pt-1.5 truncate flex items-center justify-between">
                    <span>
                      {endLineOutput > 0
                        ? `Shift Bal: ${Math.round(dailyAvailableTimeSecs)}s ÷ ${remainingShiftBalance} pcs`
                        : `Avail: ${Math.round(dailyAvailableTimeSecs)}s ÷ ${targetOutput} pcs`}
                    </span>
                    {endLineOutput > 0 ? (
                      <span className="text-emerald-700 font-bold font-sans">Done: {endLineOutput} pcs</span>
                    ) : (
                      <span className="text-emerald-700 font-bold font-sans">✓ Balanced Plan</span>
                    )}
                  </div>
                </div>

                {/* Card 2: REQUIRED RUN RATE & ACTUAL OUTPUT */}
                <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                      REMAINING SHIFT BALANCE
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span>{effectiveHourlyTarget} pcs/hr</span>
                    </span>
                  </div>

                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#221912] font-mono">
                      {remainingShiftBalance.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#8C7E6E]">pcs balance ({targetOutput} quota)</span>
                  </div>

                  <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono">
                    <span>End-Line Output: <strong>{endLineOutput} pcs</strong></span>
                    <span className={remainingShiftBalance === 0 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      {remainingShiftBalance === 0 ? "✓ Quota Achieved" : `${remainingShiftBalance} pcs remaining`}
                    </span>
                  </div>
                </div>

                {/* Card 3: WORK CONTENT SMV */}
                <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                      WORK CONTENT (SMV)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{plannedStations.length} Operations</span>
                    </span>
                  </div>

                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#221912] font-mono">
                      {totalLineSMVSecs.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-[#8C7E6E] font-mono">sec ({(totalLineSMVSecs / 60).toFixed(2)} min)</span>
                  </div>

                  <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span>Pitch: {(totalLineSMVSecs / Math.max(1, plannedStations.length)).toFixed(1)}s</span>
                    <span>PFD: {allowance}%</span>
                  </div>
                </div>

                {/* Card 4: END-LINE THROUGHPUT & PROGRESS */}
                <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                      END-LINE FLOW & PROGRESS
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold shadow-2xs border ${
                      plannedLineEfficiency >= 85
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                        : plannedLineEfficiency >= 70
                        ? "bg-sky-50 text-sky-800 border-sky-200/90"
                        : "bg-rose-50 text-rose-800 border-rose-200/90"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        plannedLineEfficiency >= 85 ? "bg-emerald-500" : plannedLineEfficiency >= 70 ? "bg-sky-500" : "bg-rose-500"
                      }`} />
                      <span>{plannedLineEfficiency}% Eff</span>
                    </span>
                  </div>

                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#221912] font-mono">
                      {endLineOutput}
                    </span>
                    <span className="text-xs font-semibold text-[#8C7E6E]">/ {targetOutput} pcs ({((endLineOutput / Math.max(1, targetOutput)) * 100).toFixed(1)}%)</span>
                  </div>

                  <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className={remainingShiftBalance === 0 ? "text-emerald-700 font-bold" : "text-slate-600"}>
                      {remainingShiftBalance === 0 ? "✓ Shift Target Met" : `Bal: ${remainingShiftBalance} pcs remaining`}
                    </span>
                    <span>Order #{selectedOrder?.orderNo}</span>
                  </div>
                </div>
              </div>

              {/* ── 3. Station-by-Station Execution vs Balanced Capacity Table ── */}
              <DataCard noPad>
                <DataCardHeader 
                  title="Station Workstation Allocations & Live Execution Tracking" 
                  subtitle="Live performance comparison between Planned Balance (SMV, Machine, Allocated Operator) and Measured Floor Production" 
                />
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs" style={{ minWidth: "1100px" }}>
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] uppercase font-bold tracking-wider text-slate-500 select-none">
                        <th className="py-3.5 px-4 w-16 text-center whitespace-nowrap">Seq</th>
                        <th className="py-3.5 px-4 w-60 whitespace-nowrap">Operation & Machine</th>
                        <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">Work Content (SMV)</th>
                        <th className="py-3.5 px-4 w-24 text-center bg-slate-100/60 whitespace-nowrap">Planned Ops</th>
                        <th className="py-3.5 px-4 w-64 bg-blue-50/30 whitespace-nowrap">Assigned Operator(s) & Skill</th>
                        <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap">Planned Capacity</th>
                        <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Actual Output Today</th>
                        <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap">Measured Cycle Time</th>
                        <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap">Execution Status</th>
                        <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {stationLiveExecution.map((st) => {
                        return (
                          <tr
                            key={st.stationNum}
                            className={`group transition-colors duration-150 ${
                              st.isBottleneck ? "bg-rose-50/30 hover:bg-rose-50/50" : "bg-white hover:bg-slate-50/80"
                            }`}
                          >
                            {/* 1. Seq */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              <span
                                className={`w-8 h-8 rounded-xl inline-flex items-center justify-center font-mono font-bold text-xs border shadow-2xs ${
                                  st.isBottleneck
                                    ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                                    : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                              >
                                #{st.stationNum}
                              </span>
                            </td>

                            {/* 2. Operation & Machine */}
                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{st.operationName}</span>
                                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-bold">
                                    {st.operationCode}
                                  </span>
                                  {st.isQcCheckpoint && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                                      <span>QC Checkpoint</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
                                  <Cpu className="w-3 h-3 text-slate-400" />
                                  <span>{st.machineType}</span>
                                </div>
                              </div>
                            </td>

                            {/* 3. Work Content (SMV) */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              <div className="flex flex-col items-center">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {(st.smvSeconds / 60).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">min</span>
                                </span>
                                <span className="text-[10px] text-blue-600 font-mono font-medium">
                                  ({st.smvSeconds.toFixed(1)} sec)
                                </span>
                              </div>
                            </td>

                            {/* 4. Planned Ops */}
                            <td className="py-3 px-4 text-center align-middle bg-slate-50/50 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-slate-200/80 text-slate-800 font-mono font-bold text-xs border border-slate-300 shadow-2xs">
                                {st.allocatedOps} {st.allocatedOps > 1 ? "Ops Split" : "Op"}
                              </span>
                            </td>

                            {/* 5. Assigned Operator(s) & Certified Skill */}
                            <td className="py-3 px-4 align-middle bg-blue-50/20 whitespace-nowrap">
                              <div className="space-y-1">
                                {st.operatorDetails.length === 0 ? (
                                  <span className="text-slate-400 italic text-xs">Unassigned</span>
                                ) : (
                                  st.operatorDetails.map(opItem => (
                                    <div key={opItem.id} className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 text-xs">{opItem.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">({opItem.empId})</span>
                                      {opItem.rating ? (
                                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border font-mono ${
                                          opItem.rating >= 4 
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                        }`}>
                                          ★ {opItem.rating}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-400">Unrated</span>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </td>

                            {/* 6. Planned Capacity */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              <div className="flex flex-col items-center">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {st.plannedCapacityPerHour} pcs/hr
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({st.plannedCycleSecs.toFixed(1)}s planned)
                                </span>
                              </div>
                            </td>

                            {/* 7. Actual Output Today */}
                            <td className={`py-3 px-4 text-center align-middle whitespace-nowrap font-mono ${
                              plannedStations.length > 1 && st.totalGood === endLineOutput ? "bg-amber-50/50" : ""
                            }`}>
                              {st.totalGood > 0 ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1 font-bold">
                                    <span className={plannedStations.length > 1 && st.totalGood === endLineOutput ? "text-amber-900 font-extrabold text-sm" : "text-emerald-700 text-sm"}>
                                      {st.totalGood} ok
                                    </span>
                                    {st.totalReject > 0 && (
                                      <span className="text-rose-600 text-xs">(-{st.totalReject})</span>
                                    )}
                                  </div>
                                  {plannedStations.length > 1 && st.totalGood === endLineOutput ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs mt-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                      End-Line Flow: {st.totalGood} pcs
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                      +{Math.max(0, st.totalGood - endLineOutput)} WIP buffer
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* 8. Measured Cycle Time */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap font-mono">
                              {st.actualCycleSecs > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className={`font-bold text-xs ${st.actualCycleSecs > taktTimeSecs ? "text-rose-600" : "text-emerald-700"}`}>
                                    {st.actualCycleSecs.toFixed(1)}s / pc
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({(3600 / st.actualCycleSecs).toFixed(0)} pcs/hr)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            {/* 9. Execution Status */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              {st.isBottleneck ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10.5px] font-bold border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Exceeds Takt</span>
                                </span>
                              ) : st.totalGood > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10.5px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>On Track</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10.5px] font-semibold">
                                  <span>Pending Logs</span>
                                </span>
                              )}
                            </td>

                            {/* 10. Action */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLog(null);
                                  setPreselectedOperatorId(st.operatorIds.length > 0 ? String(st.operatorIds[0]) : "");
                                  setPreselectedOperationId(String(st.operationId));
                                  setPreselectedOrderIdForModal(selectedOrderId || "");
                                  setPreselectedMachineCode(st.machineType);
                                  setIsRecordModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F6F1E8] hover:bg-[#EFE9DF] text-[#9C5B3C] border border-[#E6DDCE] text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Log piece run batch for this station"
                              >
                                <Plus className="w-3 h-3" /> Log Pieces
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DataCard>

              {/* ── 4. Hourly Pitch Output Entry Tracker ──────────────────── */}
              <DataCard noPad>
                <DataCardHeader 
                  title="Shift Hourly Pitch Output Entry & Velocity" 
                  subtitle={`Enter actual completed line units per hour against the Planned Pitch Target (${hourlyTarget} pcs/hr)`} 
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] uppercase tracking-wider font-bold text-slate-500">
                        <th className="p-4 w-28">Shift Hour</th>
                        <th className="p-4 w-32">Planned Target</th>
                        <th className="p-4 w-48">Actual Line Output</th>
                        <th className="p-4 w-32">Hourly Variance</th>
                        <th className="p-4">Execution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                      {SHIFT_HOURS.map((hour) => {
                        const actual = hourlyOutput[hour];
                        const hasEntry = actual !== undefined;
                        const hrVariance = hasEntry ? actual - hourlyTarget : 0;
                        
                        return (
                          <tr key={hour} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-mono font-bold">Hour {hour}</td>
                            <td className="p-4 font-mono text-slate-500">{hourlyTarget} pcs</td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                className="w-28 h-9 bg-white border border-slate-200 rounded-xl px-3 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
                                value={actual ?? ""}
                                onChange={e => handleOutputChange(hour, e.target.value)}
                                placeholder="—"
                              />
                            </td>
                            <td className={`p-4 font-mono font-bold ${hasEntry ? (hrVariance < 0 ? 'text-amber-700' : 'text-emerald-700') : 'text-slate-300'}`}>
                              {hasEntry ? (hrVariance > 0 ? `+${hrVariance}` : hrVariance) : '—'}
                            </td>
                            <td className="p-4">
                              {hasEntry && hrVariance < 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Behind Target
                                </span>
                              )}
                              {hasEntry && hrVariance >= 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                  <CheckCircle className="w-3.5 h-3.5" /> On Track
                                </span>
                              )}
                              {!hasEntry && (
                                <span className="text-slate-400 text-[11px] italic">Not logged</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </>
          )}
        </div>
      )}

      {/* ── Record Piece Modal Dialog (Create & Edit Mode) ─────────── */}
      {isRecordModalOpen && (
        <RecordPieceModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setEditingLog(null);
          }}
          onSuccess={loadData}
          onDelete={handleDeletePieceLog}
          operators={operators}
          operations={operations}
          orders={orders}
          initialDate={selectedDate}
          initialOperatorId={preselectedOperatorId}
          initialOperationId={preselectedOperationId}
          initialOrderId={preselectedOrderIdForModal}
          initialMachineCode={preselectedMachineCode}
          initialStartTime={preselectedTime}
          editingLog={editingLog}
        />
      )}
    </div>
  );
}
