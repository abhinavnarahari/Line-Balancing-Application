import { useState, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Machine, MachineStatus } from "./api";
import type { SewingLine } from "../lines/api";

interface MachineFormProps {
  existingMachines?: Machine[];
  initialData?: Machine | null;
  lines: SewingLine[];
  onSubmit: (data: Omit<Machine, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const COMMON_MACHINE_TYPES = [
  "Single Needle Lockstitch",
  "Double Needle Lockstitch",
  "4-Thread Overlock",
  "5-Thread Overlock",
  "Flatlock / Interlock",
  "Feed-off-the-arm Machine",
  "Buttonhole Machine",
  "Button Attach Machine",
  "Bar Tack Machine",
  "Blind Stitch Machine",
  "Snap Button Machine",
  "Zig-Zag Machine",
  "Automatic Pocket Welting",
];

export function MachineForm({ existingMachines = [], initialData, lines, onSubmit, onCancel }: MachineFormProps) {
  const currentYear = new Date().getFullYear();

  const sequentialCode = useMemo(() => {
    const list = existingMachines || [];
    const numbers = list
      .map(m => {
        const match = (m.machineCode || "").match(/\d+/g);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : list.length;
    return `MC-${String(maxNum + 1).padStart(3, "0")}`;
  }, [existingMachines]);

  const [formData, setFormData] = useState({
    machineCode: initialData?.machineCode || sequentialCode,
    machineType: initialData?.machineType || "Single Needle Lockstitch",
    brand: initialData?.brand || "Juki",
    model: initialData?.model || "",
    serialNo: initialData?.serialNo || `SN-${currentYear}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    lineId: initialData?.lineId ? String(initialData.lineId) : "",
    quantity: initialData?.quantity || 1,
    status: (initialData?.status || "AVAILABLE") as MachineStatus,
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        machineCode: initialData.machineCode,
        machineType: initialData.machineType,
        brand: initialData.brand || "Juki",
        model: initialData.model || "",
        serialNo: initialData.serialNo || "",
        lineId: initialData.lineId ? String(initialData.lineId) : "",
        quantity: initialData.quantity || 1,
        status: initialData.status || "AVAILABLE",
        active: initialData.active,
      });
    } else if (!formData.machineCode && sequentialCode) {
      setFormData(prev => ({ ...prev, machineCode: sequentialCode }));
    }
  }, [initialData, sequentialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: Number(formData.quantity) || 1,
      lineId: formData.lineId ? Number(formData.lineId) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Machine Code / Asset ID"
          id="machineCode"
          name="machineCode"
          value={formData.machineCode}
          onChange={handleChange}
          placeholder="e.g. MC-001"
          required
          hint="Sequential machine asset identifier"
        />

        <div className="flex flex-col space-y-2">
          <label htmlFor="machineType" className="text-sm font-medium text-[#475569]">
            Machine Type / Category
          </label>
          <select
            id="machineType"
            name="machineType"
            value={formData.machineType}
            onChange={handleChange}
            className="flex h-11 w-full bg-white border border-[#F1F5F9] px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            {COMMON_MACHINE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Brand / Manufacturer"
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="e.g. Juki, Brother, Pegasus, Jack"
        />

        <Input
          label="Model Number"
          id="model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          placeholder="e.g. DDL-8700, M952-52"
        />

        <Input
          label="Serial Number"
          id="serialNo"
          name="serialNo"
          value={formData.serialNo}
          onChange={handleChange}
          placeholder="e.g. SN-JK-2024-998"
        />

        <Input
          label="Quantity (Units)"
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          step="1"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="1"
          required
          hint="Number of units in this asset record"
        />

        <div className="flex flex-col space-y-2">
          <label htmlFor="lineId" className="text-sm font-medium text-[#475569]">
            Assigned Line (Optional)
          </label>
          <select
            id="lineId"
            name="lineId"
            value={formData.lineId}
            onChange={handleChange}
            className="flex h-11 w-full bg-white border border-[#F1F5F9] px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            <option value="">— Unallocated / General Pool —</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lineCode} · {l.lineName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-[#475569]">
            Operational Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="flex h-11 w-full bg-white border border-[#F1F5F9] px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            <option value="AVAILABLE">Available / Ready</option>
            <option value="IN_USE">In Use on Line</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance / Repair</option>
            <option value="IDLE">Idle / Standby</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">Active</label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
            }
            className="flex h-11 w-full bg-white border border-[#F1F5F9] px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            <option value="true">Active Asset</option>
            <option value="false">Decommissioned / Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Machine" : "Register Machine"}
        </Button>
      </div>
    </form>
  );
}
