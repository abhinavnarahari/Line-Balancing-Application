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
  assignments: ShiftAssignment[];
  onSubmit: (data: Omit<ShiftAssignment, "id" | "status" | "createdAt">[]) => void;
  onCancel: () => void;
}

export function AssignmentForm({ operators, shifts, assignments, onSubmit, onCancel }: AssignmentFormProps) {
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    operatorIds: [] as string[],
    shiftId: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "", // empty means null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.operatorIds.length === 0 || !formData.shiftId) return;
    
    const assignments = formData.operatorIds.map(opId => ({
      operatorId: opId,
      shiftId: formData.shiftId,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo || null,
    }));
    
    onSubmit(assignments);
  };

  const toggleOperator = (opId: string) => {
    setFormData(prev => ({
      ...prev,
      operatorIds: prev.operatorIds.includes(opId)
        ? prev.operatorIds.filter(id => id !== opId)
        : [...prev.operatorIds, opId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Operators</label>
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search operators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 text-[11px] bg-white border border-[#E2E8F0] rounded-sm pl-3 pr-3 text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
            />
          </div>
          <div className="h-40 overflow-y-auto bg-white border border-[#E2E8F0] rounded-sm p-2 space-y-1">
            {operators
              .filter(op => op.name.toLowerCase().includes(search.toLowerCase()) || op.employeeId.toLowerCase().includes(search.toLowerCase()))
              .map(op => {
                const isAlreadyAssigned = formData.shiftId && assignments.some(a => 
                  String(a.operatorId) === String(op.id) && 
                  String(a.shiftId) === String(formData.shiftId) && 
                  (a.status.toUpperCase() === "ACTIVE" || a.status.toUpperCase() === "SCHEDULED")
                );

                return (
                  <label key={op.id} className={`flex items-center justify-between gap-2 p-1.5 rounded cursor-pointer ${isAlreadyAssigned ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:bg-[#FFFFFF]'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={!!isAlreadyAssigned}
                        checked={formData.operatorIds.includes(String(op.id))}
                        onChange={() => toggleOperator(String(op.id))}
                        className="rounded-sm border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB] disabled:opacity-50"
                      />
                      <span className="text-sm text-[#0F172A]">{op.employeeId} - {op.name}</span>
                    </div>
                    {isAlreadyAssigned && (
                      <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide">Already Assigned</span>
                    )}
                  </label>
                );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Assign Shift</Button>
      </div>
    </form>
  );
}

