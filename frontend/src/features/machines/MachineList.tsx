import { useState } from "react";
import { Search, Cpu, X, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { StatusBadge, DataCard, SkeletonTable, EmptyState } from "../../components/ui/PremiumUI";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import type { Machine, MachineStatus } from "./api";
import type { SewingLine } from "../lines/api";

interface MachineListProps {
  machines: Machine[];
  lines: SewingLine[];
  loading?: boolean;
  onEdit: (machine: Machine) => void;
  onToggleActive: (id: string | number) => void;
}

const getStatusStyle = (status: MachineStatus) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_USE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "UNDER_MAINTENANCE":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "IDLE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: MachineStatus) => {
  switch (status) {
    case "AVAILABLE":
      return "Ready / Available";
    case "IN_USE":
      return "In Use on Line";
    case "UNDER_MAINTENANCE":
      return "Maintenance";
    case "IDLE":
      return "Idle / Standby";
    default:
      return status;
  }
};

export function MachineList({ machines, lines, loading, onEdit, onToggleActive }: MachineListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const machineTypes = Array.from(new Set(machines.map((m) => m.machineType))).filter(Boolean);

  const filtered = machines.filter((machine) => {
    const matchesSearch =
      machine.machineCode.toLowerCase().includes(search.toLowerCase()) ||
      machine.machineType.toLowerCase().includes(search.toLowerCase()) ||
      (machine.brand && machine.brand.toLowerCase().includes(search.toLowerCase())) ||
      (machine.model && machine.model.toLowerCase().includes(search.toLowerCase())) ||
      (machine.lineName && machine.lineName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === "all" || machine.machineType === typeFilter;
    const matchesStatus = statusFilter === "all" || machine.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Machine Inventory & Equipment</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sewing machines, special equipment, and floor assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="AVAILABLE">Ready / Available</option>
            <option value="IN_USE">In Use</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="IDLE">Idle</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">All Machine Types</option>
            {machineTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, type, brand…"
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
        <SkeletonTable rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No machines found" description="Register sewing machines to track line constraints and floor capacity." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200">
                <TableHead className="w-32 text-slate-500 font-bold whitespace-nowrap">Asset Code</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Machine Type</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Brand & Model</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Assigned Line</TableHead>
                <TableHead className="w-32 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="w-24 text-center text-slate-500 font-bold whitespace-nowrap">Active</TableHead>
                <TableHead className="text-right w-24 text-slate-500 font-bold whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m, index) => (
                <motion.tr
                  key={m.id}
                  className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015, duration: 0.2 }}
                >
                  <TableCell className="align-middle whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {m.machineCode}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-900 text-xs">{m.machineType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle text-xs font-medium text-slate-700 whitespace-nowrap">
                    {m.brand ? `${m.brand} ${m.model || ""}` : "—"}
                  </TableCell>
                  <TableCell className="align-middle whitespace-nowrap">
                    {(() => {
                      const resolvedLine = lines?.find(l => String(l.id) === String(m.lineId));
                      const name = m.lineName || (resolvedLine ? `${resolvedLine.lineCode} · ${resolvedLine.lineName}` : null);
                      return name ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
                          {name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center align-middle whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(m.status)}`}>
                      {getStatusLabel(m.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center align-middle whitespace-nowrap">
                    <StatusBadge status={m.active ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell className="text-right align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(m)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                        title="Edit Machine"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <ToggleSwitch
                        checked={m.active}
                        onChange={() => onToggleActive(m.id)}
                        title={m.active ? "Deactivate machine" : "Activate machine"}
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
