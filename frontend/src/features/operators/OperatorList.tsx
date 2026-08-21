import { motion } from "framer-motion";
import { Search, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { DataCard, DataCardHeader, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import type { Operator } from "./api";

interface OperatorListProps {
  operators: Operator[];
  onEdit: (op: Operator) => void;
  onToggleActive: (id: string) => void;
  loading?: boolean;
}

export function OperatorList({ operators, onEdit, onToggleActive, loading }: OperatorListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = operators.filter((op) => {
    const s = search.toLowerCase();
    const matchesSearch = op.name.toLowerCase().includes(s) || op.employeeId.toLowerCase().includes(s) || op.department.toLowerCase().includes(s);
    const matchesFilter = filter === "all" || (filter === "active" && op.active) || (filter === "inactive" && !op.active);
    return matchesSearch && matchesFilter;
  });

  return (
    <DataCard noPad>
      <DataCardHeader
        title="Sewing Operators"
        subtitle={`${operators.filter(o => o.active).length} active · ${operators.filter(o => !o.active).length} inactive`}
        count={filtered.length}
        action={
          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center border border-[#D0C8B4] bg-white overflow-hidden rounded-sm">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[10px] font-semibold tracking-wide uppercase transition-colors ${
                    filter === f ? "bg-[#B8763F] text-white" : "text-[#6E6656] hover:text-[#26231D]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8270]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search operators…"
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#D0C8B4] text-[#26231D] placeholder-[#B8A898] w-48 focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 transition-all"
              />
            </div>
          </div>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No operators found" description="Try adjusting your search or filter." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-12">Age</TableHead>
                <TableHead className="w-20">Gender</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((op, index) => (
                <motion.tr
                  key={op.id}
                  className="group bg-white hover:bg-[#FBF8F3] border-b border-[#EDE8DF] last:border-0 transition-colors duration-100"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.018, duration: 0.22 }}
                >
                  <TableCell>
                    <span className="font-mono text-[11px] font-semibold text-[#B8763F] bg-[#FBF4EC] px-2 py-0.5 rounded-sm border border-[#E0D8C0] tracking-wide">
                      {op.employeeId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {/* Avatar initial */}
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D89A5C]/30 to-[#8B4A3C]/20 flex items-center justify-center text-[10px] font-bold text-[#8B4A3C] shrink-0 border border-[#E0D8C0]">
                        {op.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className={`font-medium text-sm ${!op.active ? "text-[#8A8270]" : "text-[#1E1B16]"}`}>
                        {op.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#6E6656]">{op.age}</TableCell>
                  <TableCell className="text-xs text-[#6E6656]">{op.gender}</TableCell>
                  <TableCell className="text-sm text-[#26231D]">{op.department}</TableCell>
                  <TableCell className="font-mono text-xs text-[#6E6656]">{op.joiningDate}</TableCell>
                  <TableCell><StatusBadge status={op.active ? "active" : "inactive"} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="xs" onClick={() => onEdit(op)} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => onToggleActive(op.id)} title={op.active ? "Deactivate" : "Activate"}>
                        {op.active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="px-5 py-2.5 border-t border-[#E0D8C0] bg-[#FAF7F2] flex justify-between items-center">
        <span className="text-[11px] text-[#8A8270] font-mono">
          Showing {filtered.length} of {operators.length} operators
        </span>
        <span className="text-[11px] text-[#8A8270]">
          {operators.filter(o => o.active).length} active · {operators.filter(o => !o.active).length} inactive
        </span>
      </div>
    </DataCard>
  );
}
