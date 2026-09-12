import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ChevronDown, Sparkles,
  Plus, Minus, X, Activity, Clock, ShieldAlert,
  Check, RefreshCw, Zap, Users, Cpu, Download, RotateCcw,
  Filter, Calendar, CalendarClock,
  Gauge, TrendingUp, Layers, AlertTriangle,
  Network
} from "lucide-react";
import { operationsApi, type Operation, type OperationAffinity } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../../features/production-logs/api";
import { notificationsApi } from "../../features/notifications/api";
import type { Shift } from "../../features/shifts/types";
import { DataCard } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { OperatorCombobox } from "../../components/ui/OperatorCombobox";
import { exportToExcel } from "../../utils/excel";
import { lineDesignApi, type LineDesign } from "../../features/linedesign/api";
import { 
  getAppliedBulletinScenarioForLine, 
  SCENARIO_APPLIED_EVENT 
} from "../../features/bulletins/bulletinScenarioStore";
import { runGlobalPoolOptimization, RATING_EFFICIENCY_MULTIPLIERS } from "../../features/line-balance/globalPoolOptimizer";


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
  designedPitchTimeSecs: number;
  requiredHourlyTarget: number;
  requiredDesignCapacity: number;
  plannedEfficiency: number;
  lineBalanceEfficiency: number;
  totalLineSMVSecs: number;
  onAddOperator: (stationIndex: number) => void;
}

function YamazumiPitchChart({
  data,
  taktTimeSecs,
  designedPitchTimeSecs,
  requiredHourlyTarget,
  requiredDesignCapacity,
  plannedEfficiency,
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
    const maxData = Math.max(...data.map(d => d.effectiveTimeSecs), taktTimeSecs, designedPitchTimeSecs, 1);
    maxVal = Math.max(10, Math.ceil((maxData * 1.2) / 10) * 10);
  } else if (viewMode === "capacity") {
    const maxData = Math.max(...data.map(d => d.capacityPerHour), requiredDesignCapacity, requiredHourlyTarget, 1);
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
            Designed Pitch Target: <strong className="text-[#9C5B3C] font-mono">{designedPitchTimeSecs.toFixed(1)}s</strong> ({requiredDesignCapacity.toFixed(1)} pcs/hr @ {plannedEfficiency}% Eff) · Customer Takt: <strong className="text-[#221912] font-mono">{taktTimeSecs.toFixed(1)}s</strong> ({requiredHourlyTarget.toFixed(0)} pcs/hr)
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

            {/* Designed Pitch Line (Terracotta Primary Target) */}
            {viewMode === "time" && designedPitchTimeSecs > 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (designedPitchTimeSecs / maxVal) * 100)}%` }}
              >
                <div className="relative border-t-2 border-dashed border-[#9C5B3C]">
                  <span className="absolute -top-3 right-2 text-[10px] font-bold text-white bg-[#9C5B3C] px-2 py-0.5 rounded shadow-xs">
                    DESIGN PITCH {designedPitchTimeSecs.toFixed(1)}s ({requiredDesignCapacity.toFixed(1)} pcs/h @ {plannedEfficiency}%)
                  </span>
                </div>
              </div>
            )}

            {/* Customer Takt Line (Secondary Reference) */}
            {viewMode === "time" && taktTimeSecs > 0 && Math.abs(taktTimeSecs - designedPitchTimeSecs) > 1 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (taktTimeSecs / maxVal) * 100)}%` }}
              >
                <div className="relative border-t border-dashed border-slate-400">
                  <span className="absolute -top-2.5 left-2 text-[9.5px] font-bold text-slate-700 bg-white/95 px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs">
                    CUSTOMER TAKT {taktTimeSecs.toFixed(1)}s ({requiredHourlyTarget.toFixed(0)} pcs/h)
                  </span>
                </div>
              </div>
            )}

            {/* Average Pitch Line (Exact Alignment) */}
            {viewMode === "time" && averagePitchSecs > 0 && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (averagePitchSecs / maxVal) * 100)}%` }}
              >
                <div className="relative border-t border-dotted border-[#8C7E6E]">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9.5px] font-bold text-[#8C7E6E] bg-white px-1.5 py-0.5 rounded border border-[#E6DDCE] shadow-2xs">
                    AVG {averagePitchSecs.toFixed(1)}s
                  </span>
                </div>
              </div>
            )}

            {/* Required Design Capacity Line */}
            {viewMode === "capacity" && requiredDesignCapacity > 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (requiredDesignCapacity / maxVal) * 100)}%` }}
              >
                <div className="relative border-t-2 border-dashed border-[#9C5B3C]">
                  <span className="absolute -top-3 right-2 text-[10px] font-bold text-white bg-[#9C5B3C] px-2 py-0.5 rounded shadow-xs">
                    DESIGN CAP {requiredDesignCapacity.toFixed(1)} pcs/h (@ {plannedEfficiency}%)
                  </span>
                </div>
              </div>
            )}

            {/* Customer Target Capacity Line */}
            {viewMode === "capacity" && requiredHourlyTarget > 0 && Math.abs(requiredDesignCapacity - requiredHourlyTarget) > 1 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none transition-all duration-200"
                style={{ bottom: `${Math.min(98, (requiredHourlyTarget / maxVal) * 100)}%` }}
              >
                <div className="relative border-t border-dashed border-slate-400">
                  <span className="absolute -top-2.5 left-2 text-[9.5px] font-bold text-slate-700 bg-white/95 px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs">
                    CUSTOMER TARGET {requiredHourlyTarget.toFixed(0)} pcs/h
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
                    100% DESIGN PACE
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
                  ? station.effectiveTimeSecs > designedPitchTimeSecs && designedPitchTimeSecs > 0
                  : viewMode === "capacity"
                  ? station.capacityPerHour < requiredDesignCapacity
                  : station.loadPercent > 100;

                // Portion of bar below Designed Pitch
                const basePortionPct = isOverTakt && viewMode === "time"
                  ? Math.min(100, (designedPitchTimeSecs / station.effectiveTimeSecs) * 100)
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
                          className="absolute bottom-full mb-2 z-50 bg-[#06202B] text-white p-3 rounded-xl shadow-xl border border-[#0A2947] w-60 text-xs pointer-events-auto"
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
                              <span>Design Pitch:</span>
                              <span className="text-white font-mono">{designedPitchTimeSecs.toFixed(1)}s (@ {plannedEfficiency}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Capacity vs Req:</span>
                              <span className={`font-mono font-bold ${station.capacityPerHour < requiredDesignCapacity ? "text-rose-400" : "text-emerald-400"}`}>
                                {station.capacityPerHour} / {requiredDesignCapacity.toFixed(1)} pcs/h
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Operators:</span>
                              <span className="text-white font-mono">{station.allocatedOps}</span>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#0A2947] flex items-center justify-between">
                            <span className={`font-bold text-[10.5px] ${station.isBottleneck ? "text-rose-400" : "text-[#10B981]"}`}>
                              {station.isBottleneck ? `⚠️ Over Pitch (+${(station.effectiveTimeSecs - designedPitchTimeSecs).toFixed(1)}s)` : "✓ Balanced"}
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
  const [affinities, setAffinities] = useState<OperationAffinity[]>([]);

  // Selections
  const [selectedOrderId, setSelectedOrderId] = useState<string>(paramOrderId || "");
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>(paramBulletinId || "");
  const [selectedShiftId, setSelectedShiftId] = useState<string>(paramShiftId || "");
  const [selectedLineId, setSelectedLineId] = useState<string>(paramLineId || "");
  const [customShiftTarget, setCustomShiftTarget] = useState<number | null>(null);
  const [plannedEfficiency, setPlannedEfficiency] = useState<number>(80); // Expected Line Efficiency % (IE standard 80.0%)
  const [activeLineDesign, setActiveLineDesign] = useState<LineDesign | null>(null);

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
    if (paramLineDesignId) {
      lineDesignApi.getDesignById(paramLineDesignId).then(design => {
        if (design) {
          setActiveLineDesign(design);
          if (design.orderId) setSelectedOrderId(String(design.orderId));
          if (design.lineId) setSelectedLineId(String(design.lineId));
          if (design.shiftId) setSelectedShiftId(String(design.shiftId));
          if (design.bulletinId) setSelectedBulletinId(String(design.bulletinId));
          if (design.plannedEfficiency) setPlannedEfficiency(Number(design.plannedEfficiency));
          if (design.targetHourlyOutput) {
            setCustomShiftTarget(Math.round(design.targetHourlyOutput * 8));
          }
        }
      }).catch(err => console.warn("Failed to load line design:", err));
    }
  }, [paramLineDesignId]);

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
  const [allLinePlans, setAllLinePlans] = useState<LinePlan[]>([]);

  // Station Rows
  const [stations, setStations] = useState<StationRow[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [ops, oprs, shfts, ords, bulls, skills, lns, atts, ts, logs, plans, affs] = await Promise.all([
          operationsApi.getOperations().catch(() => []),
          operatorsApi.getOperators().catch(() => []),
          shiftsApi.getShifts().catch(() => []),
          ordersApi.getOrders().catch(() => []),
          bulletinsApi.getBulletins().catch(() => []),
          skillApi.getCurrentMatrix().catch(() => []),
          linesApi.getLines(true).catch(() => []),
          attendanceApi.getAttendanceByDate(today).catch(() => []),
          pieceProductionApi.get24hTimesheet(today).catch(() => []),
          pieceProductionApi.getLogs().catch(() => []),
          linePlanApi.getAllPlans().catch(() => []),
          operationsApi.getAllAffinities().catch(() => []),
        ]);
        setOperations(ops || []);
        setOperators((oprs || []).filter(o => o && o.active));
        setSkillAssessments(skills || []);
        setAffinities(affs || []);
        setLines(lns || []);
        setAttendanceRecords(atts || []);
        setTimesheetData(ts || []);
        setAllPieceLogs(logs || []);
        setAllLinePlans(plans || []);

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

    // ── Live Background Polling (Every 8s) to stream floor piece completions & timesheet logs in real-time ──
    const pollTimer = setInterval(async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [logs, ts, atts] = await Promise.all([
          pieceProductionApi.getLogs().catch(() => null),
          pieceProductionApi.get24hTimesheet(today).catch(() => null),
          attendanceApi.getAttendanceByDate(today).catch(() => null),
        ]);
        if (logs) setAllPieceLogs(logs);
        if (ts) setTimesheetData(ts);
        if (atts) setAttendanceRecords(atts);
      } catch (pollErr) {
        // Silent background poll
      }
    }, 8000);

    return () => clearInterval(pollTimer);
  }, [paramOrderId, paramLineId, paramShiftId, paramBulletinId]);

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
      if (b) {
        setSelectedBulletinId(String(b.id));
      }
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

      const isPlanForThisLine = existingPlan && (!existingPlan.lineId || String(existingPlan.lineId) === String(selectedLineId));

      if (isPlanForThisLine && existingPlan) {
        if (existingPlan.plannedEfficiency !== undefined && existingPlan.plannedEfficiency !== null && existingPlan.plannedEfficiency > 0) {
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
            const op = operations.find(o => String(o.id) === String(line.operationId));
            const smvVal = Number(line.smv || 0.5);

            // Multi-index resolution for stationAllocations:
            // Prioritize activeLineDesign, then currentApplied
            let allocCount = 1;
            let allocSource: Record<string | number, number> | null = null;
            if (activeLineDesign?.stationAllocations) {
              try {
                allocSource = typeof activeLineDesign.stationAllocations === "string" 
                  ? JSON.parse(activeLineDesign.stationAllocations) 
                  : activeLineDesign.stationAllocations;
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
              requiredSkillRating: line.skillRatingRequired ? String(line.skillRatingRequired) : (op?.skillLevelRequired || op?.skillLevel ? String(op.skillLevelRequired || op.skillLevel) : undefined),
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
                requiredSkillRating: (op?.skillLevelRequired || op?.skillLevel) ? String(op.skillLevelRequired || op.skillLevel) : undefined,
                wipThreshold: 20,
              });
            }
          }
        }

        setStations(rows.sort((a, b) => a.stationNum - b.stationNum));
        return;
      }

      if (operations.length > 0) {
        const rows: StationRow[] = operations
          .filter(o => o.active)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          .map((op, idx) => {
            const smvVal = Number(op.standardSmv || 0.5);
            const rawAssigned = existingAssignmentsByOp.get(String(op.id)) || [];
            const assignedOps = rawAssigned.filter(id => id !== null && id !== undefined && id !== "");
            const operatorIds = assignedOps.length > 0 ? assignedOps : (rawAssigned.length > 0 ? rawAssigned : [null]);

            return {
              stationNum: idx + 1,
              bulletinLineId: null,
              operationId: op.id,
              operationCode: op.operationCode,
              operationName: op.name,
              machineType: op.machineType || "Single Needle Lockstitch",
              smvSeconds: Math.round(smvVal * 60 * 10) / 10,
              operatorIds,
              isQcCheckpoint: existingQcByOp.get(String(op.id)) || false,
              requiredSkillRating: (op?.skillLevelRequired || op?.skillLevel) ? String(op.skillLevelRequired || op.skillLevel) : undefined,
            };
          });
        setStations(rows);
      }
    };

    initStations();
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
                  requiredSkillRating: line.skillRatingRequired ? String(line.skillRatingRequired) : (op?.skillLevelRequired || op?.skillLevel ? String(op.skillLevelRequired || op.skillLevel) : undefined),
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

  // Total Customer Demand (Order Quantity)
  const totalOrderQuantity = selectedOrder?.totalQuantity && selectedOrder.totalQuantity > 0
    ? selectedOrder.totalQuantity
    : 1000;

  // Live Available Production Time across remaining delivery window (ticking second-by-second)
  const liveAvailableProductionSecs = useMemo(() => {
    return deliveryScheduleMetrics.liveWorkingDaysExact * dailyAvailableTimeSecs;
  }, [deliveryScheduleMetrics.liveWorkingDaysExact, dailyAvailableTimeSecs]);

  // Live Required Daily Output to meet delivery on time:
  const liveDeliveryDailyTarget = useMemo(() => {
    const days = Math.max(1, deliveryScheduleMetrics.workingDaysRemaining);
    return Math.max(1, Math.ceil(totalOrderQuantity / days));
  }, [totalOrderQuantity, deliveryScheduleMetrics.workingDaysRemaining]);

  // ─── Live Floor Output & End-Line Throughput (Theory of Constraints / Bottleneck Flow) ──
  const { stationActuals, todayStationActuals } = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

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
        const matchesOrder = !selectedOrderId || !log.orderId || String(log.orderId) === String(selectedOrderId);
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
              if (String(log.operationId) === opIdStr || (!log.operationId && row.department === st.operationName)) {
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

    // 2. Enforce Progressive Sequential Flow Constraint (Garment Assembly Line Precedence Flow):
    // In apparel manufacturing, Station k cannot complete and output more units than what Station (k-1) has completed and passed.
    // FlowBounded(Station 1) = Raw(Station 1)
    // FlowBounded(Station k) = min(Raw(Station k), FlowBounded(Station k-1))
    // Queue WIP_k = FlowBounded(Station k-1) - FlowBounded(Station k)
    let maxPrevCum = Infinity;
    let maxPrevToday = Infinity;

    const cumActuals: Array<{ stationNum: number; operationId: string | number; actualGood: number; actualReject: number; rawGood: number; queueWip: number }> = [];
    const todayActuals: Array<{ stationNum: number; operationId: string | number; actualGood: number; actualReject: number; rawGood: number; queueWip: number }> = [];

    sortedStations.forEach((st, idx) => {
      const rawCum = rawCumMap.get(st.stationNum) || { good: 0, reject: 0 };
      const rawToday = rawTodayMap.get(st.stationNum) || { good: 0, reject: 0 };

      // Flow bounded output: strictly <= predecessor completed output
      const boundedCumGood = Math.min(rawCum.good, maxPrevCum);
      const boundedTodayGood = Math.min(rawToday.good, maxPrevToday);

      // WIP waiting in buffer before this station (from predecessor output)
      const cumWip = idx > 0 && maxPrevCum !== Infinity ? Math.max(0, maxPrevCum - boundedCumGood) : 0;
      const todayWip = idx > 0 && maxPrevToday !== Infinity ? Math.max(0, maxPrevToday - boundedTodayGood) : 0;

      maxPrevCum = boundedCumGood;
      maxPrevToday = boundedTodayGood;

      cumActuals.push({
        stationNum: st.stationNum,
        operationId: st.operationId,
        actualGood: boundedCumGood,
        actualReject: rawCum.reject,
        rawGood: rawCum.good,
        queueWip: cumWip,
      });

      todayActuals.push({
        stationNum: st.stationNum,
        operationId: st.operationId,
        actualGood: boundedTodayGood,
        actualReject: rawToday.reject,
        rawGood: rawToday.good,
        queueWip: todayWip,
      });
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

  // ─── Real-Time Dynamic Takt & Pitch Engine (Live Second-by-Second Dynamic Balancing) ───
  // Real-Time Base Planned Delivery Takt Time
  const liveDeliveryTaktSecs = useMemo(() => {
    if (liveDeliveryDailyTarget <= 0 || dailyAvailableTimeSecs <= 0) return 0;
    return Math.round((dailyAvailableTimeSecs / liveDeliveryDailyTarget) * 100) / 100;
  }, [dailyAvailableTimeSecs, liveDeliveryDailyTarget]);

  // Dynamic Remaining Delivery Takt Time (Live available production seconds remaining ÷ Remaining pieces):
  const dynamicRemainingDeliveryTaktSecs = useMemo(() => {
    const balance = remainingOrderBalance > 0 ? remainingOrderBalance : 1;
    if (liveAvailableProductionSecs <= 0) return 0;
    return Math.round((liveAvailableProductionSecs / balance) * 100) / 100;
  }, [liveAvailableProductionSecs, remainingOrderBalance]);

  // Real-Time Live Shift-Driven Takt Time (ticks second-by-second with live available seconds)
  const shiftDrivenTaktSecs = useMemo(() => {
    const target = activeShiftTarget > 0 ? activeShiftTarget : 1;
    if (target <= 0 || shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return Math.round((shiftScheduleMetrics.liveShiftAvailableSecs / target) * 100) / 100;
  }, [shiftScheduleMetrics.liveShiftAvailableSecs, activeShiftTarget]);

  // Dynamic Remaining Shift-Driven Takt Time (Live available seconds ÷ Remaining Shift Balance):
  const dynamicRemainingShiftTaktSecs = useMemo(() => {
    const balance = remainingShiftBalance > 0 ? remainingShiftBalance : 1;
    if (shiftScheduleMetrics.liveShiftAvailableSecs <= 0) return 0;
    return Math.round((shiftScheduleMetrics.liveShiftAvailableSecs / balance) * 100) / 100;
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

  // Reset custom shift target override on order change (only if not loaded from active line design)
  useEffect(() => {
    if (!activeLineDesign) {
      setCustomShiftTarget(null);
    }
  }, [selectedOrderId, activeLineDesign]);

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
      const smvMin = bLine?.smv !== undefined && bLine.smv !== null
        ? Number(bLine.smv)
        : (s.smvSeconds > 0 ? s.smvSeconds / 60 : (op?.standardSmv !== undefined ? Number(op.standardSmv) : 0.5));
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
          totalAssignedEfficiency += (RATING_EFFICIENCY_MULTIPLIERS[direct] || 1.0);
          return;
        }
        // Check affinitized alternative skills
        const opAffs = affinities.filter(a => String(a.primaryOperationId) === String(s.operationId));
        let bestAffEff = 0;
        for (const aff of opAffs) {
          const altRating = getOperatorSkill(id, aff.alternativeOperationId);
          if (altRating) {
            const effRating = altRating;
            const baseMult = RATING_EFFICIENCY_MULTIPLIERS[effRating] || 0.85;
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
    taktTimeSecs,
    designedPitchTimeSecs,
    requiredHourlyTarget,
    requiredDesignCapacity,
    plannedEfficiencyFraction,
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

  const handleDispatchBottleneckNotification = async () => {
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
  };

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
  }, [bottleneckCount, selectedOrder?.id, selectedLineId, stations.length, stationMetrics]);

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
      const unassigned = sortedCandidates.find(op => {
        const strId = String(op.id);
        if (updatedSlots.some(sId => String(sId) === strId)) return false;
        if (operatorsAssignedInCurrentPlan.has(strId)) return false;
        if (operatorsAssignedInOtherPlans.has(strId)) return false;
        return true;
      });
      if (unassigned) {
        updatedSlots.push(unassigned.id);
      } else {
        updatedSlots.push(null);
      }
    }

    setStations(prev =>
      prev.map((s, i) => (i === index ? { ...s, operatorIds: updatedSlots } : s))
    );

    setSuccessMessage(`Station #${station.stationNum} (${station.operationName}) auto-balanced with ${needed} operators!`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleAutoBalance = () => {
    const pitchPace = designedPitchTimeSecs > 0 ? designedPitchTimeSecs : taktTimeSecs;
    if (pitchPace <= 0) return;
    setAutoBalancing(true);

    const assignedOpIds = new Set<string>(Array.from(operatorsAssignedInOtherPlans.keys()));

    const getSkillWeight = (ratingStr?: string | number) => {
      const r = String(ratingStr || "ANY").trim();
      if (r === "5") return 5000;
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
      if (reqRatingStr === "3_PLUS") targetRating = 3;
      else if (reqRatingStr === "4_PLUS") targetRating = 4;
      else {
        const num = Number(reqRatingStr);
        if (!isNaN(num) && num >= 1 && num <= 5) targetRating = num;
      }

      const availableOps = operators.filter(o => !assignedOpIds.has(String(o.id)));
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
    setSuccessMessage(`Line auto-balanced for ${requiredDesignCapacity.toFixed(1)} pcs/hr design capacity (@ ${plannedEfficiency}% efficiency)! All operations are within Designed Pitch.`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // ─── Global Pool Optimization & Affinitized Coverage ───
  const handleAutoAssignOperators = (fillOnlyEmpty = false) => {
    if (stations.length === 0) return;
    setAutoAssigning(true);

    const externalAssignedIds = new Set<string>(Array.from(operatorsAssignedInOtherPlans.keys()));

    const result = runGlobalPoolOptimization({
      stations,
      operators,
      skillAssessments,
      affinities,
      attendanceRecords,
      externalAssignedOperatorIds: externalAssignedIds,
      taktTimeSecs,
      plannedEfficiency,
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
      `Full-Pool Allocation Optimized: Achieved ${m.realPoolAchievableEfficiency}% Floor LBE (${m.realizationRatio}% Realization of Designed OB). Staffed ${m.directSkillMatchCount} direct skills, ${m.affinityMatchCount} via operational affinities${m.unfulfilledSlotCount > 0 ? ` (${m.unfulfilledSlotCount} unfilled)` : ""}.`
    );
    setTimeout(() => setSuccessMessage(""), 6000);
  };

  const handleSave = async () => {
    const targetOrder = selectedOrder || orders.find(o => String(o.id) === String(selectedOrderId)) || (orders.length > 0 ? orders[0] : null);
    if (!targetOrder) {
      setErrorMessage("Please select an Order before saving the line plan.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const shiftIdToUse = selectedShiftId || (activeLineDesign?.shiftId ? String(activeLineDesign.shiftId) : "") || (shifts.length > 0 ? String(shifts[0].id) : "1");
    const lineIdToUse = selectedLineId ? Number(selectedLineId) : (activeLineDesign?.lineId ? Number(activeLineDesign.lineId) : (lines.length > 0 ? Number(lines[0].id) : 1));

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
      } as any);

      // If activeLineDesign exists, also update Line Design with the latest station allocations
      if (activeLineDesign?.id) {
        try {
          await lineDesignApi.updateDesign(activeLineDesign.id, {
            ...activeLineDesign,
            lineId: lineIdToUse || activeLineDesign.lineId,
            shiftId: Number(shiftIdToUse),
            stationAllocations: JSON.stringify(flatAssignments),
            workstationsJson: JSON.stringify(stations),
          } as any);
        } catch (ldErr) {
          console.warn("Could not update line design allocations:", ldErr);
        }
      }

      const refreshedPlans = await linePlanApi.getAllPlans().catch(() => []);
      setAllLinePlans(refreshedPlans || []);
      setSuccessMessage("✓ Line plan saved successfully! Connected with Live Production Monitoring & Hourly Operation Board.");
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
      "SMV (Min)": (m.smvSeconds / 60).toFixed(2),
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
      `Line_Plan_${selectedOrder.orderNo}_${new Date().toISOString().split("T")[0]}`
    );
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
              wipThreshold: line.wipThreshold ?? 20,
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
            className="flex items-center gap-2 border-[#E6DDCE] bg-[#F6F1E8] text-[#9C5B3C] hover:bg-[#EFE9DF] cursor-pointer font-bold text-xs"
          >
            <Sparkles className="w-4 h-4 text-[#9C5B3C]" />
            Auto-Balance Line
          </Button>

          <Button
            onClick={handleSave}
            loading={saving}
            size="md"
            className="bg-[#9C5B3C] hover:bg-[#854B30] text-white shadow-sm shadow-[#9C5B3C]/25 cursor-pointer font-bold text-xs px-4"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-200" />
            Save Line Plan
          </Button>

          <Link
            to={`/monitoring?orderId=${selectedOrderId || ""}&lineId=${selectedLineId || ""}&shiftId=${selectedShiftId || ""}&tab=line-monitoring`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Open live execution tracking and hourly pitch monitor"
          >
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Live Production Monitor</span>
          </Link>
        </div>
      </div>

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
                {activeLineDesign.totalWorkstations} Workstations ({activeLineDesign.totalOperators} Sewing Operators) · Target {activeLineDesign.targetHourlyOutput} pcs/hr @ {activeLineDesign.plannedEfficiency}% Planned Efficiency (Pitch: {activeLineDesign.designedPitchSecs ? activeLineDesign.designedPitchSecs.toFixed(1) : "—"}s)
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
              <span className="text-xs font-mono font-bold text-slate-700">({(totalLineSMVSecs / 60).toFixed(2)} min SAM)</span>
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
              <span className="text-xs font-mono font-bold text-slate-700">({(totalLineSMVSecs / 60).toFixed(2)} min SAM)</span>
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
                <th className="py-3.5 px-5 w-80 bg-blue-50/30 whitespace-nowrap">
                  <div className="flex items-center justify-between gap-2">
                    <span>Manpower Allocation</span>
                    <button
                      type="button"
                      onClick={() => handleAutoAssignOperators(false)}
                      disabled={stations.length === 0 || autoAssigning}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10.5px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      title="Auto-assign available operators based on required skill rating and availability"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{autoAssigning ? "Assigning..." : "Auto-Assign"}</span>
                    </button>
                  </div>
                </th>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {row.operationName}
                          </span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-mono font-bold">
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
                      <div className="relative w-full max-w-[145px] mx-auto space-y-1.5">
                        <div className="relative">
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
                                if (req === "3_PLUS") return { r, gap: r < 3 };
                                if (req === "4_PLUS") return { r, gap: r < 4 };
                                return { r, gap: r < Number(req) };
                              });

                              const hasGap = skillChecks.some(c => c.gap);
                              if (hasGap) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs"
                                    title="One or more assigned operators do not meet the required skill rating for this operation"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Skill Deficit</span>
                                  </span>
                                );
                              }

                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                                  title="All assigned operators meet or exceed the station's required skill rating"
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
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

                            // Filter out any operator who has already been assigned to another station or another line
                            const availableForSlot = qualifiedOps.filter(op =>
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
                                            <span>Covering via {aff.alternativeOperationName || "Alt Skill"} (★{altRating}, {aff.efficiencyTransferPct}% Eff)</span>
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
          <div className="flex flex-wrap items-center gap-5">
            <span>Total Stations: <strong className="text-[#221912] font-mono">{stations.length}</strong></span>
            <span>Allocated Manpower: <strong className="text-[#221912] font-mono">{totalAllocatedOps} ops</strong></span>
            <span>Planned Manpower: <strong className="text-[#9C5B3C] font-mono">{totalPlannedManpower.toFixed(1)} ops</strong> <span className="text-[11px] text-[#A89F91]">(@ {plannedEfficiency}% Eff)</span></span>
            <span>Theoretical Min: <strong className="text-[#8C7E6E] font-mono">{totalTheoreticalManpower.toFixed(1)} ops</strong></span>
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
        <YamazumiPitchChart
          data={stationMetrics}
          taktTimeSecs={taktTimeSecs}
          designedPitchTimeSecs={designedPitchTimeSecs}
          requiredHourlyTarget={requiredHourlyTarget}
          requiredDesignCapacity={requiredDesignCapacity}
          plannedEfficiency={plannedEfficiency}
          lineBalanceEfficiency={lineBalanceEfficiency}
          totalLineSMVSecs={totalLineSMVSecs}
          onAddOperator={handleAddOperator}
        />
      )}
    </div>
  );
}
