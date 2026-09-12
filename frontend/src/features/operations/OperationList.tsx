import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Edit2, Trash2, X, Cpu, CheckCircle2, AlertCircle, Network } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { DataCard, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import { machinesApi, type Machine } from "../machines/api";
import type { Operation, OperationAffinity } from "./api";

interface OperationListProps {
  operations: Operation[];
  affinities?: OperationAffinity[];
  onEdit: (op: Operation) => void;
  onToggleActive: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onViewRating: (op: Operation) => void;
  onManageAffinities?: (op: Operation) => void;
  loading?: boolean;
}

export function OperationList({ operations, affinities = [], onEdit, onToggleActive, onDelete, onViewRating, onManageAffinities, loading }: OperationListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedMachineType, setSelectedMachineType] = useState<string>("all");
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    machinesApi.getMachines()
      .then((res) => setMachines(res || []))
      .catch(console.error);
  }, []);

  const uniqueMachineTypes = Array.from(
    new Set(operations.map((o) => o.machineType).filter(Boolean))
  ) as string[];

  const filtered = operations.filter((op) => {
    const s = search.toLowerCase();
    const matchesSearch =
      op.name.toLowerCase().includes(s) ||
      op.operationCode.toLowerCase().includes(s) ||
      (op.machineType && op.machineType.toLowerCase().includes(s)) ||
      (op.description && op.description.toLowerCase().includes(s));

    const matchesFilter =
      filter === "all" || (filter === "active" && op.active) || (filter === "inactive" && !op.active);

    const matchesMachineType =
      selectedMachineType === "all" || op.machineType === selectedMachineType;

    return matchesSearch && matchesFilter && matchesMachineType;
  });

  return (
    <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Standard Operation Library</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configured sewing machinery, standard SMVs, and 5-tier operator skill benchmarks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Machine Filter Dropdown */}
          {uniqueMachineTypes.length > 0 && (
            <select
              value={selectedMachineType}
              onChange={(e) => setSelectedMachineType(e.target.value)}
              className="h-8 bg-white border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Machinery Types</option>
              {uniqueMachineTypes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Status Segmented Tabs */}
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
              placeholder="Search operation, machine, code…"
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

      {/* ── Table Grid ────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No operations found" description="Try a different search term or register a new operation." />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-slate-50/90 border-b border-slate-200">
                <TableHead className="w-16 text-center text-slate-500 font-bold whitespace-nowrap">Seq</TableHead>
                <TableHead className="w-28 text-slate-500 font-bold whitespace-nowrap">Code</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Operation Name & Specification</TableHead>
                <TableHead className="w-56 text-slate-500 font-bold whitespace-nowrap">Attached Machinery</TableHead>
                <TableHead className="w-36 text-center text-slate-500 font-bold whitespace-nowrap">Standard SMV</TableHead>
                <TableHead className="w-40 text-center text-slate-500 font-bold whitespace-nowrap">Skill Affinities</TableHead>
                <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right w-32 text-slate-500 font-bold whitespace-nowrap pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((op, index) => {
                const smv = Number(op.standardSmv || 0.5);
                const smvSec = Math.round(smv * 60);
                const mType = op.machineType || "Single Needle Lockstitch";
                const matchingMachines = machines.filter(
                  (m) => m.machineType.toLowerCase() === mType.toLowerCase()
                );
                const availUnits = matchingMachines.filter(
                  (m) => m.status === "AVAILABLE" && m.active
                ).length;

                return (
                  <motion.tr
                    key={op.id}
                    className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.015, duration: 0.2 }}
                    onClick={() => onViewRating(op)}
                  >
                    {/* Seq */}
                    <TableCell className="text-center align-middle whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onViewRating(op); }}>
                      <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center font-mono font-bold text-xs bg-slate-100 border border-slate-200 text-slate-700">
                        #{op.sequence || index + 1}
                      </span>
                    </TableCell>

                    {/* Code */}
                    <TableCell className="align-middle whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onViewRating(op); }}>
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {op.operationCode}
                      </span>
                    </TableCell>

                    {/* Name & Description */}
                    <TableCell className="align-middle" onClick={(e) => { e.stopPropagation(); onViewRating(op); }}>
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors block">
                          {op.name}
                        </span>
                        {op.description && (
                          <span className="text-xs text-slate-500 block line-clamp-1">
                            {op.description}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Attached Machinery */}
                    <TableCell className="align-middle whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onViewRating(op); }}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                          <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{mType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {matchingMachines.length > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded border ${
                                availUnits > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {availUnits > 0 ? (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{availUnits} ready</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>0 ready ({matchingMachines.length} busy)</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Specialized workstation
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* SMV */}
                    <TableCell className="text-center align-middle whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onViewRating(op); }}>
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                          {smv.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">min</span>
                        </span>
                        <span className="text-[10px] text-blue-600 font-mono font-medium">
                          ({smvSec}s cycle)
                        </span>
                      </div>
                    </TableCell>

                    {/* Skill Affinities */}
                    <TableCell className="text-center align-middle whitespace-nowrap" onClick={(e) => { e.stopPropagation(); onManageAffinities?.(op); }}>
                      {(() => {
                        const opAffinities = affinities.filter(a => String(a.primaryOperationId) === String(op.id));
                        return opAffinities.length > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onManageAffinities?.(op); }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                            title="View & manage affinitized alternative operations"
                          >
                            <Network className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span>{opAffinities.length} Alternatives</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onManageAffinities?.(op); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-[#9C5B3C] hover:bg-[#F6F1E8] border border-dashed border-slate-200 transition-colors cursor-pointer"
                            title="Click to define alternative operations this skill can cover"
                          >
                            <Network className="w-3 h-3" />
                            <span>+ Affinitize</span>
                          </button>
                        );
                      })()}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={op.active ? "active" : "inactive"} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right align-middle whitespace-nowrap pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleSwitch
                          checked={op.active}
                          onChange={() => onToggleActive(op.id)}
                          title={op.active ? "Click to deactivate" : "Click to activate"}
                        />

                        {onManageAffinities && (
                          <button
                            type="button"
                            onClick={() => onManageAffinities(op)}
                            className="p-1.5 rounded-lg text-[#9C5B3C] hover:text-[#854B30] hover:bg-[#F6F1E8] border border-[#E6DDCE] transition-colors cursor-pointer shadow-2xs"
                            title="Manage Skill Affinities & Alternative Operations"
                          >
                            <Network className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEdit(op)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                          title="Edit Operation & Machinery"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete operation "${op.name}" (${op.operationCode})?`)) {
                              onDelete(op.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                          title="Delete Operation"
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
      )}

      {/* ── Table Footer ──────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
        <span className="font-mono">
          Showing {filtered.length} of {operations.length} operations
        </span>
        <span className="text-slate-500">
          <strong className="text-emerald-700 font-mono">{operations.filter(o => o.active).length} active</strong> · <strong className="text-slate-500 font-mono">{operations.filter(o => !o.active).length} inactive</strong>
        </span>
      </div>
    </DataCard>
  );
}
