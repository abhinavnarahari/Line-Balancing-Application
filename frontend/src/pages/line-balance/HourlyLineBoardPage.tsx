import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity, Calendar, ChevronLeft, ChevronRight, Search,
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle2,
  Users, BarChart3, X, Check, Download, Award
} from "lucide-react";
import { ordersApi, type Order } from "../../features/orders/api";
import { shiftsApi } from "../../features/shifts/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import type { Shift } from "../../features/shifts/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { exportToExcel } from "../../utils/excel";
import {
  hourlyBoardApi,
  type HourlyBoardResponse,
  type OperationRow,
  type HourCell,
  type HourlyEntryRequest,
} from "../../features/hourly-board/api";

// ─── Status colour helpers ────────────────────────────────────────────────────
function cellBg(status: string) {
  switch (status) {
    case "on_target": return "bg-emerald-50 border-emerald-300 text-emerald-800";
    case "warning":   return "bg-amber-50 border-amber-300 text-amber-800";
    case "behind":    return "bg-orange-50 border-orange-300 text-orange-800";
    case "critical":  return "bg-rose-50 border-rose-300 text-rose-800";
    default:          return "bg-slate-50 border-slate-200 text-slate-400";
  }
}

function cellDot(status: string) {
  switch (status) {
    case "on_target": return "bg-emerald-500";
    case "warning":   return "bg-amber-500";
    case "behind":    return "bg-orange-500";
    case "critical":  return "bg-rose-500";
    default:          return "bg-slate-300";
  }
}

function effColor(eff: number) {
  if (eff >= 90) return "text-emerald-600";
  if (eff >= 75) return "text-amber-600";
  if (eff >= 50) return "text-orange-600";
  if (eff > 0)   return "text-rose-600";
  return "text-slate-400";
}

// ─── Inline Cell Entry Modal ─────────────────────────────────────────────────
interface CellEntryModalProps {
  row: OperationRow;
  cell: HourCell;
  linePlanId: number;
  logDate: string;
  onClose: () => void;
  onSaved: (updated: HourCell) => void;
}

function CellEntryModal({ row, cell, linePlanId, logDate, onClose, onSaved }: CellEntryModalProps) {
  const [actualQty, setActualQty] = useState(String(cell.actualQty || ""));
  const [goodQty, setGoodQty] = useState(String(cell.goodQty || ""));
  const [rejectQty, setRejectQty] = useState(String(cell.rejectQty || ""));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleActualChange = (v: string) => {
    setActualQty(v);
    const a = Number(v) || 0;
    const g = Number(goodQty) || 0;
    if (g === 0 && a > 0) { setGoodQty(v); setRejectQty("0"); }
    else if (g > a) { setGoodQty(v); setRejectQty("0"); }
    else { setRejectQty(String(Math.max(0, a - g))); }
  };

  const handleGoodChange = (v: string) => {
    setGoodQty(v);
    const a = Number(actualQty) || 0;
    const g = Number(v) || 0;
    setRejectQty(String(Math.max(0, a - g)));
  };

  const handleSave = async () => {
    const actual = Number(actualQty) || 0;
    if (actual <= 0) { setError("Actual quantity must be > 0"); return; }
    if (!row.operatorId) { setError("Please assign an operator to this operation first"); return; }
    setSaving(true); setError("");
    try {
      const req: HourlyEntryRequest = {
        linePlanId,
        operationId: row.operationId,
        operatorId: row.operatorId,
        logDate,
        shiftHour: cell.shiftHour,
        hourStartTime: cell.startTime,
        hourEndTime: cell.endTime,
        targetQty: cell.targetQty,
        actualQty: actual,
        goodQty: Number(goodQty) || actual,
        rejectQty: Number(rejectQty) || 0,
        samMinutes: row.samMinutes,
        notes: notes || undefined,
      };
      const saved = await hourlyBoardApi.saveEntry(req);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const actualNum = Number(actualQty) || 0;
  const liveEff = cell.targetQty > 0 ? Math.round((actualNum * 100.0 / cell.targetQty) * 10.0) / 10.0 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                {row.operationCode}
              </span>
              <span className="text-[11px] font-bold text-slate-500">Hour {cell.shiftHour} ({cell.startTime}–{cell.endTime})</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{row.operationName}</h3>
            {row.operatorName ? (
              <p className="text-xs text-slate-500 mt-0.5">Operator: <strong className="text-slate-800">{row.operatorName}</strong> ({row.operatorEmployeeId})</p>
            ) : (
              <p className="text-xs text-rose-600 font-semibold mt-0.5">⚠ No Operator Assigned</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Target vs Actual Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Hour Target</span>
              <span className="font-mono font-bold text-base text-slate-900">{cell.targetQty} pcs</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Live Efficiency</span>
              <span className={`font-mono font-bold text-base ${effColor(liveEff)}`}>
                {liveEff}%
              </span>
            </div>
          </div>

          {/* Actual Quantity Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Actual Output Quantity (pcs) *
            </label>
            <input
              type="number"
              min="0"
              value={actualQty}
              onChange={e => handleActualChange(e.target.value)}
              placeholder="e.g. 55"
              autoFocus
              className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          {/* Good vs Reject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-emerald-700 block mb-1">Good Pieces</label>
              <input
                type="number"
                min="0"
                value={goodQty}
                onChange={e => handleGoodChange(e.target.value)}
                className="w-full h-10 bg-white border border-emerald-200 rounded-xl px-3 text-xs font-bold font-mono text-emerald-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-rose-700 block mb-1">Rejects / Rework</label>
              <input
                type="number"
                min="0"
                value={rejectQty}
                onChange={e => setRejectQty(e.target.value)}
                className="w-full h-10 bg-white border border-rose-200 rounded-xl px-3 text-xs font-bold font-mono text-rose-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Notes / Downtime Reason (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Needle break, thread tension issue"
              className="w-full h-9 bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Output
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Hourly Line Board Page ─────────────────────────────────────────────
export function HourlyLineBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>("" );
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [board, setBoard] = useState<HourlyBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<{ row: OperationRow; cell: HourCell } | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Load masters on mount
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [ords, shfts, oprs, lns] = await Promise.all([
          ordersApi.getOrders(),
          shiftsApi.getShifts(),
          operatorsApi.getOperators(),
          linesApi.getLines(true).catch(() => []),
        ]);
        setOrders(ords);
        setOperators(oprs.filter(o => o.active));
        setLines(lns || []);

        const activeShifts = shfts.filter(s => s.active);
        setShifts(activeShifts);

        if (ords.length > 0) setSelectedOrderId(String(ords[0].id));
        if (activeShifts.length > 0) setSelectedShiftId(String(activeShifts[0].id));
        if (lns && lns.length > 0) setSelectedLineId(String(lns[0].id));
      } catch (err) {
        console.error("Failed to load initial masters:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMasters();
  }, []);

  // Fetch hourly board whenever order, shift or date changes
  const loadBoard = useCallback(async (orderId: string, shiftId: string, date: string) => {
    if (!orderId || !shiftId) return;
    try {
      const data = await hourlyBoardApi.getBoard({
        orderId: Number(orderId),
        shiftId: Number(shiftId),
        date: date,
      });
      setBoard(data);
    } catch (err) {
      console.error("Failed to load hourly board:", err);
      setBoard(null);
    }
  }, []);

  useEffect(() => {
    if (selectedOrderId && selectedShiftId) {
      loadBoard(selectedOrderId, selectedShiftId, logDate);
    }
  }, [selectedOrderId, selectedShiftId, logDate, loadBoard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBoard(selectedOrderId, selectedShiftId, logDate);
    setRefreshing(false);
  };

  const stepDate = (days: number) => {
    const d = new Date(logDate);
    d.setDate(d.getDate() + days);
    setLogDate(d.toISOString().split("T")[0]);
  };

  const handleOperatorChange = async (operationId: number, operatorIdStr: string) => {
    if (!board) return;
    const operatorId = operatorIdStr ? Number(operatorIdStr) : undefined;
    const opObj = operators.find(o => String(o.id) === operatorIdStr);

    try {
      await hourlyBoardApi.assignOperator(board.linePlanId, operationId, operatorId);
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map(r =>
            r.operationId === operationId
              ? {
                  ...r,
                  operatorId: opObj ? Number(opObj.id) : undefined,
                  operatorName: opObj ? opObj.name : undefined,
                  operatorEmployeeId: opObj ? opObj.employeeId : undefined,
                }
              : r
          ),
        };
      });
    } catch (err) {
      console.error("Failed to assign operator:", err);
    }
  };

  const handleCellSaved = (row: OperationRow, shiftHour: number, updatedCell: HourCell) => {
    setBoard(prev => {
      if (!prev) return prev;
      const updatedRows = prev.rows.map(r => {
        if (r.operationId === row.operationId) {
          const updatedHours = { ...r.hours, [shiftHour]: updatedCell };
          const actualTotal = Object.values(updatedHours).reduce((sum, h) => sum + (h.actualQty || 0), 0);
          const goodTotal = Object.values(updatedHours).reduce((sum, h) => sum + (h.goodQty || 0), 0);
          const rejectTotal = Object.values(updatedHours).reduce((sum, h) => sum + (h.rejectQty || 0), 0);
          const eff = r.totalTarget > 0 ? Math.round((actualTotal * 100.0 / r.totalTarget) * 10.0) / 10.0 : 0;
          return {
            ...r,
            hours: updatedHours,
            totalActual: actualTotal,
            totalGood: goodTotal,
            totalReject: rejectTotal,
            efficiencyPercent: eff,
          };
        }
        return r;
      });

      const totalActualAll = updatedRows.reduce((sum, r) => sum + r.totalActual, 0);
      const totalTargetAll = updatedRows.reduce((sum, r) => sum + r.totalTarget, 0);
      const lineEff = totalTargetAll > 0 ? Math.round((totalActualAll * 100.0 / totalTargetAll) * 10.0) / 10.0 : 0;
      const onTarget = updatedRows.filter(r => r.totalActual >= r.totalTarget && r.totalTarget > 0).length;

      return {
        ...prev,
        rows: updatedRows,
        totalActualOutput: totalActualAll,
        lineEfficiencyPercent: lineEff,
        operationsOnTarget: onTarget,
        operationsBehind: updatedRows.length - onTarget,
      };
    });
  };

  // ─── IE Production & DHU Calculations ─────────────────────────────────────
  const totalEarnedMinutes = useMemo(() => {
    if (!board) return 0;
    return board.rows.reduce((sum, r) => sum + (r.totalGood * (r.samMinutes || 0)), 0);
  }, [board]);

  const totalRejects = useMemo(() => {
    if (!board) return 0;
    return board.rows.reduce((sum, r) => sum + r.totalReject, 0);
  }, [board]);

  const totalGoodPieces = useMemo(() => {
    if (!board) return 0;
    return board.rows.reduce((sum, r) => sum + r.totalGood, 0);
  }, [board]);

  const lineDhu = useMemo(() => {
    if (!board || board.totalActualOutput === 0) return 0;
    return Math.round((totalRejects * 100.0 / board.totalActualOutput) * 100) / 100;
  }, [board, totalRejects]);

  const sortedOperators = useMemo(() => {
    if (!board) return [];
    return [...board.rows]
      .filter(r => r.operatorName && r.totalActual > 0)
      .sort((a, b) => b.efficiencyPercent - a.efficiencyPercent);
  }, [board]);

  const handleExportSummary = () => {
    if (!board) return;
    const data = board.rows.map(r => ({
      "Seq #": r.sequence,
      "Operation Code": r.operationCode,
      "Operation Name": r.operationName,
      "Assigned Operator": r.operatorName ? `${r.operatorName} (${r.operatorEmployeeId})` : "Unassigned",
      "SMV (min)": r.samMinutes?.toFixed(2) || "0.00",
      "Target Qty (pcs)": r.totalTarget,
      "Actual Qty (pcs)": r.totalActual,
      "Good Qty (pcs)": r.totalGood,
      "Reject Qty (pcs)": r.totalReject,
      "Earned Minutes": (r.totalGood * (r.samMinutes || 0)).toFixed(1),
      "Realized Efficiency %": `${r.efficiencyPercent}%`,
    }));

    exportToExcel(
      data,
      `Hourly_Line_Board_${logDate}_Shift_${selectedShiftId}`
    );
  };

  const filteredRows = (board?.rows || []).filter(r =>
    !searchQuery ||
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.operatorName && r.operatorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.operationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hourCols: Array<{ slot: number; label: string }> = [];
  if (board && board.rows.length > 0) {
    const sample = board.rows[0];
    const hours = Object.values(sample.hours);
    hours.sort((a, b) => a.shiftHour - b.shiftHour);
    hours.forEach(h => hourCols.push({ slot: h.shiftHour, label: h.startTime }));
  }

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#F6F1E8] text-[#221912]">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9C5B3C] to-[#8B5E3C] flex items-center justify-center shadow-md shadow-[#9C5B3C]/20 text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#221912]">Hourly Operation & Performance Board</h1>
              <p className="text-xs text-[#8C7E6E]">
                Live shopfloor monitoring: operator pace, earned standard minutes, defects & line DHU
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            disabled={!board}
            className="h-9 px-3.5 rounded-xl border border-[#9C5B3C] bg-[#9C5B3C] text-white hover:bg-[#8B5E3C] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Award className="w-3.5 h-3.5" />
            End-of-Shift Summary
          </button>

          <button
            onClick={handleExportSummary}
            disabled={!board || board.rows.length === 0}
            className="h-9 px-3.5 rounded-xl border border-[#E6DDCE] bg-white text-[#221912] hover:bg-[#F6F1E8] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#8C7E6E]" />
            Export Report
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-xl border border-[#E6DDCE] bg-white text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#9C5B3C]" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Controls Row ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
        {/* Sewing Line select */}
        {lines.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8C7E6E]">Line:</span>
            <select
              value={selectedLineId}
              onChange={e => setSelectedLineId(e.target.value)}
              className="h-9 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] cursor-pointer"
            >
              {lines.map(l => (
                <option key={l.id} value={l.id}>{l.lineCode} · {l.lineName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Order select */}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#9C5B3C]" />
          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="h-9 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] cursor-pointer"
          >
            <option value="">— Select Order —</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{o.orderNo} {o.buyer ? `· ${o.buyer}` : ""}</option>
            ))}
          </select>
        </div>

        {/* Shift pills */}
        <div className="flex items-center gap-1 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
          {shifts.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedShiftId(String(s.id))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedShiftId === String(s.id)
                  ? "bg-[#9C5B3C] text-white shadow-xs"
                  : "text-[#8C7E6E] hover:text-[#221912]"
              }`}
            >
              {s.shiftName}
            </button>
          ))}
        </div>

        {/* Date stepper */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => stepDate(-1)} className="h-9 w-9 rounded-xl border border-[#E6DDCE] bg-white flex items-center justify-center text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-[#9C5B3C] pointer-events-none" />
            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
              className="h-9 pl-8 pr-3 bg-white border border-[#E6DDCE] rounded-xl text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C]" />
          </div>
          <button type="button" onClick={() => stepDate(1)} className="h-9 w-9 rounded-xl border border-[#E6DDCE] bg-white flex items-center justify-center text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C7E6E] pointer-events-none" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search operation, code or operator…"
            className="w-full h-9 pl-8 pr-3 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-none focus:border-[#9C5B3C]" />
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      {board && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Realized Efficiency",
              value: `${board.lineEfficiencyPercent}%`,
              sub: `${board.operationsOnTarget} / ${board.rows.length} stations on pace`,
              icon: TrendingUp,
              color: board.lineEfficiencyPercent >= 80 ? "text-[#77876F] bg-[#F3F5F2] border-[#d4decb]"
                   : board.lineEfficiencyPercent >= 60 ? "text-[#b45309] bg-[#fffbeb] border-[#fde68a]"
                   : "text-[#221912] bg-white border-[#E6DDCE]",
            },
            {
              label: "Earned Minutes (IE)",
              value: `${totalEarnedMinutes.toFixed(1)}m`,
              sub: `SMV × Good Output`,
              icon: Activity,
              color: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
              label: "Total Good Output",
              value: `${totalGoodPieces} / ${board.totalTargetOutput}`,
              sub: `${board.totalActualOutput} total inspected`,
              icon: CheckCircle2,
              color: "text-[#9C5B3C] bg-[#F6F1E8] border-[#E6DDCE]",
            },
            {
              label: "Defect Rate / DHU",
              value: `${lineDhu}%`,
              sub: `${totalRejects} rejected pieces`,
              icon: AlertTriangle,
              color: lineDhu > 3 ? "text-rose-700 bg-rose-50 border-rose-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
            },
            {
              label: "Bottlenecks Behind",
              value: `${board.operationsBehind}`,
              sub: board.operationsBehind > 0 ? "Requires floater support" : "Line flowing smoothly",
              icon: AlertTriangle,
              color: board.operationsBehind > 0 ? "text-rose-700 bg-rose-50 border-rose-200" : "text-slate-600 bg-white border-slate-200",
            },
          ].map((kpi, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${kpi.color} shadow-xs flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider opacity-75">{kpi.label}</span>
                <kpi.icon className="w-4 h-4 opacity-80" />
              </div>
              <div className="my-2">
                <span className="text-xl font-bold font-mono block">{kpi.value}</span>
                <span className="text-[10.5px] opacity-75 block">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Matrix Table ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-semibold">Loading hourly board…</p>
          </div>
        ) : !board || board.rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-600">No operations found for this line plan.</p>
            <p className="text-[11px] text-slate-400 mt-1">Make sure you have created a line plan or operation bulletin for this order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: `${540 + hourCols.length * 75}px` }}>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 w-48">Operation</th>
                  <th className="p-3 w-52">Operator</th>
                  <th className="p-3 w-16 text-center">SMV</th>
                  <th className="p-3 w-16 text-center">Target</th>
                  {hourCols.map(col => (
                    <th key={col.slot} className="p-2 text-center text-[10px] font-bold text-slate-600 border-l border-slate-100">
                      <div>H{col.slot}</div>
                      <div className="text-[9px] font-normal text-slate-400 font-mono">{col.label}</div>
                    </th>
                  ))}
                  <th className="p-3 w-20 text-center border-l border-slate-200 bg-slate-50 font-bold">Total</th>
                  <th className="p-3 w-20 text-center bg-slate-50 font-bold">Eff %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map((row) => (
                  <tr key={row.operationId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sequence */}
                    <td className="p-3 text-center font-mono font-bold text-slate-500 text-xs">
                      {row.sequence}
                    </td>

                    {/* Operation */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900 truncate max-w-[180px]" title={row.operationName}>
                        {row.operationName}
                      </div>
                      <div className="text-[10px] text-blue-600 font-mono font-semibold">{row.operationCode}</div>
                    </td>

                    {/* Operator selector */}
                    <td className="p-3">
                      <select
                        value={row.operatorId || ""}
                        onChange={e => handleOperatorChange(row.operationId, e.target.value)}
                        className={`w-full h-8 px-2 text-xs font-semibold rounded-lg border focus:outline-none focus:border-blue-500 cursor-pointer ${
                          row.operatorId
                            ? "bg-white border-slate-200 text-slate-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        <option value="">— Unassigned —</option>
                        {operators.map(op => (
                          <option key={op.id} value={op.id}>
                            {op.employeeId} · {op.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* SAM */}
                    <td className="p-3 text-center font-mono text-slate-700 text-xs">
                      {row.samMinutes?.toFixed(2) || "—"}
                    </td>

                    {/* Shift Target */}
                    <td className="p-3 text-center font-mono font-bold text-slate-900 text-xs">
                      {row.totalTarget}
                    </td>

                    {/* Hourly Output Cells */}
                    {hourCols.map(col => {
                      const cell: HourCell = row.hours[col.slot] || {
                        entryId: null,
                        shiftHour: col.slot,
                        startTime: col.label,
                        endTime: "",
                        targetQty: Math.round(row.totalTarget / hourCols.length),
                        actualQty: 0,
                        goodQty: 0,
                        rejectQty: 0,
                        efficiencyPercent: 0,
                        status: "empty",
                      };

                      const hasEntry = cell.actualQty !== undefined && cell.actualQty > 0;

                      return (
                        <td key={col.slot} className="p-1.5 text-center border-l border-slate-100">
                          <button
                            type="button"
                            onClick={() => setActiveModal({ row, cell })}
                            className={`w-full py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[38px] ${
                              hasEntry
                                ? cellBg(cell.status)
                                : "bg-slate-50 border-slate-200/80 text-slate-400 hover:border-blue-300 hover:bg-blue-50/20"
                            }`}
                          >
                            {hasEntry ? (
                              <>
                                <span className="font-mono font-bold text-xs leading-none">
                                  {cell.actualQty}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cellDot(cell.status)}`} />
                                  <span className="text-[9px] font-mono leading-none opacity-80">
                                    {cell.efficiencyPercent}%
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono opacity-50">+</span>
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Total Actual */}
                    <td className="p-3 text-center border-l border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-900 text-xs">
                      {row.totalActual}
                    </td>

                    {/* Row Efficiency */}
                    <td className={`p-3 text-center bg-slate-50/50 font-mono font-bold text-xs ${effColor(row.efficiencyPercent)}`}>
                      {row.efficiencyPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Cell Entry Modal ──────────────────────────────────────── */}
      {activeModal && board && (
        <CellEntryModal
          row={activeModal.row}
          cell={activeModal.cell}
          linePlanId={board.linePlanId}
          logDate={logDate}
          onClose={() => setActiveModal(null)}
          onSaved={updated => {
            handleCellSaved(activeModal.row, activeModal.cell.shiftHour, updated);
          }}
        />
      )}

      {/* ── End-of-Shift Performance Summary Modal ────────────────── */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title={`End-of-Shift Line Performance Summary (${logDate})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-center">
              <span className="text-[10.5px] font-bold text-[#8C7E6E] uppercase block">Line Efficiency</span>
              <span className="text-2xl font-black font-mono text-[#221912] mt-1 block">
                {board?.lineEfficiencyPercent}%
              </span>
            </div>
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <span className="text-[10.5px] font-bold text-blue-700 uppercase block">Earned Standard Mins</span>
              <span className="text-2xl font-black font-mono text-blue-900 mt-1 block">
                {totalEarnedMinutes.toFixed(1)}m
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10.5px] font-bold text-emerald-700 uppercase block">Good Garments</span>
              <span className="text-2xl font-black font-mono text-emerald-900 mt-1 block">
                {totalGoodPieces} pcs
              </span>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-[10.5px] font-bold text-rose-700 uppercase block">Line DHU Rate</span>
              <span className="text-2xl font-black font-mono text-rose-900 mt-1 block">
                {lineDhu}%
              </span>
            </div>
          </div>

          {/* Top Star Performers vs Bottleneck Assistance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Top Operator Performers</span>
              </h4>
              {sortedOperators.slice(0, 3).length > 0 ? (
                <div className="space-y-1.5">
                  {sortedOperators.slice(0, 3).map((op, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{op.operatorName}</span>
                        <span className="text-[10px] text-slate-400 block">{op.operationName}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {op.efficiencyPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No output logged yet</p>
              )}
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Operations Needing Assistance</span>
              </h4>
              {sortedOperators.filter(o => o.efficiencyPercent < 75).slice(-3).reverse().length > 0 ? (
                <div className="space-y-1.5">
                  {sortedOperators.filter(o => o.efficiencyPercent < 75).slice(-3).reverse().map((op, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{op.operationName}</span>
                        <span className="text-[10px] text-slate-400 block">{op.operatorName || "Unassigned"}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {op.efficiencyPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-semibold">✓ All operations performing at or above target pace</p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Logged Date: <strong>{logDate}</strong> · Shift Target: <strong>{board?.totalTargetOutput || 0} pcs</strong>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSummaryModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleExportSummary}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Excel Summary
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
