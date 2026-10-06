import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { 
  X, 
  Clock, 
  Cpu, 
  Copy, 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  ArrowRight,
  Tag,
  Layers,
  ShieldCheck,
  Sliders
} from "lucide-react";
import type { OperationBulletin, BulletinStatus } from "./api";
import { bulletinsApi } from "./api";
import { GARMENT_SECTIONS } from "./BulletinForm";

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
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveSectionFilter("ALL");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Work content metrics matching what is created in BulletinForm
  const metrics = useMemo(() => {
    if (!bulletin || !bulletin.lines) {
      return {
        totalSmv: 0,
        totalSmvSec: 0,
        machineCounts: {} as Record<string, number>,
        avgSkill: "3.0",
        sectionMetrics: {} as Record<string, { count: number; smvMin: number; smvSec: number }>,
      };
    }

    const totalSmv = bulletin.lines.reduce((acc, l) => acc + (Number(l.smv) || 0), 0);
    const totalSmvSec = totalSmv * 60;

    // Distinct machine types
    const machineCounts: Record<string, number> = {};
    bulletin.lines.forEach(l => {
      const m = (l.machineType || "Single Needle Lockstitch").trim();
      machineCounts[m] = (machineCounts[m] || 0) + 1;
    });

    // Skill average
    let skillSum = 0;
    bulletin.lines.forEach(l => {
      const r = Number(l.skillRatingRequired) || 3;
      skillSum += r;
    });
    const avgSkill = bulletin.lines.length > 0 ? (skillSum / bulletin.lines.length).toFixed(1) : "3.0";

    // Section distribution
    const sectionMetrics: Record<string, { count: number; smvMin: number; smvSec: number }> = {};
    GARMENT_SECTIONS.forEach(s => {
      sectionMetrics[s.id] = { count: 0, smvMin: 0, smvSec: 0 };
    });
    bulletin.lines.forEach(l => {
      const sec = l.section || "MAIN_ASSEMBLY";
      if (!sectionMetrics[sec]) {
        sectionMetrics[sec] = { count: 0, smvMin: 0, smvSec: 0 };
      }
      sectionMetrics[sec].count += 1;
      sectionMetrics[sec].smvMin += Number(l.smv) || 0;
      sectionMetrics[sec].smvSec += (Number(l.smv) || 0) * 60;
    });

    return {
      totalSmv,
      totalSmvSec,
      machineCounts,
      avgSkill,
      sectionMetrics,
    };
  }, [bulletin]);

  const filteredLines = useMemo(() => {
    if (!bulletin?.lines) return [];
    if (activeSectionFilter === "ALL") return bulletin.lines;
    return bulletin.lines.filter(l => (l.section || "MAIN_ASSEMBLY") === activeSectionFilter);
  }, [bulletin?.lines, activeSectionFilter]);

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
      const secConfig = GARMENT_SECTIONS.find(s => s.id === l.section);
      return {
        "Seq #": l.sequence,
        "Operation Code": l.operationCode || `OP-${l.operationId}`,
        "Operation Name": l.operationName || `Operation ${l.operationId}`,
        "Garment Section": secConfig ? secConfig.label : (l.section || "Main Body Assembly"),
        "Machine Type": l.machineType || "Single Needle",
        "SMV (sec)": Number((smvVal * 60).toFixed(1)),
        "SMV (min)": smvVal,
        "% Work Share": pctShare,
        "Predecessors": l.predecessorIds || "—",
        "WIP Threshold (pcs)": l.wipThreshold ?? 20,
        "Skill Required": `L${l.skillRatingRequired || 3}`,
        "Stitch Type": l.stitchType || "—",
        "Seam Type": l.seamType || "—",
        "Notes & Quality Points": l.notes || "—",
      };
    });

    const summaryRows = [
      { 
        "Seq #": "", 
        "Operation Code": "TOTAL GARMENT SMV (SAM)", 
        "Operation Name": `${metrics.totalSmv.toFixed(2)} min`, 
        "Garment Section": "", 
        "Machine Type": "", 
        "SMV (sec)": Number(metrics.totalSmvSec.toFixed(1)), 
        "% Work Share": "100%", 
        "Predecessors": "", 
        "WIP Threshold (pcs)": "", 
        "Skill Required": `Avg L${metrics.avgSkill}`, 
        "Stitch Type": "", 
        "Seam Type": "", 
        "Notes & Quality Points": `${bulletin.lines?.length || 0} operations` 
      },
      { 
        "Seq #": "", 
        "Operation Code": "TOTAL OPERATIONS", 
        "Operation Name": `${bulletin.lines?.length || 0} sequential steps`, 
        "Garment Section": "", 
        "Machine Type": "", 
        "SMV (sec)": "", 
        "% Work Share": "", 
        "Predecessors": "", 
        "WIP Threshold (pcs)": "", 
        "Skill Required": "", 
        "Stitch Type": "", 
        "Seam Type": "", 
        "Notes & Quality Points": "" 
      },
      { 
        "Seq #": "", 
        "Operation Code": "UNIQUE MACHINERY TYPES", 
        "Operation Name": `${Object.keys(metrics.machineCounts).length} types`, 
        "Garment Section": "", 
        "Machine Type": "", 
        "SMV (sec)": "", 
        "% Work Share": "", 
        "Predecessors": "", 
        "WIP Threshold (pcs)": "", 
        "Skill Required": "", 
        "Stitch Type": "", 
        "Seam Type": "", 
        "Notes & Quality Points": "" 
      },
      { 
        "Seq #": "", 
        "Operation Code": "LINKED STYLES", 
        "Operation Name": (bulletin.styles || []).map(s => s.styleNo).join(", ") || "None", 
        "Garment Section": "", 
        "Machine Type": "", 
        "SMV (sec)": "", 
        "% Work Share": "", 
        "Predecessors": "", 
        "WIP Threshold (pcs)": "", 
        "Skill Required": "", 
        "Stitch Type": "", 
        "Seam Type": "", 
        "Notes & Quality Points": "" 
      },
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
              {bulletin.revisionNumber && (
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] rounded">
                  Rev {String(bulletin.revisionNumber).padStart(2, "0")}
                </span>
              )}
              <div className="relative inline-flex items-center">
                <select
                  value={bulletin.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as BulletinStatus)}
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-hidden transition-all shadow-2xs ${
                    bulletin.status === "PUBLISHED" || bulletin.status === "RELEASED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : bulletin.status === "APPROVED"
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : bulletin.status === "ARCHIVED"
                          ? "bg-slate-100 text-slate-600 border-slate-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  <option value="DRAFT">DRAFT (In Engineering)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED (IE Sign-Off)</option>
                  <option value="RELEASED">RELEASED TO LINE</option>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          
          {/* Work Content & Bulletin Summary Cards (Matching BulletinForm) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Garment SMV */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total SMV (SAM)
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#9C5B3C]">
                  {metrics.totalSmvSec.toFixed(1)}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold font-mono">sec</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium font-mono">
                ({metrics.totalSmv.toFixed(2)} min standard)
              </p>
            </div>

            {/* Total Operations */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Total Operations
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                  {bulletin.lines?.length || 0}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold">steps</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                Sequential standard operations
              </p>
            </div>

            {/* Unique Machine Types */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Machinery Types
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-700">
                  {Object.keys(metrics.machineCounts).length}
                </span>
                <span className="text-xs text-[#8C7E6E] font-bold">types</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                Distinct equipment requirements
              </p>
            </div>

            {/* Average Skill Required */}
            <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Avg Skill Required
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
                  {metrics.avgSkill}
                </span>
                <span className="text-xs text-amber-600 font-bold">/ 5</span>
              </div>
              <p className="text-[11px] text-[#8C7E6E] mt-0.5 font-medium">
                Sewing complexity rating
              </p>
            </div>
          </div>

          {/* Linked Garment Styles */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#9C5B3C]" />
              Linked Garment Styles
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {(bulletin.styles || []).map(style => (
                <div key={style.id} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] text-xs font-bold">
                  <span className="font-mono text-[#9C5B3C]">{style.styleNo}</span>
                  {style.buyer && (
                    <span className="text-[10.5px] text-[#8C7E6E] font-medium border-l border-[#E6DDCE] pl-1.5">
                      {style.buyer}
                    </span>
                  )}
                </div>
              ))}
              {(!bulletin.styles || bulletin.styles.length === 0) && (
                <p className="text-xs text-[#8C7E6E] italic">No garment styles linked yet.</p>
              )}
            </div>
          </div>

          {/* Complete Sequential Operations Table */}
          <div className="bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs overflow-hidden">
            {/* Section Breakdown & Filter Tabs */}
            <div className="px-4 py-3 bg-[#F9F7F4] border-b border-[#E6DDCE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase text-[#221912] mr-1">Sections:</span>
                <button
                  type="button"
                  onClick={() => setActiveSectionFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSectionFilter === "ALL"
                      ? "bg-[#221912] text-white shadow-2xs"
                      : "bg-white text-[#8C7E6E] border border-[#E6DDCE] hover:text-[#221912]"
                  }`}
                >
                  All ({bulletin.lines?.length || 0})
                </button>
                {GARMENT_SECTIONS.map(s => {
                  const count = metrics.sectionMetrics[s.id]?.count || 0;
                  if (count === 0 && activeSectionFilter !== s.id) return null;
                  const isSelected = activeSectionFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSectionFilter(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#9C5B3C] text-white shadow-2xs"
                          : "bg-white text-[#8C7E6E] border border-[#E6DDCE] hover:text-[#221912]"
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isSelected ? "bg-white/30 text-white" : "bg-[#F6F1E8] text-[#8C7E6E]"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-mono font-bold text-[#9C5B3C] bg-white px-2.5 py-1 rounded-lg border border-[#E6DDCE] shrink-0 self-start sm:self-auto">
                TOTAL: {metrics.totalSmvSec.toFixed(1)}s ({metrics.totalSmv.toFixed(2)} min)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E6DDCE] bg-[#FDFCFB] text-[10.5px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3.5 w-28 whitespace-nowrap">Code</th>
                    <th className="py-3 px-4 min-w-[200px]">Operation Description</th>
                    <th className="py-3 px-4 w-44 min-w-[150px]">Machine Type</th>
                    <th className="py-3 px-3.5 w-28 text-right whitespace-nowrap">SMV (sec)</th>
                    <th className="py-3 px-3 w-28 text-center whitespace-nowrap">% Work</th>
                    <th className="py-3 px-3 w-24 text-center whitespace-nowrap">Predecessors</th>
                    <th className="py-3 px-3.5 w-28 text-center whitespace-nowrap">WIP Buffer</th>
                    <th className="py-3 px-3 w-20 text-center whitespace-nowrap">Skill</th>
                    <th className="py-3 px-4 min-w-[130px]">Notes / Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDCE]">
                  {filteredLines.map((line) => {
                    const smvVal = Number(line.smv) || 0;
                    const pctShare = metrics.totalSmv > 0 ? (smvVal / metrics.totalSmv) * 100 : 0;

                    return (
                      <tr
                        key={line.id || line.sequence}
                        className="hover:bg-[#FFFDFB] transition-colors"
                      >
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#8C7E6E]">
                          {line.sequence}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-[#9C5B3C] bg-[#F6F1E8] px-2.5 py-1 rounded-lg border border-[#E6DDCE] shadow-2xs whitespace-nowrap inline-block">
                            {line.operationCode || `OP-${line.operationId}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm text-[#221912] leading-snug">
                            {line.operationName || `Operation ${line.operationId}`}
                          </div>
                          {(line.stitchType || line.seamType || line.attachmentType) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {line.stitchType && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 whitespace-nowrap">
                                  {line.stitchType}
                                </span>
                              )}
                              {line.seamType && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 whitespace-nowrap">
                                  {line.seamType}
                                </span>
                              )}
                              {line.attachmentType && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 whitespace-nowrap">
                                  {line.attachmentType}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                          {line.machineType || "Single Needle"}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono">
                          <span className="font-bold text-xs text-[#221912]">{(smvVal * 60).toFixed(1)}s</span>
                          <span className="block text-[10px] text-[#8C7E6E] font-normal">
                            ({smvVal.toFixed(2)}m)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-14 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shrink-0">
                              <div
                                className="h-full rounded-full bg-[#9C5B3C]"
                                style={{ width: `${Math.min(100, pctShare * 2.5)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-[#8C7E6E] w-11 text-right whitespace-nowrap">
                              {pctShare.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {line.predecessorIds && line.predecessorIds.trim() ? (
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs whitespace-nowrap inline-block">
                              #{line.predecessorIds}
                            </span>
                          ) : (
                            <span className="text-[#8C7E6E] text-xs font-medium">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
                            {line.wipThreshold ?? 20} pcs
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md shadow-2xs whitespace-nowrap inline-block">
                            L{line.skillRatingRequired || 3}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#8C7E6E] text-xs italic">
                          {line.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLines.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-xs text-[#8C7E6E]">
                        No operations found in this section.
                      </td>
                    </tr>
                  )}
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
