import { 
  Compass, 
  AlertTriangle, 
  Sparkles, 
  Network, 
  ArrowRightLeft
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import type { EfficiencyMetrics } from "./globalPoolOptimizer";

interface EfficiencyComparisonCardProps {
  metrics: EfficiencyMetrics;
  onOptimize: () => void;
  isOptimizing?: boolean;
  hasStations: boolean;
  onApplySwap?: (swap: any) => void;
}

export function EfficiencyComparisonCard({
  metrics,
  onOptimize,
  isOptimizing = false,
  hasStations,
  onApplySwap: _onApplySwap
}: EfficiencyComparisonCardProps) {
  const {
    designedObEfficiency,
    realPoolAchievableEfficiency,
    realizationRatio,
    efficiencyGapPct,
    capacityPerHourDesigned,
    capacityPerHourAchievable,
    dailyOutputLossPerShift,
    bottleneckStationNum,
    bottleneckOperationName,
    bottleneckOperatorName,
    bottleneckCycleTimeSecs,
    directSkillMatchCount,
    affinityMatchCount,
    unfulfilledSlotCount,
    swapRecommendations,
  } = metrics;

  const isHealthy = realizationRatio >= 90;
  const isModerate = realizationRatio >= 75 && realizationRatio < 90;

  return (
    <div className="bg-white border border-[#E6DDCE] rounded-2xl shadow-[0_1px_3px_rgba(34,25,18,0.05)] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E6DDCE] bg-gradient-to-r from-[#FDFBF7] via-[#F6F1E8] to-[#FDFBF7] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#9C5B3C] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#221912]">
                  Real Operator Pool vs. Designed OB Efficiency
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#9C5B3C]/10 text-[#9C5B3C] border border-[#9C5B3C]/20">
                  Full Pool Optimization
                </span>
              </div>
              <p className="text-xs text-[#8C7E6E]">
                Simulates real operator skill ratings & affinitized coverage against theoretical engineering design
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onOptimize}
            disabled={!hasStations || isOptimizing}
            className="bg-[#9C5B3C] hover:bg-[#854B30] text-white shadow-xs font-bold text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            {isOptimizing ? "Optimizing Across Pool..." : "Optimize Full Pool"}
          </Button>
        </div>
      </div>

      {/* KPI Comparison Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#E6DDCE]/70 bg-white">
        {/* Metric 1: Designed OB Efficiency */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
              Designed OB (Theoretical)
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              100% Std Pace
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900">
              {designedObEfficiency.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">LBE Target</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-slate-700 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, designedObEfficiency))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Engineering Line Cap:</span>
            <strong className="text-slate-800 font-mono">{capacityPerHourDesigned} pcs/hr</strong>
          </p>
        </div>

        {/* Metric 2: Real Pool Achievable Efficiency */}
        <div className={`p-4 rounded-2xl border ${
          isHealthy
            ? "border-emerald-200 bg-emerald-50/40"
            : isModerate
              ? "border-amber-200 bg-amber-50/40"
              : "border-rose-200 bg-rose-50/40"
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#221912]">
              Real Pool Achievable
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              isHealthy
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : isModerate
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
            }`}>
              {realizationRatio.toFixed(1)}% Realization
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              isHealthy ? "text-emerald-900" : isModerate ? "text-amber-900" : "text-rose-900"
            }`}>
              {realPoolAchievableEfficiency.toFixed(1)}%
            </span>
            <span className="text-xs text-[#8C7E6E] font-semibold">Floor Realistic</span>
          </div>
          <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden border border-black/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHealthy ? "bg-emerald-600" : isModerate ? "bg-amber-600" : "bg-rose-600"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, realPoolAchievableEfficiency))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8C7E6E] flex items-center justify-between pt-1">
            <span>Realistic Output:</span>
            <strong className="text-[#221912] font-mono">{capacityPerHourAchievable} pcs/hr</strong>
          </p>
        </div>

        {/* Metric 3: Variance & Daily Skill Deficit */}
        <div className="p-4 rounded-2xl border border-[#E6DDCE] bg-[#FDFBF7] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
              Skill & Bottleneck Deficit
            </span>
            <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
              efficiencyGapPct <= 5 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            }`}>
              {efficiencyGapPct > 0 ? `-${efficiencyGapPct}% Gap` : "Balanced"}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-[#9C5B3C]">
              {dailyOutputLossPerShift}
            </span>
            <span className="text-xs text-[#8C7E6E] font-semibold">pcs / shift lost</span>
          </div>
          <div className="text-[11px] text-[#665A4E] space-y-1 pt-1 border-t border-[#E6DDCE]/50">
            <div className="flex items-center justify-between">
              <span>Hourly Deficit:</span>
              <span className="font-mono font-bold text-rose-700">-{metrics.outputDeficitPerHour} pcs/hr</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Affinity Coverage:</span>
              <span className="font-mono font-bold text-emerald-700">{affinityMatchCount} stations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Spotlight & Affinity Coverage Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-white via-[#FDFBF7] to-white grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Bottleneck Spotlight */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-rose-200/80 bg-rose-50/30">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-900 uppercase tracking-wider text-[10.5px]">
                Pacing Bottleneck Under Real Pool
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-200/60 font-mono font-bold text-rose-800 text-[10px]">
                {bottleneckCycleTimeSecs.toFixed(1)}s Cycle
              </span>
            </div>
            <p className="font-bold text-slate-900 mt-0.5 truncate">
              Station #{bottleneckStationNum}: {bottleneckOperationName}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Assigned: <strong className="text-slate-800">{bottleneckOperatorName}</strong>. This station sets the ceiling for entire line output.
            </p>
          </div>
        </div>

        {/* Affinity Coverage Status */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
            <Network className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-900 uppercase tracking-wider text-[10.5px]">
                Operation Affinity Substitutions
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-200/60 font-mono font-bold text-indigo-800 text-[10px]">
                {affinityMatchCount} Active
              </span>
            </div>
            <p className="font-semibold text-slate-800 mt-0.5">
              {affinityMatchCount > 0 
                ? `${affinityMatchCount} operators covering alternative operations with calibrated efficiency transfer.`
                : "No alternative operations needed; all stations staffed via direct skills."}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Direct Primary Skills: <strong className="text-slate-700">{directSkillMatchCount}</strong> · Unassigned: <strong className="text-slate-700">{unfulfilledSlotCount}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Intelligent Swap Recommendation Banner (if available) */}
      {swapRecommendations && swapRecommendations.length > 0 && (
        <div className="p-4 bg-amber-50/80 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block">
                Intelligent Swap Recommendation (+{swapRecommendations[0].predictedEfficiencyGainPct}% Efficiency):
              </span>
              <p className="text-amber-900 mt-0.5">
                {swapRecommendations[0].rational}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
