import React, { useMemo } from "react";
import { 
  ArrowRight, 
  GitFork, 
  Zap 
} from "lucide-react";
import type { WorkstationAllocation, BalancingScenario } from "../bulletins/lineBalancingScenarios";

interface WorkstationFlowPreviewProps {
  scenario: BalancingScenario;
  onSelectStation?: (station: WorkstationAllocation) => void;
}

export function WorkstationFlowPreview({ scenario, onSelectStation }: WorkstationFlowPreviewProps) {
  const workstations = scenario?.workstations || [];

  // Group stations logically for the flow pipeline (grouping parallel branches together)
  const stationGroups = useMemo(() => {
    const groups: {
      groupKey: string;
      baseNumber: number;
      type: "single" | "parallel" | "combined";
      stations: WorkstationAllocation[];
      primaryOpName: string;
    }[] = [];

    let currentParallelGroup: WorkstationAllocation[] = [];
    let currentBaseNum: number | null = null;

    workstations.forEach((ws) => {
      const isParallelSub = ws.workstationType === "parallel" || /[A-Z]$/.test(ws.stationCode);

      if (isParallelSub) {
        if (currentBaseNum === ws.stationNumber) {
          currentParallelGroup.push(ws);
        } else {
          if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
            groups.push({
              groupKey: `parallel-${currentBaseNum}`,
              baseNumber: currentBaseNum,
              type: "parallel",
              stations: [...currentParallelGroup],
              primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
            });
          }
          currentBaseNum = ws.stationNumber;
          currentParallelGroup = [ws];
        }
      } else {
        if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
          groups.push({
            groupKey: `parallel-${currentBaseNum}`,
            baseNumber: currentBaseNum,
            type: "parallel",
            stations: [...currentParallelGroup],
            primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
          });
          currentParallelGroup = [];
          currentBaseNum = null;
        }

        groups.push({
          groupKey: `station-${ws.stationNumber}-${ws.stationCode}`,
          baseNumber: ws.stationNumber,
          type: ws.workstationType,
          stations: [ws],
          primaryOpName: ws.stationName,
        });
      }
    });

    if (currentParallelGroup.length > 0 && currentBaseNum !== null) {
      groups.push({
        groupKey: `parallel-${currentBaseNum}`,
        baseNumber: currentBaseNum,
        type: "parallel",
        stations: [...currentParallelGroup],
        primaryOpName: currentParallelGroup[0].operations[0]?.name || currentParallelGroup[0].stationName,
      });
    }

    return groups;
  }, [workstations]);

  const bottleneckSecs = (scenario.bottleneckCycleTime * 60).toFixed(1);
  const pitchSecs = (scenario.pitchTime * 60).toFixed(1);

  return (
    <div className="bg-[#FDFCFB] border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
      {/* ── 1. Clean Enterprise Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DDCE] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-[#221912] tracking-wider">
              Workstation Layout Architecture Preview ({workstations.length} Stations)
            </span>
          </div>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">
            Sequential shop-floor process flow showing single benches, parallel balancing splits, and cycle times.
          </p>
        </div>

        {/* Key Metrics Strip */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE]">
            <span className="text-[10px] font-sans text-[#8C7E6E]">Pitch:</span>
            <span className="font-bold text-[#9C5B3C]">{pitchSecs}s</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE]">
            <span className="text-[10px] font-sans text-[#8C7E6E]">Bottleneck:</span>
            <span className="font-bold text-rose-600">{bottleneckSecs}s</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-sans text-emerald-800">Layout Output @{scenario.plannedEfficiency || 80}%:</span>
            <span className="font-bold text-emerald-700">{scenario.hourlyOutputPlanned} pcs/hr</span>
          </div>
        </div>
      </div>

      {/* ── 2. Simple, High-Quality Process Pipeline Flow ─────────────── */}
      <div className="overflow-x-auto pb-3 pt-1 custom-scrollbar">
        <div className="min-w-max flex items-center gap-2.5 px-1 py-2">
          
          {/* Infeed Pill */}
          <div className="px-3 py-4 rounded-xl border border-[#E6DDCE] bg-[#F6F1E8] text-[#8C7E6E] flex flex-col items-center justify-center text-center shrink-0">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Input</span>
            <span className="text-[11px] font-bold text-[#221912] mt-0.5">Infeed</span>
          </div>

          {/* Flow Arrow */}
          <div className="flex items-center justify-center text-[#C5B9A8] shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Stations Pipeline */}
          {stationGroups.map((group, groupIdx) => {
            const isLast = groupIdx === stationGroups.length - 1;
            const hasBottleneck = group.stations.some((s) => s.isBottleneck);

            return (
              <React.Fragment key={group.groupKey}>
                {/* Standard Single or Combined Station */}
                {group.type !== "parallel" && group.stations.length === 1 && (
                  <div
                    onClick={() => onSelectStation && onSelectStation(group.stations[0])}
                    className={`w-48 sm:w-52 p-3 rounded-xl border transition-all duration-200 shrink-0 bg-white hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${
                      hasBottleneck
                        ? "border-rose-400 ring-1 ring-rose-300/50 bg-rose-50/20"
                        : "border-[#E6DDCE] hover:border-[#9C5B3C]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-extrabold text-xs text-[#9C5B3C]">
                        {group.stations[0].stationCode}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        hasBottleneck ? "bg-rose-100 text-rose-800" : "bg-[#F6F1E8] text-[#8C7E6E]"
                      }`}>
                        {(group.stations[0].effectiveCycleTime * 60).toFixed(1)}s
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#221912] truncate mt-1" title={group.stations[0].stationName}>
                      {group.stations[0].stationName}
                    </div>

                    <div className="text-[10.5px] text-[#8C7E6E] truncate mt-0.5 flex items-center justify-between">
                      <span className="truncate">{group.stations[0].primaryMachineType}</span>
                      <span className="shrink-0 font-medium ml-1">({group.stations[0].allocatedOperators} op)</span>
                    </div>

                    {hasBottleneck && (
                      <div className="mt-2 pt-1.5 border-t border-rose-100 flex items-center gap-1 text-[9.5px] font-bold text-rose-700">
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Pacing Bottleneck</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Parallel Split Group (e.g. WS-02A & WS-02B) */}
                {group.type === "parallel" && (
                  <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shrink-0 space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold text-indigo-900 uppercase">
                        <GitFork className="w-3 h-3 text-indigo-600" />
                        <span>Parallel Split ({group.stations.length} Benches)</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-indigo-600">
                        {Math.round(100 / group.stations.length)}% each
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {group.stations.map((subStation) => (
                        <div
                          key={subStation.stationCode}
                          onClick={() => onSelectStation && onSelectStation(subStation)}
                          className="w-48 sm:w-52 p-2.5 bg-white rounded-lg border border-indigo-100 hover:border-[#9C5B3C] transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-extrabold text-xs text-[#9C5B3C]">
                              {subStation.stationCode}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#F6F1E8] text-[#8C7E6E]">
                              {(subStation.effectiveCycleTime * 60).toFixed(1)}s
                            </span>
                          </div>
                          <div className="font-bold text-[11px] text-[#221912] truncate mt-0.5">
                            {subStation.stationName}
                          </div>
                          <div className="text-[10px] text-[#8C7E6E] truncate mt-0.5 flex items-center justify-between">
                            <span className="truncate">{subStation.primaryMachineType}</span>
                            <span className="shrink-0 font-medium ml-1">(1 op)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arrow Connector between stations */}
                {!isLast && (
                  <div className="flex items-center justify-center text-[#C5B9A8] shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Flow Arrow to Outfeed */}
          <div className="flex items-center justify-center text-[#C5B9A8] shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Outfeed Pill */}
          <div className="px-3 py-4 rounded-xl border border-[#E6DDCE] bg-[#F6F1E8] text-[#8C7E6E] flex flex-col items-center justify-center text-center shrink-0">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Output</span>
            <span className="text-[11px] font-bold text-emerald-800 mt-0.5">Inspection</span>
          </div>

        </div>
      </div>
    </div>
  );
}
