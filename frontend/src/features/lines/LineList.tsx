import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Sliders, 
  Eye, 
  LayoutGrid, 
  List
} from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { DataCard, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import type { SewingLine } from "./api";
import { LINE_TYPES } from "./api";

interface LineListProps {
  lines: SewingLine[];
  loading?: boolean;
  onInspect: (line: SewingLine) => void;
  onEdit: (line: SewingLine) => void;
  onDelete: (id: string | number, lineName: string) => void;
  onToggleActive: (id: string | number) => void;
}

export const LineList: React.FC<LineListProps> = ({
  lines,
  loading,
  onInspect,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const filtered = lines.filter((line) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      line.lineCode.toLowerCase().includes(q) ||
      line.lineName.toLowerCase().includes(q) ||
      (line.supervisorName && line.supervisorName.toLowerCase().includes(q)) ||
      (line.ieInCharge && line.ieInCharge.toLowerCase().includes(q)) ||
      (line.floor && line.floor.toLowerCase().includes(q)) ||
      (line.currentStyle && line.currentStyle.toLowerCase().includes(q)) ||
      (line.department && line.department.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && line.active) ||
      (statusFilter === "INACTIVE" && !line.active);

    const matchesType =
      typeFilter === "ALL" || line.lineType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      
      {/* ── Toolbar Header ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Sewing Line Master Repository</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FAF7F2] text-[#9C5B3C] border border-[#E6DDCE]">
              {filtered.length} lines
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial apparel production lines, layout types, manpower allocation &amp; capacities
          </p>
        </div>

        {/* Filters & View Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Status Segmented Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                  statusFilter === s
                    ? "bg-[#9C5B3C] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "All" : s.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Line Type Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 bg-white border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Line Types</option>
              {LINE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, supervisor…"
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

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-[#9C5B3C] text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "cards" ? "bg-[#9C5B3C] text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visual Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Content View ────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonTable rows={5} cols={10} />
      ) : filtered.length === 0 ? (
        <EmptyState 
          title="No Sewing Lines Found" 
          description={search ? "No sewing lines match your active search filters." : "Create your first commercial sewing line to start line balancing."} 
        />
      ) : viewMode === "table" ? (
        /* ── TABLE VIEW ─────────────────────────────────────────────── */
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[1020px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200">
                <TableHead className="w-28 text-slate-500 font-bold whitespace-nowrap">Line Code</TableHead>
                <TableHead className="min-w-[180px] text-slate-500 font-bold whitespace-nowrap">Line Name</TableHead>
                <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Manpower</TableHead>
                <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Machines</TableHead>
                <TableHead className="w-32 text-center text-slate-500 font-bold whitespace-nowrap">Daily Capacity</TableHead>
                <TableHead className="w-24 text-center text-slate-500 font-bold whitespace-nowrap">Target Eff</TableHead>
                <TableHead className="min-w-[140px] text-slate-500 font-bold whitespace-nowrap">Floor Supervisor</TableHead>
                <TableHead className="min-w-[140px] text-slate-500 font-bold whitespace-nowrap">Active Style</TableHead>
                <TableHead className="text-right w-28 text-slate-500 font-bold whitespace-nowrap pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((line, index) => {
                const totalManpower = (line.operatorCount || 0) + (line.helperCount || 0);

                return (
                  <motion.tr
                    key={line.id}
                    className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.15 }}
                  >
                    {/* Line Code */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#9C5B3C] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E6DDCE] shadow-2xs inline-block">
                        {line.lineCode}
                      </span>
                    </TableCell>

                    {/* Name */}
                    <TableCell className="align-middle">
                      <span 
                        onClick={() => onInspect(line)}
                        className="font-bold text-sm text-slate-900 group-hover:text-[#9C5B3C] cursor-pointer transition-colors block"
                      >
                        {line.lineName}
                      </span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <StatusBadge status={line.active ? "active" : "inactive"} />
                    </TableCell>

                    {/* Manpower */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                          {totalManpower} <span className="text-[10px] text-slate-400 font-normal font-sans">Ops</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">
                          ({line.operatorCount} + {line.helperCount} float)
                        </span>
                      </div>
                    </TableCell>

                    {/* Machines */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E6DDCE] text-xs font-mono font-bold text-[#221912] shadow-2xs inline-block">
                        {line.machineCount} Mc
                      </span>
                    </TableCell>

                    {/* Capacity */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-xs sm:text-sm text-emerald-900">
                          {(line.capacityPerDay || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal font-sans">pcs</span>
                        </span>
                        <span className="text-[10px] text-[#9C5B3C] font-mono font-medium">
                          ~{Math.round((line.capacityPerDay || 0) / Number(line.workingHours || 8))} pcs/hr
                        </span>
                      </div>
                    </TableCell>

                    {/* Target Efficiency */}
                    <TableCell className="text-center align-middle whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 font-mono">
                        {line.targetEfficiencyPercent}%
                      </span>
                    </TableCell>

                    {/* Supervisor */}
                    <TableCell className="align-middle whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 block">{line.supervisorName || "—"}</span>
                        <span className="text-[10.5px] text-slate-500 block">IE: {line.ieInCharge || "Priya Sharma"}</span>
                      </div>
                    </TableCell>

                    {/* Active Style */}
                    <TableCell className="align-middle whitespace-nowrap">
                      {line.currentStyle ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[130px] block">{line.currentStyle}</span>
                          <span className="text-[10.5px] font-mono text-slate-500 block">{line.currentBulletin || "OB-POLO-800"}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No active style</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right align-middle whitespace-nowrap pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleSwitch
                          checked={line.active}
                          onChange={() => onToggleActive(line.id)}
                          title={line.active ? "Pause / deactivate line" : "Activate line in production"}
                        />

                        <button
                          type="button"
                          onClick={() => onInspect(line)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="View Line Blueprint & Telemetry"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          to={`/line-balance?lineId=${line.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#9C5B3C] hover:bg-[#FAF7F2] border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Open in Line Balancing Cockpit"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => onEdit(line)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Edit Sewing Line Configuration"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(line.id, line.lineName)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Delete Sewing Line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* ── CARDS VIEW (Visual Floor Layout) ─────────────────────────── */
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
          {filtered.map((line) => {
            const totalManpower = (line.operatorCount || 0) + (line.helperCount || 0);

            return (
              <div
                key={line.id}
                className="bg-white border border-slate-200 hover:border-[#9C5B3C]/60 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Top Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#9C5B3C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-lg border border-[#E6DDCE]">
                      {line.lineCode}
                    </span>

                    <StatusBadge status={line.active ? "active" : "inactive"} />
                  </div>

                  <h4 
                    onClick={() => onInspect(line)}
                    className="font-bold text-sm text-slate-900 hover:text-[#9C5B3C] cursor-pointer transition-colors line-clamp-1"
                  >
                    {line.lineName}
                  </h4>

                  {line.department && (
                    <p className="text-xs text-slate-500 font-medium">
                      {line.department}
                    </p>
                  )}
                </div>

                {/* Capacity & Sizing Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Manpower</span>
                    <div className="font-mono font-bold text-xs text-[#9C5B3C]">{totalManpower} Ops</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Machines</span>
                    <div className="font-mono font-bold text-xs text-slate-800">{line.machineCount} Mc</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Target Output</span>
                    <div className="font-mono font-bold text-xs text-emerald-800">{(line.capacityPerDay || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Personnel Footer & Balancing Shortcut */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500">Supervisor: </span>
                    <strong className="text-slate-900">{line.supervisorName || "—"}</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onInspect(line)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Inspect Line"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(line)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Line"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <Link to={`/line-balance?lineId=${line.id}`}>
                      <button type="button" className="bg-[#9C5B3C] hover:bg-[#854B31] text-white text-xs font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer">
                        <Sliders className="w-3 h-3" />
                        <span>Balance</span>
                      </button>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Table Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
        <span className="font-mono">
          Showing {filtered.length} of {lines.length} lines
        </span>
        <span className="text-slate-500">
          <strong className="text-emerald-700 font-mono">{lines.filter(l => l.active).length} active</strong> · <strong className="text-slate-500 font-mono">{lines.filter(l => !l.active).length} inactive</strong>
        </span>
      </div>

    </DataCard>
  );
};
