import { createPortal } from "react-dom";
import { X, Users, UserCheck, Star, Sparkles, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import type { ImmediateActionItem } from "./useImmediateActions";
import type { Operator } from "../operators/api";
import { Link } from "react-router-dom";

interface ReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ImmediateActionItem | null;
  onAssignReplacement?: (candidate: Operator) => void;
}

export function ReplacementModal({
  isOpen,
  onClose,
  item,
  onAssignReplacement,
}: ReplacementModalProps) {
  if (!isOpen || !item) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E6DDCE] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#221912] text-white flex items-center justify-between shrink-0 border-b border-[#382B20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9C5B3C]/20 border border-[#9C5B3C]/40 flex items-center justify-center text-[#FFE5BF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Available Buffer Operators</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#9C5B3C] border border-[#E6DDCE] font-mono font-bold">
                  {item.employeeId}
                </span>
              </h3>
              <p className="text-xs text-[#E6DDCE] mt-0.5 font-medium">
                Verified floor operators present today with ★3+ competency matching risk operations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 text-[#8C7E6E] hover:text-white rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#FAF8F5]">
          {/* Missing Operator Summary Banner */}
          <div className="p-4 rounded-xl bg-white border border-[#E6DDCE] flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{item.statusType === "LATE" ? "Late Arrival Escalation" : "Unmarked Operator (>5 mins overdue)"}</span>
              </div>
              <div className="text-base font-black text-[#221912] mt-0.5">
                {item.operatorName} <span className="font-mono text-xs text-[#9C5B3C]">({item.employeeId})</span>
              </div>
              <div className="text-xs text-[#8C7E6E] font-mono mt-0.5">
                {item.shiftCode} ({item.shiftStartTime}–{item.shiftEndTime}) · <strong className="text-rose-700 font-bold">{item.elapsedMinutes} mins overdue</strong>
              </div>
            </div>
            <Link
              to={`/settings/operators/${item.employeeId}`}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6DDCE] text-xs font-bold text-[#9C5B3C] hover:bg-[#F6F1E8] flex items-center gap-1 transition-colors"
            >
              <span>Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Qualified Operations at Risk */}
          <div className="bg-white p-4 rounded-xl border border-[#E6DDCE] shadow-2xs">
            <div className="text-xs font-bold text-[#221912] mb-2 flex items-center justify-between">
              <span>Required Operations at Risk ({item.assignedOperations.length})</span>
              <span className="text-[10px] text-[#8C7E6E] font-medium">GSD Skill Competency Requirements</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.assignedOperations.length > 0 ? (
                item.assignedOperations.map(op => (
                  <span
                    key={op.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF8F5] text-[#221912] rounded-lg text-xs font-medium border border-[#E6DDCE]"
                  >
                    <span className="font-mono font-bold text-[#9C5B3C]">{op.operationCode}</span>
                    <span>{op.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8C7E6E] italic">General sewing operator</span>
              )}
            </div>
          </div>

          {/* Replacement Candidate List */}
          <div>
            <div className="text-xs font-bold text-[#221912] mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#9C5B3C]" />
                <span>Skill-Matched Buffer Candidates</span>
              </div>
              <span className="text-[11px] font-bold text-[#9C5B3C] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E6DDCE]">
                {item.replacementCandidates.length} Free Operators Available
              </span>
            </div>

            {item.replacementCandidates.length > 0 ? (
              <div className="space-y-3">
                {item.replacementCandidates.map(cand => (
                  <div
                    key={cand.operator.id}
                    className="p-4 rounded-xl bg-white border border-[#E6DDCE] hover:border-[#9C5B3C] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#221912]">{cand.operator.name}</strong>
                        <span className="text-[10.5px] font-mono font-bold text-[#9C5B3C] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E6DDCE]">
                          {cand.operator.employeeId}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          Present on Floor
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C5B3C] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E6DDCE]">
                          <ShieldCheck className="w-3 h-3 text-[#9C5B3C]" />
                          Unallocated Buffer
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Grade {cand.rating} Certified
                        </span>
                      </div>

                      {/* Matched Operations */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-[#8C7E6E] font-bold uppercase">Matched Ops:</span>
                        {cand.matchedOperations.map(m => (
                          <span
                            key={m.operationId}
                            className="text-[10.5px] font-mono font-semibold px-2 py-0.5 bg-[#FAF8F5] text-[#9C5B3C] rounded-md border border-[#E6DDCE]"
                          >
                            {m.operationCode || m.operationName} (★{m.rating})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        to={`/settings/operators/${cand.operator.employeeId}`}
                        className="px-2.5 py-2 text-xs text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF8F5] rounded-xl border border-[#E6DDCE] transition-colors"
                        title="View Skill Matrix"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          onAssignReplacement?.(cand.operator);
                          onClose();
                        }}
                        className="px-4 py-2 bg-[#9C5B3C] hover:bg-[#854B2F] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Deploy Substitute</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-[#E6DDCE] text-xs text-[#8C7E6E] space-y-1">
                <p className="font-bold text-[#221912]">No Free Present Operators with ★3+ Rating Found</p>
                <p>All qualified operators for these operations are currently assigned to active production orders or absent.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E6DDCE] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8C7E6E] font-medium">
            Real-Time Skill Matching · Buffer Workforce Allocation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FAF8F5] text-[#221912] hover:bg-[#F6F1E8] text-xs font-bold rounded-xl border border-[#E6DDCE] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

