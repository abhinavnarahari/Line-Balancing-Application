import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Search, Upload, RefreshCw, ExternalLink, Activity, Download, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, DataCard, EmptyState } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { CustomSelect } from "../../components/ui/CustomSelect";

import { skillApi, cycleTimeToRating, type SkillAssessment } from "../../features/skill-matrix/api";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { exportToExcel } from "../../utils/excel";

// Read-only skill badge for sewing machine operators
function SkillBadge({ rating }: { rating?: number }) {
  if (!rating) {
    return (
      <div className="w-full h-10 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-[#E6DDCE]" />
      </div>
    );
  }
  const config: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: "bg-[#F6F1E8]", text: "text-[#8C7E6E]", label: "Beginner" },
    2: { bg: "bg-[#fffbeb]", text: "text-[#b45309]", label: "Basic" },
    3: { bg: "bg-[#EFE9DF]", text: "text-[#8B5E3C]", label: "Intermediate" },
    4: { bg: "bg-[#F6F1E8]", text: "text-[#9C5B3C]", label: "Skilled" },
    5: { bg: "bg-[#F3F5F2]", text: "text-[#77876F]", label: "Expert" },
  };
  const c = config[rating] || config[1];
  return (
    <div className="w-full h-10 flex items-center justify-center">
      <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.text} border border-[#E6DDCE] flex items-center justify-center text-xs font-black shadow-2xs`} title={c.label}>
        {rating}
      </div>
    </div>
  );
}

// Rating level legend
const RATING_LEGEND = [
  { rating: 1, label: "Beginner",     color: "bg-[#F6F1E8] text-[#8C7E6E] border border-[#E6DDCE]" },
  { rating: 2, label: "Basic",        color: "bg-[#fffbeb] text-[#b45309] border border-[#fde68a]" },
  { rating: 3, label: "Intermediate", color: "bg-[#EFE9DF] text-[#8B5E3C] border border-[#D8C9B8]" },
  { rating: 4, label: "Skilled",      color: "bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]" },
  { rating: 5, label: "Expert",       color: "bg-[#F3F5F2] text-[#77876F] border border-[#d1d8cd]" },
];

// Helper to determine if workforce member works directly on sewing machines
export function worksOnMachines(op: any): boolean {
  const role = op.role || "OPERATOR";
  // In garment manufacturing, dedicated operators and floaters (relief/utility operators) work on sewing machines
  return role === "OPERATOR" || role === "FLOATER";
}

// Backward compatibility alias
export function isMachineOperator(op: any): boolean {
  return worksOnMachines(op);
}

// Role badge styling and labeling
export function getRoleBadgeInfo(role?: string) {
  switch (role) {
    case "FLOATER":
      return {
        label: "Floater",
        badgeClass: "bg-amber-100/90 text-amber-900 border-amber-300",
        worksOnMachine: true,
        responsibility: "Multi-skilled relief sewer deployed dynamically for absentees & bottlenecks",
      };
    case "QUALITY_CHECKER":
      return {
        label: "Quality Checker",
        badgeClass: "bg-purple-100/90 text-purple-900 border-purple-300",
        worksOnMachine: false,
        responsibility: "In-line & end-line quality inspection, stitching audits, and measurement checks",
      };
    case "LINE_SUPERVISOR":
      return {
        label: "Line Supervisor",
        badgeClass: "bg-blue-100/90 text-blue-900 border-blue-300",
        worksOnMachine: false,
        responsibility: "Line output pacing, hourly target tracking, input feeding & floor coordination",
      };
    case "HELPER":
      return {
        label: "Floor Helper",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        worksOnMachine: false,
        responsibility: "Manual material handling, bundle untying, panel feeding & thread trimming",
      };
    default:
      return {
        label: "Sewing Operator",
        badgeClass: "bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]",
        worksOnMachine: true,
        responsibility: "Dedicated sewing machine operator assigned to specific operations",
      };
  }
}

// ── Reusable Machine Operators Matrix Grid ──────────────────────────────────
interface SkillMatrixGridProps {
  title: string;
  badgeText: string;
  badgeClass?: string;
  icon: ReactNode;
  operators: Operator[];
  operations: Operation[];
  getEffectiveRating: (opId: string | number, operId: string | number) => number | undefined;
  headerFilterAction?: ReactNode;
}

function SkillMatrixGrid({
  title,
  badgeText,
  badgeClass = "bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]",
  icon,
  operators,
  operations,
  getEffectiveRating,
  headerFilterAction,
}: SkillMatrixGridProps) {
  return (
    <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#F0EAE0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1.5 bg-white border border-[#E6DDCE] rounded-lg shadow-2xs">
            {icon}
          </span>
          <h3 className="text-sm font-extrabold text-[#221912]">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        {headerFilterAction && (
          <div className="flex items-center gap-2 shrink-0">
            {headerFilterAction}
          </div>
        )}
      </div>

      {operators.length === 0 ? (
        <div className="p-8">
          <EmptyState title="No operators found" description="Try adjusting your search criteria or role filters." />
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#F8FAFC]/95 border-b-2 border-r-2 border-[#E6DDCE] p-4 text-left w-64 min-w-[250px] shadow-[2px_0_4px_rgba(34,25,18,0.03)] backdrop-blur-xs">
                  <span className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">
                    Workforce Member
                  </span>
                </th>
                {operations.map((op: any) => (
                  <th key={op.id} className="bg-[#F8FAFC]/95 border-b-2 border-r border-[#E6DDCE] px-2 py-3 text-center min-w-[88px] w-[88px] backdrop-blur-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-[9px] text-[#9C5B3C] font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#E6DDCE]">
                        {op.code || op.operationCode}
                      </span>
                      <span className="text-[10.5px] font-semibold text-[#221912] leading-tight line-clamp-2 max-w-[76px]" title={op.name}>
                        {op.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map((operator: any) => {
                const ratedCount = operations.filter(op => {
                  const r = getEffectiveRating(operator.id, (op as any).id);
                  return r && r > 0;
                }).length;
                const roleInfo = getRoleBadgeInfo(operator.role);
                const isFloater = operator.role === "FLOATER";

                return (
                  <tr key={operator.id} className="border-b border-[#F0EAE0] hover:bg-[#FEFCF9] transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FEFCF9] border-r-2 border-[#E6DDCE] p-3 shadow-[2px_0_4px_rgba(34,25,18,0.03)] transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/settings/operators/${operator.employeeId}`}
                            className="font-bold text-xs text-[#221912] hover:text-[#9C5B3C] inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{operator.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {isFloater && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border ${roleInfo.badgeClass}`}>
                              {roleInfo.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#8C7E6E] block mt-0.5">
                          {operator.employeeId} · {ratedCount}/{operations.length} rated
                        </span>
                      </div>
                    </td>
                    {operations.map((op: any) => (
                      <td key={op.id} className="border-r border-[#F0EAE0] p-1 text-center">
                        <SkillBadge rating={getEffectiveRating(operator.id, op.id)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DataCard>
  );
}

// ── Non-Machine Workforce Table (Simple, Clean & Professional Roster) ────────
interface NonMachineTableProps {
  title: string;
  badgeText: string;
  badgeClass?: string;
  icon: ReactNode;
  personnel: Operator[];
  headerFilterAction?: ReactNode;
}

function NonMachineWorkforceTable({
  title,
  badgeText,
  badgeClass = "bg-purple-50 text-purple-900 border-purple-300",
  icon,
  personnel,
  headerFilterAction,
}: NonMachineTableProps) {
  return (
    <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#F0EAE0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1.5 bg-white border border-[#E6DDCE] rounded-lg shadow-2xs">
            {icon}
          </span>
          <h3 className="text-sm font-extrabold text-[#221912]">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        {headerFilterAction && (
          <div className="flex items-center gap-2 shrink-0">
            {headerFilterAction}
          </div>
        )}
      </div>

      {personnel.length === 0 ? (
        <div className="p-8">
          <EmptyState title="No non-machine personnel found" description="Try adjusting your search criteria or role filters." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]/95 border-b border-[#E6DDCE] text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">
                <th className="py-3 px-5 text-left">Personnel</th>
                <th className="py-3 px-5 text-left">Role</th>
                <th className="py-3 px-5 text-left">Department</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE0]">
              {personnel.map((person: any) => {
                const roleInfo = getRoleBadgeInfo(person.role);
                const initials = (person.name || "")
                  .split(" ")
                  .map((n: string) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "OP";

                return (
                  <tr key={person.id} className="hover:bg-[#FEFCF9] transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                          person.role === "QUALITY_CHECKER"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : person.role === "LINE_SUPERVISOR"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <Link
                            to={`/settings/operators/${person.employeeId}`}
                            className="font-bold text-xs text-[#221912] hover:text-[#9C5B3C] transition-colors inline-flex items-center gap-1"
                          >
                            <span>{person.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-[10px] font-mono text-[#8C7E6E] block mt-0.5">
                            {person.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${roleInfo.badgeClass}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#6B5E51]">
                      {person.department || (
                        person.role === "QUALITY_CHECKER"
                          ? "Quality Assurance"
                          : person.role === "LINE_SUPERVISOR"
                          ? "Line Supervision"
                          : "Line Support"
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F3F5F2] text-[#77876F] border border-[#d1d8cd]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/settings/operators/${person.employeeId}`}
                        className="text-xs font-bold text-[#9C5B3C] hover:text-[#B06C49] transition-colors"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-[#F0EAE0] bg-[#FAF7F2]/40 flex items-center justify-between text-[11px] text-[#8C7E6E]">
            <span>Showing {personnel.length} support & supervisory staff</span>
            <span>Non-machine personnel · Exempt from machine skill matrix</span>
          </div>
        </div>
      )}
    </DataCard>
  );
}

export function SkillMatrixPage() {
  const [matrix, setMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Navigation: Sewing Machine Operators vs Non-Machine Workforce
  const [activeSection, setActiveSection] = useState<"MACHINE_OPERATORS" | "NON_MACHINE">("MACHINE_OPERATORS");
  
  // Section-specific sub-filters
  const [machineRoleFilter, setMachineRoleFilter] = useState<string>("ALL");
  const [nonMachineRoleFilter, setNonMachineRoleFilter] = useState<string>("ALL");

  // Daily Performance Log modal
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [perfForm, setPerfForm] = useState({
    operatorId: "", operationId: "", logDate: new Date().toISOString().split("T")[0],
    actualCycleTimeSeconds: "", recordedBy: "", notes: ""
  });
  const [perfSaving, setPerfSaving] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mat, ops, oprs, perfLogs] = await Promise.all([
        skillApi.getCurrentMatrix(),
        operationsApi.getOperations(),
        operatorsApi.getOperators(),
        skillApi.getPerformanceLogs().catch(() => []),
      ]);
      setMatrix(mat);
      setPerformanceLogs(perfLogs);
      setOperations((ops as any[]).filter((o: any) => o.active).sort((a: any, b: any) => a.sequence - b.sequence));
      setOperators(
        (oprs as any[])
          .filter((o: any) => o.active)
          .sort((a: any, b: any) =>
            (a.employeeId || "").localeCompare(b.employeeId || "", undefined, { numeric: true, sensitivity: "base" })
          )
      );
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveRating = (opId: string | number, operId: string | number) => {
    const targetOp = operations.find(o => String(o.id) === String(operId));
    const opName = targetOp?.name || "";
    const opSmv = targetOp?.standardSmv;

    const submitted = performanceLogs.filter(
      l => String(l.operatorId) === String(opId) &&
           String(l.operationId) === String(operId) &&
           (l.status === "SUBMITTED" || !l.status)
    );

    if (submitted.length > 0) {
      const avg = submitted.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / submitted.length;
      return cycleTimeToRating(avg, opName, opSmv);
    }

    const skill = matrix.find(
      m => String(m.operatorId) === String(opId) && String(m.operationId) === String(operId)
    );
    if (skill?.cycleTimeSeconds && skill.cycleTimeSeconds > 0) {
      return cycleTimeToRating(skill.cycleTimeSeconds, opName, opSmv);
    }
    return skill?.rating;
  };

  useEffect(() => { loadData(); }, []);

  const handlePerfLog = async () => {
    if (!perfForm.operatorId || !perfForm.operationId || !perfForm.actualCycleTimeSeconds) return;
    setPerfSaving(true);
    try {
      await skillApi.addPerformanceLog({
        operatorId: perfForm.operatorId,
        operationId: perfForm.operationId,
        logDate: perfForm.logDate,
        actualCycleTimeSeconds: parseInt(perfForm.actualCycleTimeSeconds),
        recordedBy: perfForm.recordedBy || "Manager",
        notes: perfForm.notes,
      });
      setIsPerfModalOpen(false);
      setPerfForm({ operatorId: "", operationId: "", logDate: new Date().toISOString().split("T")[0], actualCycleTimeSeconds: "", recordedBy: "", notes: "" });
      alert("Performance log saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save performance log.");
    } finally {
      setPerfSaving(false);
    }
  };

  const handleBulkAutoUpdate = async () => {
    setAutoUpdating(true);
    try {
      let totalChanged = 0;
      for (const op of operators) {
        if (!worksOnMachines(op)) continue;
        const updated = await skillApi.autoUpdateSkillMatrix((op as any).id);
        totalChanged += Array.isArray(updated) ? updated.length : 0;
      }
      await loadData();
      alert(totalChanged === 0 ? "All machine ratings are already up to date." : `${totalChanged} rating(s) updated across machine operators!`);
    } catch (err) {
      console.error(err);
      alert("Auto-update failed.");
    } finally {
      setAutoUpdating(false);
    }
  };

  // ── Machine Operators (Dedicated Operators + Floaters) ───────────────────
  const machineOperators = useMemo(
    () => operators.filter(o => worksOnMachines(o)),
    [operators]
  );

  const dedicatedCount = useMemo(
    () => machineOperators.filter(o => !o.role || o.role === "OPERATOR").length,
    [machineOperators]
  );
  const floaterCount = useMemo(
    () => machineOperators.filter(o => o.role === "FLOATER").length,
    [machineOperators]
  );

  // ── Non-Machine Workforce (QC, Helpers, Supervisors) ─────────────────────
  const nonMachinePersonnel = useMemo(
    () => operators.filter(o => !worksOnMachines(o)),
    [operators]
  );

  const qcCount = useMemo(
    () => nonMachinePersonnel.filter(o => o.role === "QUALITY_CHECKER").length,
    [nonMachinePersonnel]
  );
  const helperCount = useMemo(
    () => nonMachinePersonnel.filter(o => o.role === "HELPER").length,
    [nonMachinePersonnel]
  );
  const supervisorCount = useMemo(
    () => nonMachinePersonnel.filter(o => o.role === "LINE_SUPERVISOR").length,
    [nonMachinePersonnel]
  );

  // Filtered operators for Sewing Machine Operators
  const filteredMachineOperators = useMemo(() => {
    return machineOperators.filter((o: any) => {
      const matchesSearch =
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        machineRoleFilter === "ALL" ||
        (machineRoleFilter === "OPERATOR" && (!o.role || o.role === "OPERATOR")) ||
        o.role === machineRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [machineOperators, search, machineRoleFilter]);

  // Filtered personnel for Non-Machine Workforce
  const filteredNonMachinePersonnel = useMemo(() => {
    return nonMachinePersonnel.filter((o: any) => {
      const matchesSearch =
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.employeeId.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        nonMachineRoleFilter === "ALL" || o.role === nonMachineRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [nonMachinePersonnel, search, nonMachineRoleFilter]);

  // Machine matrix coverage stats (evaluates machine operators only)
  const totalMachineCells = machineOperators.length * operations.length;
  const filledCells = matrix.length;
  const coveragePct = totalMachineCells > 0 ? Math.round((filledCells / totalMachineCells) * 100) : 0;

  const handleExportFullMatrix = () => {
    if (activeSection === "NON_MACHINE") {
      // Export Non-Machine Workforce Roster (No operation skill ratings)
      const rows = filteredNonMachinePersonnel.map((person: any) => {
        const roleInfo = getRoleBadgeInfo(person.role);
        return {
          "Employee ID": person.employeeId,
          "Staff Name": person.name,
          "Role": roleInfo.label,
          "Department": person.department || (
            person.role === "QUALITY_CHECKER"
              ? "Quality Assurance"
              : person.role === "LINE_SUPERVISOR"
              ? "Line Supervision"
              : "Line Support"
          ),
          "Status": person.active ? "Active" : "Inactive",
        };
      });
      exportToExcel(rows, `Non_Machine_Workforce_Roster_${new Date().toISOString().split("T")[0]}`);
    } else {
      // Export Sewing Machine Operators Skill Matrix
      const rows = filteredMachineOperators.map((operator: any) => {
        const roleInfo = getRoleBadgeInfo(operator.role);
        const row: Record<string, any> = {
          "Employee ID": operator.employeeId,
          "Operator Name": operator.name,
          "Category": "Sewing Machine Operator",
          "Role": roleInfo.label,
          "Department": operator.department || "Sewing",
        };
        operations.forEach((op: any) => {
          const rating = getEffectiveRating(operator.id, op.id);
          const colHeader = `${op.name} (${op.code || op.operationCode || `OP-${op.id}`})`;
          row[colHeader] = rating && rating > 0 ? rating : "-";
        });
        return row;
      });
      exportToExcel(rows, `Sewing_Machine_Skill_Matrix_${new Date().toISOString().split("T")[0]}`);
    }
  };

  return (
    <div className="space-y-6 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Workforce"
        title="Sewing Skill Matrix"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="md"
              onClick={handleExportFullMatrix}
              className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export Excel
            </Button>
            <Link to="/skill-matrix/logs">
              <Button variant="outline" size="md" className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]">
                <Activity className="h-4 w-4 mr-1.5" />
                History Logs
              </Button>
            </Link>
            <Button variant="outline" size="md" onClick={() => setIsPerfModalOpen(true)} className="border-[#E6DDCE] text-[#9C5B3C] hover:bg-[#F6F1E8]">
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Performance
            </Button>
            <Button size="md" onClick={handleBulkAutoUpdate} disabled={autoUpdating} className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${autoUpdating ? "animate-spin" : ""}`} />
              {autoUpdating ? "Updating..." : "Auto-Update All"}
            </Button>
          </div>
        }
      />

      {/* ── Executive Workforce KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs text-center">
          <div className="text-xl font-black text-[#221912] font-mono">{operators.length}</div>
          <div className="text-[11px] text-[#8C7E6E] font-medium mt-0.5">Total Workforce</div>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs text-center border-l-4 border-l-[#9C5B3C]">
          <div className="text-xl font-black text-[#9C5B3C] font-mono">{machineOperators.length}</div>
          <div className="text-[11px] text-[#8C7E6E] font-medium mt-0.5">Machine Operators</div>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-2xl p-3.5 shadow-2xs text-center border-l-4 border-l-amber-500">
          <div className="text-xl font-black text-amber-800 font-mono">{floaterCount}</div>
          <div className="text-[11px] text-amber-800 font-medium mt-0.5">Floaters</div>
        </div>

        <div className="bg-white border border-purple-200 bg-purple-50/20 rounded-2xl p-3.5 shadow-2xs text-center border-l-4 border-l-purple-600">
          <div className="text-xl font-black text-purple-800 font-mono">{qcCount}</div>
          <div className="text-[11px] text-purple-800 font-medium mt-0.5">Quality Checkers</div>
        </div>

        <div className="bg-white border border-blue-200 bg-blue-50/20 rounded-2xl p-3.5 shadow-2xs text-center border-l-4 border-l-blue-500">
          <div className="text-xl font-black text-blue-800 font-mono">{helperCount + supervisorCount}</div>
          <div className="text-[11px] text-blue-800 font-medium mt-0.5">Helpers & Supervisors</div>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-3.5 shadow-2xs text-center">
          <div className="text-xl font-black text-emerald-700 font-mono">{coveragePct}%</div>
          <div className="text-[11px] text-[#8C7E6E] font-medium mt-0.5">Coverage</div>
        </div>
      </div>

      {/* ── Rating Legend Bar (Only shown for Machine Operators) ──────── */}
      {activeSection === "MACHINE_OPERATORS" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#8C7E6E] mr-1">Rating Legend:</span>
            {RATING_LEGEND.map(l => (
              <span key={l.rating} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${l.color}`}>
                <span className="font-mono">{l.rating}</span> {l.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F6F1E8] text-[#8C7E6E] border border-[#E6DDCE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C7E6E] inline-block" /> Not Rated
            </span>
          </div>

          <div className="text-[11px] text-[#8C7E6E] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
            <span>Ratings evaluate operator cycle times against standard operation SMV</span>
          </div>
        </div>
      )}

      {/* ── Section Switcher Tabs & Live Search ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-2 rounded-2xl border border-[#E6DDCE] shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Section 1: Sewing Machine Operators */}
          <button
            type="button"
            onClick={() => setActiveSection("MACHINE_OPERATORS")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === "MACHINE_OPERATORS"
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "text-[#8C7E6E] hover:text-[#221912] hover:bg-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sewing Machine Operators</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
              activeSection === "MACHINE_OPERATORS" ? "bg-white/20 text-white" : "bg-[#E6DDCE] text-[#221912]"
            }`}>
              {machineOperators.length}
            </span>
          </button>

          {/* Section 2: Non-Machine Workforce */}
          <button
            type="button"
            onClick={() => setActiveSection("NON_MACHINE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === "NON_MACHINE"
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "text-[#8C7E6E] hover:text-[#221912] hover:bg-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Non-Machine Workforce</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
              activeSection === "NON_MACHINE" ? "bg-white/20 text-white" : "bg-[#E6DDCE] text-[#221912]"
            }`}>
              {nonMachinePersonnel.length}
            </span>
          </button>
        </div>

        {/* Global Matrix Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or EMP ID..."
            className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#8C7E6E]/60 focus:outline-none focus:border-[#9C5B3C] focus:ring-1 focus:ring-[#9C5B3C]/20 rounded-xl shadow-2xs"
          />
        </div>
      </div>

      {/* ── Active View Rendering ─────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center text-[#8C7E6E] bg-white border border-[#E6DDCE] rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#9C5B3C] mb-2" />
          <p className="font-semibold text-sm text-[#221912]">Loading workforce data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSection === "MACHINE_OPERATORS" ? (
            <SkillMatrixGrid
              title="Sewing Machine Operators"
              badgeText={`${filteredMachineOperators.length} Operators`}
              badgeClass="bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]"
              icon={<Users className="w-4 h-4 text-[#9C5B3C]" />}
              operators={filteredMachineOperators}
              operations={operations}
              getEffectiveRating={getEffectiveRating}
              headerFilterAction={
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-[#8C7E6E] mr-1 hidden sm:inline">Filter:</span>
                  {[
                    { key: "ALL", label: `All (${machineOperators.length})` },
                    { key: "OPERATOR", label: `Sewing Operators (${dedicatedCount})` },
                    { key: "FLOATER", label: `Floaters (${floaterCount})` },
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setMachineRoleFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        machineRoleFilter === f.key
                          ? "bg-[#9C5B3C] text-white border-[#9C5B3C] shadow-2xs"
                          : "bg-white text-[#8C7E6E] border-[#E6DDCE] hover:text-[#221912]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              }
            />
          ) : (
            <NonMachineWorkforceTable
              title="Non-Machine Workforce"
              badgeText={`${filteredNonMachinePersonnel.length} Personnel`}
              badgeClass="bg-purple-50 text-purple-900 border-purple-300"
              icon={<ShieldCheck className="w-4 h-4 text-purple-700" />}
              personnel={filteredNonMachinePersonnel}
              headerFilterAction={
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-[#8C7E6E] mr-1 hidden sm:inline">Role:</span>
                  {[
                    { key: "ALL", label: `All (${nonMachinePersonnel.length})` },
                    { key: "QUALITY_CHECKER", label: `Quality Checkers (${qcCount})` },
                    { key: "HELPER", label: `Helpers (${helperCount})` },
                    { key: "LINE_SUPERVISOR", label: `Supervisors (${supervisorCount})` },
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setNonMachineRoleFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        nonMachineRoleFilter === f.key
                          ? "bg-[#9C5B3C] text-white border-[#9C5B3C] shadow-2xs"
                          : "bg-white text-[#8C7E6E] border-[#E6DDCE] hover:text-[#221912]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              }
            />
          )}
        </div>
      )}

      {/* Info callout */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#8C7E6E] shadow-2xs">
        <ExternalLink className="w-4 h-4 text-[#9C5B3C] shrink-0" />
        <span>
          To update skill ratings for machine operators or modify staff designations, open the employee profile by clicking their name.
        </span>
      </div>

      {/* ── Daily Performance Log Modal (Machine Operators Only) ──────── */}
      <Modal isOpen={isPerfModalOpen} onClose={() => setIsPerfModalOpen(false)} title="Upload Daily Performance Log" subtitle="Record actual cycle time observed on the shop floor for a machine operator.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Machine Operator *</label>
              <CustomSelect
                value={perfForm.operatorId}
                onChange={val => setPerfForm(f => ({ ...f, operatorId: val }))}
                options={[
                  { value: "", label: "Select machine operator..." },
                  ...machineOperators.map((op: any) => ({
                    value: String(op.id),
                    label: `${op.name} (${op.employeeId})`,
                    sublabel: op.role === "FLOATER" ? "Floater" : "Sewing Operator"
                  }))
                ]}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operation *</label>
              <CustomSelect
                value={perfForm.operationId}
                onChange={val => setPerfForm(f => ({ ...f, operationId: val }))}
                options={[
                  { value: "", label: "Select operation..." },
                  ...operations.map((op: any) => ({
                    value: String(op.id),
                    label: op.name
                  }))
                ]}
                size="sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Date *</label>
              <input type="date" value={perfForm.logDate} onChange={e => setPerfForm(f => ({ ...f, logDate: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Actual Cycle Time (seconds) *</label>
              <input type="number" min="1" placeholder="e.g. 28" value={perfForm.actualCycleTimeSeconds} onChange={e => setPerfForm(f => ({ ...f, actualCycleTimeSeconds: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Logged By</label>
              <input type="text" placeholder="Manager / IE Engineer..." value={perfForm.recordedBy} onChange={e => setPerfForm(f => ({ ...f, recordedBy: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Notes</label>
              <input type="text" placeholder="Any observations..." value={perfForm.notes} onChange={e => setPerfForm(f => ({ ...f, notes: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsPerfModalOpen(false)} className="flex-1 h-9 text-xs font-semibold text-[#8C7E6E] border border-[#E6DDCE] rounded-xl hover:bg-[#F6F1E8]">Cancel</button>
            <button onClick={handlePerfLog} disabled={perfSaving || !perfForm.operatorId || !perfForm.operationId || !perfForm.actualCycleTimeSeconds} className="flex-1 h-9 text-xs font-semibold text-white bg-[#9C5B3C] rounded-xl hover:bg-[#B06C49] disabled:opacity-50">
              {perfSaving ? "Saving..." : "Save Log Entry"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}