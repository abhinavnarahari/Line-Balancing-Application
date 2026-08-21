import { useState, useEffect } from "react";
import { Plus, Search, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, DataCardHeader, EmptyState, StatusBadge, SkeletonTable } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

import { stylesApi, type Style, type CreateStyleDTO, type UpdateStyleDTO } from "../../features/styles/mockApi";
import { StyleForm } from "../../features/styles/StyleForm";

export function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  const loadStyles = async () => {
    setLoading(true);
    try {
      const data = await stylesApi.getStyles();
      setStyles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStyles(); }, []);

  const handleSubmit = async (data: CreateStyleDTO | UpdateStyleDTO) => {
    if (editingStyle) {
      await stylesApi.updateStyle(editingStyle.id, data);
    } else {
      await stylesApi.createStyle(data as CreateStyleDTO);
    }
    setIsFormOpen(false);
    setEditingStyle(null);
    loadStyles();
  };

  const handleToggle = async (id: string) => {
    await stylesApi.toggleActive(id);
    loadStyles();
  };

  const filteredStyles = styles.filter(s => 
    s.styleNo.toLowerCase().includes(search.toLowerCase()) || 
    s.buyer.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Production"
        title="Style Master"
        description="Maintain the catalog of styles and garments manufactured by the factory."
        action={
          !isFormOpen && (
            <Button onClick={() => { setEditingStyle(null); setIsFormOpen(true); }} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Style
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStyle(null); }}
        title={editingStyle ? "Edit Style" : "Create New Style"}
        subtitle="Style numbers must be unique across the catalog."
      >
        <StyleForm initialData={editingStyle} onSubmit={handleSubmit} onCancel={() => { setIsFormOpen(false); setEditingStyle(null); }} />
      </Modal>

      <DataCard noPad>
        <DataCardHeader 
          title="Style Catalog" 
          count={filteredStyles.length} 
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8270]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search styles..."
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#D0C8B4] text-[#26231D] placeholder-[#B8A898] w-64 focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 transition-all rounded-sm"
              />
            </div>
          }
        />
        
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : filteredStyles.length === 0 ? (
          <EmptyState title="No styles found" description="Try adjusting your search terms or create a new style." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Style No.</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Season</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStyles.map((style, index) => (
                <motion.tr
                  key={style.id}
                  className="group bg-white hover:bg-[#FBF8F3] border-b border-[#EDE8DF] last:border-0 transition-colors duration-100"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-[#B8763F] tracking-wide">{style.styleNo}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-[#1E1B16]">{style.buyer}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#26231D] truncate max-w-xs">{style.description}</span>
                      <span className="text-[10px] text-[#8A8270]">{style.productType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#6E6656]">{style.season}</TableCell>
                  <TableCell>
                    <StatusBadge status={style.active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="xs" onClick={() => { setEditingStyle(style); setIsFormOpen(true); }} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => handleToggle(style.id)} title={style.active ? "Deactivate" : "Activate"}>
                        {style.active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}
