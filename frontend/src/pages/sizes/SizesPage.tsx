import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Layers, CheckCircle2, Tag, ArrowRight } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader, DataCard, DataCardHeader, EmptyState, SkeletonTable, StatusBadge, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { sizesApi, type Size } from "../../features/sizes/api";
import { exportToExcel, readFromExcel } from "../../utils/excel";

export function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ code: "", label: "", sequence: 1, active: true });

  const loadSizes = async () => {
    setLoading(true);
    try {
      setSizes(await sizesApi.getSizes());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSizes();
  }, []);

  // Executive KPI stats
  const kpiStats = useMemo(() => {
    const total = sizes.length;
    const active = sizes.filter(s => s.active);
    const sorted = [...sizes].sort((a, b) => a.sequence - b.sequence);
    const range = sorted.length > 0 ? `${sorted[0].code} → ${sorted[sorted.length - 1].code}` : "—";

    return {
      total,
      activeCount: active.length,
      range,
    };
  }, [sizes]);

  const openCreate = () => {
    setEditingSize(null);
    const presets = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
    const nextPreset = presets.find(p => !sizes.some(s => s.code.toUpperCase() === p)) || `SZ-${sizes.length + 1}`;
    setFormData({ code: nextPreset, label: nextPreset, sequence: sizes.length + 1, active: true });
    setIsFormOpen(true);
  };

  const openEdit = (s: Size) => {
    setEditingSize(s);
    setFormData({ code: s.code, label: s.label, sequence: s.sequence, active: s.active });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSize) await sizesApi.updateSize(editingSize.id, formData);
      else await sizesApi.createSize(formData);
      await loadSizes();
      setIsFormOpen(false);
      setEditingSize(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string | number) => {
    await sizesApi.toggleActive(id);
    await loadSizes();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "number" ? parseInt(value) : value }));
  };

  const handleExport = () => {
    const data = [...sizes].sort((a, b) => a.sequence - b.sequence).map(s => ({
      "Sequence": s.sequence,
      "Code": s.code,
      "Label": s.label,
      "Status": s.active ? "Active" : "Inactive"
    }));
    exportToExcel(data, `Size_Definitions_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        await sizesApi.createSize({
          sequence: row["Sequence"] || 1,
          code: row["Code"],
          label: row["Label"],
          active: row["Status"] === "Active"
        });
      }
      await loadSizes();
      alert("Sizes imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import sizes. Please check Excel format.");
    }
  };

  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => a.sequence - b.sequence);
  }, [sizes]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data Configuration"
        title="Apparel Size Definitions"
        description="Standardized dimensional sizing matrix, grading sequence, and ratio profiles."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleExport}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            >
              Export
            </Button>
            <label className="cursor-pointer">
              <span className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-2xs transition-colors">
                Import
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </label>
            <Button
              variant="primary"
              size="md"
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Garment Size
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Configured Sizes</p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{kpiStats.total}</p>
            <p className="text-[11px] font-medium text-slate-500">Active size specifications</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active In Matrix</p>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono">{kpiStats.activeCount}</p>
            <p className="text-[11px] font-medium text-slate-500">Available on order forms</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Size Span</p>
            <p className="text-2xl font-extrabold text-indigo-700 font-mono">{kpiStats.range}</p>
            <p className="text-[11px] font-medium text-slate-500">Graded range sequence</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Tag className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSize ? "Edit Garment Size" : "Add New Garment Size"}
        subtitle="Size codes and sequence determine how order size breakdowns are ordered."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Size Code" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. XL" required hint="Short code (XS, S, M, L, XL)" />
            <Input label="Label" name="label" value={formData.label} onChange={handleChange} placeholder="e.g. Extra Large" required />
            <Input label="Display Sequence" name="sequence" type="number" min="1" value={formData.sequence} onChange={handleChange} required hint="Controls sort order" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" loading={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editingSize ? "Update Size" : "Create Size"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Visual Size Sequence Chips ────────────────────────────── */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Active Size Progression
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {sortedSizes.filter(s => s.active).map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 font-mono shadow-2xs">
                {s.code}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Grid ─────────────────────────────────────────────── */}
      <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
        <DataCardHeader
          title="All Garment Sizes"
          subtitle="Sorted by production display sequence"
          count={sizes.length}
        />
        {loading ? (
          <SkeletonTable rows={6} cols={4} />
        ) : sizes.length === 0 ? (
          <EmptyState icon={<Layers className="h-5 w-5" />} title="No sizes defined" description="Add your first size to get started." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Seq</TableHead>
                  <TableHead className="w-32 text-slate-500 font-bold whitespace-nowrap">Size Code</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Full Label</TableHead>
                  <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right w-32 text-slate-500 font-bold whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSizes.map((s, index) => (
                  <motion.tr
                    key={s.id}
                    className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                  >
                    {/* Seq */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 border border-slate-200 text-slate-700">
                        #{s.sequence}
                      </span>
                    </TableCell>

                    {/* Size Code */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="font-mono font-extrabold text-slate-900 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-200 shadow-2xs">
                        {s.code}
                      </span>
                    </TableCell>

                    {/* Label */}
                    <TableCell className="align-middle text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {s.label}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <StatusBadge status={s.active ? "active" : "inactive"} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleSwitch
                          checked={s.active}
                          onChange={() => handleToggle(s.id)}
                          title={s.active ? "Click to deactivate" : "Click to activate"}
                        />
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Edit Size"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <span className="font-mono">{sizes.length} total sizes defined</span>
          <span className="text-slate-500">
            <strong className="text-emerald-700 font-mono">{sizes.filter(s => s.active).length} active</strong> · <strong className="text-slate-500 font-mono">{sizes.filter(s => !s.active).length} inactive</strong>
          </span>
        </div>
      </DataCard>
    
      {/* ── Activity History ──────────────────────────────────────── */}
      <RecentActivityLog entityType="SIZE" />
    </div>
  );
}
