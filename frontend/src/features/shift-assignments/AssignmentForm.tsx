import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PremiumSelect } from "../../components/ui/PremiumUI";
import type { ShiftAssignment } from "./api";
import type { Operator } from "../operators/api";
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
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Operator</label>
          <PremiumSelect
            value={formData.operatorId}
            onChange={(val) => setFormData(p => ({ ...p, operatorId: val }))}
            options={[
              { value: "", label: "Select an operator..." },
              ...operators.map(op => ({ value: op.id, label: `${op.employeeId} - ${op.name}` }))
            ]}
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Shift</label>
          <PremiumSelect
            value={formData.shiftId}
            onChange={(val) => setFormData(p => ({ ...p, shiftId: val }))}
            options={[
              { value: "", label: "Select a shift..." },
              ...shifts.map(sh => ({ value: sh.id, label: `${sh.shiftName} (${sh.startTime} - ${sh.endTime})` }))
            ]}
          />
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

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F0EAE0]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Assign Shift</Button>
      </div>
    </form>
  );
}

