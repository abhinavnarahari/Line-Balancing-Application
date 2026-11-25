import { useState, useEffect } from "react";
import { ShieldCheck, Check, RotateCcw, Sparkles, Sliders, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { operationsApi, type Operation } from "./api";
import {
  getBenchmarkForOperation,
  saveCustomBenchmark,
  resetBenchmarkToDefault,
  generateDynamicSmvBenchmark,
  tierKey,
  type OperationRatingTier,
  type OperationRatingBenchmark,
} from "./ratingBenchmarks";
import { SKILL_LEVELS, SKILL_RATINGS, type SkillRating } from "../skill-matrix/skillScale";
import { SkillLevelIcon } from "../../components/ui/SkillLevelIcon";

interface OperationRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: Operation | null;
  onOperationUpdated?: () => void;
}

interface EditableTierState {
  rating: SkillRating;
  grade: string;
  classification: string;
  minSec: number;
  /** Upper bound; the slowest level (1) is open-ended. */
  maxSec: number;
  efficiencyLabel: string;
  criteria: string;
  tagColor: string;
}

/** Level 1 has no upper cycle-time limit. */
const isOpenEnded = (rating: SkillRating) => rating === 1;

/** Editable rows (Expert → In training) from a stored or SMV-derived benchmark. */
function buildEditableTiers(benchmark: OperationRatingBenchmark | null, smvMinutes = 0.5): EditableTierState[] {
  const fallback = generateDynamicSmvBenchmark("operation", "OP-GEN", smvMinutes);
  return SKILL_RATINGS.map((rating) => {
    const info = SKILL_LEVELS[rating];
    const t = benchmark?.[tierKey(rating)] ?? fallback[tierKey(rating)];
    return {
      rating,
      grade: `Level ${rating}`,
      classification: info.name,
      minSec: t?.minSec ?? 0,
      maxSec: isOpenEnded(rating) ? Number.MAX_SAFE_INTEGER : t?.maxSec ?? 0,
      efficiencyLabel: t?.efficiencyLabel || info.band,
      criteria: t?.criteria || info.description,
      tagColor: info.badge,
    };
  });
}

export function OperationRatingModal({
  isOpen,
  onClose,
  operation,
  onOperationUpdated,
}: OperationRatingModalProps) {
  const [smvMinutes, setSmvMinutes] = useState<number>(0.5);
  const [smvSeconds, setSmvSeconds] = useState<number>(30);
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
    setSmvSeconds(Math.round(currentSmv * 60 * 10) / 10);

    const benchmark = getBenchmarkForOperation(operation.name || operation.operationCode, currentSmv);
    setIsCustom(Boolean(benchmark?.isCustom));

    const defaultTiers = buildEditableTiers(benchmark, currentSmv);

    setTiers(defaultTiers);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [operation, isOpen]);

  if (!operation) return null;

  const targetCycleSec = smvSeconds;
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

        // Auto-recalculate the efficiency band (standard time ÷ cycle time) covered by the edited range
        if (targetCycleSec > 0) {
          const pct = (sec: number) => Math.round((targetCycleSec / sec) * 100);
          if (isOpenEnded(t.rating)) {
            if (updated.minSec > 0) updated.efficiencyLabel = `< ${pct(updated.minSec)}%`;
          } else if (updated.maxSec > 0) {
            updated.efficiencyLabel =
              updated.minSec > 0 ? `${pct(updated.maxSec)}–${pct(updated.minSec)}%` : `≥ ${pct(updated.maxSec)}%`;
          }
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
        if (t.minSec < 0 || t.maxSec <= 0 || t.maxSec <= t.minSec) {
          setErrorMessage(`Please enter a valid positive cycle time range for Level ${t.rating} (${t.classification}).`);
          setSaving(false);
          return;
        }
      }

      const buildTier = (t: EditableTierState): OperationRatingTier => ({
        minSec: t.minSec,
        maxSec: t.maxSec,
        label: isOpenEnded(t.rating)
          ? `> ${t.minSec} sec`
          : t.minSec <= 0
            ? `≤ ${t.maxSec} sec`
            : `${t.minSec}–${t.maxSec} sec`,
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
      const defSmv = defaultBenchmark.defaultSmv || 0.5;
      setSmvMinutes(defSmv);
      setSmvSeconds(Math.round(defSmv * 60 * 10) / 10);
      const resetTiers = buildEditableTiers(defaultBenchmark, defSmv);
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
      subtitle="Industrial Engineering (IE) work-study standards, target cycle time & the factory's 4-level operator skill scale."
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

            {/* Standard SMV (Seconds) */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Standard SMV
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={smvSeconds}
                  onChange={(e) => {
                    const sec = Math.max(1, parseFloat(e.target.value) || 1);
                    setSmvSeconds(sec);
                    setSmvMinutes(sec / 60);
                  }}
                  className="w-20 h-7 text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1.5 text-slate-900 focus:outline-none focus:border-[#9C5B3C] text-center"
                />
                <span className="text-xs font-bold text-slate-600 font-mono">sec</span>
              </div>
              <span className="text-[11px] font-mono text-[#9C5B3C] font-semibold block">
                Target cycle time
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

        {/* ── 4-Level Configurable Cycle Time Table ───────────────────── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#9C5B3C]" />
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
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono font-bold text-xs shadow-2xs ${tier.tagColor}`}
                        >
                          <SkillLevelIcon rating={tier.rating} size={18} decorative />
                          {tier.rating}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="py-2.5 px-3.5 align-middle">
                        <span className="font-bold text-slate-900 block text-sm">
                          {tier.classification}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {tier.grade} · {SKILL_LEVELS[tier.rating].band} of target
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
                            className="w-14 h-7 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 text-center focus:outline-none focus:border-[#9C5B3C]"
                            title="Minimum cycle time (seconds)"
                          />
                          <span className="text-slate-400 font-bold text-xs">–</span>
                          {isOpenEnded(tier.rating) ? (
                            <span
                              className="w-14 h-7 inline-flex items-center justify-center text-xs font-mono font-bold text-slate-500"
                              title="Slowest level: no upper cycle-time limit"
                            >
                              ∞
                            </span>
                          ) : (
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              value={tier.maxSec}
                              onChange={(e) => handleTierChange(tier.rating, "maxSec", e.target.value)}
                              className="w-14 h-7 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 text-center focus:outline-none focus:border-[#9C5B3C]"
                              title="Maximum cycle time (seconds)"
                            />
                          )}
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
                          className="w-full text-[11px] text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#9C5B3C] focus:bg-white px-1 py-0.5 rounded transition-colors focus:outline-none"
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
              className="bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-xs font-bold"
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
