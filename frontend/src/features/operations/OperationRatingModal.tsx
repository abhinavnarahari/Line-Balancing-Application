import { useState, useEffect } from "react";
import { ShieldCheck, Check, RotateCcw, Sparkles, Sliders, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { operationsApi, type Operation } from "./api";
import {
  getBenchmarkForOperation,
  saveCustomBenchmark,
  resetBenchmarkToDefault,
  type OperationRatingTier,
  type OperationRatingBenchmark,
} from "./ratingBenchmarks";

interface OperationRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: Operation | null;
  onOperationUpdated?: () => void;
}

interface EditableTierState {
  rating: 5 | 4 | 3 | 2 | 1;
  grade: string;
  classification: "Expert" | "Skilled" | "Intermediate" | "Basic" | "Beginner";
  minSec: number;
  maxSec: number;
  efficiencyLabel: string;
  criteria: string;
  tagColor: string;
  pillColor: string;
}

export function OperationRatingModal({
  isOpen,
  onClose,
  operation,
  onOperationUpdated,
}: OperationRatingModalProps) {
  const [smvMinutes, setSmvMinutes] = useState<number>(0.5);
  const [tiers, setTiers] = useState<EditableTierState[]>([]);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize modal state whenever operation changes or modal opens
  useEffect(() => {
    if (!operation || !isOpen) return;

    const currentSmv = Number(operation.standardSmv || 0.5);
    setSmvMinutes(currentSmv);

    const benchmark = getBenchmarkForOperation(operation.name || operation.operationCode, currentSmv);
    setIsCustom(Boolean(benchmark?.isCustom));

    const defaultTiers: EditableTierState[] = [
      {
        rating: 5,
        grade: "Grade 5",
        classification: "Expert",
        minSec: benchmark?.rating5?.minSec || Math.round(currentSmv * 60 * 0.85),
        maxSec: benchmark?.rating5?.maxSec || Math.round(currentSmv * 60 * 0.95),
        efficiencyLabel: benchmark?.rating5?.efficiencyLabel || "> 100%",
        criteria: benchmark?.rating5?.criteria || "Autonomous execution, zero defect rate, exceeding line takt time",
        tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pillColor: "bg-emerald-600 text-white",
      },
      {
        rating: 4,
        grade: "Grade 4",
        classification: "Skilled",
        minSec: benchmark?.rating4?.minSec || Math.round(currentSmv * 60 * 0.95),
        maxSec: benchmark?.rating4?.maxSec || Math.round(currentSmv * 60 * 1.05),
        efficiencyLabel: benchmark?.rating4?.efficiencyLabel || "90–100%",
        criteria: benchmark?.rating4?.criteria || "Consistent cycle time, minimal supervision, high seam quality",
        tagColor: "bg-sky-50 text-sky-700 border-sky-200",
        pillColor: "bg-sky-600 text-white",
      },
      {
        rating: 3,
        grade: "Grade 3",
        classification: "Intermediate",
        minSec: benchmark?.rating3?.minSec || Math.round(currentSmv * 60 * 1.05),
        maxSec: benchmark?.rating3?.maxSec || Math.round(currentSmv * 60 * 1.20),
        efficiencyLabel: benchmark?.rating3?.efficiencyLabel || "78–89%",
        criteria: benchmark?.rating3?.criteria || "Meets standard factory SMV target and line balancing requirements",
        tagColor: "bg-amber-50 text-amber-800 border-amber-200",
        pillColor: "bg-amber-600 text-white",
      },
      {
        rating: 2,
        grade: "Grade 2",
        classification: "Basic",
        minSec: benchmark?.rating2?.minSec || Math.round(currentSmv * 60 * 1.20),
        maxSec: benchmark?.rating2?.maxSec || Math.round(currentSmv * 60 * 1.40),
        efficiencyLabel: benchmark?.rating2?.efficiencyLabel || "69–77%",
        criteria: benchmark?.rating2?.criteria || "Requires mentoring, slight cycle time deviation from target",
        tagColor: "bg-orange-50 text-orange-700 border-orange-200",
        pillColor: "bg-orange-600 text-white",
      },
      {
        rating: 1,
        grade: "Grade 1",
        classification: "Beginner",
        minSec: benchmark?.rating1?.minSec || Math.round(currentSmv * 60 * 1.40),
        maxSec: benchmark?.rating1?.maxSec || Math.round(currentSmv * 60 * 1.65),
        efficiencyLabel: benchmark?.rating1?.efficiencyLabel || "< 69%",
        criteria: benchmark?.rating1?.criteria || "Under structured IE training / time-study observation",
        tagColor: "bg-rose-50 text-rose-700 border-rose-200",
        pillColor: "bg-rose-600 text-white",
      },
    ];

    setTiers(defaultTiers);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [operation, isOpen]);

  if (!operation) return null;

  const targetCycleSec = Math.round(smvMinutes * 60 * 10) / 10;
  const capacity8h = targetCycleSec > 0 ? Math.round((480 * 60) / targetCycleSec) : 0;

  // Handle tier cycle time input change
  const handleTierChange = (
    rating: number,
    field: "minSec" | "maxSec" | "criteria",
    val: string
  ) => {
    setTiers((prev) =>
      prev.map((t) => {
        if (t.rating !== rating) return t;

        if (field === "criteria") {
          return { ...t, criteria: val };
        }

        const numVal = Math.max(0, parseFloat(val) || 0);
        const updated = { ...t, [field]: numVal };

        // Auto-recalculate efficiency estimate
        const midSec = (updated.minSec + updated.maxSec) / 2 || targetCycleSec;
        if (targetCycleSec > 0 && midSec > 0) {
          const effPct = Math.round((targetCycleSec / midSec) * 100);
          if (rating === 5) updated.efficiencyLabel = `> ${effPct - 5}%`;
          else if (rating === 1) updated.efficiencyLabel = `< ${effPct + 5}%`;
          else updated.efficiencyLabel = `${effPct - 5}–${effPct + 5}%`;
        }

        return updated;
      })
    );
  };

  // Save customized benchmark & sync across application
  const handleSave = async () => {
    if (!operation) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Validate positive cycle times
      for (const t of tiers) {
        if (t.minSec < 0 || t.maxSec <= 0) {
          setErrorMessage(`Please enter a valid positive cycle time for Rating ${t.rating} (${t.classification}).`);
          setSaving(false);
          return;
        }
      }

      const buildTier = (t: EditableTierState): OperationRatingTier => ({
        minSec: t.minSec,
        maxSec: t.maxSec,
        label: `${t.minSec}–${t.maxSec} sec`,
        efficiencyLabel: t.efficiencyLabel,
        skillLevel: t.classification,
        badgeColor: t.tagColor,
        criteria: t.criteria,
      });

      const customBenchmark: OperationRatingBenchmark = {
        operationName: operation.name,
        operationCode: operation.operationCode,
        defaultSmv: smvMinutes,
        isCustom: true,
        rating5: buildTier(tiers.find((t) => t.rating === 5)!),
        rating4: buildTier(tiers.find((t) => t.rating === 4)!),
        rating3: buildTier(tiers.find((t) => t.rating === 3)!),
        rating2: buildTier(tiers.find((t) => t.rating === 2)!),
        rating1: buildTier(tiers.find((t) => t.rating === 1)!),
      };

      // 1. Save to central benchmark store (persisted in localStorage + event broadcast)
      saveCustomBenchmark(operation.name, customBenchmark);
      saveCustomBenchmark(operation.operationCode, customBenchmark);
      setIsCustom(true);

      // 2. If SMV changed, update the backend Operation entity
      if (Math.abs(smvMinutes - Number(operation.standardSmv || 0.5)) > 0.0001) {
        await operationsApi.updateOperation(operation.id, {
          operationCode: operation.operationCode,
          name: operation.name,
          description: operation.description,
          sequence: operation.sequence,
          active: operation.active,
          standardSmv: smvMinutes,
        });
        if (onOperationUpdated) {
          onOperationUpdated();
        }
      }

      setSuccessMessage("Cycle time benchmarks saved! Applied live across skill tests, line balance & operator matrices.");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error("Failed to save benchmark:", err);
      setErrorMessage("Failed to save benchmark configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Reset this operation's benchmark back to factory GSD standard
  const handleResetToDefault = () => {
    if (!operation) return;
    if (
      !window.confirm(
        `Reset ${operation.name} (${operation.operationCode}) benchmarks back to factory GSD defaults?`
      )
    ) {
      return;
    }

    resetBenchmarkToDefault(operation.name);
    resetBenchmarkToDefault(operation.operationCode);
    setIsCustom(false);

    // Reload default benchmark
    const defaultBenchmark = getBenchmarkForOperation(operation.name, Number(operation.standardSmv || 0.5));
    if (defaultBenchmark) {
      const resetTiers: EditableTierState[] = [
        {
          rating: 5,
          grade: "Grade 5",
          classification: "Expert",
          minSec: defaultBenchmark.rating5?.minSec || 26,
          maxSec: defaultBenchmark.rating5?.maxSec || 29,
          efficiencyLabel: defaultBenchmark.rating5?.efficiencyLabel || "> 100%",
          criteria: defaultBenchmark.rating5?.criteria || "Autonomous execution, zero defect rate, exceeding line takt time",
          tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          pillColor: "bg-emerald-600 text-white",
        },
        {
          rating: 4,
          grade: "Grade 4",
          classification: "Skilled",
          minSec: defaultBenchmark.rating4?.minSec || 29,
          maxSec: defaultBenchmark.rating4?.maxSec || 32,
          efficiencyLabel: defaultBenchmark.rating4?.efficiencyLabel || "90–100%",
          criteria: defaultBenchmark.rating4?.criteria || "Consistent cycle time, minimal supervision, high seam quality",
          tagColor: "bg-sky-50 text-sky-700 border-sky-200",
          pillColor: "bg-sky-600 text-white",
        },
        {
          rating: 3,
          grade: "Grade 3",
          classification: "Intermediate",
          minSec: defaultBenchmark.rating3?.minSec || 32,
          maxSec: defaultBenchmark.rating3?.maxSec || 37,
          efficiencyLabel: defaultBenchmark.rating3?.efficiencyLabel || "78–89%",
          criteria: defaultBenchmark.rating3?.criteria || "Meets standard factory SMV target and line balancing requirements",
          tagColor: "bg-amber-50 text-amber-800 border-amber-200",
          pillColor: "bg-amber-600 text-white",
        },
        {
          rating: 2,
          grade: "Grade 2",
          classification: "Basic",
          minSec: defaultBenchmark.rating2?.minSec || 37,
          maxSec: defaultBenchmark.rating2?.maxSec || 42,
          efficiencyLabel: defaultBenchmark.rating2?.efficiencyLabel || "69–77%",
          criteria: defaultBenchmark.rating2?.criteria || "Requires mentoring, slight cycle time deviation from target",
          tagColor: "bg-orange-50 text-orange-700 border-orange-200",
          pillColor: "bg-orange-600 text-white",
        },
        {
          rating: 1,
          grade: "Grade 1",
          classification: "Beginner",
          minSec: defaultBenchmark.rating1?.minSec || 42,
          maxSec: defaultBenchmark.rating1?.maxSec || 48,
          efficiencyLabel: defaultBenchmark.rating1?.efficiencyLabel || "< 69%",
          criteria: defaultBenchmark.rating1?.criteria || "Under structured IE training / time-study observation",
          tagColor: "bg-rose-50 text-rose-700 border-rose-200",
          pillColor: "bg-rose-600 text-white",
        },
      ];
      setTiers(resetTiers);
    }

    setSuccessMessage("Benchmarks reset to factory GSD standard.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Standard SMV & Skill Rating Benchmark"
      subtitle="Industrial Engineering (IE) work-study standards, target cycle time & 5-tier operator qualification criteria."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* ── Technical Specification Overview ───────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Operation Info */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 shadow-2xs">
                  {operation.operationCode}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Sequence #{operation.sequence || 1}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isCustom
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {isCustom ? (
                    <>
                      <Sliders className="w-3 h-3 text-purple-600" />
                      <span>Custom Configured</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>GSD Factory Standard</span>
                    </>
                  )}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 pt-0.5">
                {operation.name}
              </h3>
              {operation.description && (
                <p className="text-xs text-slate-500 line-clamp-1">
                  {operation.description}
                </p>
              )}
            </div>

            {/* Standard Allowed Minutes (SAM) */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standard Allowed Minutes
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={smvMinutes}
                  onChange={(e) => setSmvMinutes(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-20 h-7 text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 text-slate-900 focus:outline-none focus:border-blue-500 text-center"
                />
                <span className="text-xs font-bold text-slate-600 font-mono">SAM</span>
              </div>
              <span className="text-[11px] font-mono text-blue-700 font-semibold block">
                {targetCycleSec.toFixed(1)}s target cycle
              </span>
            </div>

            {/* Capacity Reference */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Capacity Reference
              </span>
              <p className="text-sm font-mono font-bold text-slate-900">
                {capacity8h.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">pcs/8h</span>
              </p>
              <span className="text-[11px] text-slate-500 block">
                at 100% standard speed
              </span>
            </div>
          </div>
        </div>

        {/* Alerts / Feedback */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── 5-Tier Configurable Cycle Time Table ───────────────────── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Skill Qualification Thresholds (Cycle Time in Seconds)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Edit second ranges below to customize operator grading
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: "700px" }}>
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3.5 w-20 text-center">Rating</th>
                  <th className="py-2.5 px-3.5 w-40">Skill Level</th>
                  <th className="py-2.5 px-3.5 w-56 text-center">Configured Cycle Time</th>
                  <th className="py-2.5 px-3.5 w-28 text-center">Efficiency %</th>
                  <th className="py-2.5 px-3.5 text-left">IE Evaluation Criteria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tiers.map((tier) => {
                  return (
                    <tr key={tier.rating} className="hover:bg-slate-50/70 transition-colors">
                      {/* Rating Pill */}
                      <td className="py-2.5 px-3.5 text-center align-middle">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-xs shadow-2xs ${tier.pillColor}`}
                        >
                          {tier.rating}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <span className="font-bold text-slate-900 block text-sm">
                          {tier.classification}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {tier.grade}
                        </span>
                      </td>

                      {/* Editable Cycle Time Range */}
                      <td className="py-2.5 px-3.5 align-middle text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg p-1 shadow-2xs">
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={tier.minSec}
                            onChange={(e) => handleTierChange(tier.rating, "minSec", e.target.value)}
                            className="w-14 h-7 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 text-center focus:outline-none focus:border-blue-500"
                            title="Minimum cycle time (seconds)"
                          />
                          <span className="text-slate-400 font-bold text-xs">–</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={tier.maxSec}
                            onChange={(e) => handleTierChange(tier.rating, "maxSec", e.target.value)}
                            className="w-14 h-7 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 text-center focus:outline-none focus:border-blue-500"
                            title="Maximum cycle time (seconds)"
                          />
                          <span className="text-[11px] font-mono text-slate-500 pr-1">sec</span>
                        </div>
                      </td>

                      {/* Efficiency Range */}
                      <td className="py-2.5 px-3.5 text-center align-middle font-mono font-semibold text-slate-800">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                          {tier.efficiencyLabel}
                        </span>
                      </td>

                      {/* Criteria */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <input
                          type="text"
                          value={tier.criteria}
                          onChange={(e) => handleTierChange(tier.rating, "criteria", e.target.value)}
                          className="w-full text-[11px] text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded transition-colors focus:outline-none"
                          placeholder="IE evaluation criteria..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer Actions ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Reset this operation back to standard factory GSD benchmark"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to GSD Standard</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose} size="sm">
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-bold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Benchmark Configuration
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
