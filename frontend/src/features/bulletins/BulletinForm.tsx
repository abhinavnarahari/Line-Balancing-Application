import { useState, useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { CreateBulletinDTO, BulletinLine } from "./api";
import type { Style } from "../styles/api";
import type { Operation } from "../operations/api";

interface BulletinFormProps {
  styles: Style[];
  operations: Operation[];
  onSubmit: (data: CreateBulletinDTO) => Promise<void>;
  onCancel: () => void;
}

export function BulletinForm({ styles, operations, onSubmit, onCancel }: BulletinFormProps) {
  const [formData, setFormData] = useState<Omit<CreateBulletinDTO, "lines">>({
    bulletinCode: "",
    name: "",
    styleIds: [],
    version: 1,
    status: "DRAFT",
  });
  
  const [lines, setLines] = useState<BulletinLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeStyles = useMemo(() => styles.filter(s => s.active), [styles]);
  const activeOps = useMemo(() => operations.filter(o => o.active).sort((a,b) => a.sequence - b.sequence), [operations]);

  const totalSMV = useMemo(() => lines.reduce((acc, curr) => acc + (Number(curr.smv) || 0), 0), [lines]);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      id: Date.now().toString(),
      sequence: lines.length + 1,
      operationId: "",
      smv: 0,
      machineType: "Single Needle",
      skillRatingRequired: 3,
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string | number, field: keyof BulletinLine, value: any) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const removeLine = (id: string | number) => {
    setLines(lines.filter(l => l.id !== id).map((l, idx) => ({ ...l, sequence: idx + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError("Operation bulletin must have at least one operation line.");
      return;
    }
    if (lines.some(l => !l.operationId)) {
      setError("All operation lines must have an operation selected.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ ...formData, lines });
    } catch (err: any) {
      setError(err.message || "Failed to create bulletin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="font-semibold mr-1">Error:</span> {error}
        </div>
      )}

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Bulletin Code" name="bulletinCode" value={formData.bulletinCode} onChange={handleHeaderChange} required placeholder="e.g. OB-TS-001" hint="Must be unique" />
        <Input label="Bulletin Name" name="name" value={formData.name} onChange={handleHeaderChange} required placeholder="e.g. Basic Crew Neck T-Shirt Flow" />
        
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Linked Styles</label>
          <div className="flex flex-wrap gap-2 p-3 border border-[#E6DDCE] rounded-sm bg-[#FAFAF8] max-h-32 overflow-y-auto">
            {activeStyles.map(s => (
              <label key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border cursor-pointer transition-colors text-xs font-semibold ${formData.styleIds.includes(s.id.toString()) ? "bg-[#B48259] text-white border-[#9B5A32]" : "bg-white text-[#221912] border-[#E6DDCE] hover:bg-[#F0EAE0]"}`}>
                <input type="checkbox" className="sr-only" checked={formData.styleIds.includes(s.id.toString())} onChange={() => handleStyleToggle(s.id.toString())} />
                {s.styleNo}
              </label>
            ))}
            {activeStyles.length === 0 && <span className="text-xs text-[#8C7E6E]">No active styles available.</span>}
          </div>
          <p className="text-[10px] text-[#8C7E6E]">Select multiple styles that share this identical operation sequence.</p>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Status</label>
          <select name="status" value={formData.status} onChange={handleHeaderChange} className="h-10 bg-white border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259]">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="border border-[#F0EAE0] rounded-sm overflow-hidden mt-6">
        <div className="bg-[#FAFAF8] p-3 border-b border-[#F0EAE0] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-[#221912]">Operation Sequence</h3>
            <p className="text-[10px] text-[#8C7E6E]">Define the standard minute value (SMV) for each step.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-mono font-bold text-[#8C7E6E] bg-white px-2 py-1 rounded-sm border border-[#E6DDCE]">
              TOTAL SMV: <span className="text-[#B48259]">{totalSMV.toFixed(2)}</span>
            </p>
            <Button type="button" size="xs" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#F0EAE0]">
                <th className="w-10"></th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6E]">Seq</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6E] min-w-[200px]">Operation</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6E]">SMV (min)</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6E]">Machine</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C7E6E]">Req. Skill</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0EAE0]">
              {lines.map((line) => (
                <tr key={line.id} className="hover:bg-[#FEFCF9] group">
                  <td className="px-2 text-center text-[#E6DDCE] cursor-grab active:cursor-grabbing"><GripVertical className="h-4 w-4 mx-auto" /></td>
                  <td className="px-3 py-2 font-mono text-xs text-[#8C7E6E]">{line.sequence}</td>
                  <td className="px-3 py-2">
                    <select
                      value={line.operationId}
                      onChange={(e) => updateLine(line.id, "operationId", e.target.value)}
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-sm px-2 text-xs text-[#221912] focus:outline-none focus:border-[#B48259]"
                    >
                      <option value="">-- Select Operation --</option>
                      {activeOps.map(op => (
                        <option key={op.id} value={op.id}>{op.operationCode} - {op.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={line.smv || ""}
                      onChange={(e) => updateLine(line.id, "smv", parseFloat(e.target.value) || 0)}
                      className="w-20 h-8 bg-white border border-[#E6DDCE] rounded-sm px-2 text-xs text-[#221912] text-right focus:outline-none focus:border-[#B48259] font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={line.machineType}
                      onChange={(e) => updateLine(line.id, "machineType", e.target.value)}
                      className="w-full h-8 bg-white border border-[#E6DDCE] rounded-sm px-2 text-xs text-[#221912] focus:outline-none focus:border-[#B48259]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={line.skillRatingRequired}
                      onChange={(e) => updateLine(line.id, "skillRatingRequired", parseInt(e.target.value))}
                      className="w-16 h-8 bg-white border border-[#E6DDCE] rounded-sm px-2 text-xs text-[#221912] focus:outline-none focus:border-[#B48259] font-mono font-bold"
                    >
                      {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-2 text-center">
                    <button type="button" onClick={() => removeLine(line.id)} className="text-[#8C7E6E] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-[#8C7E6E]">
                    No operations added. Click "Add Row" to begin building the sequence.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F0EAE0]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>Save Bulletin</Button>
      </div>
    </form>
  );
}

