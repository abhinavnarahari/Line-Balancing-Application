import { useState } from "react";
import { Search, Edit2, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { StatusBadge, DataCard, SkeletonTable, EmptyState } from "../../components/ui/PremiumUI";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import type { SewingLine } from "./api";

interface LineListProps {
  lines: SewingLine[];
  loading?: boolean;
  onEdit: (line: SewingLine) => void;
  onDelete: (id: string | number, lineName: string) => void;
  onToggleActive: (id: string | number) => void;
}

export function LineList({ lines, loading, onEdit, onDelete, onToggleActive }: LineListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = lines.filter((line) => {
    const matchesSearch =
      line.lineCode.toLowerCase().includes(search.toLowerCase()) ||
      line.lineName.toLowerCase().includes(search.toLowerCase()) ||
      (line.supervisorName && line.supervisorName.toLowerCase().includes(search.toLowerCase())) ||
      (line.floor && line.floor.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "all" || (filter === "active" && line.active) || (filter === "inactive" && !line.active);
    return matchesSearch && matchesFilter;
  });

  return (
    <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* Toolbar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Sewing Line Master</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical production lines configured across factory floors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by line code, name, supervisor…"
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
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

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={11} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No sewing lines found" description="Create a new physical line to begin line balancing." />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[960px]">
            <TableHeader>
              <TableRow className="bg-slate-50/90 border-b border-slate-200">
                <TableHead className="w-24 text-slate-500 font-bold whitespace-nowrap">Line Code</TableHead>
                <TableHead className="min-w-[150px] text-slate-500 font-bold whitespace-nowrap">Line Name / Description</TableHead>
                <TableHead className="min-w-[120px] text-slate-500 font-bold whitespace-nowrap">Floor / Location</TableHead>
                <TableHead className="min-w-[110px] text-slate-500 font-bold whitespace-nowrap">Supervisor</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Operators</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Machines</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Hours</TableHead>
                <TableHead className="w-24 text-center text-slate-500 font-bold whitespace-nowrap">Capacity/Day</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Target Eff</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right w-24 text-slate-500 font-bold whitespace-nowrap pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((line, index) => (
                <motion.tr
                  key={line.id}
                  className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                >
                  <TableCell className="align-middle whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      {line.lineCode}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle whitespace-nowrap font-bold text-slate-900 text-xs sm:text-sm">
                    {line.lineName}
                  </TableCell>
                  <TableCell className="align-middle text-xs font-medium text-slate-600 whitespace-nowrap">
                    {line.floor || "—"}
                  </TableCell>
                  <TableCell className="align-middle text-xs font-semibold text-slate-800 whitespace-nowrap">
                    {line.supervisorName || "—"}
                  </TableCell>
                  <TableCell className="text-center align-middle font-mono text-xs font-bold text-indigo-700 whitespace-nowrap">
                    <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {line.operatorCount || 0} Ops
                    </span>
                  </TableCell>
                  <TableCell className="text-center align-middle font-mono text-xs font-bold text-sky-700 whitespace-nowrap">
                    <span className="bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                      {line.machineCount || 0} Mc
                    </span>
                  </TableCell>
                  <TableCell className="text-center align-middle font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {Number(line.workingHours || 8).toFixed(1)} hrs
                  </TableCell>
                  <TableCell className="text-center align-middle font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">
                      {(line.capacityPerDay || 0).toLocaleString()} pcs
                    </span>
                  </TableCell>
                  <TableCell className="text-center align-middle font-mono text-xs font-bold text-emerald-700 whitespace-nowrap">
                    {line.targetEfficiencyPercent}%
                  </TableCell>
                  <TableCell className="text-center align-middle whitespace-nowrap">
                    <StatusBadge status={line.active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right align-middle whitespace-nowrap pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(line)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                        title="Edit Sewing Line"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(line.id, line.lineName)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer shadow-2xs"
                        title="Delete Sewing Line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ToggleSwitch
                        checked={line.active}
                        onChange={() => onToggleActive(line.id)}
                        title={line.active ? "Deactivate line" : "Activate line"}
                      />
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DataCard>
  );
}
