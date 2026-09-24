import React, { useState, useMemo } from "react";
import { X, UserCheck, Pin, Search, CheckCircle2, Clock } from "lucide-react";
import type { AllocationAssignmentItem, OperatorPoolItem } from "../types";

interface ManualOverrideModalProps {
  assignment: AllocationAssignmentItem | null;
  availableOperators: OperatorPoolItem[];
  onClose: () => void;
  onSaveOverride: (payload: {
    lineId: number;
    stationIndex: number;
    operatorId?: number | null;
    pinAsFixed?: boolean;
    justification?: string;
    performedBy?: string;
  }) => void;
}

export function ManualOverrideModal({
  assignment,
  availableOperators,
  onClose,
  onSaveOverride,
}: ManualOverrideModalProps) {
  if (!assignment) return null;

  const [search, setSearch] = useState("");
  const [selectedOpId, setSelectedOpId] = useState<string>(
    assignment.operatorId ? String(assignment.operatorId) : ""
  );
  const [pinFixed, setPinFixed] = useState<boolean>(assignment.isFixed || false);
  const [justification, setJustification] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>("Senior IE Specialist");

  const filteredOperators = useMemo(() => {
    return availableOperators.filter(
      (op) =>
        search === "" ||
        op.operatorName.toLowerCase().includes(search.toLowerCase()) ||
        op.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
        (op.department && op.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [availableOperators, search]);

  const selectedOp = useMemo(() => {
    return availableOperators.find((op) => String(op.operatorId) === selectedOpId);
  }, [availableOperators, selectedOpId]);

  // Projected Cycle Time Calculation
  const projectedCycleTime = useMemo(() => {
    if (!selectedOp) return assignment.effectiveCycleTimeSecs;
    const baseSmvSecs = (assignment.standardSmv || 1.0) * 60;
    const eff = (selectedOp.historicalEfficiency || 80) / 100;
    const skillMultiplier = selectedOp.averageSkillRating >= (assignment.requiredSkillLevel || 3) ? 0.95 : 1.15;
    return Math.round((baseSmvSecs / Math.max(0.4, eff)) * skillMultiplier);
  }, [selectedOp, assignment]);

  const cycleDelta = projectedCycleTime - assignment.effectiveCycleTimeSecs;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOverride({
      lineId: assignment.lineId,
      stationIndex: assignment.stationIndex,
      operatorId: selectedOpId ? Number(selectedOpId) : null,
      pinAsFixed: pinFixed,
      justification: justification || "Manual floor balancing override by IE",
      performedBy,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl border border-[#E6DDCE] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6DDCE] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9C5B3C]/10 flex items-center justify-center text-[#9C5B3C]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#221912]">
                Manual Workstation Operator Reassignment
              </h3>
              <p className="text-[11px] font-semibold text-[#8C7E6E]">
                {assignment.lineName} • Station {assignment.stationCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#E6DDCE]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Station Details Summary */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-xs">
            <div>
              <span className="text-[#8C7E6E] block text-[10px] uppercase font-bold">Operation</span>
              <span className="font-semibold text-[#221912] line-clamp-1">{assignment.operationName}</span>
            </div>
            <div>
              <span className="text-[#8C7E6E] block text-[10px] uppercase font-bold">Machine</span>
              <span className="font-semibold text-[#221912]">{assignment.requiredMachineType || "SNLS"}</span>
            </div>
            <div>
              <span className="text-[#8C7E6E] block text-[10px] uppercase font-bold">Target Rating</span>
              <span className="font-bold text-[#B48259]">R{assignment.requiredSkillLevel}+</span>
            </div>
            <div>
              <span className="text-[#8C7E6E] block text-[10px] uppercase font-bold">Current Operator</span>
              <span className="font-mono font-semibold text-[#9C5B3C] line-clamp-1">
                {assignment.operatorName || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Operator Search & Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#221912]">
                Select Qualified Operator from Floor Pool:
              </label>
              <span className="text-[11px] text-[#8C7E6E] font-medium">
                {filteredOperators.length} operators available
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name, ID or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              />
            </div>

            <div className="max-h-40 overflow-y-auto rounded-xl border border-[#E6DDCE] divide-y divide-[#E6DDCE]/60 bg-white">
              <div
                onClick={() => setSelectedOpId("")}
                className={`p-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                  selectedOpId === "" ? "bg-[#FAF7F2] text-[#C53030]" : "hover:bg-[#FAF7F2]/60 text-[#6B5E51]"
                }`}
              >
                <span>-- Mark Station as Unassigned (Shortage) --</span>
                {selectedOpId === "" && <CheckCircle2 className="w-3.5 h-3.5 text-[#C53030]" />}
              </div>

              {filteredOperators.map((op) => {
                const isSelected = selectedOpId === String(op.operatorId);
                const hasSkill = op.averageSkillRating >= assignment.requiredSkillLevel;

                return (
                  <div
                    key={op.operatorId}
                    onClick={() => setSelectedOpId(String(op.operatorId))}
                    className={`p-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FAF7F2] text-[#9C5B3C] font-bold"
                        : "hover:bg-[#FAF7F2]/60 text-[#221912]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{op.operatorName}</span>
                        <span className="font-mono text-[10px] text-[#8C7E6E]">({op.employeeCode})</span>
                      </div>
                      <span className="text-[10px] text-[#8C7E6E] block">
                        Rating {Number(op.averageSkillRating || 3).toFixed(1)}/5 • {op.department || "Sewing"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!hasSkill && (
                        <span className="px-1.5 py-0.5 rounded bg-[#B48259]/15 text-[#B48259] text-[9px] font-bold">
                          Skill R{Number(op.averageSkillRating || 3).toFixed(1)}
                        </span>
                      )}
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#9C5B3C]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projected Impact Card */}
          {selectedOp && (
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9C5B3C]" />
                <div>
                  <span className="text-[#8C7E6E] block text-[10px] font-bold uppercase">Projected Cycle Time</span>
                  <span className="font-mono font-bold text-[#221912]">
                    {projectedCycleTime}s per piece
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[#8C7E6E] block text-[10px] font-bold uppercase">Cycle Time Variance</span>
                <span className={`font-mono text-xs font-bold ${cycleDelta <= 0 ? "text-[#2E6F40]" : "text-[#C53030]"}`}>
                  {cycleDelta > 0 ? `+${cycleDelta}s slower` : `${cycleDelta}s faster`}
                </span>
              </div>
            </div>
          )}

          {/* Fixed Assignment Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/50">
            <input
              type="checkbox"
              checked={pinFixed}
              onChange={(e) => setPinFixed(e.target.checked)}
              className="w-4 h-4 accent-[#9C5B3C] rounded-sm cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-[#221912] flex items-center gap-1">
                <Pin className="w-3 h-3 text-[#B48259]" />
                Pin as Fixed Workstation Assignment
              </span>
              <span className="text-[11px] text-[#8C7E6E] block">
                Locks this operator to this workstation for future solver iterations.
              </span>
            </div>
          </label>

          {/* Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221912]">
              Reason / Justification (Logged to Audit Trail):
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Assigned expert operator to prevent bottleneck buildup on sleeve attachment..."
              className="w-full px-3.5 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          {/* Author Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#221912]">
              Performed By:
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E6DDCE] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E6DDCE] hover:bg-[#FAF7F2] text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#9C5B3C] hover:bg-[#7A452D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


