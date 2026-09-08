import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { SewingLine } from "./api";

interface LineFormProps {
  initialData?: SewingLine | null;
  suggestedLineCode?: string;
  onSubmit: (data: Omit<SewingLine, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export function LineForm({ initialData, suggestedLineCode, onSubmit, onCancel }: LineFormProps) {
  const [formData, setFormData] = useState({
    lineCode: initialData?.lineCode || suggestedLineCode || "LINE-01",
    lineName: initialData?.lineName || "",
    floor: initialData?.floor || "Floor 1",
    supervisorName: initialData?.supervisorName || "",
    operatorCount: initialData?.operatorCount ?? 20,
    machineCount: initialData?.machineCount ?? 22,
    workingHours: initialData?.workingHours ? Number(initialData.workingHours) : 8.0,
    capacityPerDay: initialData?.capacityPerDay ?? 1000,
    targetEfficiencyPercent: initialData?.targetEfficiencyPercent ? Number(initialData.targetEfficiencyPercent) : 85,
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        lineCode: initialData.lineCode,
        lineName: initialData.lineName,
        floor: initialData.floor || "Floor 1",
        supervisorName: initialData.supervisorName || "",
        operatorCount: initialData.operatorCount ?? 20,
        machineCount: initialData.machineCount ?? 22,
        workingHours: initialData.workingHours ? Number(initialData.workingHours) : 8.0,
        capacityPerDay: initialData.capacityPerDay ?? 1000,
        targetEfficiencyPercent: initialData.targetEfficiencyPercent ? Number(initialData.targetEfficiencyPercent) : 85,
        active: initialData.active,
      });
    } else if (!formData.lineCode && suggestedLineCode) {
      setFormData((prev) => ({
        ...prev,
        lineCode: suggestedLineCode,
      }));
    }
  }, [initialData, suggestedLineCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Line Code"
          id="lineCode"
          name="lineCode"
          value={formData.lineCode}
          onChange={handleChange}
          placeholder="e.g. LINE-01"
          required
          hint="Sequential line identifier"
        />
        <Input
          label="Line Name / Description"
          id="lineName"
          name="lineName"
          value={formData.lineName}
          onChange={handleChange}
          placeholder="e.g. Line 01 - Polo & T-Shirt"
          required
        />
        <Input
          label="Floor / Location"
          id="floor"
          name="floor"
          value={formData.floor}
          onChange={handleChange}
          placeholder="e.g. Floor 1 - Section A"
        />
        <Input
          label="Line Supervisor"
          id="supervisorName"
          name="supervisorName"
          value={formData.supervisorName}
          onChange={handleChange}
          placeholder="e.g. Rahim Khan"
        />
        <Input
          label="No. of Operators"
          id="operatorCount"
          name="operatorCount"
          type="number"
          min="1"
          max="200"
          value={formData.operatorCount}
          onChange={handleChange}
          required
        />
        <Input
          label="No. of Machines"
          id="machineCount"
          name="machineCount"
          type="number"
          min="1"
          max="200"
          value={formData.machineCount}
          onChange={handleChange}
          required
        />
        <Input
          label="Working Hours (hrs/day)"
          id="workingHours"
          name="workingHours"
          type="number"
          step="0.5"
          min="1"
          max="24"
          value={formData.workingHours}
          onChange={handleChange}
          required
        />
        <Input
          label="Capacity/Day (pcs)"
          id="capacityPerDay"
          name="capacityPerDay"
          type="number"
          min="1"
          max="50000"
          value={formData.capacityPerDay}
          onChange={handleChange}
          required
        />
        <Input
          label="Target Efficiency (%)"
          id="targetEfficiencyPercent"
          name="targetEfficiencyPercent"
          type="number"
          step="0.1"
          min="10"
          max="100"
          value={formData.targetEfficiencyPercent}
          onChange={handleChange}
          required
        />

        <div className="flex flex-col space-y-2 md:col-span-2">
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">Status</label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
            }
            className="flex h-11 w-full bg-white border border-[#F1F5F9] px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]"
          >
            <option value="true">Active (In Production)</option>
            <option value="false">Inactive / Paused</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Line" : "Create Line"}
        </Button>
      </div>
    </form>
  );
}
