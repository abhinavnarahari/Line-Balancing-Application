import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit2, X } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, EmptyState, StatusBadge, SkeletonTable, RecentActivityLog } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { stylesApi, type Style, type CreateStyleDTO, type UpdateStyleDTO } from "../../features/styles/api";
import { StyleForm } from "../../features/styles/StyleForm";
import { exportToExcel, readFromExcel } from "../../utils/excel";
import { notifyMasterDataUpdated, useMasterDataSubscription } from "../../utils/masterDataEvents";

export function StylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [buyerFilter, setBuyerFilter] = useState<string>("ALL");
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

  useEffect(() => {
    loadStyles();
  }, []);

  useMasterDataSubscription(["style", "all"], loadStyles);

  // Distinct buyers
  const distinctBuyers = useMemo(() => {
    return Array.from(new Set(styles.map(s => s.buyer).filter(Boolean))).sort();
  }, [styles]);

  const handleSubmit = async (data: CreateStyleDTO | UpdateStyleDTO) => {
    if (editingStyle) {
      await stylesApi.updateStyle(editingStyle.id, data);
    } else {
      await stylesApi.createStyle(data as CreateStyleDTO);
    }
    setIsFormOpen(false);
    setEditingStyle(null);
    notifyMasterDataUpdated("style");
    loadStyles();
  };

  const handleToggle = async (id: string | number) => {
    await stylesApi.toggleActive(id);
    notifyMasterDataUpdated("style");
    loadStyles();
  };

  const handleExport = () => {
    const data = styles.map(s => ({
      "Style No": s.styleNo,
      "Buyer": s.buyer,
      "Description": s.description,
      "Product Type": s.productType,
      "Season": s.season,
      "Status": s.active ? "Active" : "Inactive"
    }));
    exportToExcel(data, `Style_Catalog_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        await stylesApi.createStyle({
          styleNo: row["Style No"],
          buyer: row["Buyer"],
          description: row["Description"] || "",
          productType: row["Product Type"] || "",
          season: row["Season"] || "",
          active: row["Status"] === "Active"
        });
      }
      await loadStyles();
      alert("Styles imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import styles. Please verify Excel column headers.");
    }
  };

  const filteredStyles = useMemo(() => {
    return styles.filter(s => {
      if (statusFilter === "active" && !s.active) return false;
      if (statusFilter === "inactive" && s.active) return false;
      if (buyerFilter !== "ALL" && s.buyer !== buyerFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.styleNo.toLowerCase().includes(q) ||
        (s.buyer && s.buyer.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.productType && s.productType.toLowerCase().includes(q))
      );
    });
  }, [styles, statusFilter, buyerFilter, search]);

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Commercial Catalog"
        title="Style & Garment Catalog"

        action={
          !isFormOpen && (
            <Button
              onClick={() => { setEditingStyle(null); setIsFormOpen(true); }}
              size="md"
              className="bg-[#9C5B3C] hover:bg-[#854D33] text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Style
            </Button>
          )
        }
      />

      {/* ── Modal Form ────────────────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStyle(null); }}
        title={editingStyle ? "Edit Garment Style" : "Create New Style Reference"}
        subtitle="Style numbers must be unique across the catalog."
      >
        <StyleForm 
          existingStyles={styles}
          initialData={editingStyle} 
          onSubmit={handleSubmit} 
          onCancel={() => { setIsFormOpen(false); setEditingStyle(null); }} 
        />
      </Modal>

      {/* ── Data Grid ─────────────────────────────────────────────── */}
      <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Style Catalog</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FAF7F2] text-[#9C5B3C] border border-[#E6DDCE]">
                {filteredStyles.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Production style definitions linked with Operation Bulletins
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                    statusFilter === f
                      ? "bg-[#9C5B3C] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Buyer Selector */}
            {distinctBuyers.length > 0 && (
              <select
                value={buyerFilter}
                onChange={e => setBuyerFilter(e.target.value)}
                className="h-8.5 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Buyers ({distinctBuyers.length})</option>
                {distinctBuyers.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search style no, buyer…"
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : filteredStyles.length === 0 ? (
          <EmptyState title="No styles found" description="Try adjusting your search criteria or register a new style." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-36 text-slate-500 font-bold whitespace-nowrap">Style Reference</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Buyer / Brand</TableHead>
                  <TableHead className="text-slate-500 font-bold whitespace-nowrap">Garment Description</TableHead>
                  <TableHead className="w-32 text-slate-500 font-bold whitespace-nowrap">Product Type</TableHead>
                  <TableHead className="w-28 text-slate-500 font-bold whitespace-nowrap">Season</TableHead>
                  <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right w-28 text-slate-500 font-bold whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStyles.map((style, index) => (
                  <motion.tr
                    key={style.id}
                    className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015, duration: 0.2 }}
                  >
                    {/* Style No */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {style.styleNo}
                      </span>
                    </TableCell>

                    {/* Buyer */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="font-bold text-xs text-slate-900">
                        {style.buyer || "—"}
                      </span>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="align-middle">
                      <span className="text-xs text-slate-700 font-medium line-clamp-1">
                        {style.description || "—"}
                      </span>
                    </TableCell>

                    {/* Product Type */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                        {style.productType || "Garment"}
                      </span>
                    </TableCell>

                    {/* Season */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                        {style.season || "Core"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <StatusBadge status={style.active ? "active" : "inactive"} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleSwitch
                          checked={style.active}
                          onChange={() => handleToggle(style.id)}
                          title={style.active ? "Click to deactivate" : "Click to activate"}
                        />
                        <button
                          type="button"
                          onClick={() => { setEditingStyle(style); setIsFormOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Edit Style"
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
          <span className="font-mono">
            Showing {filteredStyles.length} of {styles.length} styles
          </span>
          <span className="text-slate-500">
            <strong className="text-emerald-700 font-mono">{styles.filter(s => s.active).length} active</strong> · <strong className="text-slate-500 font-mono">{styles.filter(s => !s.active).length} inactive</strong>
          </span>
        </div>
      </DataCard>
    
      {/* ── Activity History ──────────────────────────────────────── */}
      <RecentActivityLog entityType="STYLE" />
    </div>
  );
}
