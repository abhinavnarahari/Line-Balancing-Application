import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Cpu, 
  Sparkles,
  Check, 
  Layers, 
  Search, 
  AlertTriangle
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { CreateBulletinDTO, BulletinLine, OperationBulletin } from "./api";
import type { Style } from "../styles/api";
import type { Operation } from "../operations/api";

interface BulletinFormProps {
  styles: Style[];
  operations: Operation[];
  existingBulletins?: OperationBulletin[];
  initialData?: OperationBulletin | null;
  onSubmit: (data: CreateBulletinDTO) => Promise<void>;
  onCancel: () => void;
}

export function BulletinForm({ styles, operations, existingBulletins = [], initialData, onSubmit, onCancel }: BulletinFormProps) {
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

  const [formData, setFormData] = useState<Omit<CreateBulletinDTO, "lines">>(() => ({
    bulletinCode: initialData?.bulletinCode || sequentialCode,
    name: initialData?.name || "",
    description: initialData?.description || "",
    styleIds: (initialData?.styles || []).map(s => String(s.id)),
    version: initialData?.version || 1,
    status: initialData?.status || "DRAFT",
    effectiveFrom: initialData?.effectiveFrom || "",
    effectiveTo: initialData?.effectiveTo || "",
  }));

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
      }));
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkPickerOpen, setIsBulkPickerOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedBulkOpIds, setSelectedBulkOpIds] = useState<string[]>([]);

  // Update when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        bulletinCode: initialData.bulletinCode || "",
        name: initialData.name || "",
        description: initialData.description || "",
        styleIds: (initialData.styles || []).map(s => String(s.id)),
        version: initialData.version || 1,
        status: initialData.status || "DRAFT",
        effectiveFrom: initialData.effectiveFrom || "",
        effectiveTo: initialData.effectiveTo || "",
      });
      if (initialData.lines) {
        setLines(initialData.lines.map((l, idx) => ({
          ...l,
          sequence: idx + 1,
          id: l.id || `line-${Date.now()}-${idx}`,
        })));
      }
    }
  }, [initialData]);

  const activeStyles = useMemo(() => styles.filter(s => s.active !== false), [styles]);
  const activeOps = useMemo(() => operations.filter(o => o.active !== false).sort((a, b) => (a.sequence || 0) - (b.sequence || 0)), [operations]);

  // Live Calculations
  const totalSMV = useMemo(() => lines.reduce((acc, curr) => acc + (Number(curr.smv) || 0), 0), [lines]);

  const bottleneck = useMemo(() => {
    if (lines.length === 0) return null;
    let max = lines[0];
    lines.forEach(l => {
      if ((Number(l.smv) || 0) > (Number(max.smv) || 0)) max = l;
    });
    return max;
  }, [lines]);

  const machineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lines.forEach(l => {
      const m = (l.machineType || "Single Needle Lockstitch").trim();
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [lines]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStyleToggle = (styleId: string) => {
    setFormData(prev => {
      const isSelected = prev.styleIds.includes(styleId);
      return {
        ...prev,
        styleIds: isSelected 
          ? prev.styleIds.filter(id => id !== styleId)
          : [...prev.styleIds, styleId]
      };
    });
  };

  const addLine = () => {
    const newLine: BulletinLine = {
      id: `new-${Date.now()}`,
      sequence: lines.length + 1,
      operationId: "",
      smv: 0.50,
      machineType: "Single Needle Lockstitch (SNLS)",
      skillRatingRequired: 3,
      notes: "",
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string | number, field: keyof BulletinLine, value: any) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const removeLine = (id: string | number) => {
    setLines(lines.filter(l => l.id !== id).map((l, idx) => ({ ...l, sequence: idx + 1 })));
  };

  const moveLine = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lines.length) return;

    const newLines = [...lines];
    const [moved] = newLines.splice(index, 1);
    newLines.splice(targetIndex, 0, moved);

    setLines(newLines.map((l, idx) => ({ ...l, sequence: idx + 1 })));
  };

  // Bulk Add Operations from Library
  const handleBulkAddConfirm = () => {
    const selectedOps = activeOps.filter(o => selectedBulkOpIds.includes(String(o.id)));
    const newItems: BulletinLine[] = selectedOps.map((op, i) => ({
      id: `bulk-${Date.now()}-${i}`,
      sequence: lines.length + i + 1,
      operationId: String(op.id),
      operationCode: op.operationCode,
      operationName: op.name,
      smv: Number(op.standardSmv) || 0.60,
      machineType: op.machineType || "Single Needle Lockstitch (SNLS)",
      skillRatingRequired: (Number(op.skillLevel) || 3) as 1 | 2 | 3 | 4 | 5,
      notes: "",
    }));

    setLines([...lines, ...newItems]);
    setSelectedBulkOpIds([]);
    setIsBulkPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.bulletinCode.trim()) {
      setError("Bulletin code is required (e.g. OB-TS-001).");
      return;
    }
    if (!formData.name.trim()) {
      setError("Bulletin name is required.");
      return;
    }
    if (lines.length === 0) {
      setError("Operation bulletin must have at least one operation line.");
      return;
    }
    if (lines.some(l => !l.operationId)) {
      setError("All operation lines must have an operation selected.");
      return;
    }
    if (lines.some(l => Number(l.smv) <= 0)) {
      setError("Each operation line must have an SMV greater than 0.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        lines: lines.map((l, idx) => ({
          sequence: idx + 1,
          operationId: l.operationId,
          smv: Number(l.smv) || 0.1,
          machineType: l.machineType || "Single Needle Lockstitch",
          skillRatingRequired: Number(l.skillRatingRequired) || 3,
          notes: l.notes || "",
        })),
      });
    } catch (err: any) {
      setError(err.message || "Failed to save operation bulletin");
    } finally {
      setLoading(false);
    }
  };

  const filteredBulkOps = useMemo(() => {
    if (!bulkSearch) return activeOps;
    const q = bulkSearch.toLowerCase();
    return activeOps.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.operationCode.toLowerCase().includes(q) ||
      (o.machineType || "").toLowerCase().includes(q)
    );
  }, [activeOps, bulkSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 1. Header Information ──────────────────────────────────── */}
      <div className="bg-[#FDFCFB] border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#221912] border-b border-[#E6DDCE] pb-2">
          Bulletin Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            label="Bulletin Code" 
            name="bulletinCode" 
            value={formData.bulletinCode} 
            onChange={handleHeaderChange} 
            required 
            placeholder="e.g. OB-001" 
            hint="Sequential standard routing identifier" 
          />
          <Input 
            label="Bulletin Name" 
            name="name" 
            value={formData.name} 
            onChange={handleHeaderChange} 
            required 
            placeholder="e.g. Men's Pique Polo Shirt Assembly Flow" 
          />
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E]">Status</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleHeaderChange} 
              className="h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
            >
              <option value="DRAFT">DRAFT (Under Development)</option>
              <option value="PUBLISHED">PUBLISHED (Active on Shopfloor)</option>
              <option value="ARCHIVED">ARCHIVED (Historical / Retired)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E]">Description / Technical Notes</label>
            <textarea
              name="description"
              rows={2}
              value={formData.description || ""}
              onChange={handleHeaderChange}
              placeholder="e.g. Standard 2-button placket polo with flat knit collar and rib cuffs..."
              className="p-2.5 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E]">Revision Version</label>
            <input
              type="number"
              min="1"
              max="50"
              name="version"
              value={formData.version || 1}
              onChange={handleHeaderChange}
              className="h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-mono font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
            />
          </div>
        </div>

        {/* Linked Styles Multi-Select */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E]">
            Linked Styles ({formData.styleIds.length} Selected)
          </label>
          <div className="flex flex-wrap gap-2 p-3 border border-[#E6DDCE] rounded-xl bg-white max-h-28 overflow-y-auto custom-scrollbar">
            {activeStyles.map(s => {
              const isSelected = formData.styleIds.includes(String(s.id));
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleStyleToggle(String(s.id))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#9C5B3C] text-white border-[#9C5B3C] shadow-2xs"
                      : "bg-[#F6F1E8] text-[#221912] border-[#E6DDCE] hover:bg-[#EAE2D5]"
                  }`}
                >
                  <span className="font-mono">{s.styleNo}</span>
                  {s.buyer && <span className="text-[10px] opacity-80">({s.buyer})</span>}
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
            {activeStyles.length === 0 && <span className="text-xs text-[#8C7E6E] italic">No active styles registered.</span>}
          </div>
          <p className="text-[10.5px] text-[#8C7E6E]">
            One Operation Bulletin can be mapped to multiple garment styles with identical production sequences.
          </p>
        </div>
      </div>

      {/* ── 2. Live IE Metrics Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F1E8] p-3.5 rounded-2xl border border-[#E6DDCE]">
        <div className="bg-white p-3 rounded-xl border border-[#E6DDCE] shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total Work Content
          </span>
          <p className="text-2xl font-black font-mono text-[#9C5B3C] mt-1">
            {totalSMV.toFixed(2)} <span className="text-xs text-[#8C7E6E] font-normal font-sans">min</span>
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E6DDCE] shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Bottleneck Step
          </span>
          <p className="text-sm font-bold text-[#221912] mt-1 truncate" title={bottleneck?.operationName}>
            {bottleneck ? `${bottleneck.smv}m (${bottleneck.machineType || "SNLS"})` : "—"}
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E6DDCE] shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Machine Types
          </span>
          <p className="text-2xl font-black font-mono text-indigo-700 mt-1">
            {Object.keys(machineCounts).length} <span className="text-xs text-[#8C7E6E] font-normal font-sans">types</span>
          </p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E6DDCE] shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" /> Total Operations
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {lines.length} <span className="text-xs text-[#8C7E6E] font-normal font-sans">steps</span>
          </p>
        </div>
      </div>

      {/* ── 3. Operations Sequence Builder ───────────────────────────── */}
      <div className="border border-[#E6DDCE] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="bg-[#F9F7F4] p-4 border-b border-[#E6DDCE] flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#221912]">
              Sequential Operation Routing &amp; SMV Breakdown
            </h3>
            <p className="text-[11px] text-[#8C7E6E] mt-0.5">
              Select operations from master catalog. SMVs and machine types will auto-populate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkPickerOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bulk Add from Library</span>
            </button>

            <button
              type="button"
              onClick={addLine}
              className="px-3.5 py-1.5 bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>
        </div>

        {/* Operations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFCFB] border-b border-[#E6DDCE] text-[10.5px] font-bold text-[#8C7E6E] uppercase">
                <th className="py-3 px-3 w-14 text-center">Seq</th>
                <th className="py-3 px-2 w-16 text-center">Move</th>
                <th className="py-3 px-4 min-w-[220px]">Operation Catalog</th>
                <th className="py-3 px-3 w-28 text-right">SMV (min)</th>
                <th className="py-3 px-4 min-w-[180px]">Machine Type</th>
                <th className="py-3 px-3 w-20 text-center">Req. Skill</th>
                <th className="py-3 px-4 min-w-[160px]">Quality Notes</th>
                <th className="py-3 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {lines.map((line, index) => (
                <tr key={line.id} className="hover:bg-[#FEFCF9] transition-colors group">
                  {/* Sequence # */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-[#8C7E6E]">
                    {line.sequence}
                  </td>

                  {/* Move Up/Down Controls */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveLine(index, "up")}
                        className="p-1 rounded text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lines.length - 1}
                        onClick={() => moveLine(index, "down")}
                        className="p-1 rounded text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Operation Selector */}
                  <td className="py-2.5 px-4">
                    <select
                      value={line.operationId}
                      onChange={(e) => {
                        const opId = e.target.value;
                        const chosen = activeOps.find((o) => String(o.id) === String(opId));
                        setLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? {
                                  ...l,
                                  operationId: opId,
                                  operationCode: chosen?.operationCode,
                                  operationName: chosen?.name,
                                  smv: chosen?.standardSmv ? Number(chosen.standardSmv) : l.smv,
                                  machineType: chosen?.machineType || l.machineType || "Single Needle Lockstitch (SNLS)",
                                  skillRatingRequired: (Number(chosen?.skillLevel) || l.skillRatingRequired || 3) as 1 | 2 | 3 | 4 | 5,
                                }
                              : l
                          )
                        );
                      }}
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-xl px-2 text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                    >
                      <option value="">-- Choose Operation from Catalog --</option>
                      {activeOps.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.operationCode} - {op.name} ({op.machineType || "SNLS"}) · {op.standardSmv || 0.5}m
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* SMV (min) */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={line.smv || ""}
                      onChange={(e) => updateLine(line.id, "smv", parseFloat(e.target.value) || 0)}
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-xl px-2 text-xs text-[#221912] text-right font-mono font-bold focus:outline-hidden focus:border-[#9C5B3C]"
                    />
                  </td>

                  {/* Machine Type */}
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={line.machineType || ""}
                      onChange={(e) => updateLine(line.id, "machineType", e.target.value)}
                      placeholder="e.g. 4-Thread Overlock"
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-xl px-2 text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                    />
                  </td>

                  {/* Required Skill */}
                  <td className="py-2.5 px-3 text-center">
                    <select
                      value={line.skillRatingRequired || 3}
                      onChange={(e) => updateLine(line.id, "skillRatingRequired", parseInt(e.target.value))}
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-xl px-2 text-xs font-bold text-center text-emerald-800 focus:outline-hidden focus:border-[#9C5B3C]"
                    >
                      <option value={1}>L1 (Basic)</option>
                      <option value={2}>L2 (Standard)</option>
                      <option value={3}>L3 (Skilled)</option>
                      <option value={4}>L4 (Advanced)</option>
                      <option value={5}>L5 (Expert)</option>
                    </select>
                  </td>

                  {/* Quality Notes */}
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={line.notes || ""}
                      onChange={(e) => updateLine(line.id, "notes", e.target.value)}
                      placeholder="e.g. 1/4 inch gauge guide..."
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-xl px-2 text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                    />
                  </td>

                  {/* Delete Row */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {lines.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C7E6E] italic">
                    No operations in sequence yet. Click "Add Step" or "Bulk Add from Library".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bulk Add Modal ─────────────────────────────────────────── */}
      {isBulkPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E6DDCE] shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-3">
              <div>
                <h3 className="text-base font-black text-[#221912]">Select Operations from Catalog</h3>
                <p className="text-xs text-[#8C7E6E]">Pick multiple master operations to insert into this bulletin</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkPickerOpen(false)}
                className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search operation name, code, machine..."
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 max-h-96 custom-scrollbar pr-1">
              {filteredBulkOps.map((op) => {
                const isSelected = selectedBulkOpIds.includes(String(op.id));
                return (
                  <label
                    key={op.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#9C5B3C]/10 border-[#9C5B3C] text-[#221912]"
                        : "bg-white border-[#E6DDCE] hover:bg-[#F6F1E8]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedBulkOpIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== String(op.id))
                              : [...prev, String(op.id)]
                          );
                        }}
                        className="rounded text-[#9C5B3C] focus:ring-[#9C5B3C]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#9C5B3C]">{op.operationCode}</span>
                          <span className="text-xs font-bold text-[#221912]">{op.name}</span>
                        </div>
                        <div className="text-[11px] text-[#8C7E6E] mt-0.5">
                          {op.machineType || "Single Needle"} · Level {op.skillLevel || 3}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#77876F]">
                      {op.standardSmv || 0.5} min
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-[#E6DDCE] pt-3">
              <span className="text-xs font-bold text-[#8C7E6E]">
                {selectedBulkOpIds.length} operations selected
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsBulkPickerOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" disabled={selectedBulkOpIds.length === 0} onClick={handleBulkAddConfirm}>
                  Add Selected ({selectedBulkOpIds.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Form Actions ────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#E6DDCE]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white">
          {initialData ? "Update Operation Bulletin" : "Save Operation Bulletin"}
        </Button>
      </div>
    </form>
  );
}
