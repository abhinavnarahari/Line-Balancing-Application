import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { SkillAssessment } from "./api";

interface SkillAssessmentFormProps {
  operatorId: string;
  operationId: string;
  operatorName: string;
  operationName: string;
  onSubmit: (data: Omit<SkillAssessment, "id" | "revision">) => void;
  onCancel: () => void;
}

export function SkillAssessmentForm({ operatorId, operationId, operatorName, operationName, onSubmit, onCancel }: SkillAssessmentFormProps) {
  const [formData, setFormData] = useState({
    rating: 3 as 1 | 2 | 3 | 4 | 5,
    cycleTimeSeconds: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      operatorId,
      operationId,
      rating: formData.rating,
      cycleTimeSeconds: parseFloat(formData.cycleTimeSeconds),
      effectiveDate: formData.effectiveDate,
      notes: formData.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#F8FAFC] p-4 rounded-sm border border-[#F1F5F9] mb-6">
        <p className="text-[11px] uppercase tracking-wider text-[#F8FAFC]0 font-semibold mb-1">Assessment Target</p>
        <p className="text-sm text-[#0F172A]">
          <span className="font-semibold">{operatorName}</span> on <span className="font-semibold">{operationName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Skill Rating</label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((r) => (
              <label
                key={r}
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all ${
                  formData.rating === r
                    ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] ring-1 ring-[#2563EB]"
                    : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]"
                }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={r}
                  checked={formData.rating === r}
                  onChange={() => setFormData(p => ({ ...p, rating: r as 1 | 2 | 3 | 4 | 5 }))}
                  className="sr-only"
                />
                <span className="text-xl font-bold font-mono mb-1">{r}</span>
                <span className="text-[9px] uppercase tracking-wider text-center leading-tight">
                  {r === 1 ? "Beginner" : r === 2 ? "Basic" : r === 3 ? "Standard" : r === 4 ? "Good" : "Expert"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Input
          label="Cycle Time (seconds)"
          type="number"
          step="0.01"
          min="0.1"
          value={formData.cycleTimeSeconds}
          onChange={(e) => setFormData(p => ({ ...p, cycleTimeSeconds: e.target.value }))}
          required
          hint="Standard time in seconds"
          rightIcon={<span className="text-[10px] font-semibold">sec</span>}
        />

        <Input
          label="Effective Date"
          type="date"
          value={formData.effectiveDate}
          onChange={(e) => setFormData(p => ({ ...p, effectiveDate: e.target.value }))}
          required
        />

        <div className="md:col-span-2">
          <Input
            label="Assessment Notes"
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
            placeholder="Optional comments on technique or quality..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Save Assessment</Button>
      </div>
    </form>
  );
}

