import { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown } from "lucide-react";

import { ExcelImportExport } from "../common/ExcelImportExport";

/* ─── PageHeader ─────────────────────────────────────────── */
interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  showImportExport?: boolean;
  onImport?: (data: any[]) => void;
  exportData?: any[];
  exportFilename?: string;
  className?: string;
}

export function PageHeader({ 
  eyebrow, 
  title, 
  description, 
  action, 
  showImportExport, 
  onImport,
  exportData,
  exportFilename,
  className 
}: PageHeaderProps) {
  return (
    <motion.div
      className={cn("bg-white rounded-2xl border border-[#E6DDCE] p-6 shadow-sm flex items-center justify-between gap-6 flex-wrap mb-6", className)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="space-y-1">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#B8935A] uppercase">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-[22px] font-bold leading-tight text-[#221912]">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] font-medium text-[#8C7E6E] max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {showImportExport && (
          <div className="flex items-center gap-2 mr-2">
            <ExcelImportExport 
              onImport={onImport || (() => console.warn('onImport not provided'))}
              exportData={exportData || []}
              filename={exportFilename || title.replace(/\s+/g, '_').toLowerCase()}
            />
            <div className="h-6 w-px bg-[#E6DDCE] mx-2" />
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
        "rounded-2xl bg-white border border-[#E6DDCE] overflow-hidden",
        "shadow-[0_1px_3px_rgba(34,25,18,0.05)]",
        !noPad && "p-0",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE0] px-5 py-4">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-[#221912]">{title}</h3>
          {subtitle && <p className="text-[12px] font-medium text-[#8C7E6E] mt-0.5">{subtitle}</p>}
        </div>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#FAFAF8] text-[#8C7E6E] rounded-sm">
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
              className="skeleton h-4 rounded-sm"
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
        <div className="w-12 h-12 rounded-full bg-[#FAFAF8] flex items-center justify-center text-[#8C7E6E] mb-4">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-bold text-[#221912] mb-1">{title}</p>
      {description && <p className="text-[12px] font-medium text-[#8C7E6E] max-w-xs leading-relaxed mb-4">{description}</p>}
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
  active:   "bg-[#F3F5F2] text-[#77876F]",
  inactive: "bg-[#FDF2F0] text-[#C0462B]",
  present:  "bg-[#F3F5F2] text-[#77876F]",
  absent:   "bg-[#FDF2F0] text-[#C0462B]",
  leave:    "bg-[#F6F1E8] text-[#8C7E6E]",
  late:     "bg-[#F6F1E8] text-[#8C7E6E]",
};

export function StatusBadge({ status, label }: BadgeProps) {
  const key = status.toLowerCase();
  const classes = badgeMap[key] || "bg-slate-50 text-slate-600 border-slate-200/80";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase",
      classes
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label || status}
    </span>
  );
}

/* ─── Difficulty / Skill Badge ───────────────────────────── */
interface SkillBadgeProps { level: "Low" | "Medium" | "High" | "Trainee" | "Junior" | "Senior" | "Master" | string }

const skillMap: Record<string, string> = {
  Low:     "bg-teal-50 text-teal-700 border-teal-200/80",
  Medium:  "bg-amber-50 text-amber-700 border-amber-200/80",
  High:    "bg-red-50 text-red-700 border-red-200/80",
  Trainee: "bg-slate-50 text-slate-600 border-slate-200/80",
  Junior:  "bg-blue-50 text-blue-700 border-blue-200/80",
  Senior:  "bg-violet-50 text-violet-700 border-violet-200/80",
  Master:  "bg-[#FBF4EC] text-[#9B5A32] border-[#FFE5BF]/50",
};

export function SkillBadge({ level }: SkillBadgeProps) {
  const classes = skillMap[level] || "bg-slate-50 text-slate-600 border-slate-200/80";
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10.5px] font-semibold tracking-wide uppercase border",
      classes
    )}>
      {level}
    </span>
  );
}

/* --- RecentActivityLog ------------------------------------------- */
export interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

interface RecentActivityLogProps {
  activities?: ActivityItem[];
  className?: string;
}

export function RecentActivityLog({ activities = [], className }: RecentActivityLogProps) {
  const logs = activities.length > 0 ? activities : [
    { id: "1", action: "Created a new record", user: "Admin", timestamp: "10 mins ago" },
    { id: "2", action: "Updated master configuration", user: "System", timestamp: "1 hour ago" },
    { id: "3", action: "Exported data to Excel", user: "Admin", timestamp: "3 hours ago" },
  ];

  return (
    <div className={cn("mt-10", className)}>
      <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#8C7E6E] uppercase mb-4 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        Recent Activity
      </h3>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-[12px] bg-white border border-[#E6DDCE] px-5 py-3 rounded-xl shadow-sm transition-all hover:shadow-md">
            <span className="font-semibold text-[#221912] text-[13px]">{log.action}</span>
            <div className="flex items-center gap-3 text-[#8C7E6E] mt-2 sm:mt-0">
              <span>by <span className="font-semibold text-[#B48259]">{log.user}</span></span>
              <span>{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
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
      {/* Hidden native input for form compatibility if needed */}
      {name && <input type="hidden" name={name} value={value} />}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 bg-white border rounded-sm px-3 text-sm text-[#221912] flex items-center justify-between transition-colors",
          isOpen ? "border-[#B48259] ring-1 ring-[#B48259]/20" : "border-[#E6DDCE] hover:border-[#B48259]/60",
          disabled && "opacity-50 cursor-not-allowed hover:border-[#E6DDCE]"
        )}
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#8C7E6E] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 bg-white border border-[#E6DDCE] rounded-sm shadow-lg overflow-hidden max-h-60 overflow-y-auto"
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
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  String(option.value) === String(value)
                    ? "bg-[#FEFCF9] text-[#B48259] font-medium"
                    : "text-[#221912] hover:bg-[#FEFCF9]"
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
