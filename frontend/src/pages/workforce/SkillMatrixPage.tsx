import { useState, useEffect } from "react";
import { Search, Upload, RefreshCw, ExternalLink, Activity, Download } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, DataCard, DataCardHeader, EmptyState } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";

import { skillApi, cycleTimeToRating, type SkillAssessment } from "../../features/skill-matrix/api";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { exportToExcel } from "../../utils/excel";

// Read-only skill badge — clear at a glance
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

export function SkillMatrixPage() {
  const [matrix, setMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      setOperators((oprs as any[]).filter((o: any) => o.active));
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
        const updated = await skillApi.autoUpdateSkillMatrix((op as any).id);
        totalChanged += Array.isArray(updated) ? updated.length : 0;
      }
      await loadData();
      alert(totalChanged === 0 ? "All ratings are already up to date." : `${totalChanged} rating(s) updated across all operators!`);
    } catch (err) {
      console.error(err);
      alert("Auto-update failed.");
    } finally {
      setAutoUpdating(false);
    }
  };

  const filteredOperators = operators.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  // Coverage stats
  const totalCells = operators.length * operations.length;
  const filledCells = matrix.length;
  const coveragePct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  const handleExportFullMatrix = () => {
    const rows = filteredOperators.map((operator: any) => {
      const row: Record<string, any> = {
        "Employee ID": operator.employeeId,
        "Employee Name": operator.name,
        "Department": operator.department || "Sewing",
      };
      operations.forEach((op: any) => {
        const rating = getEffectiveRating(operator.id, op.id);
        const colHeader = `${op.name} (${op.code || op.operationCode || `OP-${op.id}`})`;
        row[colHeader] = rating && rating > 0 ? rating : "-";
      });
      return row;
    });

    exportToExcel(rows, `Sewing_Skill_Matrix_${new Date().toISOString().split("T")[0]}`);
  };

  return (
    <div className="space-y-6 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Workforce"
        title="Sewing Skill Matrix"
        description="Live view of operator skill ratings. To update a rating, open the employee's profile page."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={handleExportFullMatrix} className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]">
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
              Upload Daily Performance
            </Button>
            <Button size="md" onClick={handleBulkAutoUpdate} disabled={autoUpdating} className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${autoUpdating ? "animate-spin" : ""}`} />
              {autoUpdating ? "Updating..." : "Auto-Update All"}
            </Button>
          </div>
        }
      />

      {/* Performance Log Modal */}
      <Modal isOpen={isPerfModalOpen} onClose={() => setIsPerfModalOpen(false)} title="Upload Daily Performance Log" subtitle="Record actual cycle time observed on the shop floor for any operator.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operator *</label>
              <select value={perfForm.operatorId} onChange={e => setPerfForm(f => ({ ...f, operatorId: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]">
                <option value="">Select operator...</option>
                {operators.map((op: any) => (<option key={op.id} value={op.id}>{op.name} ({op.employeeId})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operation *</label>
              <select value={perfForm.operationId} onChange={e => setPerfForm(f => ({ ...f, operationId: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] bg-white focus:outline-none focus:border-[#9C5B3C]">
                <option value="">Select operation...</option>
                {operations.map((op: any) => (<option key={op.id} value={op.id}>{op.name}</option>))}
              </select>
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

      {/* Stats + Legend Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#221912] font-mono">{operators.length}</div>
            <div className="text-[11px] text-[#8C7E6E] font-medium">Operators</div>
          </div>
          <div className="w-px h-8 bg-[#E6DDCE]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#221912] font-mono">{operations.length}</div>
            <div className="text-[11px] text-[#8C7E6E] font-medium">Operations</div>
          </div>
          <div className="w-px h-8 bg-[#E6DDCE]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#9C5B3C] font-mono">{coveragePct}%</div>
            <div className="text-[11px] text-[#8C7E6E] font-medium">Coverage</div>
          </div>
        </div>
        {/* Rating Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[#8C7E6E] mr-1">Rating:</span>
          {RATING_LEGEND.map(l => (
            <span key={l.rating} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${l.color}`}>
              <span className="font-mono">{l.rating}</span> {l.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F6F1E8] text-[#8C7E6E] border border-[#E6DDCE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7E6E] inline-block" /> Not Rated
          </span>
        </div>
      </div>

      <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
        <DataCardHeader
          title="Skill Matrix"
          subtitle="Read-only view. Click an operator name to open their profile and update ratings."
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search operators..." className="pl-8 pr-4 py-1.5 text-xs bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#8C7E6E]/60 w-52 focus:outline-none focus:border-[#9C5B3C] focus:ring-1 focus:ring-[#9C5B3C]/20 rounded-xl" />
            </div>
          }
        />

        {loading ? (
          <div className="p-12 text-center text-[#8C7E6E]">Loading matrix...</div>
        ) : filteredOperators.length === 0 ? (
          <EmptyState title="No operators found" />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#F8FAFC]/90 border-b-2 border-r-2 border-[#E6DDCE] p-4 text-left w-52 min-w-[200px] shadow-[2px_0_4px_rgba(34,25,18,0.03)]">
                    <span className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">Operator</span>
                  </th>
                  {operations.map((op: any) => (
                    <th key={op.id} className="bg-[#F8FAFC]/90 border-b-2 border-r border-[#E6DDCE] px-2 py-3 text-center min-w-[88px] w-[88px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[9px] text-[#9C5B3C] font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#E6DDCE]">{op.code || op.operationCode}</span>
                        <span className="text-[10.5px] font-semibold text-[#221912] leading-tight line-clamp-2 max-w-[76px]" title={op.name}>{op.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator: any) => {
                  const ratedCount = operations.filter(op => {
                    const r = getEffectiveRating(operator.id, (op as any).id);
                    return r && r > 0;
                  }).length;
                  return (
                    <tr key={operator.id} className="border-b border-[#F0EAE0] hover:bg-[#FEFCF9] transition-colors group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FEFCF9] border-r-2 border-[#E6DDCE] p-3 shadow-[2px_0_4px_rgba(34,25,18,0.03)] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-xs font-bold text-[#9C5B3C] shrink-0 shadow-2xs">
                            {operator.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/settings/operators/${operator.employeeId}`} className="font-bold text-xs text-[#221912] hover:text-[#9C5B3C] flex items-center gap-1 transition-colors">
                              {operator.name}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <span className="text-[10px] font-mono text-[#8C7E6E] block">
                              {operator.employeeId} · {ratedCount}/{operations.length} rated
                            </span>
                          </div>
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

      {/* Info callout */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E6DDCE] rounded-xl text-sm text-[#8C7E6E]">
        <ExternalLink className="w-4 h-4 text-[#9C5B3C] shrink-0" />
        <span>To update an operator skill rating, open their <strong className="text-[#221912]">Employee Profile</strong> (click the name) and go to the <strong className="text-[#221912]">Skill Matrix</strong> tab.</span>
      </div>
    </div>
  );
}