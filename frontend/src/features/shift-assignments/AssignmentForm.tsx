import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { ShiftAssignment } from "./mockApi";
import type { Operator } from "../operators/mockApi";
import type { Shift } from "../shifts/types";

interface AssignmentFormProps {
  operators: Operator[];
  shifts: Shift[];
  onSubmit: (data: Omit<ShiftAssignment, "id" | "status" | "createdAt">) => void;
  onCancel: () => void;
}

export function AssignmentForm({ operators, shifts, onSubmit, onCancel }: AssignmentFormProps) {
  const [formData, setFormData] = useState({
    operatorId: "",
    shiftId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "", // empty means null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.operatorId || !formData.shiftId) return;
    
    onSubmit({
      operatorId: formData.operatorId,
      shiftId: formData.shiftId,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6E6656]">Operator</label>
          <select
            value={formData.operatorId}
            onChange={(e) => setFormData(p => ({ ...p, operatorId: e.target.value }))}
            className="h-10 bg-white border border-[#D0C8B4] rounded-sm px-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-2 focus:ring-[#B8763F]/15"
            required
          >
            <option value="">Select an operator...</option>
            {operators.map(op => (
              <option key={op.id} value={op.id}>{op.employeeId} - {op.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6E6656]">Shift</label>
          <select
            value={formData.shiftId}
            onChange={(e) => setFormData(p => ({ ...p, shiftId: e.target.value }))}
            className="h-10 bg-white border border-[#D0C8B4] rounded-sm px-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-2 focus:ring-[#B8763F]/15"
            required
          >
            <option value="">Select a shift...</option>
            {shifts.map(sh => (
              <option key={sh.id} value={sh.id}>{sh.shiftName} ({sh.startTime} - {sh.endTime})</option>
            ))}
          </select>
        </div>

        <Input
          label="Effective From"
          type="date"
          value={formData.effectiveFrom}
          onChange={(e) => setFormData(p => ({ ...p, effectiveFrom: e.target.value }))}
          required
        />
        
        <Input
          label="Effective To"
          type="date"
          value={formData.effectiveTo}
          onChange={(e) => setFormData(p => ({ ...p, effectiveTo: e.target.value }))}
          hint="Leave blank if assigning indefinitely"
        />
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#E0D8C0]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Assign Shift</Button>
      </div>
    </form>
  );
}
