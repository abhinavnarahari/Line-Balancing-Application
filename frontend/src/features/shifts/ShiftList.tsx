import { motion } from "framer-motion";
import { Edit2, Clock, Moon } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { DataCard, DataCardHeader, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import type { Shift } from "./types";

interface ShiftListProps {
  shifts: Shift[];
  onToggleActive: (id: string) => void;
  onEdit: (shift: Shift) => void;
  loading?: boolean;
}

function shiftDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function isOvernightShift(start: string, end: string): boolean {
  const [sh] = start.split(":").map(Number);
  const [eh] = end.split(":").map(Number);
  return eh < sh;
}

const shiftColors: Record<string, string> = {
  A: "from-[#4A7E6A] to-[#3C5245]",
  B: "from-[#B48259] to-[#8B4A3C]",
  C: "from-[#4A5A8A] to-[#2E3A5C]",
  GENERAL: "from-[#475569] to-[#4A443C]",
};

export function ShiftList({ shifts, onToggleActive, onEdit, loading }: ShiftListProps) {
  if (loading) return <DataCard noPad><SkeletonTable rows={4} cols={5} /></DataCard>;

  if (shifts.length === 0) {
    return (
      <DataCard noPad>
        <EmptyState title="No shifts configured" description="Create your first shift to get started." />
      </DataCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Shift Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {shifts.map((shift, index) => {
          const gradient = shiftColors[shift.shiftCode] || "from-[#475569] to-[#4A443C]";
          const overnight = isOvernightShift(shift.startTime, shift.endTime);
          const duration = shiftDuration(shift.startTime, shift.endTime);

          return (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-sm border ${shift.active ? "border-[#E6DDCE]" : "border-[#FAFAF8] opacity-60"} bg-white shadow-sm group`}
            >
              {/* Gradient header band */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm bg-gradient-to-r ${gradient} text-white`}>
                        {shift.shiftCode}
                      </span>
                      {overnight && <span title="Overnight shift"><Moon className="h-3 w-3 text-[#8C7E6E]" /></span>}
                    </div>
                    <h3 className="text-sm font-semibold text-[#221912] tracking-tight">{shift.shiftName}</h3>
                  </div>
                  <StatusBadge status={shift.active ? "active" : "inactive"} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8C7E6E]">Start</span>
                    <span className="font-mono font-semibold text-[#221912]">{shift.startTime}</span>
                  </div>
                  <div className="h-px bg-[#F0EAE0]" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8C7E6E]">End</span>
                    <span className="font-mono font-semibold text-[#221912]">{shift.endTime}</span>
                  </div>
                  <div className="h-px bg-[#F0EAE0]" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8C7E6E]">Duration</span>
                    <span className="font-mono font-semibold text-[#B48259]">{duration}</span>
                  </div>
                </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#F0EAE0] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="xs" onClick={() => onEdit(shift)} className="flex-1 justify-center">
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <ToggleSwitch
                    checked={shift.active}
                    onChange={() => onToggleActive(shift.id)}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Compact table view below cards */}
      <DataCard noPad>
        <DataCardHeader title="Shift Summary" subtitle="All configured shifts" count={shifts.length} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift, index) => (
              <motion.tr
                key={shift.id}
                className="group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <TableCell>
                  <span className="font-mono text-[11px] font-bold text-white bg-gradient-to-br from-[#B48259] to-[#8B4A3C] px-2 py-0.5 rounded-sm">
                    {shift.shiftCode}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-[#221912]">{shift.shiftName}</TableCell>
                <TableCell className="font-mono text-xs text-[#221912]">{shift.startTime}</TableCell>
                <TableCell className="font-mono text-xs text-[#221912]">{shift.endTime}</TableCell>
                <TableCell className="font-mono text-xs text-[#B48259] font-semibold">
                  {shiftDuration(shift.startTime, shift.endTime)}
                </TableCell>
                <TableCell>
                  {isOvernightShift(shift.startTime, shift.endTime) ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#4A5A8A] font-semibold">
                      <Moon className="h-3 w-3" /> Overnight
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#4A7E6A] font-semibold">
                      <Clock className="h-3 w-3" /> Day
                    </span>
                  )}
                </TableCell>
                <TableCell><StatusBadge status={shift.active ? "active" : "inactive"} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="xs" onClick={() => onEdit(shift)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <ToggleSwitch
                      checked={shift.active}
                      onChange={() => onToggleActive(shift.id)}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </DataCard>
    </div>
  );
}

