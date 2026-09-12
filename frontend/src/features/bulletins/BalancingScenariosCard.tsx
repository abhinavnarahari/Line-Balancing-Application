import { useState, useEffect } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Cpu, 
  ArrowRight, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Lightbulb, 
  Scissors, 
  Calendar,
  Users,
  CheckCircle2,
  Split,
  Workflow,
  Activity
} from "lucide-react";
import type { BalancingScenario } from "./lineBalancingScenarios";

interface BalancingScenariosCardProps {
  scenarios: BalancingScenario[];
  activeScenarioId?: string;
  appliedScenarioId?: string;
  lines?: Array<{ id: string | number; lineCode: string; lineName: string }>;
  targetLineId?: string | number;
  onSelectTargetLine?: (lineId: string | number) => void;
  onSelectScenario?: (scenario: BalancingScenario) => void;
  onApplyScenario?: (scenario: BalancingScenario) => void;
  onResetScenario?: () => void;
  shiftHours?: number;
  onChangeShiftHours?: (hours: number) => void;
}

export function BalancingScenariosCard({
  scenarios,
  activeScenarioId,
  appliedScenarioId,
  lines,
  targetLineId = "all",
  onSelectTargetLine,
  onSelectScenario,
  onApplyScenario,
  onResetScenario,
  shiftHours = 8,
  onChangeShiftHours,
}: BalancingScenariosCardProps) {
  const [selectedId, setSelectedId] = useState<string>(activeScenarioId || appliedScenarioId || "recommended");
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showIeNotes, setShowIeNotes] = useState<boolean>(true);
  const [detailTab, setDetailTab] = useState<"workstations" | "machines" | "actions">("workstations");

  // Keep selectedId in sync with activeScenarioId / appliedScenarioId
  useEffect(() => {
    if (activeScenarioId) {
      setSelectedId(activeScenarioId);
    } else if (appliedScenarioId) {
      setSelectedId(appliedScenarioId);
    }
  }, [activeScenarioId, appliedScenarioId]);

  if (!scenarios || scenarios.length === 0) return null;

  const currentSelected = scenarios.find((s) => s.id === selectedId) || scenarios[0];
  const baselineScenario = scenarios.find((s) => s.id === "baseline") || scenarios[0];

  const handleSelect = (scenario: BalancingScenario) => {
    setSelectedId(scenario.id);
    if (onSelectScenario) {
      onSelectScenario(scenario);
    }
    if (onApplyScenario) {
      onApplyScenario(scenario);
    }
  };

  const getTargetLineLabel = () => {
    if (!targetLineId || targetLineId === "all") return "All Production Lines";
    const found = lines?.find(l => String(l.id) === String(targetLineId));
    return found ? `${found.lineCode} (${found.lineName})` : `Line ${targetLineId}`;
  };

  return (
    <div className="bg-white border border-[#E6DDCE] rounded-3xl p-5 shadow-2xs space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DDCE] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#221912]">
              Intelligent Line Balancing Scenarios
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Garment IE Standard
            </span>
          </div>
          <p className="text-[11px] text-[#8C7E6E]">
            Shopfloor workstation layouts, theoretical manning ratios (<span className="font-mono font-semibold">T_i = SMV/PT</span>), and bottleneck splitting heuristics.
          </p>
        </div>

        {/* Shift Duration Controller & Headline Banner */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Production Line Selector */}
          {lines && lines.length > 0 && onSelectTargetLine && (
            <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-2.5 py-1 rounded-xl border border-[#E6DDCE]">
              <span className="text-[10px] uppercase font-black text-[#8C7E6E] tracking-wider">Target Line:</span>
              <select
                value={targetLineId || "all"}
                onChange={(e) => onSelectTargetLine(e.target.value)}
                className="bg-white border border-[#E6DDCE] rounded-lg px-2 py-0.5 text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="all">All Lines (Default for this Bulletin)</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lineCode} · {l.lineName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shift Hours Selector */}
          {onChangeShiftHours && (
            <div className="flex items-center gap-1 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
              <Calendar className="w-3 h-3 text-[#8C7E6E] ml-1" />
              {[8, 9, 10].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => onChangeShiftHours(hours)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    shiftHours === hours
                      ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  {hours}h Shift
                </button>
              ))}
            </div>
          )}

          {/* Highlight Headline Badge */}
          {scenarios[1] && (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-sm">{scenarios[1].tagline}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3 Scenario Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {scenarios.map((scenario) => {
          const isSelected = selectedId === scenario.id;
          const isRec = scenario.id === "recommended";
          const isPeak = scenario.id === "peak";

          const themeBorder = isSelected
            ? isRec
              ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/30 shadow-md"
              : isPeak
                ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 shadow-md"
                : "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/30 shadow-md"
            : "border-[#E6DDCE] bg-white hover:border-[#9C5B3C]/50";

          const savedPieces = scenario.dailyOutput100 - baselineScenario.dailyOutput100;

          return (
            <div
              key={scenario.id}
              onClick={() => handleSelect(scenario)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${themeBorder}`}
            >
              {/* Badge Top Strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                    isRec
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : isPeak
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {scenario.badge}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#221912]">
                    <Users className="w-3 h-3 text-[#8C7E6E]" />
                    <span>{scenario.totalOperators} Ops</span>
                    <span className="text-[#8C7E6E]">•</span>
                    <Cpu className="w-3 h-3 text-[#8C7E6E]" />
                    <span>{scenario.totalMachines} Mc</span>
                  </div>
                </div>

                {/* Workstation Breakdown Pills */}
                <div className="flex items-center gap-1.5 text-[9.5px] font-mono flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-[#F6F1E8] border border-[#E6DDCE] text-[#8C7E6E] font-bold">
                    {scenario.totalOperations || scenario.workstationCount} Operations
                  </span>
                  <span className="text-[#8C7E6E]">{scenario.singleStationCount} Single</span>
                  {(scenario.parallelOperationCount || 0) > 0 && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                      +{scenario.parallelOperationCount} Split ({scenario.parallelStationCount} Benches)
                    </span>
                  )}
                  {scenario.combinedStationCount > 0 && (
                    <span className="text-indigo-700 font-bold bg-indigo-50 px-1 rounded border border-indigo-200">
                      +{scenario.combinedStationCount} Comb
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Core Metrics */}
              <div>
                <h4 className="text-sm font-black text-[#221912] flex items-center justify-between">
                  <span>{scenario.name}</span>
                  <div className="text-right">
                    <span className={`text-xl font-black font-mono ${
                      scenario.lineBalanceEfficiency >= 80
                        ? "text-emerald-700"
                        : scenario.lineBalanceEfficiency >= 70
                          ? "text-amber-700"
                          : "text-slate-700"
                    }`}>
                      {scenario.lineBalanceEfficiency}%
                    </span>
                    <span className="block text-[9.5px] font-bold text-[#8C7E6E]">
                      {scenario.balanceDelay}% Delay
                    </span>
                  </div>
                </h4>
                {/* Visual Efficiency vs Balance Delay Progress Bar */}
                <div className="mt-1.5 space-y-1">
                  <div className="h-2 w-full bg-[#E6DDCE] rounded-full overflow-hidden flex shadow-2xs">
                    <div 
                      className={`h-full transition-all duration-500 rounded-l-full ${
                        scenario.lineBalanceEfficiency >= 80 
                          ? "bg-emerald-600" 
                          : scenario.lineBalanceEfficiency >= 70 
                            ? "bg-amber-500" 
                            : "bg-slate-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, scenario.lineBalanceEfficiency))}%` }}
                    />
                    <div 
                      className="h-full bg-rose-400/80 transition-all duration-500 rounded-r-full"
                      style={{ width: `${Math.min(100, Math.max(0, scenario.balanceDelay))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Engineering Output & Balancing Metrics */}
              <div className="bg-[#F9F7F4] p-3 rounded-xl border border-[#E6DDCE] space-y-2 text-xs">
                {/* Primary Target Output */}
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-[#221912] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Target Output:
                  </span>
                  <span className="font-mono font-black text-emerald-800 text-xs sm:text-sm">
                    {scenario.hourlyOutput100} pcs/hr{" "}
                    <span className="text-[10px] text-[#8C7E6E] font-normal">
                      ({scenario.dailyOutput100}/shf)
                    </span>
                  </span>
                </div>

                {/* Pitch Time */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E6DDCE]/60">
                  <span className="text-[10.5px] font-medium text-[#8C7E6E]">Pitch Time:</span>
                  <span className="font-mono font-bold text-sky-800">
                    {(scenario.pitchTime * 60).toFixed(1)}s
                  </span>
                </div>

                {/* Pacing Station & Bottleneck Cycle Time */}
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-medium text-[#8C7E6E]">Pacing Cycle:</span>
                  <span className="font-mono font-bold text-amber-800 text-right truncate max-w-[190px]" title={scenario.bottleneckOpName}>
                    {(scenario.bottleneckCycleTime * 60).toFixed(1)}s ({scenario.bottleneckOpName})
                  </span>
                </div>

                {/* Labor Productivity */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#E6DDCE]/60">
                  <span className="text-[10.5px] font-medium text-[#8C7E6E]">Productivity:</span>
                  <span className="font-mono font-bold text-emerald-800 flex items-center gap-1">
                    {scenario.laborProductivity} pcs/op/hr
                    {scenario.laborProductivityDelta > 0 && (
                      <span className="text-[9.5px] text-emerald-600 font-bold">
                        (+{scenario.laborProductivityDelta})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Specific Adjustments bullet list */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                  Line Modifications:
                </span>
                <ul className="space-y-1.5">
                  {scenario.specificAdjustments.map((adj, idx) => (
                    <li key={idx} className="text-[11px] text-[#221912] flex items-start gap-1.5 font-medium leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B3C] mt-1 shrink-0" />
                      <span className="break-words">{adj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Saved Capacity / ROI Callout Pill */}
              {savedPieces > 0 && scenario.id !== "baseline" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-[10.5px] text-emerald-900 font-bold flex items-center justify-between">
                  <span>Shift Gain:</span>
                  <span className="font-mono text-emerald-800">+{savedPieces} garments/day</span>
                </div>
              ) : (
                <div className="bg-white/80 border border-[#E6DDCE] rounded-lg px-2.5 py-1 text-[10px] text-[#8C7E6E] font-medium leading-snug">
                  <span className="font-bold text-[#221912]">Benchmark: </span>
                  <span>{scenario.roiMetric.replace(/^Benchmark:\s*/i, "")}</span>
                </div>
              )}

              {/* Apply / Active Scenario State */}
              {(() => {
                if (isSelected) {
                  return (
                    <div className="space-y-1.5 mt-2">
                      <div className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 shadow-2xs ${
                        isRec
                          ? "bg-emerald-600 text-white"
                          : isPeak
                            ? "bg-indigo-600 text-white"
                            : "bg-amber-600 text-white"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>✓ Active Scenario Selected</span>
                        </div>
                        <span className="text-[9.5px] font-normal opacity-90 text-center">
                          Applies to Planned Lines for {getTargetLineLabel()} on Save/Update
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(scenario);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs mt-2 bg-[#F6F1E8] text-[#221912] hover:bg-[#EAE2D5] border border-[#E6DDCE]"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#9C5B3C]" />
                    <span>Select {scenario.name} ({scenario.workstationCount} WS)</span>
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* ── Active Simulation Scoped Notice ── */}
      {(() => {
        const activeOrApplied = scenarios.find(s => s.id === (appliedScenarioId || selectedId)) || currentSelected;

        return (
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#221912]">
                  Active Scenario: <span className="text-emerald-800">{activeOrApplied?.name}</span> ({activeOrApplied?.totalOperators} Operators · {activeOrApplied?.lineBalanceEfficiency}% Eff) for <span className="text-[#9C5B3C] underline decoration-[#9C5B3C]/40 font-bold">{getTargetLineLabel()}</span>
                </p>
                <p className="text-[11px] text-[#8C7E6E] mt-0.5">
                  When you click <strong className="text-[#221912]">Save / Update Operation Bulletin</strong> below, these workstation allocations, pitch time, and efficiency will be applied to <strong>Planned Lines</strong>.
                </p>
              </div>
            </div>
            {onResetScenario && selectedId !== "baseline" && (
              <button
                type="button"
                onClick={onResetScenario}
                className="px-3 py-1 bg-white hover:bg-rose-50 border border-[#E6DDCE] hover:border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                Reset to Baseline (1:1)
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Senior Industrial Engineer Executive Analysis & Rationale ── */}
      <div className="bg-[#FAF8F5] border border-[#E6DDCE] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">

            <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[#221912]">
              Senior IE Analysis for "{currentSelected.name}":
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowIeNotes(!showIeNotes)}
              className="text-xs font-bold text-[#8C7E6E] hover:text-[#221912] flex items-center gap-1 cursor-pointer"
            >
              <span>{showIeNotes ? "Collapse IE Notes" : "Expand IE Notes"}</span>
              {showIeNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showDetails ? "Hide Workstation Ledger" : "View Workstations & Machine Ledger"}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Narrative Box */}
        {showIeNotes && (
          <div className="space-y-3 pt-1 border-t border-[#E6DDCE]/60">
            <p className="text-xs leading-relaxed text-[#221912] font-medium bg-white p-3 rounded-xl border border-[#E6DDCE]">
              {currentSelected.humanIeRationale}
            </p>
          </div>
        )}

        {/* ── Sub-Tabs Detailed View: Workstation Layout, Machine Ledger, IE Actions ── */}
        {showDetails && (
          <div className="pt-2 border-t border-[#E6DDCE] space-y-3 animate-in fade-in duration-200">
            {/* Sub-Tab Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E6DDCE] pb-2">
              <div className="flex items-center bg-[#F6F1E8] p-0.5 rounded-xl border border-[#E6DDCE] text-xs">
                <button
                  type="button"
                  onClick={() => setDetailTab("workstations")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    detailTab === "workstations"
                      ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Shopfloor Workstations ({currentSelected.workstations?.length || currentSelected.workstationCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailTab("machines")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    detailTab === "machines"
                      ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Machine Ledger ({currentSelected.totalMachines})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailTab("actions")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    detailTab === "actions"
                      ? "bg-white text-[#9C5B3C] shadow-2xs border border-[#E6DDCE]"
                      : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Bottleneck Relief &amp; Clustering</span>
                </button>
              </div>

              {/* Summary Stats Pill */}
              <div className="text-[11px] font-mono text-[#8C7E6E] flex items-center gap-2">
                <span>Pitch: <b className="text-sky-800">{(currentSelected.pitchTime * 60).toFixed(1)}s</b></span>
                <span>•</span>
                <span>Pacing: <b className="text-amber-800">{(currentSelected.bottleneckCycleTime * 60).toFixed(1)}s</b></span>
                <span>•</span>
                <span>Eff: <b className="text-emerald-700">{currentSelected.lineBalanceEfficiency}%</b></span>
              </div>
            </div>

            {/* TAB 1: Shopfloor Workstation Layout */}
            {detailTab === "workstations" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#8C7E6E]">
                  <span>
                    Theoretical Manning Ratio: <span className="font-mono font-bold text-[#221912]">T_i = SMV / Pitch Time</span>. Stations with <span className="font-mono text-emerald-700 font-bold">T_i ≈ 1.0</span> are perfectly balanced.
                  </span>
                  <span className="font-mono text-[10px] text-[#8C7E6E]">
                    {currentSelected.workstations?.length || 0} benches allocated
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E6DDCE] bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E6DDCE] bg-[#FDFCFB] text-[10px] font-bold text-[#8C7E6E] uppercase">
                        <th className="py-2.5 px-3 w-16 text-center">Station</th>
                        <th className="py-2.5 px-2.5 w-24">Type</th>
                        <th className="py-2.5 px-3">Operation(s) Handled</th>
                        <th className="py-2.5 px-3">Primary Machine</th>
                        <th className="py-2.5 px-2.5 text-center">Manning</th>
                        <th className="py-2.5 px-3 text-right">Base SMV (sec)</th>
                        <th className="py-2.5 px-3 text-right">Effective Cycle (sec)</th>
                        <th className="py-2.5 px-3 text-center" title="Theoretical Manning Ratio (SMV / Pitch Time)">
                          Manning Ratio (T_i)
                        </th>
                        <th className="py-2.5 px-3 text-right">Cap (100%)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DDCE]">
                      {(currentSelected.workstations || []).map((ws, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-[#FEFCF9] transition-colors ${
                            ws.isBottleneck 
                              ? "bg-amber-50/40" 
                              : ws.workstationType === "combined"
                                ? "bg-indigo-50/20"
                                : ws.workstationType === "parallel"
                                  ? "bg-emerald-50/20"
                                  : ""
                          }`}
                        >
                          {/* Station Code */}
                          <td className="py-2 px-3 text-center">
                            <span className="font-mono font-black text-xs text-[#221912] px-1.5 py-0.5 rounded bg-[#F6F1E8] border border-[#E6DDCE]">
                              {ws.stationCode}
                            </span>
                          </td>

                          {/* Workstation Type */}
                          <td className="py-2 px-2.5">
                            {ws.workstationType === "parallel" ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Split className="w-2.5 h-2.5" /> Parallel
                              </span>
                            ) : ws.workstationType === "combined" ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300">
                                <Scissors className="w-2.5 h-2.5" /> Combined
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                                Single
                              </span>
                            )}
                          </td>

                          {/* Operation(s) Handled */}
                          <td className="py-2 px-3">
                            <div className="space-y-0.5">
                              {ws.operations.map((op, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs">
                                  <span className="font-mono text-[10px] text-[#8C7E6E] font-bold">#{op.sequence}</span>
                                  <span className="font-semibold text-[#221912]">{op.name}</span>
                                  <span className="text-[10px] font-mono text-[#8C7E6E]">({(op.smv * 60).toFixed(1)}s)</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Machine Class */}
                          <td className="py-2 px-3 text-[#8C7E6E] text-[11px]">
                            {ws.primaryMachineType}
                          </td>

                          {/* Manning */}
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#221912] text-xs">
                            {ws.allocatedOperators} Op / {ws.allocatedMachines} Mc
                          </td>

                          {/* Base Station SMV */}
                          <td className="py-2 px-3 text-right font-mono font-medium text-[#8C7E6E]">
                            {(ws.totalStationSmv * 60).toFixed(1)}s
                          </td>

                          {/* Effective Cycle Time */}
                          <td className="py-2 px-3 text-right font-mono font-black text-[#9C5B3C]">
                            {(ws.effectiveCycleTime * 60).toFixed(1)}s
                          </td>

                          {/* Theoretical Manning Ratio (T_i) */}
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block font-mono font-black text-[10.5px] px-2 py-0.5 rounded-md border ${
                              ws.theoreticalManning >= 1.25
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : ws.theoreticalManning <= 0.60
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }`}>
                              {ws.theoreticalManning.toFixed(2)} T_i
                            </span>
                          </td>

                          {/* Station Capacity (100%) */}
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#221912]">
                            {ws.stationCapacity100 || ws.stationCapacity85} <span className="text-[10px] font-normal text-[#8C7E6E]">pcs/h</span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              ws.status === "bottleneck"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : ws.status === "over_pitch"
                                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                                  : ws.status === "under_utilized"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-emerald-50 text-emerald-800"
                            }`}>
                              {ws.status === "bottleneck" 
                                ? "Bottleneck" 
                                : ws.status === "over_pitch" 
                                  ? "Over Pitch" 
                                  : ws.status === "under_utilized" 
                                    ? "Low SMV" 
                                    : "Balanced"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Factory Machine Requirements Ledger */}
            {detailTab === "machines" && (
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] block">
                  Required Machinery Inventory on Floor ({currentSelected.totalMachines} Total Machines):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {Object.entries(currentSelected.machineLedger).map(([machine, count]) => (
                    <div key={machine} className="p-3 rounded-xl bg-white border border-[#E6DDCE] shadow-2xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#221912] block truncate" title={machine}>{machine}</span>
                        <span className="text-[10.5px] text-[#8C7E6E]">Sewing workstation</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-[#9C5B3C] text-white text-xs font-mono font-black">
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: IE Bottleneck Choke Relief & Multi-Skilling Clustering */}
            {detailTab === "actions" && (
              <div className="space-y-3">
                {/* Bottleneck Relief Table (if any parallel machines added) */}
                {currentSelected.chokeReliefList && currentSelected.chokeReliefList.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      Targeted Bottleneck Choke Relief ({currentSelected.chokeReliefList.length} Stations Optimized):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {currentSelected.chokeReliefList.map((choke, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white border border-[#E6DDCE] text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-[#221912]">
                            <span className="truncate" title={choke.opName}>{choke.opName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {choke.allocatedMachines}x Mach
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#8C7E6E]">
                            <span>Cycle Relief:</span>
                            <span className="font-mono font-bold text-[#221912]">
                              <span className="line-through text-rose-500 mr-1">{choke.beforeCycle.toFixed(2)}m</span>
                              <ArrowRight className="w-2.5 h-2.5 inline mx-0.5 text-emerald-600" />
                              <span className="text-emerald-700">{choke.afterCycle.toFixed(2)}m</span>
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8C7E6E] truncate">
                            Machine: {choke.machineType.split("(")[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-[#E6DDCE] text-xs text-[#8C7E6E]">
                    No parallel bottleneck splits required for this scenario baseline.
                  </div>
                )}

                {/* Operator Multi-Tasking / Clustering Suggestions */}
                {currentSelected.clusteringOpportunities && currentSelected.clusteringOpportunities.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1.5">
                      <Scissors className="w-3 h-3 text-[#9C5B3C]" />
                      Operator Multi-Skilling / Operation Clustering Recommendations:
                    </span>
                    <div className="space-y-1.5">
                      {currentSelected.clusteringOpportunities.map((cluster, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                          <div className="text-[11px] text-[#221912] leading-snug">
                            <span className="font-bold text-amber-900">{cluster.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
