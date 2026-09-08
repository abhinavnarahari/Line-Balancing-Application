import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Calculator, Sparkles, Check, FileText, ArrowDownRight } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { skillApi, cycleTimeToRating, type PerformanceLog, type PerformanceLogInput } from "../../features/skill-matrix/api";
import type { Operation } from "../../features/operations/api";
import type { Operator } from "../../features/operators/api";

import { getBenchmarkForOperation, getRatingRangeLabel, subscribeToBenchmarkChanges } from "../../features/operations/ratingBenchmarks";

interface RecordPerformanceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator;
  operations: Operation[];
  performanceLogs?: PerformanceLog[];
  onSuccess: () => void;
}

export function RecordPerformanceTestModal({
  isOpen,
  onClose,
  operator,
  operations,
  performanceLogs = [],
  onSuccess,
}: RecordPerformanceTestModalProps) {
  const [operationId, setOperationId] = useState<string>(operations[0]?.id ? String(operations[0].id) : "");
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [recordedBy, setRecordedBy] = useState<string>("Manager");
  const [notes, setNotes] = useState<string>("");
  const [testRuns, setTestRuns] = useState<string[]>(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [, setBenchmarkVersion] = useState(0);

  // Subscribe to live benchmark changes
  useEffect(() => {
    return subscribeToBenchmarkChanges(() => {
      setBenchmarkVersion((v) => v + 1);
    });
  }, []);

  const selectedOp = operations.find((o) => String(o.id) === String(operationId));
  const benchmark = selectedOp ? getBenchmarkForOperation(selectedOp.name, selectedOp.standardSmv) : null;

  // Find existing draft runs for currently selected operation (strictly DRAFT status)
  const existingDraftLogs = performanceLogs.filter(
    (l) =>
      String(l.operationId) === String(operationId) &&
      l.status === "DRAFT"
  );

  const draftAvg =
    existingDraftLogs.length > 0
      ? existingDraftLogs.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / existingDraftLogs.length
      : 0;

  // Auto-populate or allow loading draft runs into editor
  const handleLoadDraftsIntoEditor = () => {
    if (existingDraftLogs.length === 0) return;
    const times = existingDraftLogs.map((d) => String(d.actualCycleTimeSeconds));
    setTestRuns(times);
    if (existingDraftLogs[0]?.logDate) {
      setLogDate(existingDraftLogs[0].logDate);
    }
  };

  // Calculate live average cycle time and rating
  const validTimes = testRuns
    .map((t) => parseFloat(t))
    .filter((n) => !isNaN(n) && n > 0);

  const avgTime =
    validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : 0;

  const derivedRating = validTimes.length > 0
    ? cycleTimeToRating(avgTime, selectedOp?.name, selectedOp?.standardSmv)
    : null;

  const draftRating = existingDraftLogs.length > 0
    ? cycleTimeToRating(draftAvg, selectedOp?.name, selectedOp?.standardSmv)
    : null;

  const handleAddRun = () => {
    setTestRuns((prev) => [...prev, ""]);
  };

  const handleRemoveRun = (index: number) => {
    if (testRuns.length <= 1) return;
    setTestRuns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunChange = (index: number, val: string) => {
    setTestRuns((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!operationId || validTimes.length === 0) {
      alert("Please select an operation and enter at least one valid test cycle time.");
      return;
    }

    setSaving(true);
    try {
      const payload: PerformanceLogInput[] = validTimes.map((time, idx) => ({
        operatorId: Number(operator.id),
        operationId: Number(operationId),
        logDate,
        actualCycleTimeSeconds: Math.round(time),
        recordedBy: recordedBy.trim() || "Manager",
        status,
        notes: notes.trim() ? `${notes} (Run ${idx + 1}/${validTimes.length})` : `Test run ${idx + 1}/${validTimes.length}`,
      }));

      // 1. Save the logs
      await skillApi.batchAddPerformanceLogs(payload);

      // 2. If submitting, also directly write to the skill assessments table to guarantee immediate matrix reflection
      if (status === "SUBMITTED" && derivedRating !== null) {
        try {
          await skillApi.addAssessment({
            operatorId: Number(operator.id),
            operationId: Number(operationId),
            rating: derivedRating,
            cycleTimeSeconds: Math.round(avgTime),
            effectiveDate: logDate,
            notes: `Submitted ${validTimes.length} performance test run(s) with daily average ${avgTime.toFixed(1)}s`,
          });
        } catch (assessErr) {
          console.warn("Direct assessment update fallback:", assessErr);
        }
      }

      onSuccess();
      onClose();
      setTestRuns(["", "", ""]);
      setNotes("");
    } catch (err: any) {
      console.error("Failed to save performance tests:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to save performance tests. Please try again.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Performance Timing Tests"
      subtitle={`Log 1 to N timed test runs for ${operator.name} (${operator.employeeId}). Save as draft or submit to automatically update the Skill Matrix.`}
    >
      <div className="space-y-4">
        {/* Searchable Operation Selection */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-1">
            Operation *
          </label>
          <SearchableSelect
            value={operationId}
            onChange={setOperationId}
            options={operations.map((op) => ({
              value: String(op.id),
              label: op.name,
              sublabel: op.operationCode,
            }))}
            placeholder="Search operation name or code..."
          />

          {/* Operation Benchmark Tier Reference Pill */}
          {benchmark && benchmark.rating5 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-xl font-mono mt-1.5 shadow-2xs">
              <span className="font-bold text-slate-700">Tiers:</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">⭐5: {benchmark.rating5.label}</span>
              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold">⭐4: {benchmark.rating4?.label}</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold">⭐3: {benchmark.rating3?.label}</span>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-bold">⭐2: {benchmark.rating2?.label}</span>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">⭐1: {benchmark.rating1?.label}</span>
            </div>
          )}
        </div>

        {/* Existing Drafts Banner if any exist for this operation */}
        {existingDraftLogs.length > 0 && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Found {existingDraftLogs.length} Saved Draft Test Run(s)</span>
              </div>
              <button
                type="button"
                onClick={handleLoadDraftsIntoEditor}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md border border-amber-300 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowDownRight className="w-3 h-3" /> Load Runs into Editor
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              {existingDraftLogs.map((d, i) => (
                <span key={d.id || i} className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded font-mono text-xs font-semibold">
                  #{i + 1}: {d.actualCycleTimeSeconds}s
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-amber-900 pt-1 border-t border-amber-200">
              <span>Daily Draft Avg: <strong>{draftAvg.toFixed(1)}s</strong></span>
              <span className="font-bold">Pending Rating {draftRating} ({getRatingRangeLabel(draftRating || 1, selectedOp?.name)})</span>
            </div>
          </div>
        )}

        {/* Date and Tester */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-1">
              Test Date *
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-1">
              Recorded By
            </label>
            <input
              type="text"
              placeholder="e.g. Line Manager"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Dynamic Test Runs */}
        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#F1F5F9] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>Test Runs (Cycle Time in Seconds)</span>
            </div>
            <button
              type="button"
              onClick={handleAddRun}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:text-[#8C603D] bg-white px-2.5 py-1 rounded-md border border-[#E2E8F0] hover:border-[#D8C7B5] shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Run
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {testRuns.map((run, index) => (
              <div key={index} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                <span className="text-[10px] font-bold text-[#64748B] pl-1 shrink-0">
                  #{index + 1}
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Sec"
                  value={run}
                  onChange={(e) => handleRunChange(index, e.target.value)}
                  className="w-full h-7 px-1 text-xs font-semibold text-[#0F172A] focus:outline-none text-center bg-transparent"
                />
                {testRuns.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRun(index)}
                    className="p-1 text-[#C2B7AA] hover:text-rose-600 rounded cursor-pointer"
                    title="Remove Run"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Live Automatic Calculation Box */}
          {validTimes.length > 0 && derivedRating !== null && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <div className="text-[11px] text-[#64748B]">
                    {validTimes.length} {validTimes.length === 1 ? "test" : "tests"} · Daily Average
                  </div>
                  <div className="text-sm font-bold text-[#0F172A]">
                    {avgTime.toFixed(1)}s
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-bold text-white bg-[#0F172A] px-2.5 py-1 rounded-md shadow-2xs">
                  ⭐ Rating {derivedRating} &mdash; {getRatingRangeLabel(derivedRating, selectedOp?.name)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Observation Notes */}
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wide mb-1">
            Notes / Observations
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Smooth thread tension, high needle accuracy..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB] resize-none"
          />
        </div>

        {/* Action Buttons: Save as Draft vs Submit */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 h-9 text-xs font-semibold text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving || validTimes.length === 0 || !operationId}
              onClick={() => handleSave("DRAFT")}
              className="px-4 h-9 text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] rounded-lg disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={saving || validTimes.length === 0 || !operationId}
              onClick={() => handleSave("SUBMITTED")}
              className="px-5 h-9 text-xs font-bold text-white bg-[#0F172A] rounded-lg hover:bg-[#3A2E24] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Submitting..." : `Submit & Reflect Rating ${derivedRating ? `(${derivedRating})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
