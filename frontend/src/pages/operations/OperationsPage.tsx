import { useState, useEffect, useMemo } from "react";
import { Plus, Scissors, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { OperationList } from "../../features/operations/OperationList";
import { OperationForm } from "../../features/operations/OperationForm";
import { OperationRatingModal } from "../../features/operations/OperationRatingModal";
import { OperationAffinityModal } from "../../features/operations/OperationAffinityModal";
import { operationsApi, type Operation, type OperationAffinity } from "../../features/operations/api";
import { exportToExcel, readFromExcel } from "../../utils/excel";

export function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [affinities, setAffinities] = useState<OperationAffinity[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [selectedOperationForRating, setSelectedOperationForRating] = useState<Operation | null>(null);
  const [selectedOpForAffinity, setSelectedOpForAffinity] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const [ops, affs] = await Promise.all([
        operationsApi.getOperations(),
        operationsApi.getAllAffinities().catch(() => [])
      ]);
      setOperations(ops);
      setAffinities(affs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  // Executive KPI summary stats
  const kpiStats = useMemo(() => {
    const total = operations.length;
    const active = operations.filter(o => o.active);
    const avgSmv = operations.length > 0
      ? (operations.reduce((sum, o) => sum + (o.standardSmv || 0.5), 0) / operations.length).toFixed(2)
      : "0.50";

    return {
      total,
      activeCount: active.length,
      avgSmv,
    };
  }, [operations]);

  const handleSubmit = async (data: Omit<Operation, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingOperation) await operationsApi.updateOperation(editingOperation.id, data);
      else await operationsApi.createOperation(data);
      await loadOperations();
      setIsFormOpen(false);
      setEditingOperation(null);
    } catch (err) {
      console.error("Failed to save operation:", err);
    }
  };

  const handleEdit = (op: Operation) => {
    setEditingOperation(op);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (id: string | number) => {
    await operationsApi.toggleActive(id);
    await loadOperations();
  };

  const handleDelete = async (id: string | number) => {
    try {
      await operationsApi.deleteOperation(id);
      await loadOperations();
    } catch (err) {
      console.error(err);
      alert("Failed to delete operation.");
    }
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingOperation(null);
  };

  const handleExport = () => {
    const data = operations.map(op => ({
      "Operation Code": op.operationCode,
      "Name": op.name,
      "Machine Type": op.machineType || "Single Needle Lockstitch",
      "Description": op.description,
      "Standard SMV": op.standardSmv || 0.5,
      "Sequence": op.sequence,
      "Status": op.active ? "Active" : "Inactive"
    }));
    exportToExcel(data, `Operations_Master_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        await operationsApi.createOperation({
          operationCode: row["Operation Code"],
          name: row["Name"],
          machineType: row["Machine Type"] || "Single Needle Lockstitch",
          description: row["Description"] || "",
          standardSmv: parseFloat(row["Standard SMV"]) || 0.5,
          sequence: parseInt(row["Sequence"]) || 0,
          active: row["Status"] === "Active"
        });
      }
      await loadOperations();
      alert("Operations imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import operations. Please verify Excel headers.");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Industrial Engineering"
        title="Operation Master & SMV Benchmark"
        description="Standard sewing work content, machine assignments, and SMV engineering library for operation bulletins."
        action={
          !isFormOpen && (
            <Button
              onClick={() => { setEditingOperation(null); setIsFormOpen(true); }}
              size="md"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Operation
            </Button>
          )
        }
      />

      {/* ── Executive KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Operations */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Operations</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{kpiStats.total}</p>
            <p className="text-[11px] font-medium text-slate-500">Standard work catalog</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Scissors className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Active on Production */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Operations</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 font-mono">{kpiStats.activeCount}</p>
            <p className="text-[11px] font-medium text-emerald-700">Available in bulletins</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Average Standard SMV */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Standard SMV</p>
            <p className="text-2xl font-extrabold text-indigo-700 font-mono">{kpiStats.avgSmv} min</p>
            <p className="text-[11px] font-medium text-slate-500">{(parseFloat(kpiStats.avgSmv) * 60).toFixed(0)} sec / cycle average</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Modal Form ────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingOperation ? "Edit Operation" : "Create New Standard Operation"}
        subtitle="Define standard SMV (Standard Minute Value) and machinery requirements."
      >
        <OperationForm
          existingOperations={operations}
          initialData={editingOperation}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>

      {/* ── Operation Rating Benchmark Modal ───────────────────────── */}
      <OperationRatingModal
        isOpen={Boolean(selectedOperationForRating)}
        onClose={() => setSelectedOperationForRating(null)}
        operation={selectedOperationForRating}
        onOperationUpdated={loadOperations}
      />

      {/* ── Operation Affinity Modal ───────────────────────────────── */}
      <OperationAffinityModal
        isOpen={Boolean(selectedOpForAffinity)}
        onClose={() => setSelectedOpForAffinity(null)}
        operation={selectedOpForAffinity}
        allOperations={operations}
        onUpdated={loadOperations}
      />

      {/* ── Data Grid ─────────────────────────────────────────────── */}
      <OperationList
        operations={operations}
        affinities={affinities}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
        onViewRating={(op) => setSelectedOperationForRating(op)}
        onManageAffinities={(op) => setSelectedOpForAffinity(op)}
        loading={loading}
      />
    
      {/* ── Activity History ──────────────────────────────────────── */}
      <RecentActivityLog entityType="OPERATION" />
    </div>
  );
}
