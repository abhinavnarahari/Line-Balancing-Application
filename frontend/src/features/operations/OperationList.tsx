import { motion } from "framer-motion";
import { Search, Edit2 } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { DataCard, DataCardHeader, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import type { Operation } from "./api";

interface OperationListProps {
  operations: Operation[];
  onEdit: (op: Operation) => void;
  onToggleActive: (id: string | number) => void;
  loading?: boolean;
}

export function OperationList({ operations, onEdit, onToggleActive, loading }: OperationListProps) {
  const [search, setSearch] = useState("");

  const filtered = operations.filter((op) => {
    const s = search.toLowerCase();
    return op.name.toLowerCase().includes(s) || op.operationCode.toLowerCase().includes(s);
  });

  return (
    <DataCard noPad>
      <DataCardHeader
        title="All Operations"
        subtitle="18 standard sewing operations from the production worksheet"
        count={filtered.length}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operations…"
              className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#B8A898] w-52 focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 transition-all"
            />
          </div>
        }
      />

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No operations found" description="Try a different search term." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Seq</TableHead>
              <TableHead className="w-28">Code</TableHead>
              <TableHead>Operation Name</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((op, index) => (
              <motion.tr
                key={op.id}
                className="group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
              >
                <TableCell className="font-mono text-xs text-[#8C7E6E] w-14">{op.sequence}</TableCell>
                <TableCell>
                  <span className="font-mono text-[11.5px] font-semibold text-[#B48259] tracking-wide bg-[#FBF4EC] px-2 py-0.5 rounded-sm border border-[#F0EAE0]">
                    {op.operationCode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`font-medium text-sm ${!op.active ? "text-[#8C7E6E]" : "text-[#221912]"}`}>
                    {op.name}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-[#475569] max-w-xs truncate">
                  {op.description}
                </TableCell>
                <TableCell>
                  <StatusBadge status={op.active ? "active" : "inactive"} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onEdit(op)}
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <ToggleSwitch
                      checked={op.active}
                      onChange={() => onToggleActive(op.id)}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="px-5 py-2.5 border-t border-[#F0EAE0] bg-[#FAFAF8] flex justify-between items-center">
        <span className="text-[11px] text-[#8C7E6E] font-mono">
          {filtered.length} of {operations.length} operations
        </span>
        <span className="text-[11px] text-[#8C7E6E]">
          {operations.filter(o => o.active).length} active
        </span>
      </div>
    </DataCard>
  );
}

