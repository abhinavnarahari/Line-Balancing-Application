import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

/* ─── PageHeader ─────────────────────────────────────────── */
interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <motion.div
      className={cn("flex items-end justify-between gap-6 flex-wrap pb-8 border-b border-[#E0D8C0]", className)}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="space-y-2">
        {eyebrow && (
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-[#D89A5C] to-[#B8763F]" />
            <span className="text-[10.5px] font-semibold tracking-[0.22em] text-[#B8763F] uppercase">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-[2.75rem] leading-[1.08] tracking-[-0.02em] text-[#1E1B16]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#6E6656] max-w-md leading-relaxed mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
        "bg-white border border-[#E0D8C0] overflow-hidden",
        "shadow-[0_1px_4px_0_rgba(38,35,29,0.06),0_0_0_1px_rgba(38,35,29,0.03)]",
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
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0D8C0] bg-[#FAF7F2]">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[#26231D] tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-[#8A8270] mt-0.5">{subtitle}</p>}
        </div>
        {count !== undefined && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#E9E1CC] text-[#6E6656] rounded-sm">
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
    <div className="divide-y divide-[#EDE8DF]">
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
        <div className="w-12 h-12 rounded-full bg-[#F0EAE0] flex items-center justify-center text-[#8A8270] mb-4">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-[#26231D] mb-1">{title}</p>
      {description && <p className="text-xs text-[#8A8270] max-w-xs leading-relaxed mb-4">{description}</p>}
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
  active:   "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  inactive: "bg-red-50 text-red-600 border-red-200/80",
  present:  "bg-blue-50 text-blue-700 border-blue-200/80",
  absent:   "bg-red-50 text-red-600 border-red-200/80",
  leave:    "bg-amber-50 text-amber-700 border-amber-200/80",
  late:     "bg-orange-50 text-orange-700 border-orange-200/80",
};

export function StatusBadge({ status, label }: BadgeProps) {
  const key = status.toLowerCase();
  const classes = badgeMap[key] || "bg-slate-50 text-slate-600 border-slate-200/80";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide uppercase border",
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
  Master:  "bg-[#FBF4EC] text-[#9B5A32] border-[#D89A5C]/50",
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
