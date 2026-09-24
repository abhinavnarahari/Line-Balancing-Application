import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Layers,
  Users,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  TrendingUp,
  Shirt,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import type { PlanningContextResponse } from "../types";
import type { Shift } from "../../shifts/types";

interface PlanningContextStepProps {
  context: PlanningContextResponse | null;
  selectedLineIds: number[];
  onToggleLine: (lineId: number) => void;
  onSelectAllLines: () => void;
  planningDate: string;
  onChangeDate: (date: string) => void;
  shifts: Shift[];
  selectedShiftId?: number;
  onChangeShift: (shiftId: number) => void;
  onNext: () => void;
  loading: boolean;
}

export function PlanningContextStep({
  context,
  selectedLineIds,
  onToggleLine,
  onSelectAllLines,
  planningDate,
  onChangeDate,
  shifts,
  selectedShiftId,
  onChangeShift,
  onNext,
  loading,
}: PlanningContextStepProps) {
  const [lineTypeFilter, setLineTypeFilter] = useState<string>("ALL");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const nextMondayStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }, []);

  const allSelected = useMemo(() => {
    if (!context || context.selectedLines.length === 0) return false;
    return context.selectedLines.every((l) => selectedLineIds.includes(l.lineId));
  }, [context, selectedLineIds]);

  const filteredLines = useMemo(() => {
    if (!context) return [];
    if (lineTypeFilter === "ALL") return context.selectedLines;
    if (lineTypeFilter === "SELECTED") {
      return context.selectedLines.filter((l) => selectedLineIds.includes(l.lineId));
    }
    return context.selectedLines.filter(
      (l) => l.lineType && l.lineType.toLowerCase().includes(lineTypeFilter.toLowerCase())
    );
  }, [context, lineTypeFilter, selectedLineIds]);

  if (loading || !context) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-[#E6DDCE] shadow-2xs">
        <div className="w-12 h-12 border-4 border-[#9C5B3C]/20 border-t-[#9C5B3C] rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-[#221912]">Synchronizing Shopfloor Planning Context</p>
          <p className="text-xs text-[#8C7E6E] mt-0.5">Fetching active sewing lines, orders, and shift attendance data...</p>
        </div>
      </div>
    );
  }

  // Calculate selected aggregate manpower vs present workforce
  const selectedManpowerSum = context.selectedLines
    .filter((l) => selectedLineIds.includes(l.lineId))
    .reduce((sum, l) => sum + (l.designedManpower || 0), 0);

  const selectedTargetSum = context.selectedLines
    .filter((l) => selectedLineIds.includes(l.lineId))
    .reduce((sum, l) => sum + (l.targetHourlyOutput || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Planning Card */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[11px] font-bold uppercase tracking-wider">
                Step 1 of 5
              </span>
              <span className="text-xs font-semibold text-[#77876F] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Multi-Line Scope Definition
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#221912] tracking-tight">
              Factory Planning Context & Line Boundaries
            </h2>
          </div>

          {/* Date & Shift Context Control */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Date Presets */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#E6DDCE] shadow-2xs h-10">
              <button
                type="button"
                onClick={() => onChangeDate(todayStr)}
                className={`px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  planningDate === todayStr
                    ? "bg-[#9C5B3C] text-white shadow-xs shadow-[#9C5B3C]/30"
                    : "text-[#6B5E51] hover:text-[#221912] hover:bg-[#FAF7F2]"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => onChangeDate(tomorrowStr)}
                className={`px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  planningDate === tomorrowStr
                    ? "bg-[#9C5B3C] text-white shadow-xs shadow-[#9C5B3C]/30"
                    : "text-[#6B5E51] hover:text-[#221912] hover:bg-[#FAF7F2]"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => onChangeDate(nextMondayStr)}
                className={`px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  planningDate === nextMondayStr
                    ? "bg-[#9C5B3C] text-white shadow-xs shadow-[#9C5B3C]/30"
                    : "text-[#6B5E51] hover:text-[#221912] hover:bg-[#FAF7F2]"
                }`}
              >
                Next Mon
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2 bg-white px-3 h-10 rounded-xl border border-[#E6DDCE] shadow-2xs">
              <Calendar className="w-4 h-4 text-[#9C5B3C] shrink-0" />
              <input
                type="date"
                value={planningDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="text-xs font-bold text-[#221912] bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Shift Selector */}
            <div className="flex items-center gap-2 bg-white px-3 h-10 rounded-xl border border-[#E6DDCE] shadow-2xs whitespace-nowrap">
              <Clock className="w-4 h-4 text-[#77876F] shrink-0" />
              <select
                value={selectedShiftId ?? (context.shiftId ?? "")}
                onChange={(e) => onChangeShift(Number(e.target.value))}
                className="text-xs font-bold text-[#221912] bg-transparent focus:outline-hidden cursor-pointer pr-1"
                aria-label="Select Shift"
              >
                {shifts && shifts.length > 0 ? (
                  shifts.map((s) => {
                    const startH = s.startTime ? parseInt(s.startTime.split(":")[0], 10) : 0;
                    const endH = s.endTime ? parseInt(s.endTime.split(":")[0], 10) : 8;
                    let dur = endH - startH;
                    if (dur <= 0) dur += 24;
                    return (
                      <option key={s.id} value={s.id} className="text-[#221912]">
                        {s.shiftName} ({dur}h)
                      </option>
                    );
                  })
                ) : (
                  <option value={context.shiftId}>
                    {context.shiftName} ({context.shiftWorkingHours}h)
                  </option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Aggregate Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Selected Lines</span>
            <div className="p-1.5 rounded-lg bg-[#9C5B3C]/10 text-[#9C5B3C]">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{selectedLineIds.length}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">of {context.selectedLines.length} active factory lines</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Target Rate</span>
            <div className="p-1.5 rounded-lg bg-[#B48259]/10 text-[#B48259]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{selectedTargetSum || context.totalTargetHourlyOutput}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">pieces / hr required</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Demand Manpower</span>
            <div className="p-1.5 rounded-lg bg-[#77876F]/10 text-[#77876F]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{selectedManpowerSum || context.totalDesignedManpower}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">operators across lines</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Present Workforce</span>
            <div className="p-1.5 rounded-lg bg-[#2E6F40]/10 text-[#2E6F40]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#2E6F40] tracking-tight">{context.totalPresentOperators}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">{context.totalAbsentOperators} absent / leave</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Active Machines</span>
            <div className="p-1.5 rounded-lg bg-[#4A6B82]/10 text-[#4A6B82]">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{context.totalAvailableMachines}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">floor machinery units</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs hover:shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Coverage Ratio</span>
            <div className="p-1.5 rounded-lg bg-[#9C5B3C]/10 text-[#9C5B3C]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">
            {selectedManpowerSum > 0 ? Math.min(100, Math.round((context.totalPresentOperators / selectedManpowerSum) * 100)) : 100}%
          </p>
          <p className="text-[11px] text-[#77876F] mt-0.5">workforce capacity ratio</p>
        </div>
      </div>

      {/* Sewing Line Grid Container */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-2xs space-y-5">
        {/* Line Filter Chips & Select All Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6DDCE]/60">
          <div>
            <h3 className="text-sm font-bold text-[#221912] tracking-tight">
              Select Lines for Simultaneous Multi-Line Allocation
            </h3>
            <p className="text-xs text-[#8C7E6E] mt-0.5">
              Click any line card to toggle inclusion in the mathematical constraint solver.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Chips */}
            <div className="flex items-center gap-1 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
              <button
                type="button"
                onClick={() => setLineTypeFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lineTypeFilter === "ALL" ? "bg-white text-[#221912] shadow-2xs" : "text-[#6B5E51] hover:text-[#221912]"
                }`}
              >
                All ({context.selectedLines.length})
              </button>
              <button
                type="button"
                onClick={() => setLineTypeFilter("SELECTED")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  lineTypeFilter === "SELECTED" ? "bg-white text-[#9C5B3C] shadow-2xs" : "text-[#6B5E51] hover:text-[#9C5B3C]"
                }`}
              >
                Selected ({selectedLineIds.length})
              </button>
            </div>

            {/* Select All Button */}
            <button
              type="button"
              onClick={onSelectAllLines}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE9] border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#9C5B3C] transition-colors cursor-pointer"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-[#9C5B3C]" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-[#8C7E6E]" />
                  <span>Select All ({context.selectedLines.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLines.map((line) => {
            const isSelected = selectedLineIds.includes(line.lineId);
            return (
              <div
                key={line.lineId}
                onClick={() => onToggleLine(line.lineId)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer select-none relative overflow-hidden ${
                  isSelected
                    ? "bg-[#FAF7F2] border-[#9C5B3C] ring-2 ring-[#9C5B3C]/40 shadow-sm"
                    : "bg-white border-[#E6DDCE] hover:border-[#B48259] hover:bg-[#FAF7F2]/40"
                }`}
              >
                {/* Active Indicator Top Pill */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs transition-all ${
                        isSelected
                          ? "bg-[#9C5B3C] border-[#9C5B3C] text-white font-bold"
                          : "border-[#C4B5A5] bg-white group-hover:border-[#9C5B3C]"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                    <span className="font-mono font-bold text-xs text-[#9C5B3C] uppercase tracking-wider">
                      {line.lineCode}
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-[#E6DDCE]/60 text-[#6B5E51] text-[10px] font-bold uppercase tracking-wide">
                    {line.lineType || "Assembly"}
                  </span>
                </div>

                {/* Line Title & Style Info */}
                <div className="space-y-1 mb-3.5">
                  <h4 className="text-sm font-bold text-[#221912] line-clamp-1 group-hover:text-[#9C5B3C] transition-colors">
                    {line.lineName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#6B5E51]">
                    <Shirt className="w-3.5 h-3.5 text-[#8C7E6E] shrink-0" />
                    <span className="font-semibold text-[#221912] truncate">{line.currentStyle || "Polo Regular"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#8C7E6E]">
                    <Scissors className="w-3.5 h-3.5 text-[#8C7E6E] shrink-0" />
                    <span className="font-mono font-semibold text-[#9C5B3C]">
                      {line.currentBulletin || "OB-POLO-800"} (Rev {line.revisionNumber || 1})
                    </span>
                  </div>
                </div>

                {/* Line Parameters Summary Grid */}
                <div className="pt-2.5 border-t border-[#E6DDCE]/60 grid grid-cols-3 gap-2 text-center bg-white/80 p-2.5 rounded-lg border border-[#E6DDCE]/40">
                  <div>
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Target</span>
                    <span className="text-xs font-bold text-[#221912]">{line.targetHourlyOutput} pcs/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Eff. Target</span>
                    <span className="text-xs font-bold text-[#77876F]">{line.plannedEfficiency}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Demand</span>
                    <span className="text-xs font-bold text-[#9C5B3C]">{line.designedManpower} Ops</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-2">
        <div className="text-xs text-[#6B5E51] font-semibold">
          <span className="text-[#9C5B3C] font-bold">{selectedLineIds.length} lines</span> selected for optimization
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={selectedLineIds.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B31] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Continue to Operator Pool Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

