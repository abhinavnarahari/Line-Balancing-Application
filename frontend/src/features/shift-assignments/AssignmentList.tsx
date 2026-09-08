import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  onEndAssignment: (id: string | number, date: string) => void;
  onUpdateAssignment: (id: string | number, data: any) => Promise<void>;
  loading?: boolean;
}

export function AssignmentList({ assignments, operators, shifts, onEndAssignment, onUpdateAssignment, loading }: AssignmentListProps) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("employeeId") || "");
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditClick = (a: any) => {
    setEditingId(a.id.toString());
    setEditStartDate(a.effectiveFrom);
    setEditEndDate(a.effectiveTo || "");
    setEditError(null);
  };

  const submitEdit = async (a: any) => {
    try {
      await onUpdateAssignment(a.id, {
        operatorId: a.operatorId,
        shiftId: a.shiftId,
        effectiveFrom: editStartDate,
        effectiveTo: editEndDate || null
      });
      setEditingId(null);
      setEditError(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || "Failed to update");
    }
  };

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
    return a.operatorName.toLowerCase().includes(search.toLowerCase()) || 
           a.employeeId.toLowerCase().includes(search.toLowerCase());
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
        subtitle="Showing all assignments"
        count={filtered.length}
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="pl-8 pr-4 py-1.5 text-xs bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#8C7E6E]/60 w-52 focus:outline-none focus:border-[#9C5B3C] focus:ring-1 focus:ring-[#9C5B3C]/20 transition-all rounded-xl"
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
        <>
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
              {filtered.slice((page - 1) * pageSize, page * pageSize).map((a, index) => (
                <motion.tr
                  key={a.id}
                  className={`group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100 ${a.status === 'Completed' ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % pageSize) * 0.02, duration: 0.2 }}
                >
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-[#9C5B3C] bg-[#F6F1E8] px-2 py-0.5 rounded-md border border-[#E6DDCE] tracking-wide">
                      {a.employeeId}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-[#221912]">{a.operatorName}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#221912]">
                      <span className="w-5 h-5 rounded-md bg-[#9C5B3C] text-white flex items-center justify-center text-[10px] font-mono font-bold shadow-2xs">
                        {a.shiftCode}
                      </span>
                      {a.shiftName}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#8C7E6E]">
                    {editingId === a.id.toString() ? (
                      <input 
                        type="date" 
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="h-7 text-[10px] border border-[#E6DDCE] px-2 rounded-lg w-28 bg-white"
                      />
                    ) : a.effectiveFrom}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#8C7E6E]">
                    {editingId === a.id.toString() ? (
                      <input 
                        type="date" 
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="h-7 text-[10px] border border-[#E6DDCE] px-2 rounded-lg w-28 bg-white"
                      />
                    ) : (a.effectiveTo || <span className="italic text-[#8C7E6E]">Indefinite</span>)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={a.status === 'Active' ? 'active' : a.status === 'Scheduled' ? 'present' : 'inactive'} 
                      label={a.status} 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === "Active" && endingId !== a.id.toString() && editingId !== a.id.toString() && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="xs" onClick={() => handleEditClick(a)} className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]">
                          Edit
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => setEndingId(a.id.toString())} className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]">
                          End
                        </Button>
                      </div>
                    )}
                    {endingId === a.id.toString() && (
                      <div className="flex items-center justify-end gap-2">
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-7 text-[10px] border border-[#E6DDCE] px-2 rounded-lg bg-white"
                        />
                        <Button variant="ghost" size="xs" onClick={() => setEndingId(null)} className="h-7 px-2 text-[#be123c]"><X className="h-3.5 w-3.5"/></Button>
                        <Button variant="primary" size="xs" onClick={() => { onEndAssignment(a.id, endDate); setEndingId(null); }} className="h-7 px-2 bg-[#9C5B3C] text-white"><Check className="h-3.5 w-3.5"/></Button>
                      </div>
                    )}
                    {editingId === a.id.toString() && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="xs" onClick={() => setEditingId(null)} className="h-7 px-2 text-[#be123c]"><X className="h-3.5 w-3.5"/></Button>
                          <Button variant="primary" size="xs" onClick={() => submitEdit(a)} className="h-7 px-2 bg-[#9C5B3C] text-white"><Check className="h-3.5 w-3.5"/></Button>
                        </div>
                        {editError && <div className="text-[10px] text-[#be123c] max-w-[120px] text-right leading-tight">{editError}</div>}
                      </div>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#F1F5F9] rounded-b-2xl">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-[#64748B] uppercase">Rows per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs bg-white border border-[#E2E8F0] rounded-sm h-7 px-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-[#64748B]">
                {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(filtered.length, page * pageSize)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))} disabled={page === Math.ceil(filtered.length / pageSize) || Math.ceil(filtered.length / pageSize) === 0} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </>
      )}
    </DataCard>
  );
}

