import { useState, useEffect, useMemo } from "react";
import { Plus, Activity, Users, Cpu, Gauge, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { LineList } from "../../features/lines/LineList";
import { LineForm } from "../../features/lines/LineForm";
import { exportToExcel, readFromExcel } from "../../utils/excel";

export function LinesPage() {
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<SewingLine | null>(null);
  const [suggestedLineCode, setSuggestedLineCode] = useState("LINE-01");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await linesApi.getLines();
      setLines(data);
    } catch (err) {
      console.error("Failed to load sewing lines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Executive KPI summary stats
  const kpiStats = useMemo(() => {
    const totalLines = lines.length;
    const activeLines = lines.filter((l) => l.active).length;
    const totalOps = lines.reduce((sum, l) => sum + (l.operatorCount || 0), 0);
    const totalMachines = lines.reduce((sum, l) => sum + (l.machineCount || 0), 0);
    const totalCapacity = lines.reduce((sum, l) => sum + (l.capacityPerDay || 0), 0);

    return {
      totalLines,
      activeLines,
      totalOps,
      totalMachines,
      totalCapacity,
    };
  }, [lines]);

  const handleOpenCreate = async () => {
    setEditingLine(null);
    try {
      const nextCode = await linesApi.getNextLineCode();
      setSuggestedLineCode(nextCode);
    } catch {
      setSuggestedLineCode(`LINE-0${lines.length + 1}`);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (line: SewingLine) => {
    setEditingLine(line);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: Omit<SewingLine, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingLine) {
        await linesApi.updateLine(editingLine.id, data);
      } else {
        await linesApi.createLine(data);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save sewing line:", err);
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await linesApi.toggleStatus(id);
      loadData();
    } catch (err) {
      console.error("Failed to toggle line status:", err);
    }
  };

  const handleDeletePrompt = (id: string | number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await linesApi.deleteLine(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Failed to delete sewing line:", err);
      alert("Failed to delete sewing line. Please check if any records depend on it.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = lines.map((l) => ({
      "Line Code": l.lineCode,
      "Line Name": l.lineName,
      "Floor / Location": l.floor || "",
      "Line Supervisor": l.supervisorName || "",
      "No. of Operators": l.operatorCount || 0,
      "No. of Machines": l.machineCount || 0,
      "Working Hours": Number(l.workingHours || 8).toFixed(1),
      "Capacity/Day": l.capacityPerDay || 0,
      "Target Efficiency %": `${l.targetEfficiencyPercent}%`,
      "Status": l.active ? "Active" : "Inactive",
    }));

    exportToExcel(exportData, `Sewing_Lines_Master_${new Date().toISOString().split("T")[0]}`);
  };

  // Import from Excel
  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        const lineCode = row["Line Code"] || row["lineCode"] || "";
        const lineName = row["Line Name"] || row["lineName"] || "";
        if (!lineName && !lineCode) continue;

        await linesApi.createLine({
          lineCode: lineCode.trim(),
          lineName: lineName.trim() || `Line ${lineCode}`,
          floor: row["Floor / Location"] || row["floor"] || "Floor 1",
          supervisorName: row["Line Supervisor"] || row["supervisorName"] || "",
          operatorCount: parseInt(row["No. of Operators"] || row["operatorCount"]) || 20,
          machineCount: parseInt(row["No. of Machines"] || row["machineCount"]) || 22,
          workingHours: parseFloat(row["Working Hours"] || row["workingHours"]) || 8.0,
          capacityPerDay: parseInt(row["Capacity/Day"] || row["capacityPerDay"]) || 1000,
          targetEfficiencyPercent: parseFloat(String(row["Target Efficiency %"] || row["targetEfficiencyPercent"]).replace("%", "")) || 85.0,
          active: row["Status"] !== "Inactive",
        });
      }
      await loadData();
      alert("Sewing lines imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import sewing lines. Please verify Excel column formats.");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Physical Floor Setup"
        title="Sewing Lines Master"
        description="Configure physical production lines, operators, machines, daily capacity targets, and supervisor allocations."
        action={
          <Button
            onClick={handleOpenCreate}
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Sewing Line
          </Button>
        }
      />

      {/* ── Executive KPI Summary Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lines */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Lines</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{kpiStats.totalLines}</p>
            <p className="text-[11px] font-medium text-emerald-600">{kpiStats.activeLines} active in production</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Sewing Operators */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-white to-indigo-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Line Operators</p>
            <p className="text-2xl font-extrabold text-indigo-900 font-mono">{kpiStats.totalOps}</p>
            <p className="text-[11px] font-medium text-indigo-600">Total planned sewing manpower</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Sewing Machines */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Machine Count</p>
            <p className="text-2xl font-extrabold text-sky-900 font-mono">{kpiStats.totalMachines}</p>
            <p className="text-[11px] font-medium text-sky-600">Installed machine positions</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Daily Output Capacity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Daily Plant Capacity</p>
            <p className="text-2xl font-extrabold text-emerald-900 font-mono">
              {kpiStats.totalCapacity.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-emerald-600">Target pieces / day</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <Gauge className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Line Data List ────────────────────────────────────────── */}
      <LineList
        lines={lines}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={handleDeletePrompt}
        onToggleActive={handleToggleActive}
      />

      {/* ── Create / Edit Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLine ? "Edit Sewing Line" : "New Sewing Line"}
        subtitle={
          editingLine
            ? "Update physical line configuration and capacity parameters."
            : "Register a new sewing production line with auto system-generated code."
        }
        maxWidth="max-w-2xl"
      >
        <LineForm
          initialData={editingLine}
          suggestedLineCode={suggestedLineCode}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* ── Delete Confirmation Dialog ────────────────────────────── */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete Sewing Line"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Are you sure you want to delete this sewing line?</p>
              <p className="text-rose-700">
                You are about to delete <strong className="font-semibold">{deleteConfirm?.name}</strong>. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="md"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete Line
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Activity History ──────────────────────────────────────── */}
      <RecentActivityLog entityType="SEWING_LINE" />
    </div>
  );
}

