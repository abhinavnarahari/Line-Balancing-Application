import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { 
  X, 
  Sparkles, 
  Sliders, 
  Clock, 
  Cpu, 
  Copy, 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Tag,
  Users
} from "lucide-react";
import type { OperationBulletin, BulletinStatus } from "./api";
import { bulletinsApi } from "./api";

interface BulletinDetailModalProps {
  bulletin: OperationBulletin | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (bulletin: OperationBulletin) => void;
  onClone: (bulletin: OperationBulletin) => void;
  onDelete: (bulletin: OperationBulletin) => void;
  onRefresh: () => void;
}

export function BulletinDetailModal({
  bulletin,
  isOpen,
  onClose,
  onEdit,
  onClone,
  onDelete,
  onRefresh,
}: BulletinDetailModalProps) {
  const [targetManpower, setTargetManpower] = useState<number>(30);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // 1. Industrial Engineering Metrics Calculations
  const metrics = useMemo(() => {
    if (!bulletin || !bulletin.lines) {
      return {
        totalSmv: 0,
        bottleneckLine: null,
        machineCounts: {} as Record<string, number>,
        avgSkill: 0,
        skillDist: {} as Record<number, number>,
      };
    }

    const totalSmv = bulletin.lines.reduce((acc, l) => acc + (Number(l.smv) || 0), 0);

    // Bottleneck operation (highest SMV)
    let bottleneckLine = bulletin.lines[0] || null;
    bulletin.lines.forEach(l => {
      if ((l.smv || 0) > (bottleneckLine?.smv || 0)) {
        bottleneckLine = l;
      }
    });

    // Machine counts breakdown
    const machineCounts: Record<string, number> = {};
    bulletin.lines.forEach(l => {
      const m = (l.machineType || "Single Needle Lockstitch").trim();
      machineCounts[m] = (machineCounts[m] || 0) + 1;
    });

    // Skill distribution & Average
    let skillSum = 0;
    const skillDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    bulletin.lines.forEach(l => {
      const r = Number(l.skillRatingRequired) || 3;
      skillSum += r;
      skillDist[r] = (skillDist[r] || 0) + 1;
    });
    const avgSkill = bulletin.lines.length > 0 ? (skillSum / bulletin.lines.length).toFixed(1) : "3.0";

    return {
      totalSmv,
      bottleneckLine,
      machineCounts,
      avgSkill,
      skillDist,
    };
  }, [bulletin]);

  // 2. Theoretical Hourly Output Calculations based on Manpower
  const hourlyOutput = useMemo(() => {
    const smv = metrics.totalSmv;
    if (smv <= 0 || targetManpower <= 0) return { eff100: 0, eff85: 0, eff70: 0, eff60: 0, taktSec: "0.0" };

    const totalAvailableMinutesPerHour = 60 * targetManpower;
    const eff100 = Math.round(totalAvailableMinutesPerHour / smv);
    const eff85 = Math.round((totalAvailableMinutesPerHour * 0.85) / smv);
    const eff70 = Math.round((totalAvailableMinutesPerHour * 0.70) / smv);
    const eff60 = Math.round((totalAvailableMinutesPerHour * 0.60) / smv);

    const taktSec = eff85 > 0 ? (3600 / eff85).toFixed(1) : "0.0";

    return { eff100, eff85, eff70, eff60, taktSec };
  }, [metrics.totalSmv, targetManpower]);

  if (!isOpen || !bulletin || !mounted) return null;

  // Handle Status Switch
  const handleStatusChange = async (newStatus: BulletinStatus) => {
    if (!bulletin.id) return;
    setUpdatingStatus(true);
    try {
      await bulletinsApi.updateStatus(bulletin.id, newStatus);
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Export Formatted IE Excel Sheet
  const handleExportExcel = () => {
    if (!bulletin) return;

    const rows = (bulletin.lines || []).map(l => {
      const smvVal = Number(l.smv) || 0;
      const pctShare = metrics.totalSmv > 0 ? ((smvVal / metrics.totalSmv) * 100).toFixed(1) + "%" : "0%";
      return {
        "Seq #": l.sequence,
        "Operation Code": l.operationCode || `OP-${l.operationId}`,
        "Operation Name": l.operationName || `Operation ${l.operationId}`,
        "Machine Type": l.machineType || "Single Needle",
        "SMV (min)": smvVal,
        "% Work Share": pctShare,
        "Skill Required": `L${l.skillRatingRequired || 3}`,
        "Notes & Quality Points": l.notes || "—",
      };
    });

    const summaryRows = [
      { "Seq #": "", "Operation Code": "TOTAL GARMENT SMV", "Operation Name": "", "Machine Type": "", "SMV (min)": Number(metrics.totalSmv.toFixed(3)), "% Work Share": "100%", "Skill Required": `Avg L${metrics.avgSkill}`, "Notes & Quality Points": "" },
      { "Seq #": "", "Operation Code": "BOTTLENECK OPERATION", "Operation Name": metrics.bottleneckLine?.operationName || "—", "Machine Type": metrics.bottleneckLine?.machineType || "—", "SMV (min)": metrics.bottleneckLine?.smv || 0, "% Work Share": "", "Skill Required": "", "Notes & Quality Points": "Critical Pace Constraint" },
      { "Seq #": "", "Operation Code": "EST. HOURLY TARGET (85% Eff)", "Operation Name": `${hourlyOutput.eff85} pcs/hr with ${targetManpower} operators`, "Machine Type": "", "SMV (min)": "", "% Work Share": "", "Skill Required": "", "Notes & Quality Points": `Takt Time: ${hourlyOutput.taktSec}s` },
    ];

    const allRows = [...rows, {}, ...summaryRows];

    const ws = XLSX.utils.json_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operation Bulletin");
    XLSX.writeFile(wb, `OB_${bulletin.bulletinCode}_v${bulletin.version}.xlsx`);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-[#F6F1E8] rounded-3xl border border-[#E6DDCE] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── 1. Header Bar ────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#E6DDCE] px-6 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] rounded-lg shadow-2xs">
                {bulletin.bulletinCode}
              </span>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                v{bulletin.version}
              </span>
              <div className="relative inline-flex items-center">
                <select
                  value={bulletin.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as BulletinStatus)}
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-hidden transition-all shadow-2xs ${
                    bulletin.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : bulletin.status === "ARCHIVED"
                        ? "bg-slate-100 text-slate-600 border-slate-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  <option value="DRAFT">DRAFT (In Engineering)</option>
                  <option value="PUBLISHED">PUBLISHED (Active on Floor)</option>
                  <option value="ARCHIVED">ARCHIVED (Retired)</option>
                </select>
              </div>
            </div>

            <h2 className="text-lg font-black text-[#221912]">{bulletin.name}</h2>
            {bulletin.description && (
              <p className="text-xs text-[#8C7E6E] font-medium">{bulletin.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] border border-transparent hover:border-[#E6DDCE] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 2. Scrollable Body ────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          
          {/* Executive IE Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Garment SMV */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total SMV
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#9C5B3C]">
                  {metrics.totalSmv.toFixed(2)}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold font-mono">min</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                {bulletin.lines?.length || 0} sequential operations
              </p>
            </div>

            {/* Bottleneck Operation */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Bottleneck Step
              </span>
              <div className="mt-1.5">
                <span className="text-xs sm:text-sm font-bold text-[#221912] line-clamp-1" title={metrics.bottleneckLine?.operationName}>
                  {metrics.bottleneckLine?.operationName || "—"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-black text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    {metrics.bottleneckLine?.smv || 0} min
                  </span>
                  <span className="text-[10.5px] text-[#8C7E6E] truncate max-w-[90px]">
                    {metrics.bottleneckLine?.machineType}
                  </span>
                </div>
              </div>
            </div>

            {/* Unique Machine Count */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Machine Types
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-700">
                  {Object.keys(metrics.machineCounts).length}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold">types</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                {bulletin.lines?.length || 0} total machine stations
              </p>
            </div>

            {/* Average Skill Rating */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Avg Skill Required
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                  L{metrics.avgSkill}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold font-mono">/ 5.0</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                Standard Matrix Level
              </p>
            </div>
          </div>

          {/* Theoretical Hourly Target Pace Calculator */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E6DDCE] pb-2.5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#221912] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#9C5B3C]" />
                  Theoretical Hourly Output Pace Calculator
                </h3>
                <p className="text-[10.5px] text-[#8C7E6E] mt-0.5">
                  Formula: Output = (60 × Operators × Efficiency) / Total SMV
                </p>
              </div>

              {/* Manpower Slider / Input */}
              <div className="flex items-center gap-2 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
                <Users className="w-3.5 h-3.5 text-[#8C7E6E] ml-1.5" />
                <span className="text-xs font-bold text-[#8C7E6E]">Line Manpower:</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={targetManpower}
                  onChange={(e) => setTargetManpower(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 px-2 py-0.5 bg-white border border-[#E6DDCE] rounded-lg text-xs font-mono font-bold text-[#221912] text-center focus:outline-hidden focus:border-[#9C5B3C]"
                />
                <span className="text-xs text-[#8C7E6E] font-bold mr-1">ops</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-[#FEFCF9] border border-[#E6DDCE] rounded-xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-[#8C7E6E]">100% Efficiency</span>
                <p className="text-xl font-black font-mono text-[#221912] mt-0.5">{hourlyOutput.eff100} <span className="text-[10px] text-[#8C7E6E] font-normal">pcs/hr</span></p>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-emerald-800">85% (Expected)</span>
                <p className="text-xl font-black font-mono text-emerald-800 mt-0.5">{hourlyOutput.eff85} <span className="text-[10px] text-emerald-600 font-normal">pcs/hr</span></p>
              </div>
              <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-sky-800">70% Efficiency</span>
                <p className="text-xl font-black font-mono text-sky-800 mt-0.5">{hourlyOutput.eff70} <span className="text-[10px] text-sky-600 font-normal">pcs/hr</span></p>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-amber-800">60% Ramp-Up</span>
                <p className="text-xl font-black font-mono text-amber-800 mt-0.5">{hourlyOutput.eff60} <span className="text-[10px] text-amber-600 font-normal">pcs/hr</span></p>
              </div>
            </div>
          </div>

          {/* Machine Inventory & Linked Styles Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Machine Inventory Breakdown */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#9C5B3C]" />
                Machine Floor Allocation Requirements
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {Object.entries(metrics.machineCounts).map(([machine, count]) => (
                  <div key={machine} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] text-xs font-bold text-[#221912]">
                    <span>{machine}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#9C5B3C] text-white text-[10px] font-mono font-black">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Styles */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#9C5B3C]" />
                Linked Garment Styles
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(bulletin.styles || []).map(style => (
                  <div key={style.id} className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] text-xs">
                    <span className="font-mono font-bold text-[#9C5B3C]">{style.styleNo}</span>
                    {style.buyer && (
                      <span className="text-[10px] text-[#8C7E6E] font-medium border-l border-[#E6DDCE] pl-1">
                        {style.buyer}
                      </span>
                    )}
                  </div>
                ))}
                {(!bulletin.styles || bulletin.styles.length === 0) && (
                  <p className="text-xs text-[#8C7E6E] italic">No styles linked yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Complete Sequential Operations Table */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F9F7F4] border-b border-[#E6DDCE] flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#221912]">
                Operation Sequence &amp; Standard Work Content ({bulletin.lines?.length || 0} Steps)
              </h3>
              <span className="text-xs font-mono font-bold text-[#9C5B3C] bg-white px-2 py-0.5 rounded-lg border border-[#E6DDCE]">
                TOTAL: {metrics.totalSmv.toFixed(2)} min
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6DDCE] bg-[#FDFCFB] text-[10.5px] font-bold text-[#8C7E6E] uppercase">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-28">Code</th>
                    <th className="py-2.5 px-4">Operation Description</th>
                    <th className="py-2.5 px-4 w-40">Machine Type</th>
                    <th className="py-2.5 px-3 w-24 text-right">SMV (min)</th>
                    <th className="py-2.5 px-3 w-24 text-center">% Work</th>
                    <th className="py-2.5 px-3 w-20 text-center">Skill</th>
                    <th className="py-2.5 px-4">Notes / Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDCE]">
                  {(bulletin.lines || []).map((line) => {
                    const isBottleneck = metrics.bottleneckLine?.id === line.id || (line.smv === metrics.bottleneckLine?.smv && (line.smv || 0) > 0);
                    const smvVal = Number(line.smv) || 0;
                    const pctShare = metrics.totalSmv > 0 ? (smvVal / metrics.totalSmv) * 100 : 0;

                    return (
                      <tr
                        key={line.id || line.sequence}
                        className={`hover:bg-[#FFFDFB] transition-colors ${
                          isBottleneck ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#8C7E6E]">
                          {line.sequence}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-[#9C5B3C] bg-[#F6F1E8] px-2 py-0.5 rounded border border-[#E6DDCE]">
                            {line.operationCode || `OP-${line.operationId}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-[#221912] flex items-center gap-1.5">
                            <span>{line.operationName || `Operation ${line.operationId}`}</span>
                            {isBottleneck && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                Bottleneck
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-700">
                          {line.machineType || "Single Needle"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#221912]">
                          {smvVal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${isBottleneck ? "bg-amber-500" : "bg-[#9C5B3C]"}`}
                                style={{ width: `${Math.min(100, pctShare * 2.5)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-[#8C7E6E] w-8 text-right">
                              {pctShare.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono font-extrabold text-[10.5px] px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                            L{line.skillRatingRequired || 3}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#8C7E6E] text-[11px] italic">
                          {line.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 3. Footer Actions Bar ────────────────────────────────────── */}
        <div className="bg-white border-t border-[#E6DDCE] px-6 py-3.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(bulletin)}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Bulletin</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold border border-[#E6DDCE] rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel (IE Sheet)</span>
            </button>

            <button
              type="button"
              onClick={() => onClone(bulletin)}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold border border-[#E6DDCE] rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Duplicate / Clone</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(bulletin)}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F6F1E8] text-[#221912] text-xs font-bold border border-[#E6DDCE] rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#9C5B3C]" />
              <span>Edit Bulletin</span>
            </button>

            <Link
              to={`/line-balance?bulletinId=${bulletin.id}`}
              className="px-3.5 py-1.5 bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#9C5B3C]/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Open in Line Balancing</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
