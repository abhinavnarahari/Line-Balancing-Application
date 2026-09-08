import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Clock, Moon, Trash2, History, ChevronDown } from "lucide-react";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { DataCard, DataCardHeader, SkeletonTable, EmptyState, StatusBadge } from "../../components/ui/PremiumUI";
import { auditApi, type AuditLog } from "../../lib/audit";
import { cn } from "../../utils/cn";
import type { Shift } from "./types";

interface ShiftListProps {
  shifts: Shift[];
  onToggleActive: (id: string) => void;
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

function formatTime(t: string | undefined): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return t;
}

function formatDuration(start: string, end: string): string {
  const [sh = 0, sm = 0] = (start || "").split(":").map(Number);
  const [eh = 0, em = 0] = (end || "").split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} hrs`;
  return `${h} hrs ${m} mins`;
}

function isOvernightShift(start: string, end: string): boolean {
  const [sh = 0] = (start || "").split(":").map(Number);
  const [eh = 0] = (end || "").split(":").map(Number);
  return eh < sh;
}

const shiftColors: Record<string, string> = {
  A: "from-[#77876F] to-[#55694F]",
  B: "from-[#9C5B3C] to-[#804529]",
  C: "from-[#221912] to-[#3D2C20]",
  GENERAL: "from-[#8C7E6E] to-[#5C5245]",
};

const getShiftBadgeStyle = (code: string) => {
  switch (code?.toUpperCase()) {
    case "A":
      return "bg-[#F3F5F2] text-[#485742] border border-[#d4decb]";
    case "B":
      return "bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE]";
    case "C":
      return "bg-[#EFE9DF] text-[#614328] border border-[#D8C9B8]";
    case "GENERAL":
    default:
      return "bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]";
  }
};

/* ─── Past Changes History Panel ─────────────────────────────────── */
function ShiftHistoryPanel({ shift }: { shift: Shift }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    auditApi.getRecentLogs("Shift", shift.id)
      .then((data) => {
        if (isMounted) {
          setLogs(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error("Failed to load shift history:", err);
        if (isMounted) setLogs([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shift.id]);

  if (loading) {
    return (
      <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-center gap-2 text-xs text-[#64748B]">
        <div className="w-3.5 h-3.5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span>Loading past changes...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] text-center text-xs text-[#64748B] italic">
        No recorded past changes for this shift yet.
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9]">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-[#2563EB]" />
        <h4 className="text-xs font-bold text-[#0F172A]">
          Past Changes · {shift.shiftName} ({shift.shiftCode})
        </h4>
        <span className="text-[11px] font-medium text-[#64748B]">
          ({logs.length} {logs.length === 1 ? "change" : "changes"})
        </span>
      </div>

      <div className="space-y-3 relative pl-1 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E2E8F0]">
        {logs.map((log) => {
          const isCreate = log.action === "CREATE" || log.action === "CREATED";
          const isDelete = log.action === "DELETE" || log.action === "DELETED";
          const actionVerb = isCreate ? "created" : isDelete ? "deleted" : "updated";

          const actor = log.performedBy || "Admin";
          let details = log.details || `${actionVerb} Shift #${log.entityId} (${shift.shiftName})`;
          if (details.toLowerCase().startsWith(actor.toLowerCase())) {
            details = details.slice(actor.length).trim();
          }

          return (
            <div key={log.id} className="relative pl-6 flex items-start justify-between gap-3 text-xs">
              {/* Unified Brand Dot */}
              <div className="absolute left-[3px] top-[5px] w-2.5 h-2.5 rounded-full bg-[#9C5B3C] shadow-[0_0_0_3px_#F8FAFC] ring-1 ring-[#9C5B3C]/30" />
              
              <div className="flex-1">
                <div className="text-[#0F172A] font-normal leading-relaxed">
                  <span className="font-mono text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] mr-1.5">
                    {actor}
                  </span>
                  <span>{details}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShiftList({ shifts, onToggleActive, onEdit, onDelete, loading }: ShiftListProps) {
  const [expandedShiftId, setExpandedShiftId] = useState<string | number | null>(null);

  const toggleExpand = (id: string | number) => {
    setExpandedShiftId((prev) => (prev === id ? null : id));
  };

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
          const gradient = shiftColors[shift.shiftCode] || "from-[#475569] to-[#334155]";
          const overnight = isOvernightShift(shift.startTime, shift.endTime);
          const duration = formatDuration(shift.startTime, shift.endTime);
          const formattedStartTime = formatTime(shift.startTime);
          const formattedEndTime = formatTime(shift.endTime);

          return (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#D8C7B5] transition-all duration-200 group flex flex-col justify-between",
                shift.active ? "border-[#E2E8F0]" : "border-[#F1F5F9] opacity-75"
              )}
            >
              {/* Gradient Accent Bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`font-mono text-[11px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded-md bg-gradient-to-r ${gradient} text-white shadow-xs`}>
                          {shift.shiftCode}
                        </span>
                        {overnight && (
                          <span title="Overnight shift" className="inline-flex items-center gap-1 text-[10px] font-medium text-[#4A5A8A] bg-[#EEF2FF] px-1.5 py-0.5 rounded border border-[#E0E7FF]">
                            <Moon className="h-2.5 w-2.5" /> Night
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">{shift.shiftName}</h3>
                    </div>
                    <StatusBadge status={shift.active ? "active" : "inactive"} />
                  </div>

                  {/* Timing Box */}
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9] mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" /> Time
                      </span>
                      <span className="font-semibold text-xs text-[#0F172A] tracking-wide">
                        {formattedStartTime} – {formattedEndTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EDE4D8]">
                      <span className="text-[#64748B] font-medium">Duration</span>
                      <span className="font-semibold text-[11px] text-[#2563EB] bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0] shadow-2xs">
                        {duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons: Toggle, Edit, Delete */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5">
                    <ToggleSwitch
                      checked={shift.active}
                      onChange={() => onToggleActive(shift.id)}
                      title={shift.active ? "Shift Active (Click to pause)" : "Shift Paused (Click to activate)"}
                    />
                    <span className="text-[11px] font-medium text-[#64748B]">
                      {shift.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(shift)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#D8C7B5] transition-colors cursor-pointer shadow-2xs"
                      title="Edit Shift"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => { if (window.confirm(`Are you sure you want to delete "${shift.shiftName}"?`)) onDelete(shift.id); }}
                      className="p-1.5 rounded-lg text-[#A89F91] hover:text-rose-600 bg-[#F8FAFC] hover:bg-rose-50 border border-[#E2E8F0] hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                      title="Delete Shift"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Compact table view below cards: click on row to expand Past Changes */}
      <DataCard noPad>
        <DataCardHeader 
          title="Shift Summary" 
          subtitle="Click on any shift to inspect past changes and timing modifications" 
          count={shifts.length} 
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift, index) => {
              const isExpanded = expandedShiftId === shift.id;

              return (
                <div key={shift.id} className="contents">
                  <motion.tr
                    className={cn(
                      "group border-b border-[#F1F5F9] transition-colors duration-100 cursor-pointer",
                      isExpanded ? "bg-[#F8FAFC]" : "bg-white hover:bg-[#FFFFFF]"
                    )}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => toggleExpand(shift.id)}
                  >
                    <TableCell>
                      <span className={cn(
                        "font-mono text-[11px] font-bold px-2 py-0.5 rounded-md tracking-wider shadow-2xs",
                        getShiftBadgeStyle(shift.shiftCode)
                      )}>
                        {shift.shiftCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-[#0F172A]">
                      <div className="flex items-center gap-1.5">
                        <span>{shift.shiftName}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-[#64748B] transition-transform duration-200", isExpanded && "rotate-180 text-[#2563EB]")} />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[#0F172A]">{formatTime(shift.startTime)}</TableCell>
                    <TableCell className="text-xs font-semibold text-[#0F172A]">{formatTime(shift.endTime)}</TableCell>
                    <TableCell className="text-xs text-[#2563EB] font-semibold">
                      {formatDuration(shift.startTime, shift.endTime)}
                    </TableCell>
                    <TableCell>
                      {isOvernightShift(shift.startTime, shift.endTime) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#4A5A8A] font-semibold bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#E0E7FF]">
                          <Moon className="h-3 w-3" /> Overnight
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#4A7E6A] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#D1FAE5]">
                          <Clock className="h-3 w-3" /> Day
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={shift.active ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <ToggleSwitch
                          checked={shift.active}
                          onChange={() => onToggleActive(shift.id)}
                          title={shift.active ? "Click to Pause" : "Click to Activate"}
                        />

                        <button 
                          type="button"
                          onClick={() => onEdit(shift)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer"
                          title="Edit Shift"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          type="button"
                          className="p-1.5 rounded-lg text-[#A89F91] hover:text-rose-600 hover:bg-rose-50 border border-[#E2E8F0] hover:border-rose-200 transition-colors cursor-pointer"
                          onClick={() => { if (window.confirm(`Are you sure you want to delete "${shift.shiftName}"?`)) onDelete(shift.id); }}
                          title="Delete Shift"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>

                  {/* Expandable Past Changes Sub-Row */}
                  <AnimatePresence>
                    {isExpanded && (
                      <TableRow className="bg-[#F8FAFC] p-0 hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <TableCell colSpan={8} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <ShiftHistoryPanel shift={shift} />
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </TableBody>
        </Table>
      </DataCard>
    </div>
  );
}
