import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ChevronDown, Sparkles,
  Plus, Minus, X, Activity, Clock, ShieldAlert,
  Check, RefreshCw, Zap, Users, Cpu, Download, RotateCcw,
  ShieldCheck, Sliders, Filter, Calendar, CalendarClock,
  Gauge, TrendingUp, Layers
} from "lucide-react";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { linePlanApi } from "../../features/line-balance/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { machinesApi, type Machine } from "../../features/machines/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../../features/production-logs/api";
import { notificationsApi } from "../../features/notifications/api";
import type { Shift } from "../../features/shifts/types";
import { DataCard } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { exportToExcel } from "../../utils/excel";

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
  actualOutput?: number;
}

// ─── Yamazumi / Pitch Line Balance Chart (Clean & Mathematically Calibrated) ──
interface YamazumiPitchChartProps {
  data: Array<{
    stationNum: number;
    operationName: string;
    operationCode: string;
    machineType: string;
    smvSeconds: number;
    effectiveTimeSecs: number;
    allocatedOps: number;
    capacityPerHour: number;
    capacityPerShift: number;
    isBottleneck: boolean;
    deficitPerHour: number;
    requiredOps: number;
    gap: number;
    loadPercent: number;
  }>;
  taktTimeSecs: number;
  requiredHourlyTarget: number;
  lineBalanceEfficiency: number;
  totalLineSMVSecs: number;
  onAddOperator: (stationIndex: number) => void;
}

function YamazumiPitchChart({
  data,
  taktTimeSecs,
  requiredHourlyTarget,
  lineBalanceEfficiency,
  totalLineSMVSecs,
  onAddOperator,
}: YamazumiPitchChartProps) {
  const [viewMode, setViewMode] = useState<"time" | "capacity" | "load">("time");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const averagePitchSecs = data.length > 0 ? totalLineSMVSecs / data.length : 0;
  const bottleneckCount = data.filter(d => d.isBottleneck).length;

  // Calculate clean, rounded dynamic maximum for Y-axis
  let maxVal = 60;
  if (viewMode === "time") {
    const maxData = Math.max(...data.map(d => d.effectiveTimeSecs), taktTimeSecs, 1);
    maxVal = Math.max(10, Math.ceil((maxData * 1.2) / 10) * 10);
  } else if (viewMode === "capacity") {
    const maxData = Math.max(...data.map(d => d.capacityPerHour), requiredHourlyTarget, 1);
    maxVal = Math.max(20, Math.ceil((maxData * 1.2) / 20) * 20);
  } else {
    const maxData = Math.max(...data.map(d => d.loadPercent), 100);
    maxVal = Math.max(100, Math.ceil((maxData * 1.2) / 25) * 25);
  }

  // 5 evenly spaced ticks [100%, 75%, 50%, 25%, 0%]
  const yTicks = [
    { pct: 100, label: `${Math.round(maxVal)}${viewMode === "time" ? "s" : viewMode === "load" ? "%" : ""}` },
    { pct: 75, label: `${Math.round(maxVal * 0.75)}${viewMode === "time" ? "s" : viewMode === "load" ? "%" : ""}` },
    { pct: 50, label: `${Math.round(maxVal * 0.5)}${viewMode === "time" ? "s" : viewMode === "load" ? "%" : ""}` },
    { pct: 25, label: `${Math.round(maxVal * 0.25)}${viewMode === "time" ? "s" : viewMode === "load" ? "%" : ""}` },
    { pct: 0, label: `0${viewMode === "time" ? "s" : viewMode === "load" ? "%" : ""}` },
  ];

  return (
    <div className="bg-white border border-[#E6DDCE] rounded-2xl shadow-[0_1px_3px_rgba(34,25,18,0.05)] overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 sm:p-5 border-b border-[#E6DDCE] bg-[#FDFBF7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#221912]">
              Yamazumi / Pitch Line Balance Chart
            </h3>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold font-mono ${
                bottleneckCount === 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {bottleneckCount === 0 ? "Line Balanced" : `${bottleneckCount} Bottlenecks`}
            </span>
          </div>
          <p className="text-xs text-[#8C7E6E] mt-0.5">
            Workload distribution across workstations compared to Takt Time ({taktTimeSecs.toFixed(1)}s / pc)
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE] shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("time")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "time"
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            Cycle Time (s)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("capacity")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "capacity"
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            Capacity (pcs/hr)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("load")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "load"
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            Workload (%)
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-6 bg-white space-y-3">
        <div className="flex gap-2">
          {/* Y-Axis Column */}
          <div className="w-10 shrink-0 relative h-60 select-none pointer-events-none">
            {yTicks.map((tick, i) => (
              <span
                key={i}
                className="absolute right-1 text-[11px] font-mono font-semibold text-[#8C7E6E] -translate-y-1/2"
                style={{ bottom: `${tick.pct}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>

          {/* Plot Area */}
          <div className="flex-1 relative h-60 border-l border-b border-[#E6DDCE] bg-slate-50/30 rounded-r-lg">
            {/* Horizontal Gridlines */}
            {yTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-b border-[#E6DDCE]/50 pointer-events-none"
                style={{ bottom: `${tick.pct}%` }}
              />
            ))}

            {/* Takt Line (Exact Alignment) */}
            {viewMode === "time" && taktTimeSecs > 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (taktTimeSecs / maxVal) * 100)}%` }}
              >
                <div className="relative border-t-2 border-dashed border-[#9C5B3C]">
                  <span className="absolute -top-3 right-2 text-[10px] font-bold text-white bg-[#9C5B3C] px-2 py-0.5 rounded shadow-xs">
                    TAKT {taktTimeSecs.toFixed(1)}s ({requiredHourlyTarget.toFixed(0)} pcs/h)
                  </span>
                </div>
              </div>
            )}

            {/* Average Pitch Line (Exact Alignment) */}
            {viewMode === "time" && averagePitchSecs > 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (averagePitchSecs / maxVal) * 100)}%` }}
              >
                <div className="relative border-t border-dotted border-[#8C7E6E]">
                  <span className="absolute -top-2.5 left-2 text-[9.5px] font-bold text-[#8C7E6E] bg-white px-1.5 py-0.5 rounded border border-[#E6DDCE] shadow-2xs">
                    AVG {averagePitchSecs.toFixed(1)}s
                  </span>
                </div>
              </div>
            )}

            {/* Target Capacity Line */}
            {viewMode === "capacity" && requiredHourlyTarget > 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (requiredHourlyTarget / maxVal) * 100)}%` }}
              >
                <div className="relative border-t-2 border-dashed border-[#9C5B3C]">
                  <span className="absolute -top-3 right-2 text-[10px] font-bold text-white bg-[#9C5B3C] px-2 py-0.5 rounded shadow-xs">
                    TARGET {requiredHourlyTarget.toFixed(0)} pcs/h
                  </span>
                </div>
              </div>
            )}

            {/* 100% Workload Line */}
            {viewMode === "load" && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (100 / maxVal) * 100)}%` }}
              >
                <div className="relative border-t-2 border-dashed border-[#9C5B3C]">
                  <span className="absolute -top-3 right-2 text-[10px] font-bold text-white bg-[#9C5B3C] px-2 py-0.5 rounded shadow-xs">
                    100% TAKT PACE
                  </span>
                </div>
              </div>
            )}

            {/* Bars Flex Row */}
            <div className="absolute inset-0 flex items-end gap-3 px-4 overflow-x-auto custom-scrollbar z-10">
              {data.map((station, idx) => {
                let currentVal = station.effectiveTimeSecs;
                if (viewMode === "capacity") {
                  currentVal = station.capacityPerHour;
                } else if (viewMode === "load") {
                  currentVal = station.loadPercent;
                }

                // Bar height % of plot area
                const barHeightPct = Math.min(100, Math.max(3, (currentVal / maxVal) * 100));

                const isOverTakt = viewMode === "time"
                  ? station.effectiveTimeSecs > taktTimeSecs && taktTimeSecs > 0
                  : viewMode === "capacity"
                  ? station.capacityPerHour < requiredHourlyTarget
                  : station.loadPercent > 100;

                // Portion of bar below Takt
                const basePortionPct = isOverTakt && viewMode === "time"
                  ? Math.min(100, (taktTimeSecs / station.effectiveTimeSecs) * 100)
                  : 100;

                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={station.stationNum || idx}
                    className="flex flex-col items-center justify-end h-full relative min-w-[52px] max-w-[70px] flex-1 group"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-full mb-2 z-50 bg-[#06202B] text-white p-3 rounded-xl shadow-xl border border-[#0A2947] w-56 text-xs pointer-events-auto"
                        >
                          <div className="flex items-center justify-between border-b border-[#0A2947] pb-1.5 mb-2">
                            <span className="font-mono text-xs font-bold text-[#9C5B3C]">
                              Station #{station.stationNum}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A2947] text-white font-mono">
                              {station.operationCode}
                            </span>
                          </div>

                          <p className="font-semibold text-white text-xs leading-tight mb-2 truncate">
                            {station.operationName}
                          </p>

                          <div className="space-y-1 text-[11px] text-[#8C7E6E]">
                            <div className="flex justify-between">
                              <span>SMV:</span>
                              <span className="text-white font-mono">{station.smvSeconds.toFixed(1)}s ({(station.smvSeconds / 60).toFixed(2)} min)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cycle Time:</span>
                              <span className="text-white font-mono font-bold">{station.effectiveTimeSecs.toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Capacity:</span>
                              <span className="text-white font-mono">{station.capacityPerHour} pcs/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Operators:</span>
                              <span className="text-white font-mono">{station.allocatedOps}</span>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#0A2947] flex items-center justify-between">
                            <span className={`font-bold text-[10.5px] ${station.isBottleneck ? "text-rose-400" : "text-[#10B981]"}`}>
                              {station.isBottleneck ? `⚠️ Over Takt (+${(station.effectiveTimeSecs - taktTimeSecs).toFixed(1)}s)` : "✓ Balanced"}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddOperator(idx);
                              }}
                              className="px-2 py-0.5 bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                              title="Allocate extra operator"
                            >
                              +1 Op
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar Cylinder */}
                    <div
                      className={`w-full relative overflow-hidden rounded-t-md transition-all cursor-pointer ${
                        isHovered ? "ring-2 ring-[#9C5B3C]" : ""
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    >
                      {viewMode === "time" ? (
                        <>
                          {/* Below Takt Base (Green/Teal) */}
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-[#10B981] transition-all"
                            style={{ height: `${basePortionPct}%` }}
                          />
                          {/* Above Takt Excess (Red/Crimson) */}
                          {isOverTakt && (
                            <div
                              className="absolute top-0 left-0 right-0 bg-[#E11D48] transition-all"
                              style={{ height: `${100 - basePortionPct}%` }}
                            />
                          )}
                        </>
                      ) : viewMode === "capacity" ? (
                        <div
                          className={`absolute inset-0 ${
                            station.capacityPerHour >= requiredHourlyTarget
                              ? "bg-[#10B981]"
                              : "bg-[#E11D48]"
                          }`}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 ${
                            station.loadPercent > 100 ? "bg-[#E11D48]" : "bg-[#10B981]"
                          }`}
                        />
                      )}

                      {/* Bar Value Label */}
                      <span className="absolute bottom-1.5 left-0 right-0 text-center font-mono font-bold text-[10px] text-white drop-shadow-xs">
                        {viewMode === "time"
                          ? `${station.effectiveTimeSecs.toFixed(0)}s`
                          : viewMode === "capacity"
                          ? `${station.capacityPerHour}`
                          : `${station.loadPercent}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-Axis Labels Row */}
        <div className="flex gap-2">
          <div className="w-10 shrink-0" />
          <div className="flex-1 flex gap-3 px-4 overflow-x-auto custom-scrollbar">
            {data.map((station, idx) => (
              <div
                key={station.stationNum || idx}
                className="min-w-[52px] max-w-[70px] flex-1 text-center select-none"
              >
                <span
                  className={`text-[11px] font-mono block font-bold leading-tight ${
                    station.isBottleneck ? "text-[#E11D48]" : "text-[#221912]"
                  }`}
                >
                  #{station.stationNum}
                </span>
                <span className="text-[9.5px] text-[#8C7E6E] truncate max-w-[48px] block font-mono font-medium">
                  {station.operationCode}
                </span>
                {station.allocatedOps > 1 && (
                  <span className="text-[8.5px] text-[#9C5B3C] font-mono font-bold block">
                    👥{station.allocatedOps}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2 pt-3 mt-1 border-t border-[#E6DDCE] text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
              <span className="font-medium text-[#221912]">Balanced Station (≤ Takt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#E11D48]" />
              <span className="font-medium text-[#E11D48]">Bottleneck (&gt; Takt)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-[#9C5B3C]" />
              <span className="font-medium text-[#8C7E6E]">Takt Target Line</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 border-t border-dotted border-[#8C7E6E]" />
              <span className="font-medium text-[#8C7E6E]">Pitch Average Line</span>
            </div>
          </div>

          <span className="text-xs text-[#8C7E6E] font-mono">
            Pitch Efficiency: <strong className="text-[#221912]">{lineBalanceEfficiency}%</strong> · Avg Pitch:{" "}
            <strong className="text-[#221912]">{averagePitchSecs.toFixed(1)}s</strong>
          </span>
        </div>
      </div>
    </div>
  );
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
  const paramMode = searchParams.get("mode") || searchParams.get("taktMode");

  const isFixedShiftRoute = fixedMode === "SHIFT_TARGET" || location.pathname.includes("fixed-shift") || location.pathname.includes("shift-target");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoBalancing, setAutoBalancing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Master Data
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);

  // Selections
  const [selectedOrderId, setSelectedOrderId] = useState<string>(paramOrderId || "");
  const [selectedShiftId, setSelectedShiftId] = useState<string>(paramShiftId || "");
  const [selectedLineId, setSelectedLineId] = useState<string>(paramLineId || "");
  const [customShiftTarget, setCustomShiftTarget] = useState<number | null>(null);
  const [allowance, setAllowance] = useState<number>(10);

  // Takt Time Calculation Strategy
  const [taktMode, setTaktMode] = useState<"DELIVERY" | "SHIFT_TARGET">(() => {
    if (fixedMode) return fixedMode;
    if (isFixedShiftRoute) return "SHIFT_TARGET";
    if (paramMode?.toUpperCase() === "SHIFT_TARGET" || paramMode?.toUpperCase() === "FIXED" || paramMode?.toUpperCase() === "SHIFT") {
      return "SHIFT_TARGET";
    }
    return "DELIVERY";
  });

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
  }, [paramOrderId, paramLineId, paramShiftId]);

  const [workDaysOnly, setWorkDaysOnly] = useState<boolean>(true); // 6-day factory week (excl Sundays)

  // Live ticking clock for real-time delivery countdown & live second-by-second takt pacing
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // PFD Breakdown state (Personal 5%, Fatigue 4%, Delay 1%)
  const [pfdPersonal, setPfdPersonal] = useState<number>(5);
  const [pfdFatigue, setPfdFatigue] = useState<number>(4);
  const [pfdDelay, setPfdDelay] = useState<number>(1);
  const [isPfdModalOpen, setIsPfdModalOpen] = useState(false);

  // Attendance & Machine Constraints
  const [filterPresentOnly, setFilterPresentOnly] = useState<boolean>(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [allPieceLogs, setAllPieceLogs] = useState<PieceProductionLog[]>([]);

  // Station Rows
  const [stations, setStations] = useState<StationRow[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [ops, oprs, shfts, ords, bulls, skills, lns, machs, atts, ts, logs] = await Promise.all([
          operationsApi.getOperations().catch(() => []),
          operatorsApi.getOperators().catch(() => []),
          shiftsApi.getShifts().catch(() => []),
          ordersApi.getOrders().catch(() => []),
          bulletinsApi.getBulletins().catch(() => []),
          skillApi.getCurrentMatrix().catch(() => []),
          linesApi.getLines(true).catch(() => []),
          machinesApi.getMachines().catch(() => []),
          attendanceApi.getAttendanceByDate(today).catch(() => []),
          pieceProductionApi.get24hTimesheet(today).catch(() => []),
          pieceProductionApi.getLogs().catch(() => []),
        ]);
        setOperations(ops || []);
        setOperators((oprs || []).filter(o => o && o.active));
        setSkillAssessments(skills || []);
        setLines(lns || []);
        setMachines(machs || []);
        setAttendanceRecords(atts || []);
        setTimesheetData(ts || []);
        setAllPieceLogs(logs || []);

        if (lns && lns.length > 0) {
          const matchLine = paramLineId ? lns.find(l => String(l.id) === String(paramLineId)) : null;
          setSelectedLineId(String((matchLine || lns[0]).id));
        }

        const activeShifts = shfts.filter(s => s.active);
        setShifts(activeShifts);
        if (activeShifts.length > 0) {
          const matchShift = paramShiftId ? activeShifts.find(s => String(s.id) === String(paramShiftId)) : null;
          setSelectedShiftId(String((matchShift || activeShifts[0]).id));
        }

        setOrders(ords);
        setBulletins(bulls);

        if (ords.length > 0) {
          const match = paramOrderId ? ords.find(o => String(o.id) === String(paramOrderId)) : null;
          const initialOrder = match || ords[0];
          setSelectedOrderId(String(initialOrder.id));
        }
      } catch (err) {
        console.error("Failed to fetch line balance dependencies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [paramOrderId, paramLineId, paramShiftId]);

  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);
  const selectedShift = useMemo(() => shifts.find(s => String(s.id) === String(selectedShiftId)), [shifts, selectedShiftId]);
  const selectedLine = useMemo(() => lines.find(l => String(l.id) === String(selectedLineId)), [lines, selectedLineId]);

  const selectedBulletin = useMemo(() => {
    if (!selectedOrder) return null;
    return bulletins.find(b => (b.styles || []).some(s => String(s.id) === String(selectedOrder.styleId))) || null;
  }, [bulletins, selectedOrder]);

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
    const initStations = async () => {
      if (!selectedOrder) {
        setStations([]);
        return;
      }

      try {
        const existingPlan = await linePlanApi.getPlanForOrder(String(selectedOrder.id));
        if (existingPlan && existingPlan.assignments && existingPlan.assignments.length > 0) {
          if (existingPlan.allowance !== undefined) {
            setAllowance(existingPlan.allowance);
          }
          if (existingPlan.allowancePfd) {
            const parts = existingPlan.allowancePfd.split(",").map(Number);
            if (parts.length === 3) {
              setPfdPersonal(parts[0]);
              setPfdFatigue(parts[1]);
              setPfdDelay(parts[2]);
            }
          }
          if (existingPlan.shiftId) {
            setSelectedShiftId(String(existingPlan.shiftId));
          }
          if (existingPlan.lineId) {
            setSelectedLineId(String(existingPlan.lineId));
          }

          const grouped: Record<string, StationRow> = {};
          let seq = 1;
          for (const a of existingPlan.assignments) {
            const opId = String(a.operationId);
            const op = operations.find(o => String(o.id) === opId);
            const bLine = selectedBulletin?.lines?.find(l => String(l.id) === String(a.bulletinLineId));
            const smvVal = Number(bLine?.smv || op?.standardSmv || 0.5);

            if (!grouped[opId]) {
              grouped[opId] = {
                stationNum: bLine?.sequence || seq++,
                bulletinLineId: a.bulletinLineId,
                operationId: a.operationId,
                operationCode: op?.operationCode || "OP",
                operationName: op?.name || "Operation",
                machineType: bLine?.machineType || op?.machineType || "Single Needle Lockstitch",
                smvSeconds: Math.round(smvVal * 60 * 10) / 10,
                operatorIds: [a.operatorId],
                isQcCheckpoint: a.isQcCheckpoint ?? false,
              };
            } else {
              grouped[opId].operatorIds.push(a.operatorId);
              if (a.isQcCheckpoint) grouped[opId].isQcCheckpoint = true;
            }
          }
          setStations(Object.values(grouped).sort((a, b) => a.stationNum - b.stationNum));
          return;
        }
      } catch (e) {
        console.warn("No existing plan, building stations from source:", e);
      }

      if (selectedBulletin && selectedBulletin.lines && selectedBulletin.lines.length > 0) {
        const rows: StationRow[] = selectedBulletin.lines
          .sort((a, b) => a.sequence - b.sequence)
          .map(line => {
            const op = operations.find(o => String(o.id) === String(line.operationId));
            const smvVal = Number(line.smv || 0.5);
            return {
              stationNum: line.sequence,
              bulletinLineId: line.id,
              operationId: line.operationId,
              operationCode: op?.operationCode || "OP",
              operationName: op?.name || "Operation",
              machineType: line.machineType || op?.machineType || "Single Needle Lockstitch",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds: [null],
              isQcCheckpoint: false,
            };
          });
        setStations(rows);
        return;
      }

      if (operations.length > 0) {
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
              machineType: op.machineType || "Single Needle Lockstitch",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds: [null],
              isQcCheckpoint: false,
            };
          });
        setStations(rows);
      }
    };

    initStations();
  }, [selectedOrder, selectedBulletin, operations]);

  // ─── Real-Time Delivery Schedule & Working Days Calculation ─────────────────
  const deliveryScheduleMetrics = useMemo(() => {
    if (!selectedOrder?.deliveryDate && !selectedOrder?.plannedCompletionDate) {
      return {
        calendarDaysRemaining: 1,
        workingDaysRemaining: 1,
        liveWorkingDaysExact: 1,
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

    // Today's remaining seconds (ticking second-by-second)
    const nowSecsIntoDay = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const todayFractionRemaining = Math.max(0, Math.min(1, (86400 - nowSecsIntoDay) / 86400));
    const liveWorkingDaysExact = isOverdue ? 1 : Math.max(0.05, futureWorkingDays + todayFractionRemaining);
    const workingDaysRemaining = Math.max(1, Math.ceil(liveWorkingDaysExact));

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
      isOverdue,
      isDueToday,
      countdownFormatted,
      progressPct,
      deliveryFormatted,
      plannedCompletionFormatted,
    };
  }, [selectedOrder, currentTime, workDaysOnly]);

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
  const dailyAvailableTimeSecs = dailyNetWorkingSecs * (1 - allowance / 100);

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
    const liveShiftAvailableSecs = liveRemainingNetSecs * (1 - allowance / 100);

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
  }, [currentTime, selectedShift, grossShiftMins, netWorkingMins, dailyNetWorkingSecs, allowance]);

  // Total Customer Demand (Order Quantity)
  const totalOrderQuantity = selectedOrder?.totalQuantity && selectedOrder.totalQuantity > 0
    ? selectedOrder.totalQuantity
    : 1000;

  // Live Available Production Time across remaining delivery window (ticking second-by-second)
  const liveAvailableProductionSecs = useMemo(() => {
    return deliveryScheduleMetrics.liveWorkingDaysExact * dailyAvailableTimeSecs;
  }, [deliveryScheduleMetrics.liveWorkingDaysExact, dailyAvailableTimeSecs]);

  const totalAvailableProductionSecs = liveAvailableProductionSecs;

  // Live Required Daily Output to meet delivery on time:
  const liveDeliveryDailyTarget = useMemo(() => {
    const days = Math.max(1, deliveryScheduleMetrics.workingDaysRemaining);
    return Math.max(1, Math.ceil(totalOrderQuantity / days));
  }, [totalOrderQuantity, deliveryScheduleMetrics.workingDaysRemaining]);

  // ─── Live Floor Output & End-Line Throughput (Theory of Constraints / Bottleneck Flow) ──
  const { stationActuals, todayStationActuals } = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const cumActuals = stations.map(st => {
      const opIdStr = String(st.operationId);
      const assignedOpIds = st.operatorIds.filter(Boolean).map(String);
      let actualGood = 0;
      let actualReject = 0;
      const countedLogIds = new Set<number>();

      // 1. Sum across all piece logs for this order / operation / assigned operators
      allPieceLogs.forEach(log => {
        const matchesOrder = !selectedOrderId || !log.orderId || String(log.orderId) === String(selectedOrderId);
        const matchesOp = String(log.operationId) === opIdStr || log.operationName === st.operationName;
        const matchesAssignee = assignedOpIds.length === 0 || assignedOpIds.includes(String(log.operatorId));
        if (matchesOrder && matchesOp && matchesAssignee && !countedLogIds.has(log.id)) {
          countedLogIds.add(log.id);
          actualGood += log.goodQty || 0;
          actualReject += log.rejectQty || 0;
        }
      });

      // 2. Sum across timesheet rows
      timesheetData.forEach(row => {
        if (assignedOpIds.includes(String(row.operatorId)) || assignedOpIds.length === 0) {
          (row.rawLogs || []).forEach(log => {
            const logId = (log as any).id;
            if (!logId || !countedLogIds.has(logId)) {
              if (logId) countedLogIds.add(logId);
              if (String(log.operationId) === opIdStr || (!log.operationId && row.department === st.operationName)) {
                actualGood += log.goodQty || 0;
                actualReject += log.rejectQty || 0;
              }
            }
          });
        }
      });

      return {
        stationNum: st.stationNum,
        operationId: st.operationId,
        actualGood,
        actualReject,
      };
    });

    const todayActuals = stations.map(st => {
      const opIdStr = String(st.operationId);
      const assignedOpIds = st.operatorIds.filter(Boolean).map(String);
      let todayGood = 0;
      let todayReject = 0;
      const countedTodayIds = new Set<number>();

      allPieceLogs.forEach(log => {
        const matchesDate = Boolean(log.logDate && (log.logDate === todayStr || log.logDate.startsWith(todayStr)));
        const matchesOrder = !selectedOrderId || !log.orderId || String(log.orderId) === String(selectedOrderId);
        const matchesOp = String(log.operationId) === opIdStr || log.operationName === st.operationName;
        const matchesAssignee = assignedOpIds.length === 0 || assignedOpIds.includes(String(log.operatorId));
        if (matchesDate && matchesOrder && matchesOp && matchesAssignee && !countedTodayIds.has(log.id)) {
          countedTodayIds.add(log.id);
          todayGood += log.goodQty || 0;
          todayReject += log.rejectQty || 0;
        }
      });

      return {
        stationNum: st.stationNum,
        operationId: st.operationId,
        actualGood: todayGood,
        actualReject: todayReject,
      };
    });

    return { stationActuals: cumActuals, todayStationActuals: todayActuals };
  }, [stations, timesheetData, allPieceLogs, selectedOrderId]);

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
    const days = Math.max(1, deliveryScheduleMetrics.workingDaysRemaining);
    return Math.max(1, Math.ceil(remainingOrderBalance / days));
  }, [remainingOrderBalance, deliveryScheduleMetrics.workingDaysRemaining]);

  // Real-time Planned Pace Required Daily Target
  const plannedPaceDailyTarget = cumulativeOrderOutput > 0 ? dynamicRemainingDeliveryDailyTarget : liveDeliveryDailyTarget;

  // Active Base Shift Target (dynamically mirrors Planned Pace's Required Daily Target in real-time or custom override)
  const activeShiftTarget = (customShiftTarget !== null && customShiftTarget > 0)
    ? customShiftTarget
    : plannedPaceDailyTarget;

  // Remaining Balance Target to Produce for Today's Shift (Today's Quota - Today's Completed Output)
  const remainingShiftBalance = Math.max(0, activeShiftTarget - todayShiftOutput);

  // Real-Time Base Planned Delivery Takt Time
  const liveDeliveryTaktSecs = useMemo(() => {
    if (liveDeliveryDailyTarget <= 0 || dailyAvailableTimeSecs <= 0) return 0;
    return dailyAvailableTimeSecs / liveDeliveryDailyTarget;
  }, [dailyAvailableTimeSecs, liveDeliveryDailyTarget]);

  // Dynamic Remaining Delivery Takt Time (subtracting completed output hour-wise):
  const dynamicRemainingDeliveryTaktSecs = useMemo(() => {
    const balance = remainingOrderBalance > 0 ? remainingOrderBalance : 1;
    if (liveAvailableProductionSecs <= 0) return 0;
    return liveAvailableProductionSecs / balance;
  }, [liveAvailableProductionSecs, remainingOrderBalance]);

  // Real-Time Live Shift-Driven Takt Time (ticks second-by-second with live available seconds)
  const shiftDrivenTaktSecs = useMemo(() => {
    const target = activeShiftTarget > 0 ? activeShiftTarget : 1;
    if (target <= 0 || shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return shiftScheduleMetrics.liveShiftAvailableSecs / target;
  }, [shiftScheduleMetrics.liveShiftAvailableSecs, activeShiftTarget]);

  // Dynamic Remaining Shift-Driven Takt Time (Live available seconds ÷ Remaining Shift Balance):
  const dynamicRemainingShiftTaktSecs = useMemo(() => {
    const balance = remainingShiftBalance > 0 ? remainingShiftBalance : 1;
    if (shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return shiftScheduleMetrics.liveShiftAvailableSecs / balance;
  }, [shiftScheduleMetrics.liveShiftAvailableSecs, remainingShiftBalance]);

  // Active Takt Time according to selected mode:
  // In Planned Pace mode, Takt Time subtracts completed output hour-wise from the total order quantity across remaining available delivery time
  // In Fixed Shift Target mode, Takt Time dynamically recalculates based on remaining shift balance across available shift time
  const taktTimeSecs = taktMode === "DELIVERY"
    ? (endLineOutput > 0 ? dynamicRemainingDeliveryTaktSecs : liveDeliveryTaktSecs)
    : (endLineOutput > 0 ? dynamicRemainingShiftTaktSecs : shiftDrivenTaktSecs);

  const requiredDailyTarget = taktMode === "DELIVERY"
    ? plannedPaceDailyTarget
    : activeShiftTarget;

  const requiredHourlyTarget = taktTimeSecs > 0 ? (3600 / taktTimeSecs) : 0;

  // Reset custom shift target override on order change
  useEffect(() => {
    setCustomShiftTarget(null);
  }, [selectedOrderId]);

  // ─── Operator Skill Lookup Helper ────────────────────────────────────────────
  const getOperatorSkill = (operatorId: string | number | null, operationId: string | number): number | null => {
    if (!operatorId) return null;
    const assessment = skillAssessments.find(
      a => String(a.operatorId) === String(operatorId) && String(a.operationId) === String(operationId)
    );
    return assessment?.rating || null;
  };

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
        return r !== null && r >= 3;
      });
    }
    if (reqRating === "4_PLUS") {
      return baseOps.filter(o => {
        const r = getOperatorSkill(o.id, operationId);
        return r !== null && r >= 4;
      });
    }
    const numericRating = Number(reqRating);
    return baseOps.filter(o => {
      const r = getOperatorSkill(o.id, operationId);
      return r === numericRating;
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

  // ─── Per-Station Metrics in Seconds (Live Linked to Operations Library) ───
  const stationMetrics = useMemo(() => {
    return stations.map(s => {
      const op = operations.find(o => String(o.id) === String(s.operationId));
      const bLine = selectedBulletin?.lines?.find(l => String(l.id) === String(s.bulletinLineId));
      const opSmv = op?.standardSmv !== undefined && op?.standardSmv !== null ? Number(op.standardSmv) : undefined;
      const smvMin = opSmv !== undefined ? opSmv : (bLine?.smv !== undefined ? Number(bLine.smv) : 0.5);
      const smvSeconds = Math.round(smvMin * 60 * 10) / 10;

      const allocatedOps = Math.max(1, s.operatorIds.length);
      const effectiveTimeSecs = smvSeconds / allocatedOps;
      const capacityPerHour = effectiveTimeSecs > 0 ? Math.round(3600 / effectiveTimeSecs) : 0;
      const capacityPerShift = Math.round(capacityPerHour * shiftHours);
      const matchedCumulative = stationActuals.find(
        a => a.stationNum === s.stationNum && String(a.operationId) === String(s.operationId)
      );
      const actualOutputTillDate = matchedCumulative ? matchedCumulative.actualGood : 0;

      const matchedToday = todayStationActuals.find(
        a => a.stationNum === s.stationNum && String(a.operationId) === String(s.operationId)
      );
      const todayActualGood = matchedToday ? matchedToday.actualGood : 0;

      // ─── Dynamic Takt Time & Dynamic Required Ops based on Remaining Pieces ───
      let remainingPieces = 0;
      let exactRemainingManpower = 0;
      let dynamicTaktSecs = 0;
      let dynamicRequiredOps = 1;

      if (taktMode === "DELIVERY") {
        remainingPieces = Math.max(0, totalOrderQuantity - actualOutputTillDate);
        const availableSecs = Math.max(1, liveAvailableProductionSecs);
        
        dynamicTaktSecs = remainingPieces > 0 && availableSecs > 0
          ? Math.round((availableSecs / remainingPieces) * 10) / 10
          : 0;

        exactRemainingManpower = availableSecs > 0
          ? (remainingPieces * smvSeconds) / availableSecs
          : 0;
        
        dynamicRequiredOps = remainingPieces === 0
          ? 0
          : dynamicTaktSecs > 0
            ? Math.max(1, Math.ceil(smvSeconds / dynamicTaktSecs))
            : (taktTimeSecs > 0 ? Math.ceil(smvSeconds / taktTimeSecs) : 1);
      } else {
        const shiftQuota = activeShiftTarget > 0 ? activeShiftTarget : 500;
        remainingPieces = Math.max(0, shiftQuota - todayActualGood);
        const shiftAvailableSecs = Math.max(1, shiftScheduleMetrics.liveShiftAvailableSecs);
        
        dynamicTaktSecs = remainingPieces > 0 && shiftAvailableSecs > 0
          ? Math.round((shiftAvailableSecs / remainingPieces) * 10) / 10
          : 0;

        exactRemainingManpower = shiftAvailableSecs > 0
          ? (remainingPieces * smvSeconds) / shiftAvailableSecs
          : 0;

        dynamicRequiredOps = remainingPieces === 0
          ? 0
          : dynamicTaktSecs > 0
            ? Math.max(1, Math.ceil(smvSeconds / dynamicTaktSecs))
            : (taktTimeSecs > 0 ? Math.ceil(smvSeconds / taktTimeSecs) : 1);
      }

      const requiredOps = dynamicRequiredOps;
      const gap = allocatedOps - requiredOps;
      const isBottleneck = dynamicTaktSecs > 0
        ? effectiveTimeSecs > dynamicTaktSecs
        : (taktTimeSecs > 0 && (effectiveTimeSecs > taktTimeSecs || capacityPerHour < requiredHourlyTarget));
      const deficitPerHour = Math.max(0, Math.round(requiredHourlyTarget - capacityPerHour));
      const loadPercent = dynamicTaktSecs > 0
        ? Math.round((effectiveTimeSecs / dynamicTaktSecs) * 100)
        : (taktTimeSecs > 0 ? Math.round((effectiveTimeSecs / taktTimeSecs) * 100) : 100);
      const requiredSkillRating = s.requiredSkillRating || "ANY";

      const operatorNames = s.operatorIds
        .map(id => operators.find(o => String(o.id) === String(id))?.name)
        .filter(Boolean) as string[];

      const actualRequiredOps = dynamicRequiredOps;
      const actualRequiredGap = gap;
      const dynamicLoadPercent = dynamicTaktSecs > 0
        ? Math.round((effectiveTimeSecs / dynamicTaktSecs) * 100)
        : 0;

      const actualGood = taktMode === "SHIFT_TARGET" ? todayActualGood : actualOutputTillDate;
      const isEndLineBottleneck = stations.length > 1 && actualGood === endLineOutput;

      return {
        ...s,
        smvSeconds,
        operationName: op?.name || s.operationName,
        operationCode: op?.operationCode || s.operationCode,
        allocatedOps,
        effectiveTimeSecs,
        capacityPerHour,
        capacityPerShift,
        isBottleneck,
        deficitPerHour,
        requiredOps,
        gap,
        loadPercent,
        requiredSkillRating,
        operatorNames,
        actualGood,
        actualOutputTillDate,
        todayActualGood,
        remainingPieces,
        exactRemainingManpower,
        actualRequiredOps,
        actualRequiredGap,
        dynamicTaktSecs,
        dynamicLoadPercent,
        isEndLineBottleneck,
      };
    });
  }, [
    stations,
    operations,
    selectedBulletin,
    taktTimeSecs,
    requiredHourlyTarget,
    shiftHours,
    operators,
    skillAssessments,
    stationActuals,
    todayStationActuals,
    endLineOutput,
    taktMode,
    totalOrderQuantity,
    deliveryScheduleMetrics,
    dailyAvailableTimeSecs,
    liveAvailableProductionSecs,
    shiftScheduleMetrics,
    activeShiftTarget,
  ]);

  // ─── Line Metrics in Seconds ─────────────────────────────────────────────────
  const totalLineSMVSecs = useMemo(() => stationMetrics.reduce((sum, s) => sum + s.smvSeconds, 0), [stationMetrics]);
  const totalTheoreticalManpower = taktTimeSecs > 0 ? totalLineSMVSecs / taktTimeSecs : 0;
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

  const handleDispatchBottleneckNotification = async () => {
    if (bottleneckCount === 0 || !selectedOrder) return;
    const summary = bottleneckStations
      .map(b => `#${b.stationNum} ${b.operationName} (${b.effectiveTimeSecs.toFixed(1)}s, Cap: ${b.capacityPerHour} pcs/hr)`)
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
  };

  useEffect(() => {
    if (bottleneckCount > 0 && selectedOrder?.id && stations.length > 0) {
      const bottleneckStationNums = bottleneckStations.map(b => b.stationNum).sort().join(",");
      const key = `bottleneck-${selectedOrder.id}-${selectedLineId || "default"}-${bottleneckStationNums}`;

      const alreadySent = sessionStorage.getItem(key);
      if (lastDispatchedKeyRef.current !== key && !alreadySent) {
        lastDispatchedKeyRef.current = key;
        sessionStorage.setItem(key, "true");
        handleDispatchBottleneckNotification();
      }
    } else if (bottleneckCount === 0) {
      lastDispatchedKeyRef.current = "";
    }
  }, [bottleneckCount, selectedOrder?.id, selectedLineId, stations.length]);

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
    const needed = Math.max(1, Math.ceil(station.smvSeconds / taktTimeSecs));
    
    // Sort active operators by their skill rating for this operation, prioritizing matching rating
    const matchingOps = getEligibleOpsForSkill(station.operationId, station.requiredSkillRating);
    const candidateOps = matchingOps.length > 0 ? matchingOps : operators;
    const sortedCandidates = [...candidateOps].sort((a, b) => {
      const rA = getOperatorSkill(a.id, station.operationId) || 0;
      const rB = getOperatorSkill(b.id, station.operationId) || 0;
      return rB - rA;
    });

    const updatedSlots = [...station.operatorIds];
    while (updatedSlots.length < needed) {
      const unassigned = sortedCandidates.find(op => !updatedSlots.includes(op.id));
      updatedSlots.push(unassigned ? unassigned.id : (sortedCandidates[0]?.id || null));
    }

    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, operatorIds: updatedSlots } : s))
    );

    setSuccessMessage(`Station #${station.stationNum} (${station.operationName}) auto-balanced with ${needed} operators!`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleAutoBalance = () => {
    if (taktTimeSecs <= 0) return;
    setAutoBalancing(true);

    const assignedOpIds = new Set<string | number>();

    const balanced = stations.map(s => {
      const neededOps = Math.max(1, Math.ceil(s.smvSeconds / taktTimeSecs));
      const allocated: (string | number | null)[] = [];

      // Sort operators by their skill rating for this operation, prioritizing matching rating
      const matchingOps = getEligibleOpsForSkill(s.operationId, s.requiredSkillRating);
      const candidateOps = matchingOps.length > 0 ? matchingOps : operators;
      const sortedCandidates = [...candidateOps].sort((a, b) => {
        const rA = getOperatorSkill(a.id, s.operationId) || 0;
        const rB = getOperatorSkill(b.id, s.operationId) || 0;
        return rB - rA;
      });

      for (let k = 0; k < neededOps; k++) {
        const unassigned = sortedCandidates.find(op => !assignedOpIds.has(op.id));
        const chosen = unassigned || sortedCandidates[k % sortedCandidates.length];

        if (chosen) {
          allocated.push(chosen.id);
          assignedOpIds.add(chosen.id);
        } else {
          allocated.push(null);
        }
      }

      return {
        ...s,
        operatorIds: allocated,
      };
    });

    setStations(balanced);
    setAutoBalancing(false);
    setSuccessMessage("Line auto-balanced! All operations are within Takt Time with 0 bottlenecks.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleToggleQcCheckpoint = (index: number) => {
    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, isQcCheckpoint: !s.isQcCheckpoint } : s))
    );
  };

  const handleSave = async () => {
    if (!selectedOrder || !selectedShiftId) return;
    setSaving(true);
    try {
      const flatAssignments: any[] = [];
      for (const s of stations) {
        for (const opId of s.operatorIds) {
          flatAssignments.push({
            bulletinLineId: s.bulletinLineId || null,
            operationId: s.operationId,
            operatorId: opId ? Number(opId) : null,
            isQcCheckpoint: s.isQcCheckpoint ?? false,
          });
        }
      }

      await linePlanApi.savePlan({
        orderId: String(selectedOrder.id),
        shiftId: selectedShiftId,
        lineId: selectedLineId ? Number(selectedLineId) : undefined,
        targetOutput: activeShiftTarget,
        allowance,
        allowancePfd: `${pfdPersonal},${pfdFatigue},${pfdDelay}`,
        assignments: flatAssignments,
      } as any);

      setSuccessMessage("Line plan saved successfully! Connected with Hourly Operation Board.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e: any) {
      console.error("Failed to save line plan:", e);
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
      "SMV (Min)": (m.smvSeconds / 60).toFixed(2),
      "SMV (Sec)": m.smvSeconds,
      "Benchmark Required Ops": m.requiredOps,
      "Allocated Operators": m.allocatedOps,
      "Assigned Operators": m.operatorNames.join(", ") || "Unassigned",
      "Effective Time (Sec)": m.effectiveTimeSecs.toFixed(1),
      "Capacity / Hr": m.capacityPerHour,
      "Capacity / Shift": m.capacityPerShift,
      "Takt Time (Sec)": taktTimeSecs.toFixed(1),
      "Load %": `${m.loadPercent}%`,
      "Actual Output Till Date": m.actualOutputTillDate,
      "Remaining Pieces": m.remainingPieces,
      "Dynamic Takt (Sec)": m.dynamicTaktSecs > 0 ? m.dynamicTaktSecs.toFixed(1) : "N/A (Done)",
      "Actual Required Ops (Remaining)": m.actualRequiredOps,
      "Exact Manpower Needed": m.exactRemainingManpower.toFixed(2),
      "Today Actual Output": m.todayActualGood,
      "Bottleneck": m.isBottleneck ? "YES - DEFICIT" : "NO - BALANCED",
    }));

    exportToExcel(
      exportData,
      `Line_Plan_${selectedOrder.orderNo}_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleResetPlan = async () => {
    if (!selectedOrder) return;
    if (!window.confirm("Are you sure you want to reset this line plan back to default operation bulletin / master operations?")) {
      return;
    }
    try {
      await linePlanApi.deletePlanByOrderId(selectedOrder.id);
      setSuccessMessage("Line plan reset to defaults.");
      setTimeout(() => setSuccessMessage(""), 4000);

      // Re-initialize stations
      if (selectedBulletin && selectedBulletin.lines && selectedBulletin.lines.length > 0) {
        const rows: StationRow[] = selectedBulletin.lines
          .sort((a, b) => a.sequence - b.sequence)
          .map(line => {
            const op = operations.find(o => String(o.id) === String(line.operationId));
            const smvVal = Number(line.smv || 0.5);
            return {
              stationNum: line.sequence,
              bulletinLineId: line.id,
              operationId: line.operationId,
              operationCode: op?.operationCode || "OP",
              operationName: op?.name || "Operation",
              machineType: line.machineType || "Single Needle",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds: [null],
            };
          });
        setStations(rows);
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
            };
          });
        setStations(rows);
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${
              taktMode === "SHIFT_TARGET"
                ? "bg-gradient-to-br from-[#9C5B3C] to-[#7A452D] shadow-[#9C5B3C]/20"
                : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20"
            }`}>
              {taktMode === "SHIFT_TARGET" ? (
                <Gauge className="w-5 h-5" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {taktMode === "SHIFT_TARGET" ? "Fixed Shift Target Balancing" : "Planned Lines & Balancing"}
              </h1>
              <p className="text-xs text-slate-500">
                {taktMode === "SHIFT_TARGET"
                  ? "Pace workstations against daily shift target quotas and monitor end-line throughput"
                  : "Calculate dynamic Takt Time from delivery horizon, allocate multi-operator capacity, and eliminate bottlenecks"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPlan}
            disabled={stations.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export Line Balancing Sheet to Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Plan
          </button>

          <button
            type="button"
            onClick={handleResetPlan}
            disabled={!selectedOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Reset Line Plan to Defaults"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Reset Plan
          </button>

          <Button
            variant="outline"
            onClick={handleAutoBalance}
            loading={autoBalancing}
            size="md"
            className="flex items-center gap-2 border-[#E6DDCE] bg-[#F6F1E8] text-[#9C5B3C] hover:bg-[#EFE9DF] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#9C5B3C]" />
            Auto-Balance Line
          </Button>

          <Link
            to={`/monitoring?orderId=${selectedOrderId || ""}&lineId=${selectedLineId || ""}&shiftId=${selectedShiftId || ""}&tab=line-monitoring`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Open live execution tracking and hourly pitch monitor"
          >
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Live Production Monitor</span>
          </Link>

          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!selectedOrder}
            size="md"
            className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white shadow-sm shadow-[#9C5B3C]/20 cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Save Line Plan
          </Button>
        </div>
      </div>

      {/* Success Alert */}
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
      </AnimatePresence>

      {/* ── 1. Target & Shift Configuration Panel ─────────────────── */}
      <div className="bg-white border border-[#E6DDCE] rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] space-y-4">
        <div className="space-y-3.5 pb-1 border-b border-[#F0EAE0]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#221912]">Line Target & Floor Configuration</h2>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-mono ${
              taktMode === "SHIFT_TARGET"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {taktMode === "SHIFT_TARGET" ? "Shift Target Paced IE Engine" : "Delivery Horizon Paced IE Engine"}
            </span>
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

            {/* PFD Allowance Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsPfdModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6DDCE] bg-[#F6F1E8] text-[#9C5B3C] text-xs font-bold hover:bg-[#EFE9DF] transition-colors cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>PFD: {allowance}%</span>
            </button>
          </div>
        </div>

        {/* Floor Configuration Grid: Render customized panels for Planned Pace vs Fixed Shift Target */}
        {taktMode === "DELIVERY" ? (
          /* ── Mode A: Planned Pace (Master Delivery Plan) ──────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Sewing Line Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Physical Sewing Line</label>
              <select
                value={selectedLineId}
                onChange={e => setSelectedLineId(e.target.value)}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {lines.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.lineCode} · {l.lineName}
                  </option>
                ))}
              </select>
              {selectedLine && (
                <span className="text-[11px] text-[#8C7E6E] block truncate">
                  {selectedLine.floor || "Main Floor"} · {selectedLine.supervisorName || "Supervisor: Unassigned"}
                </span>
              )}
            </div>

            {/* 2. Order Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Production Order (PO)</label>
              <select
                value={selectedOrderId}
                onChange={e => {
                  setSelectedOrderId(e.target.value);
                }}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {orders.map(ord => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNo} · {ord.buyer} ({ord.totalQuantity} pcs)
                  </option>
                ))}
              </select>
              {selectedOrder ? (
                <span className="text-[11px] text-[#77876F] font-bold block truncate">
                  Demand: {totalOrderQuantity.toLocaleString()} pcs ({selectedOrder.color || "Standard"}) · Planned: {deliveryScheduleMetrics.plannedCompletionFormatted}
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 block truncate">
                  No order selected
                </span>
              )}
            </div>

            {/* 3. Real-Time Planned Completion & Delivery Window */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#221912] block">Planned Complete Target</label>
                <button
                  type="button"
                  onClick={() => setWorkDaysOnly(!workDaysOnly)}
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-colors cursor-pointer ${
                    workDaysOnly ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-slate-100 text-slate-700"
                  }`}
                  title="Toggle between 6-day work week (excluding Sundays) and 7-day continuous schedule"
                >
                  {workDaysOnly ? "6-Day Wk (Excl Sun)" : "7-Day Wk"}
                </button>
              </div>
              <div className="h-11 bg-slate-50 border border-[#E6DDCE] rounded-2xl px-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#9C5B3C]" />
                  <span className="text-xs font-bold text-[#221912] font-mono">
                    {deliveryScheduleMetrics.workingDaysRemaining} <span className="text-[10px] text-[#8C7E6E] font-sans font-normal">work days left</span>
                  </span>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-[#9C5B3C] bg-[#F6F1E8] px-2 py-0.5 rounded-lg border border-[#E6DDCE]">
                  {deliveryScheduleMetrics.plannedCompletionFormatted}
                </span>
              </div>
              <span className="text-[11px] text-[#8C7E6E] block truncate font-mono">
                Planned: <strong className="text-[#221912] font-semibold">{deliveryScheduleMetrics.plannedCompletionFormatted}</strong> · Due: <strong>{deliveryScheduleMetrics.deliveryFormatted}</strong>
              </span>
            </div>

            {/* 4. Production Shift */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Production Shift</label>
              <select
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shiftCode} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#8C7E6E] block font-mono">
                Net: {netWorkingMins}m ({shiftHours.toFixed(1)}h) · Break: {breakDurationMins}m
              </span>
            </div>

            {/* 5. Required Daily Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Required Daily Target</label>
              <div className="h-11 bg-slate-50 border border-[#E6DDCE] rounded-2xl px-3 flex items-center justify-between shadow-2xs">
                <span className="font-mono text-xs font-black text-[#221912]">
                  {requiredDailyTarget.toLocaleString()} <span className="text-[10px] text-[#8C7E6E] font-normal font-sans">pcs/day</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg font-bold border border-blue-200/80 font-mono shadow-2xs">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  {requiredHourlyTarget.toFixed(1)} pcs/hr
                </span>
              </div>
              <span className="text-[11px] text-[#8C7E6E] block font-mono truncate">
                {endLineOutput > 0 ? (
                  <>Bal: <strong className="text-[#221912] font-semibold">{remainingOrderBalance.toLocaleString()} pcs</strong> ({totalOrderQuantity.toLocaleString()} - {endLineOutput} done) ÷ {deliveryScheduleMetrics.workingDaysRemaining}d</>
                ) : (
                  <>Avail: <strong className="text-[#221912] font-semibold">{(dailyAvailableTimeSecs / 60).toFixed(0)}m/shift</strong> (Target: {deliveryScheduleMetrics.plannedCompletionFormatted})</>
                )}
              </span>
            </div>
          </div>
        ) : (
          /* ── Mode B: Fixed Shift Target (Live Shift Execution) ─────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Sewing Line Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Physical Sewing Line</label>
              <select
                value={selectedLineId}
                onChange={e => setSelectedLineId(e.target.value)}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {lines.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.lineCode} · {l.lineName}
                  </option>
                ))}
              </select>
              {selectedLine && (
                <span className="text-[11px] text-[#8C7E6E] block truncate">
                  {selectedLine.floor || "Main Floor"} · {selectedLine.supervisorName || "Supervisor: Unassigned"}
                </span>
              )}
            </div>

            {/* 2. Order Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Production Order (PO)</label>
              <select
                value={selectedOrderId}
                onChange={e => {
                  setSelectedOrderId(e.target.value);
                }}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {orders.map(ord => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNo} · {ord.buyer} ({ord.totalQuantity} pcs)
                  </option>
                ))}
              </select>
              {selectedOrder ? (
                <span className="text-[11px] text-[#77876F] font-bold block truncate">
                  Demand: {totalOrderQuantity.toLocaleString()} pcs ({selectedOrder.color || "Standard"})
                </span>
              ) : (
                <span className="text-[11px] text-amber-700 block truncate">
                  No order selected
                </span>
              )}
            </div>

            {/* 3. Production Shift with Live Countdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#221912] block">Production Shift</label>
              <select
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shiftCode} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#8C7E6E] block font-mono">
                Net: {netWorkingMins}m · Left: <strong className="text-[#221912] font-semibold">{shiftScheduleMetrics.countdownFormatted}</strong>
              </span>
            </div>

            {/* 4. Shift Target Output Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#221912]">Shift Target Output</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Pace: {plannedPaceDailyTarget} pcs</span>
                  {customShiftTarget !== null && customShiftTarget !== plannedPaceDailyTarget && (
                    <button
                      type="button"
                      onClick={() => setCustomShiftTarget(null)}
                      className="text-[9.5px] text-blue-600 font-bold hover:underline cursor-pointer"
                      title="Reset to Planned Pace Target"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="number"
                min={1}
                value={customShiftTarget !== null ? customShiftTarget : plannedPaceDailyTarget}
                onChange={e => {
                  const val = Number(e.target.value);
                  setCustomShiftTarget(val > 0 ? val : null);
                }}
                className="w-full h-11 bg-white border border-[#E6DDCE] rounded-2xl px-3 text-xs font-mono font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
              />
              <span className="text-[11px] text-[#8C7E6E] block font-mono truncate">
                Shift Live: <strong className="text-[#221912] font-semibold">{(shiftScheduleMetrics.liveShiftAvailableSecs / 60).toFixed(0)}m avail</strong>
              </span>
            </div>

            {/* 5. End-Line Output & Remaining Shift Balance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#221912]">End-Line Output</label>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 font-mono" title="Governed by the bottleneck minimum completed station pace">
                  Min Flow
                </span>
              </div>
              <div className="h-11 bg-slate-50 border border-[#E6DDCE] rounded-2xl px-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono text-xs font-black text-[#221912]">
                    {endLineOutput} <span className="text-[10px] text-[#8C7E6E] font-normal font-sans">pcs</span>
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300/80 shadow-2xs">
                  Bal: {remainingShiftBalance} pcs
                </span>
              </div>
              <span className="text-[11px] text-[#8C7E6E] block font-mono truncate">
                Quota: {activeShiftTarget} - Done: {endLineOutput} = <strong>{remainingShiftBalance} pcs left</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Live Calculation Summary Cards (Differentiated by Mode) ── */}
      {taktMode === "DELIVERY" ? (
        /* ── Mode A: Planned Pace Summary Cards ─────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: PLANNED TAKT TIME */}
          <div className="bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
                  {endLineOutput > 0 ? "DYNAMIC PLANNED TAKT" : "PLANNED TAKT TIME (DELIVERY)"}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold shadow-2xs border ${
                taktTimeSecs >= 60
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                  : taktTimeSecs >= 30
                  ? "bg-sky-50 text-sky-800 border-sky-200/90"
                  : taktTimeSecs >= 15
                  ? "bg-amber-50 text-amber-800 border-amber-200/90"
                  : "bg-rose-50 text-rose-800 border-rose-200/90"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  taktTimeSecs >= 60
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : taktTimeSecs >= 30
                    ? "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]"
                    : taktTimeSecs >= 15
                    ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                    : "bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                }`} />
                <span>
                  {taktTimeSecs >= 60
                    ? "Comfortable Pace"
                    : taktTimeSecs >= 30
                    ? "Standard Pace"
                    : taktTimeSecs >= 15
                    ? "High Velocity"
                    : "Critical Rush"}
                </span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {taktTimeSecs > 0 ? taktTimeSecs.toFixed(2) : "0.00"}
              </span>
              <span className="text-xs font-bold text-[#9C5B3C]">sec / pc</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] font-mono border-t border-[#E6DDCE]/60 pt-1.5 truncate flex items-center justify-between">
              <span>
                {endLineOutput > 0
                  ? `Avail: ${Math.round(totalAvailableProductionSecs).toLocaleString()}s ÷ ${remainingOrderBalance.toLocaleString()} pcs bal`
                  : `Avail: ${Math.round(totalAvailableProductionSecs).toLocaleString()}s ÷ ${totalOrderQuantity.toLocaleString()} pcs`}
              </span>
              <span className={endLineOutput > 0 ? "text-emerald-700 font-bold font-sans" : "text-blue-600 font-bold font-sans"}>
                {endLineOutput > 0 ? `(${totalOrderQuantity.toLocaleString()} - ${endLineOutput} done)` : "Master Plan"}
              </span>
            </div>
          </div>

          {/* Card 2: REQUIRED DAILY RUN RATE */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                REQUIRED DAILY RUN RATE
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span>{requiredHourlyTarget.toFixed(1)} pcs/hr</span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {requiredDailyTarget.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">pcs / day</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono">
              <span>
                {endLineOutput > 0
                  ? `${remainingOrderBalance.toLocaleString()} pcs bal (${totalOrderQuantity.toLocaleString()} - ${endLineOutput} done)`
                  : `${deliveryScheduleMetrics.workingDaysRemaining} working days left`}
              </span>
              <span>{(requiredHourlyTarget / 60).toFixed(2)} pcs/min</span>
            </div>
          </div>

          {/* Card 3: TOTAL WORK CONTENT (SMV) */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                TOTAL WORK CONTENT (SMV)
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{stations.length} Operations</span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {totalLineSMVSecs.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E] font-mono">sec ({(totalLineSMVSecs / 60).toFixed(2)} min)</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span>Avg Pitch: {(totalLineSMVSecs / Math.max(1, stations.length)).toFixed(1)}s</span>
              <span>Max Station: {maxStationTimeSecs.toFixed(1)}s</span>
            </div>
          </div>

          {/* Card 4: MANPOWER ALLOCATION & EFFICIENCY */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                MANPOWER ALLOCATION
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold shadow-2xs border ${
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

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {totalAllocatedOps}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">allocated ({totalTheoreticalManpower.toFixed(1)} theoretical min)</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className={totalAllocatedOps >= totalTheoreticalManpower ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                {totalAllocatedOps >= totalTheoreticalManpower ? "✓ Capacity Met" : "⚠️ Headcount Deficit"}
              </span>
              <span>{bottleneckCount} Bottlenecks</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mode B: Fixed Shift Target Summary Cards ────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: DYNAMIC REMAINING TAKT TIME */}
          <div className="bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9C5B3C]">
                  {endLineOutput > 0 ? "DYNAMIC REMAINING TAKT" : "SHIFT TAKT TIME (LIVE)"}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold shadow-2xs border ${
                taktTimeSecs >= 60
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                  : taktTimeSecs >= 30
                  ? "bg-sky-50 text-sky-800 border-sky-200/90"
                  : taktTimeSecs >= 15
                  ? "bg-amber-50 text-amber-800 border-amber-200/90"
                  : "bg-rose-50 text-rose-800 border-rose-200/90"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  taktTimeSecs >= 60
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : taktTimeSecs >= 30
                    ? "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]"
                    : taktTimeSecs >= 15
                    ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                    : "bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                }`} />
                <span>
                  {taktTimeSecs >= 60
                    ? "Comfortable Pace"
                    : taktTimeSecs >= 30
                    ? "Standard Pace"
                    : taktTimeSecs >= 15
                    ? "High Velocity"
                    : "Critical Rush"}
                </span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono tracking-tight">
                {taktTimeSecs > 0 ? taktTimeSecs.toFixed(2) : "0.00"}
              </span>
              <span className="text-xs font-bold text-[#9C5B3C]">sec / pc</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] font-mono border-t border-[#E6DDCE]/60 pt-1.5 truncate flex items-center justify-between">
              <span>
                Shift Bal: {Math.round(shiftScheduleMetrics.liveShiftAvailableSecs).toLocaleString()}s ({shiftScheduleMetrics.countdownFormatted} left) ÷ {remainingShiftBalance} pcs
              </span>
              {todayShiftOutput > 0 && (
                <span className="text-emerald-700 font-bold">
                  (Today: {todayShiftOutput} pcs)
                </span>
              )}
            </div>
          </div>

          {/* Card 2: REMAINING SHIFT BALANCE */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                REMAINING SHIFT BALANCE
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span>{requiredHourlyTarget.toFixed(1)} pcs/hr</span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {remainingShiftBalance.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">pcs balance ({activeShiftTarget} shift quota)</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono">
              <span>Today's Flow: {todayShiftOutput} pcs done</span>
              <span className={remainingShiftBalance === 0 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                {remainingShiftBalance === 0 ? "✓ Shift Quota Achieved" : `${remainingShiftBalance} pcs remaining today`}
              </span>
            </div>
          </div>

          {/* Card 3: TOTAL WORK CONTENT (SMV) */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                TOTAL WORK CONTENT (SMV)
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{stations.length} Operations</span>
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {totalLineSMVSecs.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E] font-mono">sec ({(totalLineSMVSecs / 60).toFixed(2)} min)</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span>Avg Pitch: {(totalLineSMVSecs / Math.max(1, stations.length)).toFixed(1)}s</span>
              <span>Max Station: {maxStationTimeSecs.toFixed(1)}s</span>
            </div>
          </div>

          {/* Card 4: END-LINE THROUGHPUT & PROGRESS */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col justify-between min-h-[135px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                SHIFT PROGRESS & FLOW
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold shadow-2xs border ${
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

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#221912] font-mono">
                {todayShiftOutput}
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">/ {activeShiftTarget} pcs ({((todayShiftOutput / Math.max(1, activeShiftTarget)) * 100).toFixed(1)}%)</span>
            </div>

            <div className="text-[10.5px] text-[#8C7E6E] flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className={remainingShiftBalance === 0 ? "text-emerald-700 font-bold" : "text-slate-600"}>
                {remainingShiftBalance === 0 ? "✓ Shift Target Achieved" : `Balance: ${remainingShiftBalance} pcs left for today`}
              </span>
              <span>{totalAllocatedOps} Operators</span>
            </div>
          </div>
        </div>
      )}


      {/* ── 3. Bottleneck Alert Banner ────────────────────────────── */}
      {bottleneckCount > 0 ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs flex-1">
            <h4 className="font-bold text-rose-900 text-sm">
              Line Balancing Alert: {bottleneckCount} Bottleneck Operation{bottleneckCount > 1 ? "s" : ""} Exceeding Takt Time ({taktTimeSecs.toFixed(1)}s)
            </h4>
            <p className="text-rose-700">
              The stations below have cycle times higher than the Takt Time (<strong>{taktTimeSecs.toFixed(1)} sec</strong>) and cannot meet the required line speed of <strong>{requiredHourlyTarget.toFixed(0)} pcs/hr</strong> ({requiredDailyTarget} pcs/day). This will cause WIP buildup and delivery delays:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {bottleneckStations.map(b => (
                <span
                  key={b.stationNum}
                  className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-xl font-mono font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <span>#{b.stationNum} {b.operationName}:</span>
                  <span className="text-rose-600">{b.effectiveTimeSecs.toFixed(1)}s ({b.capacityPerHour} pcs/hr)</span>
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
        <div className="p-4 sm:p-5 border-b border-[#F0EAE0] bg-[#FDFBF7] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Operation Manpower Allocation & Capacity Table
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                {stations.length} Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live engineering matrix: allocate multi-operator manpower to maintain station cycle times below Takt Time ({taktTimeSecs.toFixed(1)}s).
            </p>
          </div>

          {/* Benchmark Context Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500">Takt Pace:</span>
              <strong className="text-slate-900 font-mono">{taktTimeSecs.toFixed(1)}s / pc</strong>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500">Hourly Target:</span>
              <strong className="text-slate-900 font-mono">{requiredHourlyTarget.toFixed(0)} pcs/hr</strong>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">Daily Target:</span>
              <strong className="text-slate-900 font-mono">{requiredDailyTarget} pcs/day</strong>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
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
                <th className="py-3.5 px-5 w-80 bg-blue-50/30 whitespace-nowrap">Manpower Allocation</th>
                {taktMode === "DELIVERY" && (
                  <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap bg-blue-50/20">Actual Output Till Date</th>
                )}
                {taktMode === "SHIFT_TARGET" && (
                  <th className="py-3.5 px-4 w-36 text-center whitespace-nowrap">Actual Output (Today)</th>
                )}
                <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap bg-amber-50/40 text-amber-950 border-l border-r border-amber-200/70" title="Dynamic Operation Takt Time: Available Working Time ÷ Remaining Pieces for this operation">
                  Dynamic Takt Pace
                </th>
                <th className="py-3.5 px-4 w-44 text-center whitespace-nowrap">Station Load & Cycle Time</th>
                <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Hourly Capacity</th>
                <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">
                  {taktMode === "DELIVERY" ? "Daily Target" : "Shift Target"}
                </th>
                <th className="py-3.5 px-4 w-40 text-center whitespace-nowrap">Line Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {row.operationName}
                          </span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-bold">
                            {row.operationCode}
                          </span>
                          {/* QC Checkpoint Tag */}
                          <button
                            type="button"
                            onClick={() => handleToggleQcCheckpoint(idx)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              row.isQcCheckpoint
                                ? "bg-purple-100 text-purple-800 border-purple-300 shadow-2xs"
                                : "bg-slate-50 text-slate-400 border-slate-200 hover:text-purple-700 hover:border-purple-200"
                            }`}
                            title="Click to toggle Inline QC Inspection Checkpoint"
                          >
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>{row.isQcCheckpoint ? "QC Inspection" : "+ Tag QC"}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-slate-400" />
                            <span>{row.machineType}</span>
                          </div>
                          {(() => {
                            const availCount = machines.filter(m => m.machineType === row.machineType && m.status === "AVAILABLE" && m.active).length;
                            return (
                              <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono ${
                                availCount > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                              }`}>
                                {availCount > 0 ? `${availCount} ready` : "No idle"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Work Content (SMV) - Read-Only Display Linked to Operations Library */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {(row.smvSeconds / 60).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">min</span>
                        </span>
                        <span className="text-[10px] text-blue-600 font-mono font-medium">
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
                            <span className="text-[9.5px] text-slate-500 mt-0.5 font-mono" title="⌈Work Content (Sec) ÷ Dynamic Takt (Sec)⌉">
                              ⌈{row.smvSeconds.toFixed(1)}s ÷ {(row.dynamicTaktSecs > 0 ? row.dynamicTaktSecs : taktTimeSecs).toFixed(1)}s⌉
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Column 5: REQUIRED SKILL RATING SELECTOR (Matching Table Theme) */}
                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-full max-w-[145px]">
                          <select
                            value={row.requiredSkillRating || "ANY"}
                            onChange={e => handleUpdateRequiredSkill(idx, e.target.value)}
                            className="w-full h-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-2.5 pr-7 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer appearance-none transition-colors"
                          >
                            <option value="ANY">Any Rating (All)</option>
                            <option value="1">★ 1 · Trainee</option>
                            <option value="2">★ 2 · Basic</option>
                            <option value="3">★ 3 · Standard</option>
                            <option value="4">★ 4 · Skilled</option>
                            <option value="5">★ 5 · Master Expert</option>
                            <option value="3_PLUS">★ 3+ · Skilled & Up</option>
                            <option value="4_PLUS">★ 4+ · Senior & Up</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono font-medium px-2 py-0.5 rounded-full border shadow-2xs ${
                          qualifiedOps.length > 0
                            ? "bg-slate-100/90 text-slate-600 border-slate-200/80"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${qualifiedOps.length > 0 ? "bg-slate-400" : "bg-rose-500"}`} />
                          <span>{qualifiedOps.length} ops matching</span>
                        </span>
                      </div>
                    </td>

                    {/* Column 6: Allocated Operators (Multi-Operator Stepper + Filtered Selectors) */}
                    <td className="py-3 px-5 align-middle bg-blue-50/20">
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
                              className="w-7 h-7 flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer transition-colors"
                              title="Add another operator to this station"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              row.allocatedOps > 1
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {row.allocatedOps > 1 ? `${row.allocatedOps} Operators Split` : "Single Operator"}
                          </span>
                        </div>

                        {/* Dropdowns for Each Operator Slot filtered strictly by Required Skill Rating */}
                        <div className="space-y-1.5">
                          {row.operatorIds.map((opId, slotIdx) => {
                            const skillRating = getOperatorSkill(opId, row.operationId);
                            // Only show operators matching selected required rating (+ current assignment if set)
                            const currentOp = opId ? operators.find(o => String(o.id) === String(opId)) : null;
                            const slotOps = currentOp && !qualifiedOps.some(o => String(o.id) === String(opId))
                              ? [currentOp, ...qualifiedOps]
                              : qualifiedOps;

                            const isSkillMismatch = Boolean(
                              row.requiredSkillRating &&
                              row.requiredSkillRating !== "ANY" &&
                              skillRating !== null &&
                              (row.requiredSkillRating === "3_PLUS"
                                ? skillRating < 3
                                : row.requiredSkillRating === "4_PLUS"
                                ? skillRating < 4
                                : skillRating !== Number(row.requiredSkillRating))
                            );

                            return (
                              <div key={slotIdx} className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <select
                                    value={opId ? String(opId) : ""}
                                    onChange={e => handleAssignOperator(idx, slotIdx, e.target.value)}
                                    className={`w-full h-8 bg-white border rounded-lg pl-2 pr-7 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer appearance-none ${
                                      isSkillMismatch ? "border-amber-400 bg-amber-50/30" : "border-slate-200"
                                    }`}
                                  >
                                    <option value="">
                                      — Select {row.requiredSkillRating !== "ANY" ? `★${row.requiredSkillRating} ` : ""}Operator {row.operatorIds.length > 1 ? `#${slotIdx + 1}` : ""} ({qualifiedOps.length} avail) —
                                    </option>
                                    {slotOps.map(op => {
                                      const rating = getOperatorSkill(op.id, row.operationId);
                                      const att = getOperatorAttendance(op.id);
                                      const attTag = att === "PRESENT" ? "🟢" : att === "LATE" ? "🟡 Late" : att === "ABSENT" ? "🔴 Absent" : "";
                                      return (
                                        <option key={op.id} value={op.id}>
                                          {attTag} {op.employeeId} · {op.name} {op.role && op.role !== "OPERATOR" ? `[${op.role}]` : ""} {rating ? `(⭐ Rating: ${rating})` : "(Unrated)"}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {skillRating !== null ? (
                                  <span
                                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold border shadow-2xs ${
                                      isSkillMismatch
                                        ? "bg-amber-100 text-amber-900 border-amber-300"
                                        : skillRating >= 4
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : skillRating === 3
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                    title={isSkillMismatch ? `Rating ★${skillRating} does not match required rating ★${row.requiredSkillRating}` : `Operator skill rating: ★${skillRating}/5`}
                                  >
                                    <span>★ {skillRating}</span>
                                    {isSkillMismatch && <span className="text-[8.5px] text-amber-700">⚠️</span>}
                                  </span>
                                ) : (
                                  <span className="shrink-0 text-[9.5px] text-slate-400 px-1 font-medium">Unrated</span>
                                )}

                                {row.operatorIds.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOperator(idx, slotIdx)}
                                    className="w-6 h-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md flex items-center justify-center cursor-pointer transition-colors"
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
                      <td className="py-3 px-4 text-center align-middle whitespace-nowrap bg-blue-50/10">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {(row.actualOutputTillDate || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                          </span>
                          {(totalOrderQuantity || 0) > 0 && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
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

                    {/* Column: Actual Output (Today) with End-Line Flow & Bottleneck Highlight (Only in Fixed Shift Target Mode) */}
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
                          {row.isEndLineBottleneck && stations.length > 1 ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                              End-Line Flow ({row.todayActualGood} pcs)
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                              +{Math.max(0, (row.todayActualGood ?? 0) - endLineOutput)} WIP buffer
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
                          <span className="text-[9.5px] text-blue-600 font-mono block">
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
                                  ? "bg-blue-600"
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
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            -{row.deficitPerHour} deficit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                            +{Math.max(0, Math.round(row.capacityPerHour - requiredHourlyTarget))} buffer
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 8: Shift / Daily Output Capacity */}
                    <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-extrabold text-slate-800 text-sm">
                          {row.capacityPerShift.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          target: {requiredDailyTarget}
                        </span>
                      </div>
                    </td>

                    {/* Column 9: Line Status & Quick Action */}
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
                            title="Add 1 Operator to bring station time under Takt"
                          >
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>Auto-Fix (+1 Op)</span>
                          </button>
                        </div>
                      ) : row.capacityPerHour >= requiredHourlyTarget * 1.4 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
          <div className="flex items-center gap-5">
            <span>Total Stations: <strong className="text-[#221912] font-mono">{stations.length}</strong></span>
            <span>Allocated Manpower: <strong className="text-[#221912] font-mono">{totalAllocatedOps} operators</strong></span>
            <span>Theoretical Min: <strong className="text-[#8C7E6E] font-mono">{totalTheoreticalManpower.toFixed(1)} ops</strong></span>
            <span>Pitch Balance Efficiency: <strong className="text-[#77876F] font-mono">{lineBalanceEfficiency}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#9C5B3C]" />
            <span>Target Line Speed: <strong className="text-[#221912] font-mono">{requiredHourlyTarget.toFixed(0)} pcs/hr</strong> (1 pc / {taktTimeSecs.toFixed(1)}s)</span>
          </div>
        </div>
      </DataCard>

      {/* ── 5. Yamazumi / Pitch Line Balance Chart ────────────────── */}
      {stations.length > 0 && (
        <YamazumiPitchChart
          data={stationMetrics}
          taktTimeSecs={taktTimeSecs}
          requiredHourlyTarget={requiredHourlyTarget}
          lineBalanceEfficiency={lineBalanceEfficiency}
          totalLineSMVSecs={totalLineSMVSecs}
          onAddOperator={handleAddOperator}
        />
      )}

      {/* ── PFD Allowance Breakdown Modal ─────────────────────────── */}
      <Modal
        isOpen={isPfdModalOpen}
        onClose={() => setIsPfdModalOpen(false)}
        title="Industrial Engineering PFD Allowance Breakdown"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-600">
            Configure standard <strong>Personal, Fatigue, and Delay (PFD)</strong> allowance factors according to ILO and garment factory standards.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex justify-between">
                <span>Personal Needs Allowance (%)</span>
                <span className="font-mono text-blue-700">{pfdPersonal}%</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={pfdPersonal}
                onChange={e => setPfdPersonal(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold"
              />
              <span className="text-[10.5px] text-slate-400">Water breaks, hygiene, personal fatigue (Standard: 5%)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex justify-between">
                <span>Basic Fatigue Allowance (%)</span>
                <span className="font-mono text-blue-700">{pfdFatigue}%</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={pfdFatigue}
                onChange={e => setPfdFatigue(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold"
              />
              <span className="text-[10.5px] text-slate-400">Physical strain, posture, repetitive motion (Standard: 4%)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex justify-between">
                <span>Unavoidable Delay Allowance (%)</span>
                <span className="font-mono text-blue-700">{pfdDelay}%</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={pfdDelay}
                onChange={e => setPfdDelay(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-mono font-bold"
              />
              <span className="text-[10.5px] text-slate-400">Thread breakage, bobbin change, bundle handling (Standard: 1-3%)</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Total Effective Allowance:</span>
            <span className="text-sm font-mono font-black text-blue-800">
              {pfdPersonal + pfdFatigue + pfdDelay}%
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              onClick={() => {
                const total = pfdPersonal + pfdFatigue + pfdDelay;
                setAllowance(total);
                setIsPfdModalOpen(false);
              }}
            >
              Apply PFD Allowance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
