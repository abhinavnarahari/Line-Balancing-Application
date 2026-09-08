import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, ChevronDown } from "lucide-react";
import { auditApi } from "../../lib/audit";

/* ─── PageHeader ─────────────────────────────────────────── */
interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  showImportExport?: boolean;
  onExport?: () => void;
  onImport?: (file: File) => void;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, showImportExport, onExport, onImport, className }: PageHeaderProps) {
  return (
    <motion.div
      className={cn("bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex items-center justify-between gap-6 flex-wrap mb-6", className)}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="space-y-1">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold tracking-[0.16em] text-[#9C5B3C] uppercase">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight text-[#221912]">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[#8C7E6E] max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {showImportExport && (
          <div className="flex items-center gap-2 mr-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] rounded-lg transition-colors border border-transparent hover:border-[#E6DDCE] cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              Import Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImport) onImport(file);
                e.target.value = '';
              }} />
            </label>
            <button
              onClick={() => onExport && onExport()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] rounded-lg transition-colors border border-transparent hover:border-[#E6DDCE] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </button>
            <div className="h-5 w-px bg-[#E6DDCE] mx-2" />
          </div>
        )}
        {action && action}
      </div>
    </motion.div>
  );
}

/* ─── DataCard ───────────────────────────────────────────── */
interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function DataCard({ children, className, noPad }: DataCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-white border border-[#E6DDCE] overflow-hidden shadow-[0_1px_3px_rgba(34,25,18,0.05)]",
        !noPad && "p-0",
        className
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── DataCard Header ─────────────────────────────────────── */
interface DataCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  count?: number;
}

export function DataCardHeader({ title, subtitle, action, count }: DataCardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE0] px-5 py-4 bg-white">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#221912]">{title}</h3>
          {subtitle && <p className="text-xs text-[#8C7E6E] mt-0.5">{subtitle}</p>}
        </div>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#F6F1E8] text-[#9C5B3C] rounded-md border border-[#E6DDCE]">
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ─── Skeleton Row ───────────────────────────────────────── */
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[#F0EAE0]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex items-center gap-4" style={{ animationDelay: `${i * 60}ms` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton h-4 rounded-md"
              style={{ width: j === 1 ? "30%" : j === cols - 1 ? "10%" : "18%", opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────── */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#F6F1E8] flex items-center justify-center text-[#8C7E6E] mb-4 border border-[#E6DDCE]">
          {icon}
        </div>
      )}
      <p className="text-sm font-bold text-[#221912] mb-1">{title}</p>
      {description && <p className="text-xs text-[#8C7E6E] max-w-xs leading-relaxed mb-4">{description}</p>}
      {action}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────── */
interface BadgeProps {
  status: "active" | "inactive" | "present" | "absent" | "leave" | "late" | string;
  label?: string;
}

const badgeMap: Record<string, string> = {
  active:   "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]",
  inactive: "bg-[#fff1f2] text-[#be123c] border-[#fecaca]",
  present:  "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]",
  absent:   "bg-[#fff1f2] text-[#be123c] border-[#fecaca]",
  leave:    "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
  late:     "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
};

export function StatusBadge({ status, label }: BadgeProps) {
  const key = status.toLowerCase();
  const classes = badgeMap[key] || "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border",
      classes
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label || status}
    </span>
  );
}

/* ─── Difficulty / Skill Badge ───────────────────────────── */
interface SkillBadgeProps { level: "Low" | "Medium" | "High" | "Trainee" | "Junior" | "Senior" | "Master" | string }

const skillMap: Record<string, string> = {
  Low:     "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]",
  Medium:  "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
  High:    "bg-[#fff1f2] text-[#be123c] border-[#fecaca]",
  Trainee: "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]",
  Junior:  "bg-[#F6F1E8] text-[#9C5B3C] border-[#E6DDCE]",
  Senior:  "bg-[#EFE9DF] text-[#8B5E3C] border-[#D8C9B8]",
  Master:  "bg-[#E8DCC9] text-[#221912] border-[#C5B9A8]",
};

export function SkillBadge({ level }: SkillBadgeProps) {
  const classes = skillMap[level] || "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]";
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border",
      classes
    )}>
      {level}
    </span>
  );
}

/* --- RecentActivityLog ------------------------------------------- */
export interface ActivityItem {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
}

export function RecentActivityLog({ entityType, entityId }: { entityType?: string; entityId?: string | number }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      setLoading(true);
      auditApi.getRecentLogs(entityType, entityId)
        .then((data) => {
          if (isMounted) {
            setLogs(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          console.error("Failed to load audit logs:", err);
          if (isMounted) setLogs([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, entityType, entityId]);

  return (
    <div className="mt-8 rounded-2xl bg-white border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-[#FEFCF9] transition-colors border-b border-[#F0EAE0]"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#221912] uppercase tracking-wider">
            Audit Trail & Past Changes {entityType ? `· ${entityType}` : ''}
          </span>
          <span className="text-[10px] font-mono font-semibold bg-[#F6F1E8] text-[#9C5B3C] px-2 py-0.5 rounded border border-[#E6DDCE]">
            Live Feed
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#8C7E6E] transition-transform duration-200",
            isOpen && "rotate-180 text-[#9C5B3C]"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[#FDFBF7]"
          >
            {loading ? (
              <div className="p-6 flex items-center justify-center gap-2 text-xs text-[#8C7E6E]">
                <div className="w-4 h-4 border-2 border-[#9C5B3C] border-t-transparent rounded-full animate-spin" />
                <span>Fetching activity logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8C7E6E] italic">
                No past changes recorded for this section yet.
              </div>
            ) : (
              <div className="p-6 space-y-3.5 max-h-80 overflow-y-auto custom-scrollbar">
                {logs.map((log, index) => {
                  const actor = log.performedBy || "Admin";
                  let details = log.details || `${log.action} on ${log.entityName} #${log.entityId}`;
                  if (details.toLowerCase().startsWith(actor.toLowerCase())) {
                    details = details.slice(actor.length).trim();
                  }

                  const isDelete = log.action?.toUpperCase().includes("DELETE");
                  const isCreate = log.action?.toUpperCase().includes("CREATE");

                  return (
                    <div key={log.id || index} className="flex items-start justify-between gap-4 text-xs border-b border-[#F0EAE0] pb-3 last:border-0 last:pb-0 group">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] tracking-wider shrink-0 mt-0.5">
                          {actor}
                        </span>
                        <div>
                          <div className="font-semibold text-[#221912] leading-snug">
                            {details}
                          </div>
                          <div className="text-[10.5px] text-[#8C7E6E] font-mono mt-0.5 flex items-center gap-2">
                            <span className={cn(
                              "font-bold",
                              isDelete ? "text-rose-600" : isCreate ? "text-emerald-700" : "text-[#9C5B3C]"
                            )}>
                              {log.action}
                            </span>
                            <span>·</span>
                            <span>{log.entityName} #{log.entityId}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10.5px] text-[#8C7E6E] shrink-0 font-mono bg-[#F6F1E8] px-2 py-0.5 rounded-md border border-[#E6DDCE]">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PremiumSelect ────────────────────────────────────────── */
export interface PremiumSelectOption {
  value: string | number;
  label: string;
}

interface PremiumSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: PremiumSelectOption[];
  className?: string;
  name?: string;
  disabled?: boolean;
}

export function PremiumSelect({ value, onChange, options, className, name, disabled }: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={value} />}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 bg-white border rounded-xl px-3 text-xs font-semibold text-[#221912] flex items-center justify-between transition-colors shadow-2xs",
          isOpen ? "border-[#9C5B3C] ring-1 ring-[#9C5B3C]/20" : "border-[#E6DDCE] hover:border-[#9C5B3C]/60",
          disabled && "opacity-50 cursor-not-allowed hover:border-[#E6DDCE]"
        )}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#8C7E6E] transition-transform duration-200", isOpen && "rotate-180 text-[#9C5B3C]")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 bg-white border border-[#E6DDCE] rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                  String(option.value) === String(value)
                    ? "bg-[#F6F1E8] text-[#9C5B3C] font-bold"
                    : "text-[#221912] hover:bg-[#FDFBF7]"
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
