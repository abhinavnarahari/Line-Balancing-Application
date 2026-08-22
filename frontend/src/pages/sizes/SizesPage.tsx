import { useState, useEffect } from "react";
import { Plus, Edit2, Layers } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader, DataCard, DataCardHeader, EmptyState, SkeletonTable, StatusBadge, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { sizesApi, type Size } from "../../features/sizes/api";

export function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ code: "", label: "", sequence: 1, active: true });

  useEffect(() => { loadSizes(); }, []);

  const loadSizes = async () => {
    setLoading(true);
    try { setSizes(await sizesApi.getSizes()); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingSize(null);
    setFormData({ code: "", label: "", sequence: sizes.length + 1, active: true });
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
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string | number) => {
    await sizesApi.toggleActive(id);
    await loadSizes();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "number" ? parseInt(value) : value }));
  };

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Masters"
        title="Size Master"
        description="Configure all garment size codes. Sizes must not be hard-coded — they come from here."
        action={
          !isFormOpen && (
            <Button onClick={openCreate} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Size
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSize ? "Edit Size" : "Add New Size"}
        subtitle="Size codes are used in order details and bulletins."
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Input label="Size Code" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. XL" required hint="Short code used in orders" />
            <Input label="Label" name="label" value={formData.label} onChange={handleChange} placeholder="e.g. Extra Large" required />
            <Input label="Display Sequence" name="sequence" type="number" min="1" value={formData.sequence} onChange={handleChange} required hint="Controls sort order" />
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-[#F0EAE0]">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>
              {editingSize ? "Update Size" : "Create Size"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Size chips — visual reference row */}
      <div className="flex flex-wrap gap-2">
        {sizes.filter(s => s.active).sort((a, b) => a.sequence - b.sequence).map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-2 bg-white border border-[#E6DDCE] rounded-sm text-sm font-semibold text-[#221912] shadow-sm"
          >
            {s.code}
          </motion.div>
        ))}
      </div>

      {/* Main table */}
      <DataCard noPad>
        <DataCardHeader
          title="All Sizes"
          subtitle="Sorted by display sequence"
          count={sizes.length}
        />
        {loading ? (
          <SkeletonTable rows={6} cols={4} />
        ) : sizes.length === 0 ? (
          <EmptyState icon={<Layers className="h-5 w-5" />} title="No sizes defined" description="Add your first size to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Seq</TableHead>
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sizes].sort((a, b) => a.sequence - b.sequence).map((s, index) => (
                <motion.tr
                  key={s.id}
                  className="group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.22 }}
                >
                  <TableCell className="font-mono text-xs text-[#8C7E6E]">{s.sequence}</TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-[#221912] text-base tracking-widest">
                      {s.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#221912]">{s.label}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(s)} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <ToggleSwitch
                        checked={s.active}
                        onChange={() => handleToggle(s.id)}
                      />
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="px-5 py-2.5 border-t border-[#F0EAE0] bg-[#FAFAF8] flex justify-between">
          <span className="text-[11px] text-[#8C7E6E] font-mono">{sizes.length} total sizes</span>
          <span className="text-[11px] text-[#8C7E6E]">{sizes.filter(s => s.active).length} active</span>
        </div>
      </DataCard>

      <RecentActivityLog />
    </div>
  );
}
