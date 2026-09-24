import { useState, useEffect, useMemo } from "react";
import { Plus, Users, Cpu, Gauge, AlertTriangle, Building } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { linesApi, type SewingLine, type LineType, type OperationalStatus } from "../../features/lines/api";
import { LineList } from "../../features/lines/LineList";
import { LineForm } from "../../features/lines/LineForm";
import { LineDetailModal } from "../../features/lines/LineDetailModal";
import { exportToExcel, readFromExcel } from "../../utils/excel";
import { notifyMasterDataUpdated } from "../../utils/masterDataEvents";

export function LinesPage() {
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<SewingLine | null>(null);
  const [inspectingLine, setInspectingLine] = useState<SewingLine | null>(null);
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
    const activeLines = lines.filter((l) => l.operationalStatus === "ACTIVE" || (l.active && l.operationalStatus !== "IDLE")).length;
    const changeoverLines = lines.filter((l) => l.operationalStatus === "CHANGEOVER").length;
    const totalWorkstations = lines.reduce((sum, l) => sum + (l.workstationCount || 0), 0);
    const totalOps = lines.reduce((sum, l) => sum + (l.operatorCount || 0), 0);
    const totalHelpers = lines.reduce((sum, l) => sum + (l.helperCount || 0), 0);
    const totalMachines = lines.reduce((sum, l) => sum + (l.machineCount || 0), 0);
    const totalCapacity = lines.reduce((sum, l) => sum + (l.capacityPerDay || 0), 0);

    return {
      totalLines,
      activeLines,
      changeoverLines,
      totalWorkstations,
      totalOps,
      totalHelpers,
      totalManpower: totalOps + totalHelpers,
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
      notifyMasterDataUpdated("line");
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save sewing line:", err);
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await linesApi.toggleStatus(id);
      notifyMasterDataUpdated("line");
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
      notifyMasterDataUpdated("line");
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Failed to delete sewing line:", err);
      alert("Failed to delete sewing line. Please check if any line plans or bulletins depend on it.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = lines.map((l) => ({
      "Line Code": l.lineCode,
      "Line Name": l.lineName,
      "Line Type": l.lineType || "PBS",
      "Floor / Location": l.floor || "",
      "Department": l.department || "Sewing Floor",
      "Line Supervisor": l.supervisorName || "",
      "IE In-Charge": l.ieInCharge || "",
      "QC Lead": l.qcInspector || "",
      "Workstations": l.workstationCount || 24,
      "No. of Operators": l.operatorCount || 0,
      "Floaters / Helpers": l.helperCount || 0,
      "No. of Machines": l.machineCount || 0,
      "Working Hours": Number(l.workingHours || 8).toFixed(1),
      "Capacity/Day (pcs)": l.capacityPerDay || 0,
      "Target Efficiency %": `${l.targetEfficiencyPercent}%`,
      "Operational Status": l.operationalStatus || "ACTIVE",
      "Active Style": l.currentStyle || "",
      "Active Bulletin": l.currentBulletin || "",
      "Notes": l.notes || "",
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
          lineType: (row["Line Type"] || row["lineType"] || "PBS") as LineType,
          floor: row["Floor / Location"] || row["floor"] || "Unit 1 - Floor 1",
          department: row["Department"] || row["department"] || "Knit Assembly",
          supervisorName: row["Line Supervisor"] || row["supervisorName"] || "",
          ieInCharge: row["IE In-Charge"] || row["ieInCharge"] || "Priya Sharma",
          qcInspector: row["QC Lead"] || row["qcInspector"] || "Naresh Soni",
          workstationCount: parseInt(row["Workstations"] || row["workstationCount"]) || 24,
          operatorCount: parseInt(row["No. of Operators"] || row["operatorCount"]) || 20,
          helperCount: parseInt(row["Floaters / Helpers"] || row["helperCount"]) || 2,
          machineCount: parseInt(row["No. of Machines"] || row["machineCount"]) || 22,
          workingHours: parseFloat(row["Working Hours"] || row["workingHours"]) || 8.0,
          capacityPerDay: parseInt(row["Capacity/Day (pcs)"] || row["capacityPerDay"]) || 1000,
          targetEfficiencyPercent: parseFloat(String(row["Target Efficiency %"] || row["targetEfficiencyPercent"]).replace("%", "")) || 85.0,
          operationalStatus: (row["Operational Status"] || row["operationalStatus"] || "ACTIVE") as OperationalStatus,
          currentStyle: row["Active Style"] || row["currentStyle"] || "",
          currentBulletin: row["Active Bulletin"] || row["currentBulletin"] || "",
          notes: row["Notes"] || row["notes"] || "",
          active: row["Operational Status"] !== "IDLE",
        });
      }
      await loadData();
      alert("Commercial sewing lines imported successfully!");
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
        eyebrow="Physical Factory Floor Setup"
        title="Sewing Lines Master"

        action={
          <Button
            onClick={handleOpenCreate}
            size="md"
            className="bg-[#9C5B3C] hover:bg-[#854B31] text-white shadow-sm font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Sewing Line</span>
          </Button>
        }
      />

      {/* ── Executive Industrial Floor Telemetry Cards ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Lines */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Factory Lines</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.totalLines}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {kpiStats.activeLines} Active
              </span>
            </div>
            <p className="text-[11px] text-[#8C7E6E]">
              {kpiStats.changeoverLines > 0 ? `${kpiStats.changeoverLines} in style changeover` : "All active in production"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Building className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Planned Manpower */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.04 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Total Planned Manpower</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.totalManpower}</span>
              <span className="text-xs font-medium text-[#8C7E6E] font-mono">Ops</span>
            </div>
            <p className="text-[11px] text-[#8C7E6E]">
              {kpiStats.totalOps} Primary + {kpiStats.totalHelpers} Floater Helpers
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Machines */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.08 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Total Machines</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.totalMachines}</span>
              <span className="text-xs font-medium text-[#8C7E6E] font-mono">Mc</span>
            </div>
            <p className="text-[11px] text-[#8C7E6E]">
              Installed sewing &amp; press machines
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Daily Plant Output Capacity */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.12 }}
          className="rounded-2xl border border-emerald-200/70 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Daily Factory Capacity</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-950 font-mono">
                {kpiStats.totalCapacity.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-emerald-700 font-mono">pcs/day</span>
            </div>
            <p className="text-[11px] text-emerald-600">
              Combined rated sewing throughput
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
            <Gauge className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Line Master Data Workspace ────────────────────────────── */}
      <LineList
        lines={lines}
        loading={loading}
        onInspect={(line) => setInspectingLine(line)}
        onEdit={handleOpenEdit}
        onDelete={handleDeletePrompt}
        onToggleActive={handleToggleActive}
      />

      {/* ── Create / Edit Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLine ? `Edit Sewing Line: ${editingLine.lineCode}` : "Register Commercial Sewing Line"}
        subtitle={
          editingLine
            ? "Update physical line layout type, capacity parameters, and personnel assignments."
            : "Register a new commercial garment sewing line with industrial engineering specifications."
        }
        className="max-w-4xl"
      >
        <LineForm
          initialData={editingLine}
          suggestedLineCode={suggestedLineCode}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* ── Line Detail / Inspection Modal ────────────────────────── */}
      <LineDetailModal
        line={inspectingLine}
        isOpen={!!inspectingLine}
        onClose={() => setInspectingLine(null)}
        onEdit={(line) => {
          setInspectingLine(null);
          handleOpenEdit(line);
        }}
      />

      {/* ── Delete Confirmation Dialog ────────────────────────────── */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete Sewing Line"
        className="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to delete this sewing line?</p>
              <p className="text-rose-700">
                You are about to delete <strong className="font-semibold">{deleteConfirm?.name}</strong>. All associated line configurations will be removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
