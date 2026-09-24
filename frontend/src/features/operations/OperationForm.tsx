import { useState, useEffect, useMemo } from "react";
import { Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { machinesApi, type Machine } from "../machines/api";
import type { Operation } from "./api";

interface OperationFormProps {
  existingOperations?: Operation[];
  initialData?: Operation | null;
  onSubmit: (data: Omit<Operation, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const COMMON_MACHINE_PRESETS = [
  "Single Needle Lockstitch",
  "4-Thread Overlock",
  "5-Thread Overlock",
  "Flatlock / Interlock",
  "Buttonhole Machine",
  "Button Attach Machine",
  "Bar Tack Machine",
  "Feed-off-the-arm Machine",
  "Double Needle Lockstitch",
  "Blind Stitch Machine",
  "Manual / Trim Station",
  "Inspection Table",
  "Ironing / Pressing Table",
  "Manual / Packing Table",
  "Manual / Carton Station",
];

export function OperationForm({ existingOperations = [], initialData, onSubmit, onCancel }: OperationFormProps) {
  const sequentialCode = useMemo(() => {
    const list = existingOperations || [];
    const numbers = list
      .map(o => {
        const match = (o.operationCode || "").match(/\d+/g);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : list.length;
    return `OP-${String(maxNum + 1).padStart(3, "0")}`;
  }, [existingOperations]);

  const initialSmv = initialData?.standardSmv !== undefined ? Number(initialData.standardSmv) : 0.5;
  const initialSec = Math.round(initialSmv * 60 * 10) / 10;

  const [secondsVal, setSecondsVal] = useState<number | string>(initialSec);
  const [smvVal, setSmvVal] = useState<number | string>(initialSmv);

  const [formData, setFormData] = useState({
    operationCode: initialData?.operationCode || sequentialCode,
    name: initialData?.name || "",
    description: initialData?.description || "",
    sequence: initialData?.sequence || (existingOperations.length + 1),
    standardSmv: initialSmv,
    machineType: initialData?.machineType || "Single Needle Lockstitch",
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (!initialData && !formData.operationCode && sequentialCode) {
      setFormData(prev => ({ ...prev, operationCode: sequentialCode }));
    }
  }, [sequentialCode, initialData]);

  // Sync when initialData changes
  useEffect(() => {
    if (initialData) {
      const smv = initialData.standardSmv !== undefined ? Number(initialData.standardSmv) : 0.5;
      const sec = Math.round(smv * 60 * 10) / 10;
      setSmvVal(smv);
      setSecondsVal(sec);
      setFormData(prev => ({
        ...prev,
        operationCode: initialData.operationCode,
        name: initialData.name,
        description: initialData.description || "",
        sequence: initialData.sequence || 1,
        standardSmv: smv,
        machineType: initialData.machineType || "Single Needle Lockstitch",
        active: initialData.active ?? true,
      }));
    }
  }, [initialData]);

  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    machinesApi.getMachines()
      .then((res) => setMachines(res || []))
      .catch(console.error);
  }, []);

  // Merge inventory machine types with standard presets for an exhaustive list
  const allMachineTypes = Array.from(
    new Set([
      ...machines.map((m) => m.machineType).filter(Boolean),
      ...COMMON_MACHINE_PRESETS,
      formData.machineType,
    ].filter(Boolean))
  );

  const matchedMachines = machines.filter(
    (m) => m.machineType.toLowerCase() === formData.machineType.toLowerCase()
  );
  const availableCount = matchedMachines.filter((m) => m.status === "AVAILABLE" && m.active).length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    }));
  };

  const handleSecondsChange = (valStr: string) => {
    setSecondsVal(valStr);
    const sec = parseFloat(valStr);
    if (!isNaN(sec) && sec > 0) {
      const min = Math.round((sec / 60) * 1000) / 1000;
      setSmvVal(min);
      setFormData(prev => ({ ...prev, standardSmv: min }));
    }
  };

  const handleSmvMinutesChange = (valStr: string) => {
    setSmvVal(valStr);
    const min = parseFloat(valStr);
    if (!isNaN(min) && min > 0) {
      const sec = Math.round(min * 60 * 10) / 10;
      setSecondsVal(sec);
      setFormData(prev => ({ ...prev, standardSmv: min }));
    }
  };

  const setSecondsPreset = (sec: number) => {
    setSecondsVal(sec);
    const min = Math.round((sec / 60) * 1000) / 1000;
    setSmvVal(min);
    setFormData(prev => ({ ...prev, standardSmv: min }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSec = typeof secondsVal === "number" ? secondsVal : parseFloat(secondsVal);
    const finalSmv = typeof smvVal === "number" ? smvVal : parseFloat(smvVal);
    const resolvedSmv = !isNaN(finalSmv) && finalSmv > 0
      ? finalSmv
      : (!isNaN(finalSec) && finalSec > 0 ? finalSec / 60 : 0.5);

    onSubmit({
      ...formData,
      sequence: Number(formData.sequence) || 1,
      standardSmv: resolvedSmv,
      machineType: formData.machineType.trim() || "Single Needle Lockstitch",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Operation Code"
          id="operationCode"
          name="operationCode"
          value={formData.operationCode}
          onChange={handleChange}
          placeholder="e.g. OP-001"
          required
          hint="Sequential standard operation identifier"
        />
        <Input
          label="Sequence"
          id="sequence"
          name="sequence"
          type="number"
          min="1"
          value={formData.sequence}
          onChange={handleChange}
          required
        />
        <div className="md:col-span-2">
          <Input
            label="Operation Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Shoulder Join"
            required
          />
        </div>

        {/* Standard SMV / Target Cycle Time (Seconds Primary) */}
        <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Standard SMV & Target Cycle Time
              </label>
              <p className="text-[11px] text-slate-500 font-medium">
                Enter benchmark cycle time in seconds (or standard minutes).
              </p>
            </div>
            
            {/* Quick Seconds Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-semibold text-slate-400 mr-1">Presets:</span>
              {[15, 20, 24, 30, 45, 60].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSecondsPreset(s)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    Number(secondsVal) === s
                      ? "bg-[#9C5B3C] text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#9C5B3C] hover:text-[#9C5B3C]"
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Primary Seconds Input */}
            <div className="bg-white border-2 border-[#9C5B3C]/40 focus-within:border-[#9C5B3C] rounded-xl p-3 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="cycleSeconds" className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>Cycle Time in Seconds</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-[#9C5B3C] font-bold text-[10px] border border-amber-200">
                    Primary
                  </span>
                </label>
                <span className="text-[10.5px] font-mono text-slate-400 font-semibold">sec</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="cycleSeconds"
                  step="0.5"
                  min="1"
                  value={secondsVal}
                  onChange={(e) => handleSecondsChange(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full text-lg font-mono font-extrabold text-slate-900 focus:outline-none bg-transparent"
                  required
                />
                <span className="text-sm font-bold text-[#9C5B3C] font-mono">seconds</span>
              </div>
            </div>

            {/* Equivalent Minutes Input */}
            <div className="bg-white border border-slate-200 focus-within:border-[#9C5B3C] rounded-xl p-3 shadow-2xs transition-colors">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="smvMinutes" className="text-xs font-bold text-slate-700">
                  Equivalent Standard SMV (SAM)
                </label>
                <span className="text-[10.5px] font-mono text-slate-400 font-semibold">min</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="smvMinutes"
                  step="0.01"
                  min="0.01"
                  value={smvVal}
                  onChange={(e) => handleSmvMinutesChange(e.target.value)}
                  placeholder="e.g. 0.40"
                  className="w-full text-lg font-mono font-bold text-slate-700 focus:outline-none bg-transparent"
                  required
                />
                <span className="text-sm font-semibold text-slate-500 font-mono">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">
            Status
          </label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) => setFormData((p) => ({ ...p, active: e.target.value === "true" }))}
            className="flex h-11 w-full bg-white border border-[#E6DDCE] rounded-xl px-3 py-2 text-sm text-[#221912] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#9C5B3C] focus:border-[#9C5B3C]"
          >
            <option value="true">Active (Available in Bulletins & Lines)</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Sewing Machine Attachment */}
        <div className="md:col-span-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-[#221912] uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-[#9C5B3C]" />
              <span>Assigned Sewing Machine / Workstation</span>
            </label>
            {formData.machineType && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  availableCount > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : matchedMachines.length > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {availableCount > 0 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{availableCount} available in shopfloor</span>
                  </>
                ) : matchedMachines.length > 0 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>{matchedMachines.length} in use / maintenance</span>
                  </>
                ) : (
                  <span>Special / Manual Station</span>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8C7E6E] mb-1">
                Select Standard Machinery Preset
              </label>
              <select
                value={allMachineTypes.includes(formData.machineType) ? formData.machineType : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData((p) => ({ ...p, machineType: e.target.value }));
                  }
                }}
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-lg px-3 text-xs text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs font-medium"
              >
                <option value="">-- Choose Machine Preset --</option>
                {allMachineTypes.map((mType) => {
                  const total = machines.filter(
                    (m) => m.machineType.toLowerCase() === mType.toLowerCase()
                  ).length;
                  return (
                    <option key={mType} value={mType}>
                      {mType} {total > 0 ? `(${total} units in plant)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8C7E6E] mb-1">
                Or Type Custom Machine Specification
              </label>
              <input
                type="text"
                name="machineType"
                value={formData.machineType}
                onChange={handleChange}
                placeholder="e.g. 4-Thread Overlock or Special Gauge"
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-lg px-3 text-xs text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs font-mono font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-[#8C7E6E]">
            Description / Standard Work Procedure
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe seam construction, fabric feeding, and standard work method…"
            className="w-full bg-white border border-[#E6DDCE] rounded-xl px-4 py-2.5 text-sm text-[#221912] placeholder-slate-400 shadow-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#9C5B3C] focus:border-[#9C5B3C]"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#E6DDCE]">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="bg-[#9C5B3C] hover:bg-[#854D33] text-white font-bold">
          {initialData ? "Update Operation" : "Create Operation"}
        </Button>
      </div>
    </form>
  );
}
