import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Cpu, 
  Check, 
  Search, 
  AlertTriangle,
  Layers,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Tag,
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import type { CreateBulletinDTO, BulletinLine, OperationBulletin, BulletinStatus } from "./api";
import type { Style } from "../styles/api";
import type { Operation } from "../operations/api";
import { machinesApi, type Machine } from "../machines/api";
import { 
  ALL_GARMENT_MACHINE_PRESETS 
} from "./garmentMachinery";

export const GARMENT_SECTIONS = [
  { id: "FRONT_PREP", label: "Front Preparation", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "BACK_PREP", label: "Back Preparation", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { id: "COLLAR_CUFF", label: "Collar & Cuff / Sleeves", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "MAIN_ASSEMBLY", label: "Main Body Assembly", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "WAISTBAND", label: "Waistband & Bottom", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "FINISHING", label: "Finishing & Trimming", color: "bg-rose-50 text-rose-800 border-rose-200" },
  { id: "QUALITY", label: "Quality Inspection Check", color: "bg-slate-100 text-slate-800 border-slate-300" },
];

export const STITCH_TYPES = [
  "301 - Single Needle Lockstitch (SNLS)",
  "401 - Multi-Needle Chainstitch",
  "504 - 3-Thread Overlock",
  "514 - 4-Thread Overlock (Safety Stitch)",
  "516 - 5-Thread Safety Stitch",
  "602 - 2-Needle 4-Thread Coverstitch",
  "605 - 3-Needle 5-Thread Flatlock",
  "Buttonhole Automatic Indexer",
  "Button Attach Auto-Feed",
  "Bartack Programmable",
  "Manual Ironing / Pressing",
  "Manual Hand Trimming / QC",
];

export const SEAM_TYPES = [
  "SSa-1 (Superimposed Seam)",
  "LSc-2 (Lapped Seam / Denim Felled)",
  "BSa-1 (Bound Seam / Binding)",
  "EFa-1 (Edge Finishing / Hemming)",
  "OSa-1 (Ornamental Stitching)",
];

interface BulletinFormProps {
  styles: Style[];
  operations: Operation[];
  existingBulletins?: OperationBulletin[];
  initialData?: OperationBulletin | null;
  onSubmit: (data: CreateBulletinDTO) => Promise<void>;
  onCancel: () => void;
}

export function BulletinForm({ 
  styles, 
  operations, 
  existingBulletins = [], 
  initialData, 
  onSubmit, 
  onCancel 
}: BulletinFormProps) {
  const sequentialCode = useMemo(() => {
    const list = existingBulletins || [];
    const numbers = list
      .map(b => {
        const match = (b.bulletinCode || "").match(/\d+/g);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : list.length;
    return `OB-${String(maxNum + 1).padStart(3, "0")}`;
  }, [existingBulletins]);

  const [formData, setFormData] = useState<Omit<CreateBulletinDTO, "lines">>({
    bulletinCode: initialData?.bulletinCode || sequentialCode,
    name: initialData?.name || "",
    description: initialData?.description || "",
    styleIds: (initialData?.styles || []).map(s => String(s.id)),
    version: initialData?.version || 1,
    revisionNumber: initialData?.revisionNumber || 1,
    status: initialData?.status || "DRAFT",
    effectiveFrom: initialData?.effectiveFrom || "",
    effectiveTo: initialData?.effectiveTo || "",
  });

  useEffect(() => {
    if (!initialData && !formData.bulletinCode && sequentialCode) {
      setFormData(prev => ({ ...prev, bulletinCode: sequentialCode }));
    }
  }, [sequentialCode, initialData]);

  const [lines, setLines] = useState<BulletinLine[]>(() => {
    if (initialData?.lines && initialData.lines.length > 0) {
      return initialData.lines.map((l, idx) => ({
        ...l,
        sequence: idx + 1,
        id: l.id || `line-${Date.now()}-${idx}`,
        section: l.section || "MAIN_ASSEMBLY",
        isParallelizable: l.isParallelizable ?? false,
        splitAllowed: l.splitAllowed ?? true,
        splitType: l.splitType || "RATIO",
        skillRatingRequired: l.skillRatingRequired || 3,
        predecessorIds: l.predecessorIds || "",
      }));
    }
    return [];
  });

  // Machine inventory
  const [inventoryMachines, setInventoryMachines] = useState<Machine[]>([]);
  useEffect(() => {
    machinesApi.getMachines({ active: true })
      .then(res => setInventoryMachines(res || []))
      .catch(() => []);
  }, []);

  const extraInventoryTypes = useMemo(() => {
    const invTypes = new Set(inventoryMachines.map(m => m.machineType?.trim()).filter(Boolean));
    ALL_GARMENT_MACHINE_PRESETS.forEach(p => invTypes.delete(p));
    return Array.from(invTypes);
  }, [inventoryMachines]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkPickerOpen, setIsBulkPickerOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedBulkOpIds, setSelectedBulkOpIds] = useState<string[]>([]);
  const [expandedLineIndex, setExpandedLineIndex] = useState<number | null>(null);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("ALL");

  // Calculations
  const totalSmvMinutes = useMemo(() => {
    return lines.reduce((acc, l) => acc + (Number(l.smv) || 0), 0);
  }, [lines]);

  const totalSmvSeconds = useMemo(() => {
    return totalSmvMinutes * 60;
  }, [totalSmvMinutes]);

  const sectionMetrics = useMemo(() => {
    const map: Record<string, { count: number; smvMin: number; smvSec: number }> = {};
    GARMENT_SECTIONS.forEach(s => {
      map[s.id] = { count: 0, smvMin: 0, smvSec: 0 };
    });
    lines.forEach(l => {
      const sec = l.section || "MAIN_ASSEMBLY";
      if (!map[sec]) map[sec] = { count: 0, smvMin: 0, smvSec: 0 };
      map[sec].count += 1;
      map[sec].smvMin += Number(l.smv) || 0;
      map[sec].smvSec += (Number(l.smv) || 0) * 60;
    });
    return map;
  }, [lines]);

  // Bulk add operations
  const handleAddBulkOperations = () => {
    if (selectedBulkOpIds.length === 0) return;
    const newLines: BulletinLine[] = [...lines];
    selectedBulkOpIds.forEach((opId) => {
      const op = operations.find(o => String(o.id) === String(opId));
      if (!op) return;
      newLines.push({
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sequence: newLines.length + 1,
        operationId: op.id,
        operationCode: op.operationCode || op.code,
        operationName: op.name,
        smv: Number(op.standardSmv || op.defaultSmv) || 0.5,
        machineType: op.machineType || op.defaultMachineType || "SNLS",
        skillRatingRequired: (op.skillLevelRequired || op.skillLevel || op.defaultSkillRating || 3) as any,
        section: "MAIN_ASSEMBLY",
        isParallelizable: false,
        splitAllowed: true,
        splitType: "RATIO",
        predecessorIds: "",
        wipThreshold: 20,
        notes: "",
      });
    });
    setLines(newLines);
    setSelectedBulkOpIds([]);
    setIsBulkPickerOpen(false);
  };

  // Add Single Empty Operation Line
  const handleAddEmptyLine = () => {
    const firstOp = operations[0];
    const newLine: BulletinLine = {
      id: `line-${Date.now()}-${lines.length}`,
      sequence: lines.length + 1,
      operationId: firstOp ? firstOp.id : 0,
      operationCode: firstOp ? (firstOp.operationCode || firstOp.code || "OP-01") : "OP-01",
      operationName: firstOp ? firstOp.name : "Custom Sewing Operation",
      smv: firstOp ? Number(firstOp.standardSmv || firstOp.defaultSmv) || 0.5 : 0.5,
      machineType: firstOp?.machineType || firstOp?.defaultMachineType || "SNLS",
      skillRatingRequired: (firstOp?.skillLevelRequired || firstOp?.skillLevel || firstOp?.defaultSkillRating || 3) as any,
      section: "MAIN_ASSEMBLY",
      isParallelizable: false,
      splitAllowed: true,
      splitType: "RATIO",
      predecessorIds: "",
      wipThreshold: 20,
      notes: "",
    };
    setLines([...lines, newLine]);
    setExpandedLineIndex(lines.length);
  };

  const handleUpdateLine = (index: number, updates: Partial<BulletinLine>) => {
    const updated = [...lines];
    const current = updated[index];
    
    // If operationId changed, auto-populate details
    if (updates.operationId !== undefined && updates.operationId !== current.operationId) {
      const foundOp = operations.find(o => String(o.id) === String(updates.operationId));
      if (foundOp) {
        updates.operationCode = foundOp.operationCode || foundOp.code;
        updates.operationName = foundOp.name;
        if (!updates.smv && (foundOp.standardSmv || foundOp.defaultSmv)) {
          updates.smv = Number(foundOp.standardSmv || foundOp.defaultSmv);
        }
        if (!updates.machineType && (foundOp.machineType || foundOp.defaultMachineType)) {
          updates.machineType = foundOp.machineType || foundOp.defaultMachineType;
        }
        if (!updates.skillRatingRequired && (foundOp.skillLevelRequired || foundOp.skillLevel || foundOp.defaultSkillRating)) {
          updates.skillRatingRequired = (foundOp.skillLevelRequired || foundOp.skillLevel || foundOp.defaultSkillRating) as any;
        }
      }
    }

    updated[index] = { ...current, ...updates };
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    const updated = lines.filter((_, idx) => idx !== index).map((l, idx) => ({
      ...l,
      sequence: idx + 1,
    }));
    setLines(updated);
    if (expandedLineIndex === index) setExpandedLineIndex(null);
  };

  const handleMoveLine = (index: number, direction: "UP" | "DOWN") => {
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lines.length) return;
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    const reindexed = updated.map((l, idx) => ({ ...l, sequence: idx + 1 }));
    setLines(reindexed);
    if (expandedLineIndex === index) setExpandedLineIndex(targetIdx);
  };

  // Precedence validation
  const validatePrecedences = (): string | null => {
    // Check if predecessors are higher sequence numbers (forward references)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.predecessorIds && l.predecessorIds.trim()) {
        const preds = l.predecessorIds.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        for (const p of preds) {
          if (p >= l.sequence) {
            return `Sequence #${l.sequence} (${l.operationName}) cannot depend on sequence #${p} (must precede it).`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.bulletinCode.trim()) {
      setError("Bulletin Code is required.");
      return;
    }
    if (!formData.name.trim()) {
      setError("Bulletin Name is required.");
      return;
    }
    if (lines.length === 0) {
      setError("At least one operation line is required in the Operation Bulletin.");
      return;
    }

    const precError = validatePrecedences();
    if (precError) {
      setError(`Precedence Constraint Error: ${precError}`);
      return;
    }

    setLoading(true);
    try {
      const payload: CreateBulletinDTO = {
        ...formData,
        lines: lines.map((l, idx) => ({
          sequence: idx + 1,
          operationId: l.operationId,
          smv: Number(l.smv) || 0.1,
          machineType: l.machineType || "SNLS",
          skillRatingRequired: Number(l.skillRatingRequired) || 3,
          section: l.section || "MAIN_ASSEMBLY",
          predecessorIds: l.predecessorIds || "",
          isParallelizable: l.isParallelizable ?? false,
          splitAllowed: l.splitAllowed ?? true,
          splitType: l.splitType || "RATIO",
          stitchType: l.stitchType || "",
          seamType: l.seamType || "",
          attachmentType: l.attachmentType || "",
          wipThreshold: Number(l.wipThreshold) >= 0 ? Number(l.wipThreshold) : 20,
          notes: l.notes || "",
        })),
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save operation bulletin");
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    if (activeSectionFilter === "ALL") return lines;
    return lines.filter(l => (l.section || "MAIN_ASSEMBLY") === activeSectionFilter);
  }, [lines, activeSectionFilter]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* ── 1. Master Bulletin Information Header ────────────────────── */}
      <div className="bg-[#FDFCFB] border border-[#E6DDCE] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#9C5B3C]/10 text-[#9C5B3C] rounded-xl font-bold">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#221912]">Garment Routing Specification</h3>
              <p className="text-[11px] text-[#8C7E6E]">Industrial Engineering Standard Operation Bulletin (OB)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase">Lifecycle:</span>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BulletinStatus })}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs focus:outline-hidden ${
                formData.status === "RELEASED" || formData.status === "PUBLISHED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : formData.status === "APPROVED"
                  ? "bg-blue-50 text-blue-800 border-blue-300"
                  : formData.status === "UNDER_REVIEW"
                  ? "bg-purple-50 text-purple-800 border-purple-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="APPROVED">APPROVED (IE Sign-Off)</option>
              <option value="RELEASED">RELEASED TO LINE</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#8C7E6E]">Bulletin Code *</label>
            <input
              type="text"
              required
              value={formData.bulletinCode}
              onChange={(e) => setFormData({ ...formData, bulletinCode: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-mono font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              placeholder="e.g. OB-DENIM-001"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-[#8C7E6E]">Bulletin Name / Description *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              placeholder="e.g. Mens 5-Pocket Regular Fit Denim Jeans Assembly Flow"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#8C7E6E]">Revision / Version</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-mono font-black text-[#9C5B3C]">
                Rev {String(formData.revisionNumber || 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] font-mono text-[#8C7E6E]">v{formData.version || 1}</span>
            </div>
          </div>
        </div>

        {/* Linked Styles */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#9C5B3C]" /> Linked Garment Styles
          </label>
          <div className="flex flex-wrap gap-2 p-2.5 bg-[#F6F1E8]/60 border border-[#E6DDCE] rounded-xl max-h-28 overflow-y-auto">
            {styles.map(s => {
              const isSelected = formData.styleIds.includes(String(s.id));
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const idStr = String(s.id);
                    const newIds = isSelected 
                      ? formData.styleIds.filter(id => id !== idStr)
                      : [...formData.styleIds, idStr];
                    setFormData({ ...formData, styleIds: newIds });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#9C5B3C] text-white shadow-2xs"
                      : "bg-white text-[#8C7E6E] border border-[#E6DDCE] hover:border-[#9C5B3C]"
                  }`}
                >
                  <span>{s.styleNo}</span>
                  {s.buyer && <span className="text-[10px] opacity-80">({s.buyer})</span>}
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Work Content Metrics & Section Breakdown ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total Garment SMV (sec)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#9C5B3C]">{totalSmvSeconds.toFixed(1)}</span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">s</span>
          </div>
          <span className="text-[10px] text-[#8C7E6E] font-mono">({totalSmvMinutes.toFixed(2)} min standard)</span>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" /> Total Operations
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{lines.length}</p>
          <span className="text-[10px] text-[#8C7E6E]">Sequential standard steps</span>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-indigo-800 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Unique Machine Types
          </span>
          <p className="text-2xl font-black font-mono text-indigo-700 mt-1">
            {new Set(lines.map(l => l.machineType?.trim()).filter(Boolean)).size}
          </p>
          <span className="text-[10px] text-[#8C7E6E]">Equipment footprint</span>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Avg Skill Required
          </span>
          <p className="text-2xl font-black font-mono text-amber-700 mt-1">
            {lines.length > 0 
              ? (lines.reduce((a, b) => a + (Number(b.skillRatingRequired) || 3), 0) / lines.length).toFixed(1)
              : "3.0"
            } <span className="text-xs font-bold text-amber-600">/ 5</span>
          </p>
          <span className="text-[10px] text-[#8C7E6E]">Sewing complexity index</span>
        </div>
      </div>

      {/* ── 3. Operation Lines Management Toolbar ────────────────────── */}
      <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DDCE] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-[#221912] uppercase tracking-wider">Sections:</span>
            <button
              type="button"
              onClick={() => setActiveSectionFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSectionFilter === "ALL"
                  ? "bg-[#221912] text-white shadow-2xs"
                  : "bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912]"
              }`}
            >
              All ({lines.length})
            </button>
            {GARMENT_SECTIONS.map(s => {
              const count = sectionMetrics[s.id]?.count || 0;
              if (count === 0 && activeSectionFilter !== s.id) return null;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSectionFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSectionFilter === s.id
                      ? "bg-[#9C5B3C] text-white shadow-2xs"
                      : "bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30 text-current font-black">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkPickerOpen(true)}
              className="border-[#E6DDCE] text-[#221912] hover:bg-[#F6F1E8]"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-[#9C5B3C]" />
              Bulk Add from Catalog
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddEmptyLine}
              className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Operation
            </Button>
          </div>
        </div>

        {/* Bulk Operation Picker Drawer/Modal */}
        {isBulkPickerOpen && (
          <div className="p-4 bg-[#F6F1E8] border border-[#E6DDCE] rounded-2xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#221912] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#9C5B3C]" /> Select Operations from Master Catalog
              </span>
              <button
                type="button"
                onClick={() => setIsBulkPickerOpen(false)}
                className="text-xs font-bold text-[#8C7E6E] hover:text-[#221912]"
              >
                Close
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                placeholder="Search operation name, code, machine type..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {operations
                .filter(o => {
                  if (!bulkSearch.trim()) return true;
                  const q = bulkSearch.toLowerCase();
                  const opCode = (o.operationCode || o.code || "").toLowerCase();
                  const mType = (o.machineType || o.defaultMachineType || "").toLowerCase();
                  return o.name.toLowerCase().includes(q) || opCode.includes(q) || mType.includes(q);
                })
                .map(op => {
                  const isChecked = selectedBulkOpIds.includes(String(op.id));
                  const opCode = op.operationCode || op.code || `OP-${op.id}`;
                  const opSmv = Number(op.standardSmv || op.defaultSmv) || 0;
                  const mType = op.machineType || op.defaultMachineType || "SNLS";
                  return (
                    <div
                      key={op.id}
                      onClick={() => {
                        const idStr = String(op.id);
                        setSelectedBulkOpIds(prev => 
                          prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked 
                          ? "bg-white border-[#9C5B3C] shadow-2xs" 
                          : "bg-white/60 border-[#E6DDCE] hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-[#9C5B3C] focus:ring-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#221912] truncate">{op.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#8C7E6E]">
                          <span>{opCode}</span>
                          <span>•</span>
                          <span className="text-[#9C5B3C] font-bold">{(opSmv * 60).toFixed(0)}s</span>
                          <span>•</span>
                          <span>{mType}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E6DDCE]">
              <span className="text-xs font-bold text-[#8C7E6E]">
                {selectedBulkOpIds.length} operation(s) selected
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddBulkOperations}
                disabled={selectedBulkOpIds.length === 0}
                className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white"
              >
                Insert Selected Operations
              </Button>
            </div>
          </div>
        )}

        {/* Operations Table / Detail List */}
        <div className="space-y-2">
          {filteredLines.map((line, index) => {
            const isExpanded = expandedLineIndex === index;
            const smvSec = ((Number(line.smv) || 0) * 60).toFixed(1);
            const sectionObj = GARMENT_SECTIONS.find(s => s.id === line.section) || GARMENT_SECTIONS[3];

            return (
              <div 
                key={line.id || index}
                className={`border rounded-2xl transition-all ${
                  isExpanded ? "border-[#9C5B3C] bg-[#FFFDFB] shadow-sm" : "border-[#E6DDCE] bg-white hover:border-[#9C5B3C]/50"
                }`}
              >
                {/* Main Row */}
                <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Sequence Badge */}
                    <span className="w-7 h-7 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] font-mono font-black text-xs text-[#221912] flex items-center justify-center">
                      {line.sequence}
                    </span>

                    {/* Section Tag */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${sectionObj.color}`}>
                      {sectionObj.label}
                    </span>

                    {/* Operation Select / Name */}
                    <div className="w-56 sm:w-64">
                      <select
                        value={line.operationId}
                        onChange={(e) => handleUpdateLine(index, { operationId: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                      >
                        {operations.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.operationCode || o.code || `OP-${o.id}`} - {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Core Metrics: SMV, Machine, Skill */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* SMV Sec input */}
                    <div className="flex items-center gap-1 bg-[#F6F1E8] px-2 py-1 rounded-xl border border-[#E6DDCE]">
                      <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={smvSec}
                        onChange={(e) => {
                          const sec = parseFloat(e.target.value) || 0;
                          handleUpdateLine(index, { smv: sec / 60 });
                        }}
                        className="w-14 bg-transparent font-mono font-black text-[#9C5B3C] text-right focus:outline-hidden"
                      />
                      <span className="font-mono text-[10px] font-bold text-[#8C7E6E]">s</span>
                    </div>

                    {/* Machine Type */}
                    <div className="w-36">
                      <input
                        type="text"
                        value={line.machineType}
                        onChange={(e) => handleUpdateLine(index, { machineType: e.target.value })}
                        placeholder="Machine Type"
                        className="w-full px-2 py-1 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-mono font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                        list={`machines-list-${index}`}
                      />
                      <datalist id={`machines-list-${index}`}>
                        {ALL_GARMENT_MACHINE_PRESETS.map(m => (
                          <option key={m} value={m} />
                        ))}
                        {extraInventoryTypes.map(m => (
                          <option key={`inv-${m}`} value={m} />
                        ))}
                      </datalist>
                    </div>

                    {/* Skill Rating (1-5) */}
                    <div className="flex items-center gap-1 bg-[#F6F1E8] px-2 py-1 rounded-xl border border-[#E6DDCE]">
                      <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">Skill:</span>
                      <select
                        value={line.skillRatingRequired}
                        onChange={(e) => handleUpdateLine(index, { skillRatingRequired: parseInt(e.target.value, 10) as any })}
                        className="bg-transparent font-bold text-amber-700 text-xs focus:outline-hidden cursor-pointer"
                      >
                        <option value={1}>★ 1 - Basic</option>
                        <option value={2}>★★ 2 - Semi-Skill</option>
                        <option value={3}>★★★ 3 - Skilled</option>
                        <option value={4}>★★★★ 4 - High Skill</option>
                        <option value={5}>★★★★★ 5 - Master</option>
                      </select>
                    </div>

                    {/* WIP Threshold input */}
                    <div className="flex items-center gap-1 bg-[#F6F1E8] px-2 py-1 rounded-xl border border-[#E6DDCE]" title="WIP Buffer Threshold (in pieces) - alerts bottleneck if queue exceeds this limit">
                      <Layers className="w-3.5 h-3.5 text-amber-700" />
                      <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">WIP Limit:</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.wipThreshold ?? 20}
                        onChange={(e) => handleUpdateLine(index, { wipThreshold: parseInt(e.target.value, 10) || 20 })}
                        className="w-10 bg-transparent font-mono font-bold text-amber-900 text-right focus:outline-hidden"
                      />
                      <span className="font-mono text-[10px] font-bold text-[#8C7E6E]">pcs</span>
                    </div>

                    {/* Expand/Collapse Engineering Details */}
                    <button
                      type="button"
                      onClick={() => setExpandedLineIndex(isExpanded ? null : index)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        isExpanded 
                          ? "bg-[#9C5B3C] text-white border-[#9C5B3C]" 
                          : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE] hover:text-[#221912]"
                      }`}
                      title="Toggle Engineering Parameters & Precedence"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Reorder and Delete */}
                    <div className="flex items-center gap-0.5 border-l border-[#E6DDCE] pl-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveLine(index, "UP")}
                        className="p-1 rounded text-[#8C7E6E] hover:text-[#221912] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lines.length - 1}
                        onClick={() => handleMoveLine(index, "DOWN")}
                        className="p-1 rounded text-[#8C7E6E] hover:text-[#221912] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                        title="Remove Operation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Engineering Attributes Drawer */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-[#FDFCFB] border-t border-[#E6DDCE] space-y-3 animate-in fade-in duration-100 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Section Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Garment Section</label>
                        <select
                          value={line.section}
                          onChange={(e) => handleUpdateLine(index, { section: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl font-bold text-[#221912]"
                        >
                          {GARMENT_SECTIONS.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Predecessors (Dependency Constraint) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-[#9C5B3C]" /> Predecessor Sequences
                        </label>
                        <input
                          type="text"
                          value={line.predecessorIds || ""}
                          onChange={(e) => handleUpdateLine(index, { predecessorIds: e.target.value })}
                          placeholder="e.g. 1, 2, 4"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl font-mono text-xs text-[#221912]"
                          title="Comma-separated sequence numbers of prior operations that must be completed before this step"
                        />
                      </div>

                      {/* Stitch Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Stitch Classification</label>
                        <input
                          type="text"
                          value={line.stitchType || ""}
                          onChange={(e) => handleUpdateLine(index, { stitchType: e.target.value })}
                          placeholder="e.g. 301 SNLS"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912]"
                          list={`stitch-list-${index}`}
                        />
                        <datalist id={`stitch-list-${index}`}>
                          {STITCH_TYPES.map(st => (
                            <option key={st} value={st} />
                          ))}
                        </datalist>
                      </div>

                      {/* Seam Type */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Seam Classification</label>
                        <input
                          type="text"
                          value={line.seamType || ""}
                          onChange={(e) => handleUpdateLine(index, { seamType: e.target.value })}
                          placeholder="e.g. SSa-1"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912]"
                          list={`seam-list-${index}`}
                        />
                        <datalist id={`seam-list-${index}`}>
                          {SEAM_TYPES.map(st => (
                            <option key={st} value={st} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E6DDCE]">
                      {/* Attachment / Folder */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Attachment / Work Aid</label>
                        <input
                          type="text"
                          value={line.attachmentType || ""}
                          onChange={(e) => handleUpdateLine(index, { attachmentType: e.target.value })}
                          placeholder="e.g. 1/4 inch Hemmer Folder, Edge Guide"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912]"
                        />
                      </div>

                      {/* WIP Buffer Threshold (Bottleneck Control) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#9C5B3C]" /> WIP Queue Limit (pcs)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.wipThreshold ?? 20}
                          onChange={(e) => handleUpdateLine(index, { wipThreshold: parseInt(e.target.value, 10) || 20 })}
                          placeholder="e.g. 20"
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912]"
                          title="Maximum queue pieces before triggering a bottleneck alert on the sewing line"
                        />
                      </div>

                      {/* Line Balancing Constraints */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Balancing Constraints</label>
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={line.isParallelizable ?? false}
                              onChange={(e) => handleUpdateLine(index, { isParallelizable: e.target.checked })}
                              className="rounded text-[#9C5B3C] focus:ring-0"
                            />
                            <span className="text-xs font-bold text-[#221912]">Allow Parallel Stations</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={line.splitAllowed ?? true}
                              onChange={(e) => handleUpdateLine(index, { splitAllowed: e.target.checked })}
                              className="rounded text-[#9C5B3C] focus:ring-0"
                            />
                            <span className="text-xs font-bold text-[#221912]">Allow Workstation Splitting</span>
                          </label>

                          {line.splitAllowed && (
                            <select
                              value={line.splitType || "RATIO"}
                              onChange={(e) => handleUpdateLine(index, { splitType: e.target.value })}
                              className="px-2 py-1 bg-white border border-[#E6DDCE] rounded-lg text-xs font-mono font-bold"
                            >
                              <option value="RATIO">Split by Ratio (e.g. 50/50)</option>
                              <option value="DISCRETE">Discrete Split</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Form Footer Actions ───────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E6DDCE]">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="text-[#8C7E6E] hover:text-[#221912]"
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white px-6 py-2.5 font-bold shadow-md shadow-[#9C5B3C]/20"
          >
            {loading ? "Saving Operation Bulletin..." : initialData ? "Save Changes" : "Create Operation Bulletin"}
          </Button>
        </div>
      </div>
    </form>
  );
}
