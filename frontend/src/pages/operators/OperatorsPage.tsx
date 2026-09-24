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
import { notifyMasterDataUpdated } from "../../utils/masterDataEvents";

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
    notifyMasterDataUpdated("operator");
    await loadOperators();
    setIsFormOpen(false);
    setEditingOperator(null);
  };

  const handleEdit = (op: Operator) => {
    navigate(`/settings/operators/${op.employeeId}`);
  };

  const handleToggleActive = async (id: string) => {
    await operatorsApi.toggleActive(id);
    notifyMasterDataUpdated("operator");
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

        action={
          !isFormOpen && (
            <Button
              onClick={() => { setEditingOperator(null); setIsFormOpen(true); }}
              size="md"
              className="bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-sm shadow-[#9C5B3C]/20"
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
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Total Workforce</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.total}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Registered floor operators</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Active on Floor */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-[#d4decb] bg-[#F3F5F2]/60 p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#77876F] animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#77876F]">Active Operators</p>
            </div>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.activeCount}</p>
            <p className="text-[11px] font-medium text-[#77876F]">Ready for line balancing</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F3F5F2] border border-[#d4decb] flex items-center justify-center text-[#77876F] shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Departments */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Departments</p>
            <p className="text-2xl font-extrabold text-[#9C5B3C] font-mono">{kpiStats.deptCount}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Sewing, Finishing & Prep</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Demographics / Average Age */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Workforce Profile</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.avgAge} yrs</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Average operator age</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E6DDCE] flex items-center justify-center text-[#8C7E6E] shadow-xs">
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
