import { useState, useEffect, useMemo } from "react";
import { Plus, Clock, Moon, CheckCircle2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "../../features/shifts/types";
import { shiftsApi } from "../../features/shifts/api";
import { ShiftList } from "../../features/shifts/ShiftList";
import { ShiftForm } from "../../features/shifts/ShiftForm";
import { Button } from "../../components/ui/Button";
import { PageHeader, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { exportToExcel, readFromExcel } from "../../utils/excel";
import { notifyMasterDataUpdated } from "../../utils/masterDataEvents";

function getShiftDurationHours(start: string, end: string): number {
  const [sh = 0, sm = 0] = (start || "").split(":").map(Number);
  const [eh = 0, em = 0] = (end || "").split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

export function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadShifts = async () => {
    setLoading(true);
    try {
      setShifts(await shiftsApi.getShifts());
      setRefreshKey(prev => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  // Executive KPI stats
  const kpiStats = useMemo(() => {
    const total = shifts.length;
    const active = shifts.filter(s => s.active);
    const overnight = shifts.filter(s => {
      const [sh = 0] = (s.startTime || "").split(":").map(Number);
      const [eh = 0] = (s.endTime || "").split(":").map(Number);
      return eh < sh;
    });
    const totalActiveHours = active.reduce((acc, s) => acc + getShiftDurationHours(s.startTime, s.endTime), 0);

    return {
      total,
      activeCount: active.length,
      overnightCount: overnight.length,
      totalActiveHours,
    };
  }, [shifts]);

  const handleToggleActive = async (id: string) => {
    await shiftsApi.toggleActive(id);
    notifyMasterDataUpdated("shift");
    loadShifts();
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingShift(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await shiftsApi.deleteShift(id);
      notifyMasterDataUpdated("shift");
      loadShifts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete shift.");
    }
  };

  const handleSubmit = async (data: CreateShiftDTO | UpdateShiftDTO) => {
    if (editingShift) await shiftsApi.updateShift(editingShift.id, data as UpdateShiftDTO);
    else await shiftsApi.createShift(data as CreateShiftDTO);
    notifyMasterDataUpdated("shift");
    handleClose();
    loadShifts();
  };

  const handleExport = () => {
    const data = shifts.map(s => ({
      "Shift Code": s.shiftCode,
      "Name": s.shiftName,
      "Start Time": s.startTime,
      "End Time": s.endTime,
      "Duration (Hours)": getShiftDurationHours(s.startTime, s.endTime),
      "Status": s.active ? "Active" : "Inactive"
    }));
    exportToExcel(data, `Shift_Master_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        await shiftsApi.createShift({
          shiftCode: row["Shift Code"],
          shiftName: row["Name"],
          startTime: row["Start Time"],
          endTime: row["End Time"],
          active: row["Status"] === "Active"
        });
      }
      notifyMasterDataUpdated("shift");
      await loadShifts();
      alert("Shifts imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import shifts. Please verify Excel column headers.");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Plant Operations"
        title="Shift Master & Timings"

        action={
          !isFormOpen && (
            <Button
              onClick={() => { setEditingShift(null); setIsFormOpen(true); }}
              size="md"
              className="bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Shift
            </Button>
          )
        }
      />

      {/* ── Executive KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shifts */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Total Shifts</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.total}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Configured plant shifts</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Active Shifts */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Roster</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 font-mono">{kpiStats.activeCount}</p>
            <p className="text-[11px] font-medium text-emerald-700">Running on shop floor</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Floor Operating Hours */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Daily Operating Time</p>
            <p className="text-2xl font-extrabold text-[#9C5B3C] font-mono">{kpiStats.totalActiveHours} hrs</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Total active capacity</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Overnight Coverage */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Night Shifts</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.overnightCount}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Overnight 24h coverage</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#8C7E6E] shadow-xs">
            <Moon className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Modal Form ────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingShift ? "Edit Shift" : "Create New Shift"}
        subtitle="Overnight shifts (e.g. 23:00–07:00) with custom meal and break deductions are supported."
      >
        <ShiftForm 
          existingShifts={shifts}
          initialData={editingShift} 
          onSubmit={handleSubmit} 
          onCancel={handleClose} 
        />
      </Modal>

      {/* ── Shift Cards & Summary Grid ────────────────────────────── */}
      <ShiftList
        shifts={shifts}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        loading={loading}
      />
    
      {/* ── Change History Audit ──────────────────────────────────── */}
      <RecentActivityLog key={refreshKey} entityType="SHIFT" />
    </div>
  );
}
