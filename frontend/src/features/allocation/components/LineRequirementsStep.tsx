import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sliders,
  Activity,
} from "lucide-react";
import type { LineRequirementItem, PreflightValidationResponse } from "../types";


interface LineRequirementsStepProps {
  lineRequirements: LineRequirementItem[];
  validation: PreflightValidationResponse | null;
  onValidate: () => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function LineRequirementsStep({
  lineRequirements,
  validation,
  onValidate,
  onNext,
  onBack,
  loading,
}: LineRequirementsStepProps) {
  const [expandedLineId, setExpandedLineId] = useState<number | null>(
    lineRequirements.length > 0 ? lineRequirements[0].lineId : null
  );
  const [issueFilter, setIssueFilter] = useState<"ALL" | "ERROR" | "WARNING" | "INFO">("ALL");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs">
        <div className="w-12 h-12 border-4 border-[#9C5B3C]/20 border-t-[#9C5B3C] rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-[#221912]">Auditing Workstations & Constraint Feasibility</p>
          <p className="text-xs text-[#8C7E6E] mt-0.5">Calculating workstation pitch times, machine availability, and bottleneck risks...</p>
        </div>
      </div>
    );
  }

  const toggleLineExpand = (lineId: number) => {
    setExpandedLineId((prev) => (prev === lineId ? null : lineId));
  };

  const hasErrors = validation && validation.totalErrors > 0;

  const filteredIssues = validation?.issues?.filter((issue) => {
    if (issueFilter === "ALL") return true;
    return issue.severity === issueFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[11px] font-bold uppercase tracking-wider">
                Step 3 of 5
              </span>
              <span className="text-xs font-semibold text-[#77876F] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Line Feasibility & Demands
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#221912] tracking-tight">
              Line Workstation Requirements & Pre-Flight Validation
            </h2>
          </div>

          <button
            type="button"
            onClick={onValidate}
            className="flex items-center gap-2 px-3.5 h-10 bg-white hover:bg-[#FAF7F2] border border-[#E6DDCE] hover:border-[#9C5B3C] rounded-xl text-xs font-bold text-[#9C5B3C] transition-all cursor-pointer shadow-2xs self-start lg:self-auto shrink-0"
          >
            <Sliders className="w-4 h-4" />
            <span>Rerun Feasibility Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Pre-Flight Validation Feasibility Card */}
      {validation && (
        <div
          className={`rounded-2xl p-5 border shadow-2xs transition-all ${
            validation.valid
              ? "bg-[#F3F5F2]/90 border-[#d4decb]"
              : "bg-[#FFF5F5] border-[#f5c2c2]"
          }`}
        >
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              validation.valid ? "bg-[#2E6F40] text-white" : "bg-[#C53030] text-white"
            }`}>
              {validation.valid ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  className={`text-sm font-bold ${
                    validation.valid ? "text-[#2E6F40]" : "text-[#C53030]"
                  }`}
                >
                  {validation.valid
                    ? "Pre-Flight Validation Check Passed — Ready to Solve"
                    : "Pre-Flight Feasibility Warnings Detected"}
                </h3>

                {/* Severity Badges & Filter Chips */}
                <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-[#E6DDCE]/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setIssueFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      issueFilter === "ALL" ? "bg-[#9C5B3C] text-white" : "text-[#6B5E51]"
                    }`}
                  >
                    All ({validation.issues?.length || 0})
                  </button>
                  {validation.totalErrors > 0 && (
                    <button
                      type="button"
                      onClick={() => setIssueFilter("ERROR")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        issueFilter === "ERROR" ? "bg-[#C53030] text-white" : "text-[#C53030]"
                      }`}
                    >
                      {validation.totalErrors} Error(s)
                    </button>
                  )}
                  {validation.totalWarnings > 0 && (
                    <button
                      type="button"
                      onClick={() => setIssueFilter("WARNING")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        issueFilter === "WARNING" ? "bg-[#B48259] text-white" : "text-[#B48259]"
                      }`}
                    >
                      {validation.totalWarnings} Warning(s)
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#6B5E51]">{validation.summaryMessage}</p>
            </div>
          </div>

          {/* Validation Issues Data Grid */}
          {filteredIssues.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-[#E6DDCE] overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF7F2] border-b border-[#E6DDCE]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Severity</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Target Line</th>
                    <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Feasibility Diagnostic</th>
                    <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDCE]/50 font-medium text-[#221912]">
                  {filteredIssues.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF7F2]/40">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            issue.severity === "ERROR"
                              ? "bg-[#C53030] text-white"
                              : issue.severity === "WARNING"
                              ? "bg-[#B48259] text-white"
                              : "bg-[#4A6B82] text-white"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-[#6B5E51]">
                        {issue.lineName || "All Lines"} {issue.stationCode ? `• ${issue.stationCode}` : ""}
                      </td>
                      <td className="py-2.5 px-4 text-[#221912] font-medium">{issue.problemDescription}</td>
                      <td className="py-2.5 px-4 text-[#2E6F40] font-semibold">{issue.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Line Requirement Detail Accordions */}
      <div className="space-y-4">
        {lineRequirements.map((line) => {
          const isExpanded = expandedLineId === line.lineId;
          return (
            <div
              key={line.lineId}
              className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs overflow-hidden transition-all"
            >
              {/* Line Header Banner */}
              <div
                onClick={() => toggleLineExpand(line.lineId)}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF7F2]/50 select-none transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9C5B3C] to-[#8B5E3C] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {line.lineCode.replace("LINE-", "L")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#221912]">
                        {line.lineName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#E6DDCE]/60 text-[#6B5E51] text-[10px] font-bold uppercase">
                        {line.lineType || "Assembly"}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C7E6E] font-medium mt-0.5">
                      Active Style: <span className="font-semibold text-[#221912]">{line.styleNo}</span> • OB Bulletin:{" "}
                      <span className="font-mono font-semibold text-[#9C5B3C]">{line.bulletinCode} (Rev {line.bulletinRevision || 1})</span>
                    </p>
                  </div>
                </div>

                {/* Key IE Metric Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-center min-w-[85px]">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Target Rate</span>
                    <span className="text-xs font-bold font-mono text-[#221912]">{line.targetPiecesPerHour} pcs/h</span>
                  </div>

                  <div className="bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-center min-w-[85px]">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Pitch Time</span>
                    <span className="text-xs font-mono font-bold text-[#9C5B3C]">{line.designedPitchSecs}s</span>
                  </div>

                  <div className="bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-center min-w-[85px]">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Workstations</span>
                    <span className="text-xs font-bold font-mono text-[#221912]">{line.workstationCount} Stations</span>
                  </div>

                  <div className="bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-center min-w-[85px]">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase tracking-wider block">Total SMV</span>
                    <span className="text-xs font-mono font-bold text-[#77876F]">{line.totalSmvMinutes} min</span>
                  </div>

                  <div className="p-1.5 rounded-lg text-[#8C7E6E] bg-[#FAF7F2]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Workstation & Machine Breakdown (Expanded View) */}
              {isExpanded && (
                <div className="p-5 border-t border-[#E6DDCE] bg-[#FAF7F2]/30 space-y-4">
                  {/* Station Timeline Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-[#221912] uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#9C5B3C]" />
                        Workstation Operation SMV & Skill Demands
                      </h5>
                      <span className="text-[11px] font-semibold text-[#8C7E6E]">
                        Pitch Benchmark: <span className="text-[#9C5B3C] font-mono font-bold">{line.designedPitchSecs}s</span>
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-[#E6DDCE] overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#FAF7F2] sticky top-0 z-10 border-b border-[#E6DDCE]">
                            <tr>
                              <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Station Code</th>
                              <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Operation Name</th>
                              <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Section</th>
                              <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Required Machine</th>
                              <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider text-center">Standard SMV</th>
                              <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider">Pace vs Pitch Time</th>
                              <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase text-[10px] tracking-wider text-center">Req Skill</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6DDCE]/50 font-medium text-[#221912]">
                            {line.stations.map((st) => {
                              const cycleSecs = st.designedCycleTimeSecs || Math.round(st.operationSmv * 60);
                              const isOverPitch = line.designedPitchSecs > 0 && cycleSecs > line.designedPitchSecs;
                              const pacePct = line.designedPitchSecs > 0 ? Math.min(150, Math.round((cycleSecs / line.designedPitchSecs) * 100)) : 100;

                              return (
                                <tr key={st.stationIndex} className="hover:bg-[#FAF7F2]/60">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#9C5B3C]">
                                    {st.stationCode}
                                  </td>
                                  <td className="py-2.5 px-4 font-semibold text-[#221912]">
                                    {st.operationName}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#6B5E51] font-medium">
                                    {st.section}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#6B5E51]">
                                    <span className="px-2 py-0.5 rounded-lg bg-[#F6F1E8] border border-[#E6DDCE] text-[10px] font-semibold truncate max-w-[130px] block" title={st.requiredMachineType}>
                                      {st.requiredMachineType || "SNLS"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono font-bold text-[#221912]">
                                    {st.operationSmv} min
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <div className="space-y-1 max-w-[160px]">
                                      <div className="flex justify-between text-[10px] font-mono font-bold">
                                        <span className={isOverPitch ? "text-[#C53030]" : "text-[#77876F]"}>{cycleSecs}s</span>
                                        <span className="text-[#8C7E6E]">{pacePct}% Pitch</span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-[#E6DDCE]/50 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            isOverPitch ? "bg-[#C53030]" : pacePct > 85 ? "bg-[#B48259]" : "bg-[#2E6F40]"
                                          }`}
                                          style={{ width: `${Math.min(100, pacePct)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-[#B48259]/15 text-[#B48259] font-bold font-mono text-[10px]">
                                      R{st.requiredSkillLevel}+
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E6DDCE] hover:bg-white text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operator Pool</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={hasErrors}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B31] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Continue to Configure Solver Strategy</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

