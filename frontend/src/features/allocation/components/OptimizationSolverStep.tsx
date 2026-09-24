import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowLeft,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Sliders,
  CheckCircle,
  Settings2,
  Lock,
  Activity,
  Award,
  Users,
} from "lucide-react";
import type { OptimizationRequest, SolverWeights } from "../types";

interface OptimizationSolverStepProps {
  selectedLineIds: number[];
  planningDate: string;
  shiftId?: number;
  onRunOptimization: (request: OptimizationRequest) => void;
  onBack: () => void;
  isSolving: boolean;
}

const PRESET_WEIGHTS: Record<string, { title: string; desc: string; icon: any; color: string; weights: SolverWeights }> = {
  MAX_OUTPUT: {
    title: "Maximum Total Output (Recommended)",
    desc: "Maximizes overall production volume by aggressively staffing high-velocity operators to critical path bottlenecks.",
    icon: TrendingUp,
    color: "text-[#9C5B3C]",
    weights: { efficiencyWeight: 95, lineBalanceWeight: 65, skillMatchWeight: 90, machineCompatWeight: 45 },
  },
  BALANCED_LINES: {
    title: "Balanced Line Performance",
    desc: "Prevents line starvation and inter-line disparities. Equalizes skill distribution so all lines maintain >80% efficiency.",
    icon: ShieldCheck,
    color: "text-[#2E6F40]",
    weights: { efficiencyWeight: 75, lineBalanceWeight: 95, skillMatchWeight: 85, machineCompatWeight: 60 },
  },
  PRIORITY_PROTECTION: {
    title: "Quality & High-Skill First",
    desc: "Prioritizes tightest skill matrix matching to prevent quality defects and rework on complex garment styling.",
    icon: Award,
    color: "text-[#B48259]",
    weights: { efficiencyWeight: 70, lineBalanceWeight: 75, skillMatchWeight: 100, machineCompatWeight: 50 },
  },
  MIN_MANPOWER: {
    title: "Minimum Floaters & Lean Manpower",
    desc: "Achieves output goals with the most economical workforce footprint, reserving multi-skilled operators as backup floaters.",
    icon: Users,
    color: "text-[#4A6B82]",
    weights: { efficiencyWeight: 70, lineBalanceWeight: 70, skillMatchWeight: 75, machineCompatWeight: 95 },
  },
};

export function OptimizationSolverStep({
  selectedLineIds,
  planningDate,
  shiftId,
  onRunOptimization,
  onBack,
  isSolving,
}: OptimizationSolverStepProps) {
  const [scenario, setScenario] = useState<string>("MAX_OUTPUT");
  const [customWeights, setCustomWeights] = useState<SolverWeights>(PRESET_WEIGHTS.MAX_OUTPUT.weights);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [allowTransfers, setAllowTransfers] = useState<boolean>(true);
  const [allowTrainees, setAllowTrainees] = useState<boolean>(true);

  // Simulated Telemetry Stages during solving
  const [solverStage, setSolverStage] = useState<number>(0);

  useEffect(() => {
    if (!isCustomMode && PRESET_WEIGHTS[scenario]) {
      setCustomWeights(PRESET_WEIGHTS[scenario].weights);
    }
  }, [scenario, isCustomMode]);

  useEffect(() => {
    let interval: any;
    if (isSolving) {
      setSolverStage(1);
      interval = setInterval(() => {
        setSolverStage((prev) => (prev < 4 ? prev + 1 : 4));
      }, 750);
    } else {
      setSolverStage(0);
    }
    return () => clearInterval(interval);
  }, [isSolving]);

  const handleSelectPreset = (key: string) => {
    setIsCustomMode(false);
    setScenario(key);
    setCustomWeights(PRESET_WEIGHTS[key].weights);
  };

  const handleWeightChange = (key: keyof SolverWeights, val: number) => {
    setIsCustomMode(true);
    setCustomWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleStartSolving = () => {
    onRunOptimization({
      planningDate,
      shiftId,
      lineIds: selectedLineIds,
      primaryScenario: scenario,
      allowCrossLineTransfers: allowTransfers,
      allowTraineesOnSimpleOps: allowTrainees,
      createdBy: "Industrial Engineer",
      weights: customWeights,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[11px] font-bold uppercase tracking-wider">
                Step 4 of 5
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E] flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> Multi-Objective Constraint Optimizer
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#221912] tracking-tight">
              Configure & Run Multi-Line Operator Optimizer
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 h-10 rounded-xl border border-[#E6DDCE] shadow-2xs shrink-0">
            <Activity className="w-4 h-4 text-[#2E6F40] animate-pulse" />
            <span className="text-xs font-semibold text-[#8C7E6E]">Engine:</span>
            <span className="font-mono font-bold text-xs text-[#221912]">Mixed-Integer MIP</span>
          </div>
        </div>
      </div>

      {/* Solving Telemetry Overlay (If Solving) */}
      {isSolving && (
        <div className="bg-gradient-to-r from-[#221912] to-[#3B2C21] rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#B48259] animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Solving Global Multi-Line Mathematical Model...
                </h3>
                <p className="text-xs text-[#C4B5A5]">
                  Evaluating operator permutations, skill ratings, machine constraints & pitch balance.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-[#B48259] font-bold uppercase tracking-wider">
              Phase {solverStage} of 4
            </span>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
            {[
              { num: 1, title: "1. Parsing Workstations", desc: "SMV & machine locks" },
              { num: 2, title: "2. Skill Matrix Scoring", desc: "Rating & efficiency fit" },
              { num: 3, title: "3. Bottleneck Resolution", desc: "Takt time alignment" },
              { num: 4, title: "4. Global Assignment", desc: "MIP solver execution" },
            ].map((st) => {
              const isDone = solverStage > st.num;
              const isCurrent = solverStage === st.num;
              return (
                <div
                  key={st.num}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isDone
                      ? "bg-white/15 border-white/20 text-white"
                      : isCurrent
                      ? "bg-[#9C5B3C]/40 border-[#9C5B3C] text-white ring-1 ring-[#9C5B3C]"
                      : "bg-white/5 border-white/10 text-white/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                    <span>{st.title}</span>
                    {isDone && <CheckCircle className="w-3.5 h-3.5 text-[#77876F]" />}
                  </div>
                  <p className="text-[10px] text-[#C4B5A5]">{st.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#9C5B3C] to-[#B48259] h-full transition-all duration-500 rounded-full"
              style={{ width: `${(solverStage / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Solver Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Preset Strategy & Objective Weight Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#E6DDCE] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#221912]">
              <Sliders className="w-4 h-4 text-[#9C5B3C]" />
              <span>Optimization Strategy Presets</span>
            </div>
            {isCustomMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#B48259]/15 text-[#B48259] text-[10px] font-bold uppercase">
                Custom Sliders Active
              </span>
            )}
          </div>

          {/* Strategy Preset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(PRESET_WEIGHTS).map(([key, item]) => {
              const isSelected = scenario === key && !isCustomMode;
              const Icon = item.icon;
              return (
                <div
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-[#FAF7F2] border-[#9C5B3C] ring-1 ring-[#9C5B3C] shadow-xs"
                      : "bg-white border-[#E6DDCE] hover:border-[#B48259] hover:bg-[#FAF7F2]/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-[#9C5B3C] bg-[#9C5B3C]" : "border-[#C4B5A5]"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <h4 className="text-xs font-bold text-[#221912]">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#6B5E51] leading-relaxed line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fine-Grained Objective Weights */}
          <div className="pt-3 border-t border-[#E6DDCE] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#221912]">
                <Settings2 className="w-3.5 h-3.5 text-[#B48259]" />
                <span>Fine-Tuned Objective Weights</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPreset("MAX_OUTPUT")}
                className="text-[11px] font-bold text-[#9C5B3C] hover:underline cursor-pointer"
              >
                Reset to Default Presets
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Output / Efficiency Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#221912]">Throughput & Output Maximization</span>
                  <span className="font-mono font-bold text-[#9C5B3C]">{customWeights.efficiencyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customWeights.efficiencyWeight}
                  onChange={(e) => handleWeightChange("efficiencyWeight", Number(e.target.value))}
                  className="w-full accent-[#9C5B3C] cursor-pointer"
                />
              </div>

              {/* Line Balance Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#221912]">Line Balancing & Workload Smoothing</span>
                  <span className="font-mono font-bold text-[#2E6F40]">{customWeights.lineBalanceWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customWeights.lineBalanceWeight}
                  onChange={(e) => handleWeightChange("lineBalanceWeight", Number(e.target.value))}
                  className="w-full accent-[#2E6F40] cursor-pointer"
                />
              </div>

              {/* Skill Match Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#221912]">Skill Matrix Precision & Quality Fit</span>
                  <span className="font-mono font-bold text-[#B48259]">{customWeights.skillMatchWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customWeights.skillMatchWeight}
                  onChange={(e) => handleWeightChange("skillMatchWeight", Number(e.target.value))}
                  className="w-full accent-[#B48259] cursor-pointer"
                />
              </div>

              {/* Machine Compatibility / Floaters */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#221912]">Floater Reservation & Machine Compatibility</span>
                  <span className="font-mono font-bold text-[#4A6B82]">{customWeights.machineCompatWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customWeights.machineCompatWeight}
                  onChange={(e) => handleWeightChange("machineCompatWeight", Number(e.target.value))}
                  className="w-full accent-[#4A6B82] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hard Constraints & Operational Policy Toggles (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E6DDCE] shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#221912]">
              <ShieldCheck className="w-4 h-4 text-[#2E6F40]" />
              <span>Hard Constraint Rules & Policies</span>
            </div>

            {/* Locked Rules */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-start gap-2.5">
                <Lock className="w-3.5 h-3.5 text-[#9C5B3C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#221912] block">Single Station Assignment Lock</span>
                  <span className="text-[#8C7E6E] text-[11px]">
                    Strict constraint: 1 operator can occupy only 1 workstation simultaneously.
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-start gap-2.5">
                <Lock className="w-3.5 h-3.5 text-[#2E6F40] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#221912] block">Machine Qualification Gate</span>
                  <span className="text-[#8C7E6E] text-[11px]">
                    Operators must hold certification for the workstation machine class (e.g. SNLS, OVERLOCK).
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-start gap-2.5">
                <Lock className="w-3.5 h-3.5 text-[#B48259] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#221912] block">Shift Attendance Verification</span>
                  <span className="text-[#8C7E6E] text-[11px]">
                    Only operators marked PRESENT or ACTIVE on shift date are assigned.
                  </span>
                </div>
              </div>
            </div>

            {/* Policy Toggles */}
            <div className="pt-1 space-y-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/60 transition-colors">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-[#221912] block">Allow Cross-Line Floor Transfers</span>
                  <span className="text-[11px] text-[#8C7E6E]">
                    Permits transferring operators between lines if global line output gain exceeds penalty.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowTransfers}
                  onChange={(e) => setAllowTransfers(e.target.checked)}
                  className="w-4 h-4 accent-[#9C5B3C] rounded-sm cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E6DDCE] bg-white cursor-pointer hover:bg-[#FAF7F2]/60 transition-colors">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-[#221912] block">Permit Trainees on Non-Bottlenecks</span>
                  <span className="text-[11px] text-[#8C7E6E]">
                    Assigns R1-R2 trainee operators to fast, simple operations with &gt;30s buffer.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowTrainees}
                  onChange={(e) => setAllowTrainees(e.target.checked)}
                  className="w-4 h-4 accent-[#9C5B3C] rounded-sm cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-3 border-t border-[#E6DDCE]">
            <button
              type="button"
              onClick={handleStartSolving}
              disabled={isSolving}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B31] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Solving Global Constraints...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Optimize Allocation Across All {selectedLineIds.length} Lines</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSolving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E6DDCE] hover:bg-white text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Line Requirements</span>
        </button>
      </div>
    </div>
  );
}


