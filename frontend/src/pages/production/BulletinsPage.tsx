import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  Clock, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Edit2, 
  Copy, 
  Trash2, 
  Eye, 
  Sliders
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, EmptyState, SkeletonTable } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";

import { bulletinsApi, type OperationBulletin, type CreateBulletinDTO, type BulletinStatus } from "../../features/bulletins/api";
import { BulletinForm } from "../../features/bulletins/BulletinForm";
import { BulletinDetailModal } from "../../features/bulletins/BulletinDetailModal";

import { stylesApi, type Style } from "../../features/styles/api";
import { operationsApi, type Operation } from "../../features/operations/api";

export function BulletinsPage() {
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BulletinStatus>("ALL");
  const [styleFilter, setStyleFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"CREATED_DESC" | "CODE_ASC" | "SMV_DESC" | "SMV_ASC">("CREATED_DESC");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<OperationBulletin | null>(null);
  const [viewingBulletin, setViewingBulletin] = useState<OperationBulletin | null>(null);
  const [cloningBulletin, setCloningBulletin] = useState<OperationBulletin | null>(null);
  const [cloneCode, setCloneCode] = useState("");
  const [cloneName, setCloneName] = useState("");
  const [deletingBulletin, setDeletingBulletin] = useState<OperationBulletin | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bulData, styleData, opData] = await Promise.all([
        bulletinsApi.getBulletins(),
        stylesApi.getStyles(),
        operationsApi.getOperations(),
      ]);
      setBulletins(bulData || []);
      setStyles(styleData || []);
      setOperations(opData || []);
    } catch (e) {
      console.error("Failed to load bulletin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Executive KPI Aggregations
  const kpis = useMemo(() => {
    const total = bulletins.length;
    const published = bulletins.filter(b => b.status === "PUBLISHED").length;
    const drafts = bulletins.filter(b => b.status === "DRAFT").length;
    const archived = bulletins.filter(b => b.status === "ARCHIVED").length;
    
    const totalSmvSum = bulletins.reduce((acc, b) => acc + (Number(b.totalSmv) || 0), 0);
    const avgSmv = total > 0 ? (totalSmvSum / total).toFixed(2) : "0.00";
    const avgSmvSec = total > 0 ? ((totalSmvSum * 60) / total).toFixed(1) : "0.0";

    const linkedStyleSet = new Set<string>();
    bulletins.forEach(b => {
      (b.styles || []).forEach(s => linkedStyleSet.add(String(s.id)));
    });

    return {
      total,
      published,
      drafts,
      archived,
      avgSmv,
      avgSmvSec,
      linkedStylesCount: linkedStyleSet.size,
    };
  }, [bulletins]);

  // Filter & Sort Pipeline
  const filteredBulletins = useMemo(() => {
    return bulletins
      .filter(b => {
        // Status filter
        if (statusFilter !== "ALL" && b.status !== statusFilter) return false;

        // Style filter
        if (styleFilter !== "ALL") {
          const hasStyle = (b.styles || []).some(s => String(s.id) === styleFilter);
          if (!hasStyle) return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchCode = b.bulletinCode?.toLowerCase().includes(q);
          const matchName = b.name?.toLowerCase().includes(q);
          const matchDesc = b.description?.toLowerCase().includes(q);
          const matchStyles = (b.styles || []).some(s => s.styleNo?.toLowerCase().includes(q) || s.buyer?.toLowerCase().includes(q));
          const matchOps = (b.lines || []).some(l => l.operationName?.toLowerCase().includes(q) || l.operationCode?.toLowerCase().includes(q));

          if (!matchCode && !matchName && !matchDesc && !matchStyles && !matchOps) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "CODE_ASC") return a.bulletinCode.localeCompare(b.bulletinCode);
        if (sortBy === "SMV_DESC") return (Number(b.totalSmv) || 0) - (Number(a.totalSmv) || 0);
        if (sortBy === "SMV_ASC") return (Number(a.totalSmv) || 0) - (Number(b.totalSmv) || 0);
        // Default: CREATED_DESC
        const dA = new Date(a.createdAt || 0).getTime();
        const dB = new Date(b.createdAt || 0).getTime();
        return dB - dA;
      });
  }, [bulletins, statusFilter, styleFilter, search, sortBy]);

  // Create or Update Bulletin Submit
  const handleFormSubmit = async (data: CreateBulletinDTO) => {
    try {
      if (editingBulletin && editingBulletin.id) {
        await bulletinsApi.updateBulletin(editingBulletin.id, data);
        showToast(`✓ Operation Bulletin '${data.bulletinCode}' updated successfully`);
      } else {
        await bulletinsApi.createBulletin(data);
        showToast(`✓ Operation Bulletin '${data.bulletinCode}' created successfully`);
      }
      setIsFormOpen(false);
      setEditingBulletin(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to save bulletin:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to save operation bulletin"}`);
    }
  };

  // Quick Status Change
  const handleStatusChange = async (id: string | number, newStatus: any) => {
    try {
      await bulletinsApi.updateStatus(id, newStatus);
      showToast(`✓ Status updated to ${newStatus}`);
      await loadData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to update status"}`);
    }
  };

  // Clone Bulletin Action
  const handleExecuteClone = async () => {
    if (!cloningBulletin || !cloningBulletin.id) return;
    try {
      const cloned = await bulletinsApi.cloneBulletin(cloningBulletin.id, cloneCode, cloneName);
      showToast(`✓ Cloned as '${cloned.bulletinCode}' (v${cloned.version})`);
      setCloningBulletin(null);
      setCloneCode("");
      setCloneName("");
      loadData();
    } catch (err) {
      console.error("Clone failed:", err);
      showToast("Failed to clone bulletin");
    }
  };

  // Delete Bulletin Action
  const handleExecuteDelete = async () => {
    if (!deletingBulletin || !deletingBulletin.id) return;
    try {
      await bulletinsApi.deleteBulletin(deletingBulletin.id);
      showToast(`✓ Deleted bulletin '${deletingBulletin.bulletinCode}'`);
      setDeletingBulletin(null);
      if (viewingBulletin?.id === deletingBulletin.id) setViewingBulletin(null);
      loadData();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete bulletin");
    }
  };

  // Export Entire Bulletin Library to Excel
  const handleExportAllExcel = () => {
    const rows = filteredBulletins.map(b => ({
      "Bulletin Code": b.bulletinCode,
      "Name": b.name,
      "Version": `v${b.version}`,
      "Status": b.status,
      "Total SMV (sec)": Number(((b.totalSmv || 0) * 60).toFixed(1)),
      "Total SMV (min)": Number((b.totalSmv || 0).toFixed(2)),
      "Total Operations": b.lines?.length || 0,
      "Linked Styles": (b.styles || []).map(s => s.styleNo).join(", ") || "None",
      "Created At": b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—",
      "Description": b.description || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bulletins Library");
    XLSX.writeFile(wb, `Operation_Bulletins_Summary_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 w-full p-4 sm:p-6 lg:p-8 font-sans bg-[#F6F1E8] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#221912] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Page Header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Industrial Engineering"
        title="Operation Bulletins"
        description="Standard garment operation routing, machine assignments, SMVs, and theoretical line pace engineering."
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportAllExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Library</span>
            </button>

            <Button 
              onClick={() => {
                setEditingBulletin(null);
                setIsFormOpen(true);
              }} 
              size="md" 
              className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white shadow-sm shadow-[#9C5B3C]/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Operation Bulletin
            </Button>
          </div>
        }
      />

      {/* ── 2. Executive KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total Bulletins
          </span>
          <p className="text-3xl font-black font-mono text-[#221912] mt-1">{kpis.total}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8C7E6E] font-medium">
            <span className="text-emerald-700 font-bold">{kpis.published} published</span> · <span>{kpis.drafts} drafts</span>
          </div>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active on Floor
          </span>
          <p className="text-3xl font-black font-mono text-emerald-700 mt-1">{kpis.published}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-1 font-medium">
            Ready for Line Balancing
          </p>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C5B3C] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Average Total SMV
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-[#9C5B3C]">{kpis.avgSmvSec}</span>
            <span className="text-xs text-[#8C7E6E] font-bold font-mono">sec</span>
          </div>
          <p className="text-[11px] text-[#8C7E6E] mt-1 font-medium">
            Standard work content average ({kpis.avgSmv} min)
          </p>
        </div>

        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-indigo-600" /> Styles Covered
          </span>
          <p className="text-3xl font-black font-mono text-indigo-700 mt-1">{kpis.linkedStylesCount}</p>
          <p className="text-[11px] text-[#8C7E6E] mt-1 font-medium">
            Styles mapped to bulletins
          </p>
        </div>
      </div>

      {/* ── 3. Main Library Workspace Card ───────────────────────────── */}
      <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
        
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 bg-[#FDFCFB] border-b border-[#E6DDCE] flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8C7E6E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, name, style, operation..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-medium text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE]">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-[#221912] text-white shadow-2xs"
                    : "text-[#8C7E6E] hover:text-[#221912]"
                }`}
              >
                All ({kpis.total})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("PUBLISHED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === "PUBLISHED"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                <span>Published</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                  {kpis.published}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === "DRAFT"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <span>Drafts</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
                  {kpis.drafts}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("ARCHIVED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "ARCHIVED"
                    ? "bg-slate-700 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Archived
              </button>
            </div>

            {/* Style Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#8C7E6E] hidden sm:inline">Style:</span>
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
              >
                <option value="ALL">All Garment Styles</option>
                {styles.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.styleNo} {s.buyer ? `(${s.buyer})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#8C7E6E] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] shadow-2xs"
              >
                <option value="CREATED_DESC">Latest First</option>
                <option value="CODE_ASC">Code (A to Z)</option>
                <option value="SMV_DESC">SMV (High to Low)</option>
                <option value="SMV_ASC">SMV (Low to High)</option>
              </select>
            </div>

          </div>

          <div className="text-xs font-bold text-[#8C7E6E]">
            Showing <strong className="text-[#221912]">{filteredBulletins.length}</strong> of {bulletins.length} bulletins
          </div>
        </div>

        {/* ── Table Content ────────────────────────────────────────── */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : filteredBulletins.length === 0 ? (
          <EmptyState 
            icon={<FileText className="h-8 w-8 text-[#8C7E6E]" />} 
            title="No Operation Bulletins Found" 
            description={search ? "No bulletins match your active search filters." : "Create your first operation bulletin to start engineering sequential routing."} 
            action={
              !search && (
                <Button onClick={() => { setEditingBulletin(null); setIsFormOpen(true); }} size="sm" className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Bulletin
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6DDCE] bg-[#F9F7F4] text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                  <th className="py-4 px-6 w-36">Bulletin Code</th>
                  <th className="py-4 px-4 min-w-[220px]">Bulletin Name &amp; Description</th>
                  <th className="py-4 px-4 min-w-[180px]">Linked Garment Styles</th>
                  <th className="py-4 px-4 w-32 text-right">Total SMV (sec)</th>
                  <th className="py-4 px-4 w-28 text-center">Operations</th>
                  <th className="py-4 px-4 w-28 text-center">Status</th>
                  <th className="py-4 px-6 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDCE]">
                {filteredBulletins.map((bulletin, index) => {
                  const lineCount = bulletin.lines?.length || 0;
                  const totalSmv = Number(bulletin.totalSmv) || 0;

                  return (
                    <motion.tr
                      key={bulletin.id}
                      className="hover:bg-[#FFFDFB] transition-colors group cursor-pointer"
                      onClick={() => setViewingBulletin(bulletin)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.15 }}
                    >
                      {/* 1. Code & Version */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono text-xs font-black text-[#9C5B3C] bg-[#F6F1E8] px-2.5 py-0.5 rounded-lg border border-[#E6DDCE]">
                            {bulletin.bulletinCode}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#8C7E6E] px-1.5 py-0.2 bg-slate-100 rounded">
                            v{bulletin.version}
                          </span>
                        </div>
                      </td>

                      {/* 2. Name & Description */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-xs text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                          {bulletin.name}
                        </div>
                        {bulletin.description ? (
                          <div className="text-[11px] text-[#8C7E6E] mt-0.5 line-clamp-1">
                            {bulletin.description}
                          </div>
                        ) : (
                          <div className="text-[10.5px] text-[#8C7E6E] italic mt-0.5">
                            Created {bulletin.createdAt ? new Date(bulletin.createdAt).toLocaleDateString() : "recently"}
                          </div>
                        )}
                      </td>

                      {/* 3. Linked Styles */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(bulletin.styles || []).slice(0, 3).map(style => (
                            <span 
                              key={style.id} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] border border-[#E6DDCE] text-[10.5px] font-mono font-bold text-[#8C7E6E]"
                              title={style.buyer ? `Buyer: ${style.buyer}` : style.styleNo}
                            >
                              <span>{style.styleNo}</span>
                            </span>
                          ))}
                          {(bulletin.styles || []).length > 3 && (
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-[#F6F1E8] border border-[#E6DDCE] text-[10px] font-mono font-bold text-[#8C7E6E]">
                              +{(bulletin.styles || []).length - 3} more
                            </span>
                          )}
                          {(!bulletin.styles || bulletin.styles.length === 0) && (
                            <span className="text-[11px] text-[#8C7E6E] italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Total SMV */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono font-black text-sm text-[#221912]">
                          {(totalSmv * 60).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-[#8C7E6E] ml-1 font-mono font-bold">sec</span>
                        <span className="text-[9.5px] text-[#8C7E6E] block font-mono">
                          ({totalSmv.toFixed(2)} min)
                        </span>
                      </td>

                      {/* 5. Operation Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {lineCount}
                        </span>
                      </td>

                      {/* 6. Status Dropdown / Quick Switch */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={bulletin.status}
                          onChange={(e) => handleStatusChange(bulletin.id!, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-colors shadow-2xs focus:outline-none ${
                            bulletin.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : bulletin.status === 'ARCHIVED'
                              ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Click to toggle or change bulletin status"
                        >
                          <option value="DRAFT">● DRAFT</option>
                          <option value="PUBLISHED">● PUBLISHED</option>
                          <option value="ARCHIVED">● ARCHIVED</option>
                        </select>
                      </td>

                      {/* 7. Action Triggers */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingBulletin(bulletin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#9C5B3C] hover:bg-[#F6F1E8] transition-colors cursor-pointer"
                            title="View Full Industrial Engineering Bulletin"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingBulletin(bulletin);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#9C5B3C] hover:bg-[#F6F1E8] transition-colors cursor-pointer"
                            title="Edit Bulletin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCloningBulletin(bulletin);
                              setCloneCode(`${bulletin.bulletinCode}-COPY`);
                              setCloneName(`${bulletin.name} (Copy)`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Clone / Duplicate Bulletin"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/line-balance?bulletinId=${bulletin.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Open in Line Balancing"
                          >
                            <Sliders className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeletingBulletin(bulletin)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Bulletin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>

      {/* ── 4. Modals & Drawers ──────────────────────────────────────── */}

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBulletin(null);
        }}
        title={editingBulletin ? `Edit Bulletin: ${editingBulletin.bulletinCode}` : "Create Operation Bulletin"}
        subtitle="Define the sequential routing, machine assignments, and SMV engineering."
        className="max-w-5xl"
      >
        <BulletinForm 
          styles={styles} 
          operations={operations} 
          existingBulletins={bulletins}
          initialData={editingBulletin}
          onSubmit={handleFormSubmit} 
          onCancel={() => {
            setIsFormOpen(false);
            setEditingBulletin(null);
          }} 
        />
      </Modal>

      {/* Detail Viewer Modal */}
      <BulletinDetailModal
        bulletin={viewingBulletin}
        isOpen={!!viewingBulletin}
        onClose={() => setViewingBulletin(null)}
        onEdit={(b) => {
          setViewingBulletin(null);
          setEditingBulletin(b);
          setIsFormOpen(true);
        }}
        onClone={(b) => {
          setViewingBulletin(null);
          setCloningBulletin(b);
          setCloneCode(`${b.bulletinCode}-COPY`);
          setCloneName(`${b.name} (Copy)`);
        }}
        onDelete={(b) => {
          setDeletingBulletin(b);
        }}
        onRefresh={loadData}
      />

      {/* Clone Confirmation Modal */}
      <Modal
        isOpen={!!cloningBulletin}
        onClose={() => setCloningBulletin(null)}
        title="Clone Operation Bulletin"
        subtitle={cloningBulletin ? `Duplicating ${cloningBulletin.bulletinCode}` : ""}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-[#8C7E6E]">New Bulletin Code</label>
              <input
                type="text"
                value={cloneCode}
                onChange={(e) => setCloneCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-mono font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                placeholder="e.g. OB-POLO-002"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-[#8C7E6E]">New Bulletin Name</label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                placeholder="e.g. Polo Short Sleeve Flow (Revised)"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6DDCE]">
            <Button type="button" variant="ghost" onClick={() => setCloningBulletin(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleExecuteClone} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Confirm &amp; Clone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBulletin}
        onClose={() => setDeletingBulletin(null)}
        title="Delete Operation Bulletin"
        subtitle="Permanent removal confirmation"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8C7E6E]">
            Are you sure you want to delete <strong className="text-[#221912]">{deletingBulletin?.bulletinCode}</strong> ({deletingBulletin?.name})? This action will permanently remove all {deletingBulletin?.lines?.length || 0} sequential operations.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6DDCE]">
            <Button type="button" variant="ghost" onClick={() => setDeletingBulletin(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleExecuteDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
              Yes, Delete Bulletin
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
