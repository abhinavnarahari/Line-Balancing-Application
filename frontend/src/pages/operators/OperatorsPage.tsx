import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, UserCheck, ShieldCheck, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { OperatorList } from "../../features/operators/OperatorList";
import { OperatorForm } from "../../features/operators/OperatorForm";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { Button } from "../../components/ui/Button";
import { exportToExcel, readFromExcel } from "../../utils/excel";

export function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadOperators = async () => {
    setLoading(true);
    try {
      setOperators(await operatorsApi.getOperators());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  // Executive KPI stats
  const kpiStats = useMemo(() => {
    const total = operators.length;
    const active = operators.filter(o => o.active);
    const depts = Array.from(new Set(operators.map(o => o.department).filter(Boolean)));
    const avgAge = operators.length > 0 ? Math.round(operators.reduce((sum, o) => sum + (o.age || 0), 0) / operators.length) : 0;

    return {
      total,
      activeCount: active.length,
      deptCount: depts.length,
      avgAge,
    };
  }, [operators]);

  const handleSubmit = async (data: Omit<Operator, "id" | "createdAt" | "updatedAt">) => {
    if (editingOperator) await operatorsApi.updateOperator(editingOperator.id, data);
    else await operatorsApi.createOperator(data);
    await loadOperators();
    setIsFormOpen(false);
    setEditingOperator(null);
  };

  const handleEdit = (op: Operator) => {
    navigate(`/settings/operators/${op.employeeId}`);
  };

  const handleToggleActive = async (id: string) => {
    await operatorsApi.toggleActive(id);
    await loadOperators();
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingOperator(null);
  };

  const handleExport = () => {
    const data = operators.map(op => ({
      "Employee ID": op.employeeId,
      "Name": op.name,
      "Age": op.age,
      "Gender": op.gender,
      "Department": op.department,
      "Joining Date": op.joiningDate,
      "Status": op.active ? "Active" : "Inactive"
    }));
    exportToExcel(data, `Operators_Master_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        await operatorsApi.createOperator({
          employeeId: row["Employee ID"],
          name: row["Name"],
          age: parseInt(row["Age"]) || 0,
          gender: row["Gender"] || "OTHER",
          department: row["Department"] || "Sewing",
          joiningDate: row["Joining Date"] || new Date().toISOString().split("T")[0],
          active: row["Status"] === "Active"
        });
      }
      await loadOperators();
      alert("Operators imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import operators. Please verify Excel column headers.");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Workforce Directory"
        title="Sewing Operators Master"
        description="Register and manage sewing machine operators, skill competencies, and factory floor allocations."
        action={
          !isFormOpen && (
            <Button
              onClick={() => { setEditingOperator(null); setIsFormOpen(true); }}
              size="md"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Register Operator
            </Button>
          )
        }
      />

      {/* ── Executive KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Operators */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{kpiStats.total}</p>
            <p className="text-[11px] font-medium text-slate-500">Registered floor operators</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Active on Floor */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Operators</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 font-mono">{kpiStats.activeCount}</p>
            <p className="text-[11px] font-medium text-emerald-700">Ready for line balancing</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Departments */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Departments</p>
            <p className="text-2xl font-extrabold text-indigo-700 font-mono">{kpiStats.deptCount}</p>
            <p className="text-[11px] font-medium text-slate-500">Sewing, Finishing & Prep</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Demographics / Average Age */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Workforce Profile</p>
            <p className="text-2xl font-extrabold text-purple-700 font-mono">{kpiStats.avgAge} yrs</p>
            <p className="text-[11px] font-medium text-slate-500">Average operator age</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Modal Form ────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingOperator ? "Edit Operator Profile" : "Register New Operator"}
        subtitle="Employee ID must be unique across the facility."
      >
        <OperatorForm 
          existingOperators={operators}
          initialData={editingOperator} 
          onSubmit={handleSubmit} 
          onCancel={handleClose} 
        />
      </Modal>

      {/* ── Data Grid ─────────────────────────────────────────────── */}
      <OperatorList
        operators={operators}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        loading={loading}
      />
    
      {/* ── Activity History ──────────────────────────────────────── */}
      <RecentActivityLog entityType="OPERATOR" />
    </div>
  );
}
