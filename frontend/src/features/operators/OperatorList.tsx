import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Edit2, X, ArrowUpRight, Calendar } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { DataCard, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import type { Operator } from "./api";

interface OperatorListProps {
  operators: Operator[];
  onEdit: (op: Operator) => void;
  onToggleActive: (id: string) => void;
  loading?: boolean;
}

// Avatar color generator based on operator name
function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-teal-100 text-teal-800 border-teal-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  if (!name) return "OP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OperatorList({ operators, onEdit, onToggleActive, loading }: OperatorListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = operators
    .filter((op) => {
      const s = search.toLowerCase();
      const matchesSearch =
        op.name.toLowerCase().includes(s) ||
        op.employeeId.toLowerCase().includes(s) ||
        (op.department && op.department.toLowerCase().includes(s));
      const matchesFilter =
        filter === "all" || (filter === "active" && op.active) || (filter === "inactive" && !op.active);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => (a.employeeId || "").localeCompare(b.employeeId || "", undefined, { numeric: true, sensitivity: "base" }));

  return (
    <DataCard noPad className="border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
      {/* ── Toolbar Header ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Operator Directory</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {filtered.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {operators.filter(o => o.active).length} active operators available on shop floor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter Segmented Buttons */}
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
              placeholder="Search by name, ID, department…"
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
        <SkeletonTable rows={8} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No operators found" description="Try adjusting your search criteria or register a new operator." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200">
                <TableHead className="w-36 text-slate-500 font-bold whitespace-nowrap">Employee ID</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Operator Name</TableHead>
                <TableHead className="w-32 text-slate-500 font-bold whitespace-nowrap">Role / Designation</TableHead>
                <TableHead className="w-20 text-center text-slate-500 font-bold whitespace-nowrap">Age</TableHead>
                <TableHead className="w-24 text-center text-slate-500 font-bold whitespace-nowrap">Gender</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Department</TableHead>
                <TableHead className="text-slate-500 font-bold whitespace-nowrap">Joining Date</TableHead>
                <TableHead className="w-28 text-center text-slate-500 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right w-24 text-slate-500 font-bold whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((op, index) => (
                <motion.tr
                  key={op.id}
                  className="group bg-white hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015, duration: 0.2 }}
                >
                  {/* Employee ID */}
                  <TableCell className="align-middle whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {op.employeeId}
                    </span>
                  </TableCell>

                  {/* Name & Avatar */}
                  <TableCell className="align-middle whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold border shadow-2xs ${getAvatarColor(
                          op.name
                        )}`}
                      >
                        {getInitials(op.name)}
                      </div>
                      <div>
                        <Link
                          to={`/settings/operators/${op.employeeId}`}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors"
                        >
                          <span>{op.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role / Designation Badge */}
                  <TableCell className="align-middle whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      op.role === "LINE_SUPERVISOR"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : op.role === "QUALITY_CHECKER"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : op.role === "FLOATER"
                        ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                        : op.role === "HELPER"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {op.role === "LINE_SUPERVISOR"
                        ? "Supervisor"
                        : op.role === "QUALITY_CHECKER"
                        ? "QC Inspector"
                        : op.role === "FLOATER"
                        ? "Floater / Relief"
                        : op.role === "HELPER"
                        ? "Floor Helper"
                        : "Sewing Operator"}
                    </span>
                  </TableCell>

                  {/* Age */}
                  <TableCell className="text-center align-middle font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {op.age || "—"} yrs
                  </TableCell>

                  {/* Gender */}
                  <TableCell className="text-center align-middle whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                      {op.gender || "OTHER"}
                    </span>
                  </TableCell>

                  {/* Department */}
                  <TableCell className="align-middle whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
                      {op.department || "Sewing"}
                    </span>
                  </TableCell>

                  {/* Joining Date */}
                  <TableCell className="align-middle font-mono text-xs text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{op.joiningDate || "—"}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center align-middle whitespace-nowrap">
                    <StatusBadge status={op.active ? "active" : "inactive"} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(op)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                        title="Edit Operator"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <ToggleSwitch
                        checked={op.active}
                        onChange={() => onToggleActive(op.id)}
                        title={op.active ? "Click to deactivate" : "Click to activate"}
                      />
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Table Footer ──────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
        <span className="font-mono">
          Showing {filtered.length} of {operators.length} operators
        </span>
        <span className="text-slate-500">
          <strong className="text-emerald-700 font-mono">{operators.filter(o => o.active).length} active</strong> · <strong className="text-slate-500 font-mono">{operators.filter(o => !o.active).length} inactive</strong>
        </span>
      </div>
    </DataCard>
  );
}
