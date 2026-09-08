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

  const [formData, setFormData] = useState({
    operationCode: initialData?.operationCode || sequentialCode,
    name: initialData?.name || "",
    description: initialData?.description || "",
    sequence: initialData?.sequence || (existingOperations.length + 1),
    standardSmv: initialData?.standardSmv !== undefined ? Number(initialData.standardSmv) : 0.5,
    machineType: initialData?.machineType || "Single Needle Lockstitch",
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (!initialData && !formData.operationCode && sequentialCode) {
      setFormData(prev => ({ ...prev, operationCode: sequentialCode }));
    }
  }, [sequentialCode, initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sequence: Number(formData.sequence) || 1,
      standardSmv: Number(formData.standardSmv) || 0.5,
      machineType: formData.machineType.trim() || "Single Needle Lockstitch",
    });
  };

  const currentSeconds = Math.round((Number(formData.standardSmv) || 0) * 60);

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

        {/* Standard SMV */}
        <div>
          <Input
            label="Standard SMV (min)"
            id="standardSmv"
            name="standardSmv"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.standardSmv}
            onChange={handleChange}
            placeholder="e.g. 0.40"
            helperText={`${currentSeconds}s target cycle time`}
            required
          />
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">
            Status
          </label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) => setFormData((p) => ({ ...p, active: e.target.value === "true" }))}
            className="flex h-11 w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#0F172A] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            <option value="true">Active (Available in Bulletins & Lines)</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Sewing Machine Attachment */}
        <div className="md:col-span-2 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-blue-600" />
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Select Standard Machinery Preset
              </label>
              <select
                value={allMachineTypes.includes(formData.machineType) ? formData.machineType : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData((p) => ({ ...p, machineType: e.target.value }));
                  }
                }}
                className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs font-medium"
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Or Type Custom Machine Specification
              </label>
              <input
                type="text"
                name="machineType"
                value={formData.machineType}
                onChange={handleChange}
                placeholder="e.g. 4-Thread Overlock or Special Gauge"
                className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs font-mono font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-[#475569]">
            Description / Standard Work Procedure
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe seam construction, fabric feeding, and standard work method…"
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 shadow-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#E2E8F0]">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          {initialData ? "Update Operation" : "Create Operation"}
        </Button>
      </div>
    </form>
  );
}
