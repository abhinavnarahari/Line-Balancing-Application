import { useState, useMemo, Fragment } from "react";
import {
  Search,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  Star,
  Award,
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { OperatorPoolItem } from "../types";


interface OperatorPoolStepProps {
  operators: OperatorPoolItem[];
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export function OperatorPoolStep({
  operators,
  onNext,
  onBack,
  loading,
}: OperatorPoolStepProps) {
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("ALL");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "rating" | "attendance">("rating");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedOpId, setExpandedOpId] = useState<number | null>(null);

  // Skill Tier Analytics
  const skillTierCounts = useMemo(() => {
    const counts = { r5: 0, r4: 0, r3: 0, r2: 0, r1: 0 };
    operators.forEach((op) => {
      const r = Math.round(op.averageSkillRating || 3);
      if (r >= 5) counts.r5++;
      else if (r === 4) counts.r4++;
      else if (r === 3) counts.r3++;
      else if (r === 2) counts.r2++;
      else counts.r1++;
    });
    return counts;
  }, [operators]);

  // Filtered & Sorted operators
  const filteredOperators = useMemo(() => {
    const list = operators.filter((op) => {
      const matchSearch =
        search === "" ||
        op.operatorName.toLowerCase().includes(search.toLowerCase()) ||
        op.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
        (op.department && op.department.toLowerCase().includes(search.toLowerCase()));

      const matchSkill =
        skillFilter === "ALL" ||
        Math.round(op.averageSkillRating || 3).toString() === skillFilter;

      const matchAttendance =
        attendanceFilter === "ALL" ||
        op.attendanceStatus.toUpperCase() === attendanceFilter;

      return matchSearch && matchSkill && matchAttendance;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.operatorName.localeCompare(b.operatorName);
      } else if (sortField === "rating") {
        comparison = a.averageSkillRating - b.averageSkillRating;
      } else if (sortField === "attendance") {
        comparison = a.attendanceStatus.localeCompare(b.attendanceStatus);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [operators, search, skillFilter, attendanceFilter, sortField, sortAsc]);

  const presentCount = useMemo(
    () => operators.filter((o) => o.attendanceStatus === "PRESENT" || o.attendanceStatus === "LATE").length,
    [operators]
  );
  const absentCount = useMemo(
    () => operators.filter((o) => o.attendanceStatus === "ABSENT" || o.attendanceStatus === "ON_LEAVE").length,
    [operators]
  );

  const toggleSort = (field: "name" | "rating" | "attendance") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSkillFilter("ALL");
    setAttendanceFilter("ALL");
  };

  const hasActiveFilters = search !== "" || skillFilter !== "ALL" || attendanceFilter !== "ALL";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs">
        <div className="w-12 h-12 border-4 border-[#9C5B3C]/20 border-t-[#9C5B3C] rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-[#221912]">Auditing Operator Skills & Qualifications</p>
          <p className="text-xs text-[#8C7E6E] mt-0.5">Evaluating machine qualifications, attendance, and cycle times...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-white rounded-2xl p-5 sm:p-6 border border-[#E6DDCE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[11px] font-bold uppercase tracking-wider">
                Step 2 of 5
              </span>
              <span className="text-xs font-semibold text-[#77876F] flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Workforce Intelligence
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#221912] tracking-tight">
              Review Operator Pool, Skills & Machine Certifications
            </h2>
          </div>

          {/* Real-Time Attendance Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 h-10 bg-white border border-[#d4decb] rounded-xl shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E6F40] animate-pulse" />
              <span className="text-xs font-medium text-[#8C7E6E]">Present:</span>
              <span className="text-xs font-bold font-mono text-[#2E6F40]">{presentCount} Operators</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 h-10 bg-white border border-[#f5c2c2] rounded-xl shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C53030]" />
              <span className="text-xs font-medium text-[#8C7E6E]">Absent / Leave:</span>
              <span className="text-xs font-bold font-mono text-[#C53030]">{absentCount} Operators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Skill Distribution Summary Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E6DDCE] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#221912] uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#B48259]" />
            Workforce Skill Rating Distribution
          </span>
          <span className="text-xs text-[#8C7E6E] font-semibold">{operators.length} Total Registered Workforce</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#B48259] uppercase block">Rating 5 (Master)</span>
              <span className="text-xl font-bold font-mono text-[#221912]">{skillTierCounts.r5}</span>
            </div>
            <div className="flex text-[#B48259]"><Star className="w-4 h-4 fill-[#B48259]" /></div>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#77876F] uppercase block">Rating 4 (Skilled)</span>
              <span className="text-xl font-bold font-mono text-[#221912]">{skillTierCounts.r4}</span>
            </div>
            <div className="flex text-[#77876F]"><Star className="w-4 h-4 fill-[#77876F]" /></div>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#8C7E6E] uppercase block">Rating 3 (Standard)</span>
              <span className="text-xl font-bold font-mono text-[#221912]">{skillTierCounts.r3}</span>
            </div>
            <div className="flex text-[#8C7E6E]"><Star className="w-4 h-4 fill-[#8C7E6E]" /></div>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#9C5B3C] uppercase block">Rating 2 (Basic)</span>
              <span className="text-xl font-bold font-mono text-[#221912]">{skillTierCounts.r2}</span>
            </div>
            <div className="flex text-[#9C5B3C]"><Star className="w-4 h-4 fill-[#9C5B3C]" /></div>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#4A6B82] uppercase block">Rating 1 (Trainee)</span>
              <span className="text-xl font-bold font-mono text-[#221912]">{skillTierCounts.r1}</span>
            </div>
            <div className="flex text-[#4A6B82]"><Star className="w-4 h-4 fill-[#4A6B82]" /></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by operator name, employee code, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-semibold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Skill Filter */}
          <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
            <Star className="w-3.5 h-3.5 text-[#B48259]" />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="bg-transparent font-bold text-[#221912] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Ratings (1-5)</option>
              <option value="5">Rating 5 (Master)</option>
              <option value="4">Rating 4 (Skilled)</option>
              <option value="3">Rating 3 (Standard)</option>
              <option value="2">Rating 2 (Basic)</option>
              <option value="1">Rating 1 (Trainee)</option>
            </select>
          </div>

          {/* Attendance Filter */}
          <div className="flex items-center gap-1.5 bg-[#F6F1E8] px-3 py-1.5 rounded-xl border border-[#E6DDCE] text-xs">
            <Clock className="w-3.5 h-3.5 text-[#77876F]" />
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="bg-transparent font-bold text-[#221912] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Attendance</option>
              <option value="PRESENT">Present Only</option>
              <option value="LATE">Late Reporting</option>
              <option value="ABSENT">Absent Only</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#9C5B3C] hover:text-[#7A452D] hover:bg-[#FAF7F2] rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAF7F2] sticky top-0 z-10 border-b border-[#E6DDCE]">
              <tr>
                <th
                  onClick={() => toggleSort("name")}
                  className="py-3 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] cursor-pointer select-none hover:text-[#221912]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Operator Profile</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Home Line</th>
                <th
                  onClick={() => toggleSort("rating")}
                  className="py-3 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center cursor-pointer select-none hover:text-[#221912]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Skill Tier</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px]">Top Qualified Ops</th>
                <th
                  onClick={() => toggleSort("attendance")}
                  className="py-3 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center cursor-pointer select-none hover:text-[#221912]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Attendance</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 font-bold text-[#8C7E6E] uppercase tracking-wider text-[11px] text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]/60 font-medium text-[#221912]">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#8C7E6E]">
                    <p className="text-sm font-bold">No operators match the selected search & filter criteria.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 text-xs font-bold text-[#9C5B3C] underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => {
                  const isPresent = op.attendanceStatus === "PRESENT" || op.attendanceStatus === "LATE";
                  const isExpanded = expandedOpId === op.operatorId;

                  return (
                    <Fragment key={op.operatorId}>
                      <tr className="hover:bg-[#FAF7F2]/60 transition-colors group">
                        {/* Operator Name & Code */}
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-[#221912] block text-xs group-hover:text-[#9C5B3C] transition-colors">
                              {op.operatorName}
                            </span>
                            <span className="text-[11px] font-mono text-[#8C7E6E]">
                              {op.employeeCode} • {op.department || "Sewing"}
                            </span>
                          </div>
                        </td>

                        {/* Home Line */}
                        <td className="py-3 px-3 text-[#6B5E51] font-semibold whitespace-nowrap">
                          {op.currentLineName || "Floater Pool"}
                        </td>

                        {/* Skill Rating */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE]">
                            <Star className="w-3.5 h-3.5 fill-[#B48259] text-[#B48259]" />
                            <span className="font-bold font-mono text-[#221912] text-xs">
                              {Number(op.averageSkillRating || 3).toFixed(1)}
                            </span>
                          </div>
                        </td>

                        {/* Top Operations */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {op.qualifiedOperations && op.qualifiedOperations.length > 0 ? (
                              op.qualifiedOperations.slice(0, 3).map((qOp, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E6DDCE] text-[10px] font-semibold text-[#221912] truncate max-w-[150px]"
                                  title={qOp.operationName}
                                >
                                  {qOp.operationName}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#8C7E6E] text-[11px]">General Assembly</span>
                            )}
                            {op.qualifiedOperations && op.qualifiedOperations.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-lg bg-[#E6DDCE]/60 text-[10px] font-bold text-[#8C7E6E]">
                                +{op.qualifiedOperations.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Attendance Badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                              isPresent
                                ? "bg-[#F3F5F2] text-[#2E6F40] border-[#d4decb]"
                                : "bg-[#FFF5F5] text-[#C53030] border-[#f5c2c2]"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-[#2E6F40]" : "bg-[#C53030]"}`} />
                            <span>{op.attendanceStatus}</span>
                          </span>
                        </td>

                        {/* Expand Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedOpId(isExpanded ? null : op.operatorId)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3EFE9] border border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] transition-colors cursor-pointer"
                            title="View Full Skill Matrix"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <tr className="bg-[#FAF7F2]/40">
                          <td colSpan={6} className="p-4 border-t border-b border-[#E6DDCE]">
                            <div className="bg-white rounded-2xl p-4 border border-[#E6DDCE] space-y-3">
                              <h5 className="text-xs font-bold text-[#221912] uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#9C5B3C]" />
                                Certified Operations & Skill Ratings for {op.operatorName}
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {op.qualifiedOperations && op.qualifiedOperations.length > 0 ? (
                                  op.qualifiedOperations.map((q) => (
                                    <div
                                      key={q.operationId}
                                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="font-semibold text-xs text-[#221912] block truncate max-w-[150px]">
                                          {q.operationName}
                                        </span>
                                        <span className="text-[10px] font-mono text-[#8C7E6E]">
                                          Cycle: {q.cycleTimeSeconds || 30}s
                                        </span>
                                      </div>
                                      <span className="px-2 py-0.5 rounded-lg bg-[#B48259]/15 text-[#B48259] font-bold font-mono text-xs">
                                        R{q.rating}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-[#8C7E6E]">No specific operations recorded.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E6DDCE] hover:bg-white text-xs font-bold text-[#6B5E51] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 1</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9C5B3C] hover:bg-[#854B31] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <span>Continue to Line Requirements & Validation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

