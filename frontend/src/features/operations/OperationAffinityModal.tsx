import { useState, useEffect, useMemo } from "react";
import { 
  Network, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRightLeft, 
  Info
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { 
  operationsApi, 
  type Operation, 
  type OperationAffinity, 
  type AffinityLevel 
} from "./api";

interface OperationAffinityModalProps {
  operation: Operation | null;
  allOperations: Operation[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const AFFINITY_LEVELS: {
  level: AffinityLevel;
  label: string;
  defaultPct: number;
  color: string;
  badge: string;
  desc: string;
}[] = [
  {
    level: "DIRECT_SUBSTITUTE",
    label: "Direct Substitute (Tier 1)",
    defaultPct: 95,
    color: "emerald",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Nearly identical stitch/seam geometry and machine. ~95% output retention."
  },
  {
    level: "SIMILAR_TECHNIQUE",
    label: "Similar Technique (Tier 2)",
    defaultPct: 85,
    color: "amber",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Same machine family or related handling. ~85% output retention."
  },
  {
    level: "BASIC_COMPATIBLE",
    label: "Basic Compatible (Tier 3)",
    defaultPct: 70,
    color: "indigo",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    desc: "General sewing compatibility. ~70% output retention."
  }
];

export function OperationAffinityModal({
  operation,
  allOperations,
  isOpen,
  onClose,
  onUpdated
}: OperationAffinityModalProps) {
  const [affinities, setAffinities] = useState<OperationAffinity[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedAltOpId, setSelectedAltOpId] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<AffinityLevel>("DIRECT_SUBSTITUTE");
  const [transferPct, setTransferPct] = useState<number>(95);
  const [notes, setNotes] = useState<string>("");
  const [createSymmetric, setCreateSymmetric] = useState<boolean>(true);

  // Fetch affinities when modal opens for the selected operation
  const loadAffinities = async () => {
    if (!operation) return;
    setLoading(true);
    setError(null);
    try {
      const data = await operationsApi.getAffinities(operation.id);
      setAffinities(data);
    } catch (err: any) {
      console.error("Failed to load operation affinities:", err);
      setError("Failed to load operation affinities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && operation) {
      loadAffinities();
      setSelectedAltOpId("");
      setSelectedLevel("DIRECT_SUBSTITUTE");
      setTransferPct(95);
      setNotes("");
      setCreateSymmetric(true);
    }
  }, [isOpen, operation]);

  // Handle Affinity Tier selection
  const handleLevelChange = (lvl: AffinityLevel) => {
    setSelectedLevel(lvl);
    const cfg = AFFINITY_LEVELS.find(l => l.level === lvl);
    if (cfg) {
      setTransferPct(cfg.defaultPct);
    }
  };

  // Eligible alternative operations: not self and not already in affinities
  const existingAltIds = useMemo(() => {
    return new Set(affinities.map(a => String(a.alternativeOperationId)));
  }, [affinities]);

  const eligibleOps = useMemo(() => {
    if (!operation) return [];
    return allOperations.filter(
      o => String(o.id) !== String(operation.id) && !existingAltIds.has(String(o.id)) && o.active
    );
  }, [allOperations, operation, existingAltIds]);

  const selectedAltOp = useMemo(() => {
    return allOperations.find(o => String(o.id) === String(selectedAltOpId));
  }, [allOperations, selectedAltOpId]);

  const isMachineSame = useMemo(() => {
    if (!operation || !selectedAltOp) return true;
    return (operation.machineType || "").toLowerCase() === (selectedAltOp.machineType || "").toLowerCase();
  }, [operation, selectedAltOp]);

  const handleAddAffinity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operation || !selectedAltOpId) return;

    setSubmitting(true);
    setError(null);
    try {
      await operationsApi.addAffinity(operation.id, {
        alternativeOperationId: selectedAltOpId,
        affinityLevel: selectedLevel,
        efficiencyTransferPct: Number(transferPct),
        ratingDowngrade: 0,
        machineCompatible: isMachineSame,
        notes: notes.trim() || undefined,
        createSymmetric,
      });

      setSelectedAltOpId("");
      setNotes("");
      await loadAffinities();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error("Failed to add operation affinity:", err);
      setError(err?.response?.data?.message || "Failed to add affinity.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAffinity = async (affinityId: string | number) => {
    if (!confirm("Are you sure you want to remove this operation affinity?")) return;
    try {
      await operationsApi.deleteAffinity(affinityId);
      await loadAffinities();
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error("Failed to delete affinity:", err);
      setError("Failed to delete affinity mapping.");
    }
  };

  if (!operation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Operation Affinitization & Fallback Coverage"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header context */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F6F1E8] to-[#FDFBF7] border border-[#E6DDCE] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#9C5B3C] text-white">
                  {operation.operationCode}
                </span>
                <h3 className="text-base font-bold text-[#221912]">
                  {operation.name}
                </h3>
              </div>
              <p className="text-xs text-[#8C7E6E] mt-1 flex items-center gap-2">
                <span>Machine: <strong className="text-[#221912]">{operation.machineType || "Single Needle Lockstitch"}</strong></span>
                <span>•</span>
                <span>Benchmark SMV: <strong className="text-[#221912] font-mono">{operation.standardSmv || 0.5} min</strong></span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#8C7E6E] block uppercase font-bold tracking-wider">Active Affinities</span>
              <span className="text-lg font-black font-mono text-[#9C5B3C]">{affinities.length} Alternatives</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E6DDCE]/60 flex items-start gap-2 text-xs text-[#665A4E]">
            <Info className="w-4 h-4 text-[#9C5B3C] shrink-0 mt-0.5" />
            <span>
              <strong>Industrial Engineering Rule:</strong> When an operator skilled in <em>{operation.name}</em> is deployed to an alternative operation, the optimization algorithm scales their cycle time by the configured transfer efficiency.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Affinities List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-[#9C5B3C]" />
              Affinitized Alternative Operations ({affinities.length})
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[#E6DDCE] border-t-[#9C5B3C] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8C7E6E] mt-2">Loading affinities...</p>
            </div>
          ) : affinities.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E6DDCE] rounded-xl bg-[#FDFBF7]">
              <Layers className="w-8 h-8 text-[#8C7E6E]/50 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-[#221912]">No Alternative Operations Configured</p>
              <p className="text-[11px] text-[#8C7E6E] max-w-sm mx-auto mt-0.5">
                Define operations an operator skilled in this step can cover when their primary operation is unavailable.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EAE0] border border-[#E6DDCE] rounded-xl overflow-hidden bg-white shadow-2xs">
              {affinities.map(aff => {
                const tier = AFFINITY_LEVELS.find(l => l.level === aff.affinityLevel) || AFFINITY_LEVELS[0];
                return (
                  <div key={aff.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FDFBF7] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#221912]">
                          {aff.alternativeOperationName || `Operation #${aff.alternativeOperationId}`}
                        </span>
                        <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {aff.alternativeOperationCode || "OP"}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                          {tier.label.split(" (")[0]} · {aff.efficiencyTransferPct}% Eff
                        </span>
                        {aff.machineCompatible ? (
                          <span className="text-[10px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Machine Match
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Diff Machine ({aff.alternativeMachineType})
                          </span>
                        )}
                      </div>
                      {aff.notes && (
                        <p className="text-[11px] text-[#8C7E6E] mt-1 italic">
                          "{aff.notes}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAffinity(aff.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Affinity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form to Add New Affinity */}
        <form onSubmit={handleAddAffinity} className="p-4 rounded-2xl border border-[#E6DDCE] bg-[#FDFBF7] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DDCE]/60 pb-2">
            <h4 className="text-xs font-bold text-[#221912] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#9C5B3C]" />
              Add Alternative Operation Coverage
            </h4>
            <span className="text-[11px] text-[#8C7E6E]">
              {eligibleOps.length} candidates available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Alternative Operation */}
            <div>
              <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block mb-1">
                Alternative Operation *
              </label>
              <select
                value={selectedAltOpId}
                onChange={e => setSelectedAltOpId(e.target.value)}
                required
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-xl px-2.5 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
              >
                <option value="">— Select Compatible Operation —</option>
                {eligibleOps.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.operationCode} - {op.name} ({op.machineType || "Lockstitch"})
                  </option>
                ))}
              </select>
            </div>

            {/* Affinity Tier */}
            <div>
              <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block mb-1">
                Affinity Tier *
              </label>
              <select
                value={selectedLevel}
                onChange={e => handleLevelChange(e.target.value as AffinityLevel)}
                className="w-full h-9 bg-white border border-[#E6DDCE] rounded-xl px-2.5 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
              >
                {AFFINITY_LEVELS.map(lvl => (
                  <option key={lvl.level} value={lvl.level}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Compatibility Warning / Banner */}
          {selectedAltOp && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isMachineSame 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-800" 
                : "bg-amber-50/70 border-amber-200 text-amber-800"
            }`}>
              <div className="flex items-center gap-2">
                {isMachineSame ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {isMachineSame
                    ? `Compatible machine type: Both use ${operation.machineType || "Single Needle Lockstitch"}`
                    : `Machine mismatch: ${operation.machineType || "Lockstitch"} vs ${selectedAltOp.machineType || "Lockstitch"}. Operator must be cross-trained.`}
                </span>
              </div>
              <span className="font-mono font-bold text-[11px]">
                SMV: {selectedAltOp.standardSmv || 0.5}m
              </span>
            </div>
          )}

          {/* Advanced Tuning: Transfer % */}
          <div>
            <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block mb-1">
              Efficiency Transfer Retention (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="30"
                max="100"
                step="1"
                value={transferPct}
                onChange={e => setTransferPct(Number(e.target.value))}
                className="w-24 h-9 bg-white border border-[#E6DDCE] rounded-xl px-2.5 text-xs font-mono font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
              />
              <span className="text-xs text-[#8C7E6E]">
                (Operator cycle time will be scaled by {((100 / Math.max(1, transferPct))).toFixed(2)}x)
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block mb-1">
              Industrial Engineering Justification / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Similar curved seam feed technique, same folder attachment..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full h-9 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
            />
          </div>

          {/* Symmetric Link Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[#221912] cursor-pointer">
              <input
                type="checkbox"
                checked={createSymmetric}
                onChange={e => setCreateSymmetric(e.target.checked)}
                className="w-4 h-4 rounded text-[#9C5B3C] focus:ring-[#9C5B3C] border-[#E6DDCE]"
              />
              <span className="flex items-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#9C5B3C]" />
                Two-way Link: Also affinitize <strong>{selectedAltOp?.name || "alternative"}</strong> to cover <strong>{operation.name}</strong>
              </span>
            </label>

            <Button
              type="submit"
              size="sm"
              disabled={!selectedAltOpId || submitting}
              className="bg-[#9C5B3C] hover:bg-[#854B30] text-white shadow-xs font-bold"
            >
              {submitting ? "Saving..." : "Add Affinity"}
            </Button>
          </div>
        </form>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
