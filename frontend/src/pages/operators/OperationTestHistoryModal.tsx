import { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle2, Award, History } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { skillApi, cycleTimeToRating, type PerformanceLog, type SkillAssessment } from "../../features/skill-matrix/api";
import type { Operation } from "../../features/operations/api";
import type { Operator } from "../../features/operators/api";

import { getRatingRangeLabel } from "../../features/operations/ratingBenchmarks";

interface OperationTestHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator;
  operation: Operation;
  performanceLogs: PerformanceLog[];
  currentRating?: number;
}

export function OperationTestHistoryModal({
  isOpen,
  onClose,
  operator,
  operation,
  performanceLogs,
  currentRating = 0,
}: OperationTestHistoryModalProps) {
  const [assessmentHistory, setAssessmentHistory] = useState<SkillAssessment[]>([]);

  // Filter logs for this specific operation
  const opLogs = performanceLogs.filter(
    (l) => String(l.operationId) === String(operation.id)
  );

  const submittedLogs = opLogs.filter(
    (l) => l.status === "SUBMITTED" || !l.status
  );

  const draftLogs = opLogs.filter((l) => l.status === "DRAFT");

  const overallAvg =
    submittedLogs.length > 0
      ? submittedLogs.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / submittedLogs.length
      : 0;

  // Group logs by date and status
  const groupedLogs = (() => {
    const map = new Map<string, { date: string; status: "DRAFT" | "SUBMITTED"; times: number[]; tester: string; notes: string[] }>();
    opLogs.forEach((l) => {
      const status = (l.status || "SUBMITTED").toUpperCase() as "DRAFT" | "SUBMITTED";
      const key = `${l.logDate}_${status}`;
      if (!map.has(key)) {
        map.set(key, {
          date: l.logDate,
          status,
          times: [],
          tester: l.recordedBy || "Manager",
          notes: [],
        });
      }
      const entry = map.get(key)!;
      entry.times.push(l.actualCycleTimeSeconds);
      if (l.notes) entry.notes.push(l.notes);
    });

    return Array.from(map.values()).map((g) => {
      const avg = g.times.reduce((a, b) => a + b, 0) / g.times.length;
      return {
        ...g,
        avg: avg.toFixed(1),
        rating: cycleTimeToRating(avg, operation.name, operation.standardSmv),
      };
    });
  })();

  useEffect(() => {
    if (isOpen && operator.id && operation.id) {
      skillApi
        .getAllAssessments(operator.id, operation.id)
        .then((res) => setAssessmentHistory(res || []))
        .catch(console.error);
    }
  }, [isOpen, operator.id, operation.id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${operation.name} (${operation.operationCode})`}
      subtitle={`Performance test history & rating progression for ${operator.name} (${operator.employeeId})`}
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Current Rating</div>
            <div className="text-base font-bold text-[#0F172A] mt-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#2563EB]" />
              {currentRating > 0 ? `Rating ${currentRating}` : "Not Rated"}
            </div>
            {currentRating > 0 && (
              <div className="text-[10px] text-[#2563EB] font-bold mt-0.5 font-mono">{getRatingRangeLabel(currentRating, operation.name)}</div>
            )}
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Total Tests</div>
            <div className="text-base font-bold text-[#0F172A] mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              {submittedLogs.length} runs
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Across {groupedLogs.length} test dates</div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Submitted Avg</div>
            <div className="text-base font-bold text-[#2563EB] font-mono mt-1">
              {overallAvg > 0 ? `${overallAvg.toFixed(1)}s` : "--"}
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Average cycle time</div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Draft Tests</div>
            <div className="text-base font-bold text-[#0F172A] mt-1">
              {draftLogs.length} pending
            </div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
              {draftLogs.length > 0 ? "Awaiting submit" : "All submitted"}
            </div>
          </div>
        </div>

        {/* Chronological Performance Tests History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              Past Performance Test Runs
            </h4>
            <span className="text-[11px] text-[#64748B]">
              {opLogs.length} total test records
            </span>
          </div>

          {opLogs.length === 0 ? (
            <div className="py-8 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0] text-center text-xs text-[#64748B]">
              No performance test data recorded for this operation yet.
            </div>
          ) : (
            <div className="border border-[#F1F5F9] rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9] text-[10px] font-bold text-[#64748B] uppercase">
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5">Timed Runs</th>
                    <th className="py-2.5 px-2 text-center">Count</th>
                    <th className="py-2.5 px-2 text-center">Daily Avg</th>
                    <th className="py-2.5 px-3 text-center">Derived Rating</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {groupedLogs.map((group, idx) => {
                    const isDraft = group.status === "DRAFT";
                    return (
                      <tr key={idx} className="hover:bg-[#F8FAFC]/40 transition-colors">
                        <td className="py-3 px-3.5 font-medium text-[#0F172A]">{group.date}</td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {group.times.map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[10px] font-mono font-bold text-[#0F172A]">
                                {t}s
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-[#0F172A]">{group.times.length}</td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-[#2563EB]">{group.avg}s</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 bg-[#0F172A] text-white font-bold rounded text-[10px] shadow-2xs">
                            Rating {group.rating}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isDraft ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-bold text-[10px]">
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Submitted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-[#64748B]">{group.tester}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rating Progression History */}
        {assessmentHistory.length > 0 && (
          <div className="space-y-3 pt-1 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-[#2563EB]" />
              Skill Matrix Revision History
            </div>
            
            <div className="space-y-2">
              {assessmentHistory.map((h, i) => (
                <div key={h.id || i} className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A]">Revision #{h.revision}</span>
                    <span className="text-[#64748B] text-[11px]">· {h.effectiveDate}</span>
                    {h.notes && <span className="text-[#64748B] text-[11px] italic">({h.notes})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#2563EB] font-bold">{h.cycleTimeSeconds}s</span>
                    <span className="px-2 py-0.5 bg-[#0F172A] text-white text-[10px] font-bold rounded">
                      Rating {h.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-9 text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
