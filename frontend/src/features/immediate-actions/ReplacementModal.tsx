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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Available Present Operators (Skill Matched)</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-200 border border-rose-400/30 font-mono">
                  {item.employeeId}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Qualified floor operators present today and verified NOT working on any production order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Missing Operator Summary Banner */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Unmarked Shift Operator (&gt;5 mins overdue)</span>
              </div>
              <div className="text-base font-black text-rose-950 mt-0.5">
                {item.operatorName} ({item.employeeId})
              </div>
              <div className="text-xs text-rose-700 font-mono mt-0.5">
                {item.shiftCode} ({item.shiftStartTime}–{item.shiftEndTime}) · <strong className="font-bold">{item.elapsedMinutes} mins overdue</strong>
              </div>
            </div>
            <Link
              to={`/operators/${item.employeeId}`}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-800 hover:bg-rose-100/50 flex items-center gap-1 transition-colors"
            >
              <span>Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Qualified Operations at Risk */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Required Operations at Risk ({item.assignedOperations.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Based on GSD skill matrix benchmarks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.assignedOperations.length > 0 ? (
                item.assignedOperations.map(op => (
                  <span
                    key={op.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    <span className="font-mono font-bold text-blue-700">{op.operationCode}</span>
                    <span>{op.name}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">General sewing operator</span>
              )}
            </div>
          </div>

          {/* Replacement Candidate List */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Available Present Operators (Skill Matched & Unallocated)</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {item.replacementCandidates.length} Free Operators Available
              </span>
            </div>

            {item.replacementCandidates.length > 0 ? (
              <div className="space-y-3">
                {item.replacementCandidates.map(cand => (
                  <div
                    key={cand.operator.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                        {cand.operator.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900">{cand.operator.name}</strong>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cand.operator.employeeId}
                          </span>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            Present on Floor
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Free · Not on any production order
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Grade {cand.rating} Certified
                          </span>
                        </div>

                        {/* Matched Operations */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Matched Ops:</span>
                          {cand.matchedOperations.map(m => (
                            <span
                              key={m.operationId}
                              className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                            >
                              {m.operationCode || m.operationName} (★{m.rating})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        to={`/operators/${cand.operator.employeeId}`}
                        className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Deploy Substitute</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">No Free Present Operators with ★3+ Rating Found</p>
                <p>All qualified operators for these operations are currently assigned to active production orders or absent.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Real-Time Skill Matching · Buffer Workforce Allocation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
