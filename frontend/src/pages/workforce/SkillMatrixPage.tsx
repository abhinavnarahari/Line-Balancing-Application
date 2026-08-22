import { useState, useEffect } from "react";
import { Search, Upload, RefreshCw, ExternalLink, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, DataCard, DataCardHeader, EmptyState } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";

import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { operationsApi, type Operation } from "../../features/operations/mockApi";
import { operatorsApi, type Operator } from "../../features/operators/mockApi";

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
    1: { bg: "bg-slate-100",        text: "text-slate-600",   label: "Beginner" },
    2: { bg: "bg-teal-50",          text: "text-teal-700",    label: "Basic" },
    3: { bg: "bg-amber-50",         text: "text-amber-700",   label: "Standard" },
    4: { bg: "bg-blue-50",          text: "text-blue-700",    label: "Good" },
    5: { bg: "bg-[#FBF4EC]",        text: "text-[#9B5A32]",   label: "Expert" },
  };
  const c = config[rating];
  return (
    <div className="w-full h-10 flex items-center justify-center">
      <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-sm font-bold`} title={c.label}>
        {rating}
      </div>
    </div>
  );
}

// Rating level legend
const RATING_LEGEND = [
  { rating: 1, label: "Beginner",  color: "bg-slate-200 text-slate-700" },
  { rating: 2, label: "Basic",     color: "bg-teal-100 text-teal-800" },
  { rating: 3, label: "Standard",  color: "bg-amber-100 text-amber-800" },
  { rating: 4, label: "Good",      color: "bg-blue-100 text-blue-800" },
  { rating: 5, label: "Expert",    color: "bg-[#FFE5BF] text-[#9B5A32]" },
];

export function SkillMatrixPage() {
  const [matrix, setMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
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
      const [mat, ops, oprs] = await Promise.all([
        skillApi.getCurrentMatrix(),
        operationsApi.getOperations(),
        operatorsApi.getOperators(),
      ]);
      setMatrix(mat);
      setOperations((ops as any[]).filter((o: any) => o.active).sort((a: any, b: any) => a.sequence - b.sequence));
      setOperators((oprs as any[]).filter((o: any) => o.active));
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Workforce"
        title="Sewing Skill Matrix"
        description="Live view of operator skill ratings. To update a rating, open the employee's profile page."
        action={
          <div className="flex items-center gap-2">
            <Link to="/skill-matrix/logs">
              <Button variant="outline" size="md">
                <Activity className="h-4 w-4 mr-1.5" />
                History Logs
              </Button>
            </Link>
            <Button variant="outline" size="md" onClick={() => setIsPerfModalOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Upload Daily Performance
            </Button>
            <Button variant="outline" size="md" onClick={handleBulkAutoUpdate} disabled={autoUpdating}>
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
              <select value={perfForm.operatorId} onChange={e => setPerfForm(f => ({ ...f, operatorId: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]">
                <option value="">Select operator...</option>
                {operators.map((op: any) => (<option key={op.id} value={op.id}>{op.name} ({op.employeeId})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operation *</label>
              <select value={perfForm.operationId} onChange={e => setPerfForm(f => ({ ...f, operationId: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]">
                <option value="">Select operation...</option>
                {operations.map((op: any) => (<option key={op.id} value={op.id}>{op.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Date *</label>
              <input type="date" value={perfForm.logDate} onChange={e => setPerfForm(f => ({ ...f, logDate: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Actual Cycle Time (seconds) *</label>
              <input type="number" min="1" placeholder="e.g. 28" value={perfForm.actualCycleTimeSeconds} onChange={e => setPerfForm(f => ({ ...f, actualCycleTimeSeconds: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Logged By</label>
              <input type="text" placeholder="Manager / IE Engineer..." value={perfForm.recordedBy} onChange={e => setPerfForm(f => ({ ...f, recordedBy: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Notes</label>
              <input type="text" placeholder="Any observations..." value={perfForm.notes} onChange={e => setPerfForm(f => ({ ...f, notes: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsPerfModalOpen(false)} className="flex-1 h-9 text-sm font-semibold text-[#8C7E6E] border border-[#E6DDCE] rounded-sm hover:bg-[#FAFAF8]">Cancel</button>
            <button onClick={handlePerfLog} disabled={perfSaving || !perfForm.operatorId || !perfForm.operationId || !perfForm.actualCycleTimeSeconds} className="flex-1 h-9 text-sm font-semibold text-white bg-[#B48259] rounded-sm hover:bg-[#9B6B44] disabled:opacity-50">
              {perfSaving ? "Saving..." : "Save Log Entry"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stats + Legend Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#221912]">{operators.length}</div>
            <div className="text-[11px] text-[#8C7E6E] font-medium">Operators</div>
          </div>
          <div className="w-px h-8 bg-[#E6DDCE]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#221912]">{operations.length}</div>
            <div className="text-[11px] text-[#8C7E6E] font-medium">Operations</div>
          </div>
          <div className="w-px h-8 bg-[#E6DDCE]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#B48259]">{coveragePct}%</div>
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAFAF8] text-[#B8A898] border border-[#F0EAE0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D1C9BF] inline-block" /> Not Rated
          </span>
        </div>
      </div>

      <DataCard noPad>
        <DataCardHeader
          title="Skill Matrix"
          subtitle="Read-only view. Click an operator name to open their profile and update ratings."
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search operators..." className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#B8A898] w-52 focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 rounded-sm" />
            </div>
          }
        />

        {loading ? (
          <div className="p-12 text-center text-[#475569]">Loading matrix...</div>
        ) : filteredOperators.length === 0 ? (
          <EmptyState title="No operators found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#FAFAF8] border-b-2 border-r-2 border-[#F0EAE0] p-4 text-left w-52 min-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">Operator</span>
                  </th>
                  {operations.map((op: any) => (
                    <th key={op.id} className="bg-[#FAFAF8] border-b-2 border-r border-[#F0EAE0] px-2 py-3 text-center min-w-[88px] w-[88px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-[9px] text-[#B48259] font-bold bg-white px-1.5 py-0.5 rounded border border-[#F0EAE0]">{op.code || op.operationCode}</span>
                        <span className="text-[10px] font-medium text-[#221912] leading-tight line-clamp-2 max-w-[76px]" title={op.name}>{op.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator: any) => {
                  const ratedCount = operations.filter(op =>
                    matrix.some(m => String(m.operatorId) === String(operator.id) && String(m.operationId) === String((op as any).id))
                  ).length;
                  return (
                    <tr key={operator.id} className="border-b border-[#F0EAE0] hover:bg-[#FEFCF9] transition-colors group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FEFCF9] border-r-2 border-[#F0EAE0] p-3 shadow-[2px_0_4px_rgba(0,0,0,0.02)] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFE5BF] to-[#8B4A3C]/60 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {operator.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <Link to={`/settings/operators/${operator.employeeId}`} className="flex items-center gap-1 font-semibold text-sm text-[#221912] hover:text-[#B48259] transition-colors group/link">
                              <span className="truncate">{operator.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 shrink-0 transition-opacity" />
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-[#8C7E6E]">{operator.employeeId}</span>
                              <span className="text-[10px] text-[#B8A898]">|</span>
                              <span className="text-[10px] text-[#8C7E6E]">{ratedCount}/{operations.length} rated</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {operations.map((op: any) => {
                        const skill = matrix.find(m => String(m.operatorId) === String(operator.id) && String(m.operationId) === String(op.id));
                        return (
                          <td key={op.id} className="border-r border-[#F0EAE0] p-0">
                            <SkillBadge rating={skill?.rating} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>

      {/* Info callout */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FEFCF9] border border-[#F0EAE0] rounded-xl text-sm text-[#8C7E6E]">
        <ExternalLink className="w-4 h-4 text-[#B48259] shrink-0" />
        <span>To update an operator skill rating, open their <strong className="text-[#221912]">Employee Profile</strong> (click the name) and go to the <strong className="text-[#221912]">Skill Matrix</strong> tab.</span>
      </div>
    </div>
  );
}