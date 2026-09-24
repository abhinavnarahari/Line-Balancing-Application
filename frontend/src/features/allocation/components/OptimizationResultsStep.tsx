import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Users,
  Layers,
  CheckCircle2,
  Edit3,
  History,
  FileCheck,
  Filter,
  Search,
  ArrowLeft,
  Download,
  Copy,
} from "lucide-react";
import type {
  OptimizationResponse,
  AllocationAssignmentItem,
} from "../types";

interface OptimizationResultsStepProps {
  response: OptimizationResponse;
  onOpenOverride: (assignment: AllocationAssignmentItem) => void;
  onOpenApprove: () => void;
  onOpenApply: () => void;
  onOpenAuditLogs: () => void;
  onBackToConfig: () => void;
}

export function OptimizationResultsStep({
  response,
  onOpenOverride,
  onOpenApprove,
  onOpenApply,
  onOpenAuditLogs,
  onBackToConfig,
}: OptimizationResultsStepProps) {

  const [activeTab, setActiveTab] = useState<"LINES" | "MATRIX" | "BOTTLENECKS" | "SCENARIOS">("LINES");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixLineFilter, setMatrixLineFilter] = useState<string>("ALL");
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<string>("ALL");
  const [onlyBottlenecks, setOnlyBottlenecks] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const summary = response.summary;

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(response.runCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      "Line Code",
      "Line Name",
      "Station Code",
      "Station Index",
      "Operation Name",
      "Standard SMV",
      "Required Machine",
      "Required Skill",
      "Operator Code",
      "Operator Name",
      "Assigned Skill",
      "Effective Cycle Secs",
      "Match Status",
      "Is Bottleneck",
      "Is Locked",
    ];

    const rows = response.matrix.map((row) => [
      `"${row.lineCode}"`,
      `"${row.lineName}"`,
      `"${row.stationCode}"`,
      row.stationIndex,
      `"${row.operationName}"`,
      row.standardSmv,
      `"${row.requiredMachineType || ""}"`,
      row.requiredSkillLevel,
      `"${row.operatorCode || ""}"`,
      `"${row.operatorName || "UNASSIGNED"}"`,
      row.assignedSkillLevel || "",
      row.effectiveCycleTimeSecs,
      `"${row.matchStatus}"`,
      row.isBottleneck ? "YES" : "NO",
      row.isFixed ? "YES" : "NO",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Operator_Allocation_${response.runCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Matrix Rows
  const filteredMatrix = response.matrix.filter((item) => {
    const matchSearch =
      matrixSearch === "" ||
      item.operationName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      (item.operatorName && item.operatorName.toLowerCase().includes(matrixSearch.toLowerCase())) ||
      (item.operatorCode && item.operatorCode.toLowerCase().includes(matrixSearch.toLowerCase())) ||
      item.stationCode.toLowerCase().includes(matrixSearch.toLowerCase());

    const matchLine =
      matrixLineFilter === "ALL" || item.lineId.toString() === matrixLineFilter;

    const matchStatus =
      matrixStatusFilter === "ALL" || item.matchStatus === matrixStatusFilter;

    const matchBottleneck = !onlyBottlenecks || item.isBottleneck;

    return matchSearch && matchLine && matchStatus && matchBottleneck;
  });

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] text-[11px] font-bold uppercase tracking-wider">
                Step 5 of 5
              </span>
              <span className="text-xs font-semibold text-[#8C7E6E]">• Multi-Line Results & Shopfloor Governance</span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#9C5B3C] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-md border border-[#E6DDCE]"
                title="Click to copy Run ID"
              >
                <Copy className="w-3 h-3 text-[#9C5B3C]" />
                <span>{response.runCode}</span>
                {copiedRef && <span className="text-[10px] text-[#2E6F40] font-bold">Copied!</span>}
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#221912] tracking-tight">
              Achievable Line Efficiency & Multi-Line Allocation
            </h2>
            <p className="text-xs text-[#6B5E51]">
              Solver Status:{" "}
              <span className="font-bold text-[#2E6F40] uppercase">{response.solverStatus}</span> • Runtime:{" "}
              <span className="font-mono font-bold text-[#221912]">{response.solverRuntimeMs}ms</span> •{" "}
              {response.solverExplanation}
            </p>
          </div>

          {/* Floor Governance Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E6DDCE] text-xs font-bold text-[#221912] transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-[#9C5B3C]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#F6F1E8] hover:bg-[#E6DDCE]/50 border border-[#E6DDCE] text-xs font-bold text-[#6B5E51] transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-[#8C7E6E]" />
              <span>Audit Trail</span>
            </button>

            {response.status !== "APPROVED" && response.status !== "APPLIED" && (
              <button
                type="button"
                onClick={onOpenApprove}
                className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#2E6F40] hover:bg-[#245A33] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Approve Plan</span>
              </button>
            )}

            {response.status === "APPROVED" && (
              <button
                type="button"
                onClick={onOpenApply}
                className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#9C5B3C] hover:bg-[#7A452D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Apply to Floor Lines</span>
              </button>
            )}

            {response.status === "APPLIED" && (
              <span className="px-3.5 h-10 rounded-xl bg-[#F3F5F2] border border-[#d4decb] text-[#2E6F40] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active on Shopfloor</span>
              </span>
            )}
          </div>
        </div>

        {/* Executive Statement Callout */}
        <div className="mt-4 p-3.5 bg-white/80 rounded-xl border border-[#E6DDCE] flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-[#9C5B3C] shrink-0" />
          <p className="text-xs font-semibold text-[#221912] leading-relaxed">
            {summary.executiveSummaryStatement}
          </p>
        </div>
      </div>

      {/* KPI Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Achievable Output</span>
            <div className="p-1.5 rounded-lg bg-[#9C5B3C]/10 text-[#9C5B3C]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{summary.totalAchievableOutput}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">vs {summary.totalDesignedOutput} designed pcs/h</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Achievable Eff %</span>
            <div className="p-1.5 rounded-lg bg-[#2E6F40]/10 text-[#2E6F40]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#2E6F40] tracking-tight">{summary.overallAchievableEfficiency}%</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">vs {summary.overallDesignedEfficiency}% designed</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Target Attainment</span>
            <div className="p-1.5 rounded-lg bg-[#B48259]/10 text-[#B48259]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{summary.targetAchievementPercent}%</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">of total planned target</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Assigned Manpower</span>
            <div className="p-1.5 rounded-lg bg-[#2E6F40]/10 text-[#2E6F40]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#2E6F40] tracking-tight">{summary.totalAssignedOperators}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">{summary.totalUnassignedOperators} unassigned</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Skill / Machine Gaps</span>
            <div className="p-1.5 rounded-lg bg-[#B48259]/10 text-[#B48259]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#221912] tracking-tight">{summary.totalSkillGaps + summary.totalMachineGaps}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">{summary.totalSkillGaps} skill, {summary.totalMachineGaps} mach</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">Bottlenecks</span>
            <div className="p-1.5 rounded-lg bg-[#C53030]/10 text-[#C53030]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[#C53030] tracking-tight">{summary.totalBottleneckStations}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-0.5">limiting pace</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E6DDCE] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("LINES")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "LINES"
              ? "border-[#9C5B3C] text-[#9C5B3C]"
              : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
          }`}
        >
          <span>Line-by-Line Achievable Summary ({response.lineResults.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MATRIX")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "MATRIX"
              ? "border-[#9C5B3C] text-[#9C5B3C]"
              : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
          }`}
        >
          <span>Operator Allocation Matrix ({response.matrix.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BOTTLENECKS")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "BOTTLENECKS"
              ? "border-[#9C5B3C] text-[#9C5B3C]"
              : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
          }`}
        >
          <span>Bottleneck Diagnostics & IE Playbook ({response.bottlenecks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SCENARIOS")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "SCENARIOS"
              ? "border-[#9C5B3C] text-[#9C5B3C]"
              : "border-transparent text-[#8C7E6E] hover:text-[#221912]"
          }`}
        >
          <span>Alternative Allocation Scenarios ({response.scenarios.length})</span>
        </button>
      </div>

      {/* TAB 1: LINE-BY-LINE RESULTS */}
      {activeTab === "LINES" && (
        <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF7F2] border-b border-[#E6DDCE]">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Sewing Line</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Style / Order</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Target Output</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Achievable Output</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Efficiency (Des / Ach)</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Manpower</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Gaps</th>
                  <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Bottleneck Operation</th>
                  <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Line Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDCE]/60 font-medium text-[#221912]">
                {response.lineResults.map((line) => {
                  let badge = "bg-[#F3F5F2] text-[#2E6F40] border-[#d4decb]";
                  let statusText = "Target Achieved";

                  if (line.lineStatus === "OPERATOR_SHORTAGE") {
                    badge = "bg-[#FFF5F5] text-[#C53030] border-[#f5c2c2]";
                    statusText = "Operator Shortage";
                  } else if (line.lineStatus === "SKILL_GAP") {
                    badge = "bg-[#FFFBF0] text-[#B48259] border-[#f2deaa]";
                    statusText = "Skill Gap";
                  } else if (line.lineStatus === "MACHINE_SHORTAGE") {
                    badge = "bg-[#FFF5F5] text-[#C53030] border-[#f5c2c2]";
                    statusText = "Machine Shortage";
                  } else if (line.lineStatus === "PARTIALLY_ACHIEVED") {
                    badge = "bg-[#FAF7F2] text-[#9C5B3C] border-[#E6DDCE]";
                    statusText = "Partially Achieved";
                  }

                  return (
                    <tr key={line.lineId} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#221912]">
                        <span className="block text-[#9C5B3C] font-mono text-[11px] font-bold">{line.lineCode}</span>
                        {line.lineName}
                      </td>
                      <td className="py-3 px-3 text-[#6B5E51]">
                        <span className="font-semibold text-[#221912] block">{line.styleNo}</span>
                        <span className="text-[11px] font-mono text-[#8C7E6E]">{line.orderNo}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-[#8C7E6E]">
                        {line.targetHourlyOutput} pcs/h
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#221912]">
                        {line.achievableCapacity} pcs/h
                        <div className="w-20 mx-auto bg-[#E6DDCE]/50 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#2E6F40] h-full rounded-full"
                            style={{ width: `${Math.min(100, line.targetAchievementPercent)}%` }}
                          />
                        </div>
                        <span className="block text-[10px] text-[#2E6F40] font-bold mt-0.5">
                          {line.targetAchievementPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-[#8C7E6E] font-semibold">{line.designedEfficiency}%</span>
                        <span className="text-[#8C7E6E]"> → </span>
                        <span className="font-mono font-bold text-[#2E6F40]">{line.achievableEfficiency}%</span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-[#221912]">{line.assignedOperators}</span>
                        <span className="text-[#8C7E6E]"> / {line.requiredOperators}</span>
                        {line.operatorShortage > 0 && (
                          <span className="block text-[10px] text-[#C53030] font-bold">
                            -{line.operatorShortage} Short
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                        {line.skillGaps > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#B48259]/15 text-[#B48259] font-bold mr-1">
                            {line.skillGaps} Skill
                          </span>
                        )}
                        {line.machineGaps > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#C53030]/15 text-[#C53030] font-bold">
                            {line.machineGaps} Mach
                          </span>
                        )}
                        {line.skillGaps === 0 && line.machineGaps === 0 && (
                          <span className="text-[#2E6F40] font-semibold">0 Gaps</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className="font-mono font-semibold text-[#9C5B3C] block">{line.bottleneckStation}</span>
                        <span className="text-[11px] text-[#8C7E6E] truncate max-w-[140px] block">
                          {line.bottleneckOperation}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATOR ALLOCATION MATRIX */}
      {activeTab === "MATRIX" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search matrix by operation, operator name, employee ID, station..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
                <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" />
                <select
                  value={matrixLineFilter}
                  onChange={(e) => setMatrixLineFilter(e.target.value)}
                  className="bg-transparent font-bold text-[#221912] focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Sewing Lines</option>
                  {response.lineResults.map((l) => (
                    <option key={l.lineId} value={l.lineId.toString()}>
                      {l.lineCode} - {l.lineName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
                <Filter className="w-3.5 h-3.5 text-[#77876F]" />
                <select
                  value={matrixStatusFilter}
                  onChange={(e) => setMatrixStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-[#221912] focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Match Statuses</option>
                  <option value="MATCH">MATCH</option>
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="SKILL_GAP">SKILL_GAP</option>
                  <option value="MACHINE_GAP">MACHINE_GAP</option>
                  <option value="UNASSIGNED">UNASSIGNED</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs font-bold text-[#221912] cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyBottlenecks}
                  onChange={(e) => setOnlyBottlenecks(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#C53030] rounded-sm cursor-pointer"
                />
                <span className="text-[#C53030]">Bottlenecks Only</span>
              </label>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF7F2] sticky top-0 z-10 border-b border-[#E6DDCE]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Line</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Station</th>
                    <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Operation</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Machine</th>
                    <th className="py-2.5 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Assigned Operator</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Skill (Req / Act)</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Effective Cycle</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Perf Source</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Match Status</th>
                    <th className="py-2.5 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDCE]/60 font-medium text-[#221912]">
                  {filteredMatrix.map((row) => (
                    <tr
                      key={row.assignmentId}
                      className={`hover:bg-[#FAF7F2]/60 transition-colors ${
                        row.isBottleneck ? "bg-red-50/25" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#9C5B3C]">
                        {row.lineCode}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#221912]">
                        {row.stationCode}
                        {row.isFixed && <span className="ml-1 text-[10px] text-[#B48259]" title="Locked Fixed Pin">📌</span>}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#221912]">
                        {row.operationName}
                        <span className="block text-[10px] text-[#8C7E6E] font-mono">{row.standardSmv} min SMV</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#6B5E51]">
                        <span className="px-2 py-0.5 rounded bg-[#F6F1E8] border border-[#E6DDCE] text-[10px] font-semibold">
                          {row.requiredMachineType || "SNLS"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {row.operatorId ? (
                          <div>
                            <span className="font-bold text-[#221912] block">{row.operatorName}</span>
                            <span className="text-[10px] font-mono text-[#8C7E6E]">{row.operatorCode}</span>
                          </div>
                        ) : (
                          <span className="text-[#C53030] font-semibold text-[11px]">Unassigned (Shortage)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-[#8C7E6E]">R{row.requiredSkillLevel}</span>
                        <span className="text-[#221912] font-bold"> / R{row.assignedSkillLevel || 0}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={row.isBottleneck ? "text-[#C53030] font-bold" : "text-[#2E6F40]"}>
                          {row.effectiveCycleTimeSecs}s
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                          row.performanceSource === "HISTORICAL"
                            ? "bg-[#2E6F40]/15 text-[#2E6F40]"
                            : row.performanceSource === "CALIBRATED"
                            ? "bg-[#4A6B82]/15 text-[#4A6B82]"
                            : "bg-[#B48259]/15 text-[#B48259]"
                        }`}>
                          {row.performanceSource}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.matchStatus === "MATCH" || row.matchStatus === "EXCELLENT"
                            ? "bg-[#F3F5F2] text-[#2E6F40] border border-[#d4decb]"
                            : row.matchStatus === "SKILL_GAP"
                            ? "bg-[#FFFBF0] text-[#B48259] border border-[#f2deaa]"
                            : "bg-[#FFF5F5] text-[#C53030] border border-[#f5c2c2]"
                        }`}>
                          {row.matchStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenOverride(row)}
                          className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EFE9] border border-[#E6DDCE] hover:border-[#9C5B3C] text-[#9C5B3C] transition-colors cursor-pointer"
                          title="Manual IE Operator Override"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BOTTLENECKS & IE PLAYBOOK */}
      {activeTab === "BOTTLENECKS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {response.bottlenecks.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-[#E6DDCE] shadow-2xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#9C5B3C]/10 text-[#9C5B3C] font-mono font-bold text-xs">
                        {b.lineName} • {b.stationCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF5F5] text-[#C53030] font-bold text-[10px] uppercase border border-[#f5c2c2]">
                        {b.severity} Priority
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#221912] mt-1">
                      {b.operationName}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#8C7E6E] uppercase block">Cycle vs Pitch</span>
                    <span className="font-mono text-xs font-bold text-[#C53030]">
                      {b.effectiveCycleTimeSecs}s / {b.requiredCycleTimeSecs}s
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] space-y-2 text-xs">
                  <div>
                    <span className="text-[#8C7E6E] font-bold block text-[10px] uppercase tracking-wider">Root Cause:</span>
                    <span className="text-[#221912] font-medium">{b.bottleneckReason}</span>
                  </div>
                  <div>
                    <span className="text-[#2E6F40] font-bold block text-[10px] uppercase tracking-wider">Actionable IE Recommendation:</span>
                    <span className="text-[#2E6F40] font-semibold">{b.recommendedAction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ALTERNATIVE SCENARIOS */}
      {activeTab === "SCENARIOS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.scenarios.map((sc) => (
            <div
              key={sc.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs space-y-4 ${
                sc.isRecommended
                  ? "border-[#9C5B3C] ring-1 ring-[#9C5B3C] bg-[#FAF7F2]/40"
                  : "border-[#E6DDCE]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#221912]">{sc.scenarioTitle}</h4>
                    {sc.isRecommended && (
                      <span className="px-2 py-0.5 rounded-full bg-[#9C5B3C] text-white text-[10px] font-bold uppercase">
                        Current Applied Solution
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B5E51] mt-1 leading-relaxed">{sc.scenarioDescription}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-white rounded-xl border border-[#E6DDCE]">
                <div>
                  <span className="text-[10px] font-bold text-[#8C7E6E] uppercase block">Output</span>
                  <span className="text-sm font-bold font-mono text-[#221912]">{sc.totalAchievableOutput} pcs/h</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8C7E6E] uppercase block">Efficiency</span>
                  <span className="text-sm font-bold font-mono text-[#2E6F40]">{sc.overallEfficiency}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8C7E6E] uppercase block">Manpower</span>
                  <span className="text-sm font-bold font-mono text-[#221912]">{sc.assignedManpower} Ops</span>
                </div>
              </div>

              <div className="text-xs text-[#6B5E51]">
                <span className="font-bold text-[#8C7E6E]">Operational Trade-offs: </span>
                <span>{sc.mainTradeoffs}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start items-center pt-2">
        <button
          type="button"
          onClick={onBackToConfig}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E6DDCE] hover:bg-white text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Solver Configuration</span>
        </button>
      </div>
    </div>
  );
}

