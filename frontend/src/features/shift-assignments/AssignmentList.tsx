import { useState } from "react";
import { motion } from "framer-motion";
import { Search, History, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { DataCard, DataCardHeader, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import type { ShiftAssignment } from "./api";
import type { Operator } from "../operators/api";
import type { Shift } from "../shifts/types";

interface AssignmentListProps {
  assignments: ShiftAssignment[];
  operators: Operator[];
  shifts: Shift[];
  onEndAssignment: (id: string, date: string) => void;
  loading?: boolean;
}

export function AssignmentList({ assignments, operators, shifts, onEndAssignment, loading }: AssignmentListProps) {
  const [search, setSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Merge assignment with operator and shift data
  const enriched = assignments.map(a => {
    const op = operators.find(o => o.id === a.operatorId);
    const sh = shifts.find(s => s.id === a.shiftId);
    return {
      ...a,
      operatorName: op?.name || "Unknown",
      employeeId: op?.employeeId || "Unknown",
      shiftName: sh?.shiftName || "Unknown",
      shiftCode: sh?.shiftCode || "?",
    };
  });

  const filtered = enriched.filter(a => {
    const matchesSearch = a.operatorName.toLowerCase().includes(search.toLowerCase()) || 
                          a.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = showHistory ? true : (a.status === "Active" || a.status === "Scheduled");
    return matchesSearch && matchesStatus;
  });

  // Sort: Active first, then by date descending
  filtered.sort((a, b) => {
    if (a.status === "Active" && b.status !== "Active") return -1;
    if (b.status === "Active" && a.status !== "Active") return 1;
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
  });

  return (
    <DataCard noPad>
      <DataCardHeader
        title="Operator Shift Assignments"
        subtitle={showHistory ? "Showing all historical assignments" : "Showing current and scheduled assignments"}
        count={filtered.length}
        action={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-[#8A8270] cursor-pointer hover:text-[#26231D] transition-colors">
              <input 
                type="checkbox" 
                checked={showHistory} 
                onChange={(e) => setShowHistory(e.target.checked)}
                className="rounded-sm border-[#D0C8B4] text-[#B8763F] focus:ring-[#B8763F]"
              />
              <History className="h-3.5 w-3.5" />
              Show History
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8270]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#D0C8B4] text-[#26231D] placeholder-[#B8A898] w-52 focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 transition-all rounded-sm"
              />
            </div>
          </div>
        }
      />

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No assignments found" description="Try adjusting your search or filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Employee ID</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Assigned Shift</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Effective To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a, index) => (
              <motion.tr
                key={a.id}
                className={`group bg-white hover:bg-[#FBF8F3] border-b border-[#EDE8DF] last:border-0 transition-colors duration-100 ${a.status === 'Completed' ? 'opacity-60' : ''}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <TableCell>
                  <span className="font-mono text-[11px] font-semibold text-[#B8763F] tracking-wide">
                    {a.employeeId}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-sm text-[#1E1B16]">{a.operatorName}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#26231D]">
                    <span className="w-5 h-5 rounded-sm bg-gradient-to-br from-[#B8763F] to-[#8B4A3C] text-white flex items-center justify-center text-[10px]">
                      {a.shiftCode}
                    </span>
                    {a.shiftName}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-[#6E6656]">{a.effectiveFrom}</TableCell>
                <TableCell className="font-mono text-xs text-[#6E6656]">
                  {a.effectiveTo || <span className="italic text-[#B8A898]">Indefinite</span>}
                </TableCell>
                <TableCell>
                  <StatusBadge 
                    status={a.status === 'Active' ? 'active' : a.status === 'Scheduled' ? 'present' : 'inactive'} 
                    label={a.status} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  {a.status === "Active" && endingId !== a.id && (
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setEndingId(a.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      End Assignment
                    </Button>
                  )}
                  {endingId === a.id && (
                    <div className="flex items-center justify-end gap-2">
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-7 text-[10px] border border-[#D0C8B4] px-2 rounded-sm"
                      />
                      <Button variant="ghost" size="xs" onClick={() => setEndingId(null)} className="h-7 px-2 text-red-500"><X className="h-3.5 w-3.5"/></Button>
                      <Button variant="primary" size="xs" onClick={() => { onEndAssignment(a.id, endDate); setEndingId(null); }} className="h-7 px-2"><Check className="h-3.5 w-3.5"/></Button>
                    </div>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      )}
    </DataCard>
  );
}
