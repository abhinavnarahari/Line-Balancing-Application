/**
 * Shared building blocks for the three dashboards (Overall, Plant Management, Line Operations), so they read as
 * one product: one header pattern, one KPI card, one section card, one status vocabulary, one bar-chart style.
 *
 * Visual rules (keep them when adding to a dashboard):
 * - Sentence-case labels (no ALL-CAPS headings); smallest text 11px, body 13px, section titles 15px, KPI values 26px.
 * - Numbers are tabular (`tabular-nums`) so columns line up.
 * - Status colours are reserved for state (good / warn / critical) and always come with a word or icon.
 * - Charts: one series colour (brand brown) on a neutral track; text never wears the data colour.
 */
import React from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";
import { TONE, type Tone } from "./dashboardTheme";

export type { Tone } from "./dashboardTheme";


/* ─── Page header ─────────────────────────────────────────────────────────────────────────────────── */

export function DashboardHeader({
  title,
  subtitle,
  meta,
  actions,
  onRefresh,
  refreshing,
  updatedAt,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Small status chips under the title (use <MetaChip>) */
  meta?: React.ReactNode;
  /** Buttons on the right (use <HeaderButton>); keep to one primary + up to three secondary */
  actions?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** e.g. "10:42" — shown next to the refresh button */
  updatedAt?: string;
}) {
  return (
    <header className="bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_2px_rgba(34,25,18,0.04)] px-6 py-5 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight text-[#221912]">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#8C7E6E] leading-relaxed max-w-3xl">{subtitle}</p>}
        {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
      </div>
      {(actions || onRefresh) && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[12px] font-medium text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              title="Refresh now"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              {updatedAt ? <span className="tabular-nums">Updated {updatedAt}</span> : <span>Refresh</span>}
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export function MetaChip({ tone = "neutral", icon, children, title }: { tone?: Tone; icon?: React.ReactNode; children: React.ReactNode; title?: string }) {
  const t = TONE[tone];
  return (
    <span title={title} className={cn("inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[11.5px] font-semibold", t.bg, t.border, t.text)}>
      {icon ?? <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

type ButtonTarget = { to?: string; onClick?: () => void };

export function HeaderButton({
  icon,
  children,
  variant = "secondary",
  title,
  to,
  onClick,
}: { icon?: React.ReactNode; children: React.ReactNode; variant?: "primary" | "secondary"; title?: string } & ButtonTarget) {
  const cls = cn(
    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap",
    variant === "primary"
      ? "bg-[#9C5B3C] hover:bg-[#854B30] text-white shadow-sm shadow-[#9C5B3C]/20"
      : "bg-white border border-[#E6DDCE] text-[#5C4D3E] hover:bg-[#FAF7F2] hover:text-[#221912]"
  );
  return to ? (
    <Link to={to} className={cls} title={title}>{icon}{children}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} title={title}>{icon}{children}</button>
  );
}

/* ─── Alerts ──────────────────────────────────────────────────────────────────────────────────────── */

export function AlertRow({
  tone,
  icon,
  title,
  children,
  action,
}: { tone: "warn" | "critical" | "info"; icon: React.ReactNode; title: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div className={cn("flex items-start sm:items-center gap-3 rounded-xl border px-4 py-3", t.bg, t.border)} role="alert">
      <span className={cn("shrink-0 mt-0.5 sm:mt-0", t.text)}>{icon}</span>
      <div className="flex-1 min-w-0 text-[13px] leading-snug">
        <span className={cn("font-semibold", t.text)}>{title}</span>
        {children && <span className="text-[#5C4D3E]"> — {children}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── KPI cards ───────────────────────────────────────────────────────────────────────────────────── */

export function KpiCard({
  label,
  value,
  unit,
  caption,
  icon,
  tone = "neutral",
  progress,
  to,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption?: React.ReactNode;
  icon?: React.ReactNode;
  /** Colours the caption dot and progress bar; leave "neutral" unless the number is a status */
  tone?: Tone;
  /** 0–100: draws a thin meter under the value */
  progress?: number;
} & ButtonTarget) {
  const t = TONE[tone];
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-[#8C7E6E]">{label}</span>
        {icon && <span className="text-[#B5A897] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[26px] leading-none font-bold tracking-tight text-[#221912] tabular-nums">{value}</span>
        {unit && <span className="text-[12px] font-medium text-[#8C7E6E]">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-[#EFE8DD] overflow-hidden">
          <div className={cn("h-full rounded-full", tone === "neutral" ? "bg-[#9C5B3C]" : t.bar)} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {caption && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#8C7E6E] leading-snug">
          {tone !== "neutral" && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.dot)} />}
          <span className="truncate">{caption}</span>
        </div>
      )}
    </>
  );
  const cls = "block text-left bg-white rounded-xl border border-[#E6DDCE] px-4 py-4 shadow-[0_1px_2px_rgba(34,25,18,0.04)] min-w-0";
  const interactive = "hover:border-[#D6C7B3] hover:shadow-[0_2px_8px_rgba(34,25,18,0.06)] transition-all cursor-pointer";
  if (to) return <Link to={to} className={cn(cls, interactive)}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cn(cls, interactive, "w-full")}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

/* ─── Section card ────────────────────────────────────────────────────────────────────────────────── */

export function Section({
  title,
  subtitle,
  icon,
  badge,
  actions,
  children,
  flush,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  /** small count/status next to the title */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** no body padding (tables, lists that run edge to edge) */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("bg-white rounded-2xl border border-[#E6DDCE] shadow-[0_1px_2px_rgba(34,25,18,0.04)] min-w-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-5 py-4 border-b border-[#F0EAE0]">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-[#9C5B3C] shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]">{icon}</span>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-bold tracking-tight text-[#221912]">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-[12.5px] text-[#8C7E6E] mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-[12.5px] font-semibold text-[#9C5B3C] hover:text-[#7A452D] whitespace-nowrap">
      {children} →
    </Link>
  );
}

/* ─── Status pill, meter, count badge ─────────────────────────────────────────────────────────────── */

export function StatusPill({ tone, children, icon, title }: { tone: Tone; children: React.ReactNode; icon?: React.ReactNode; title?: string }) {
  const t = TONE[tone];
  return (
    <span title={title} className={cn("inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md border text-[11.5px] font-semibold whitespace-nowrap", t.bg, t.border, t.text)}>
      {icon ?? <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

export function CountBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const t = TONE[tone];
  return <span className={cn("inline-flex items-center h-5 px-1.5 rounded-md border text-[11px] font-semibold tabular-nums", t.bg, t.border, t.text)}>{children}</span>;
}

export function Meter({ value, tone = "brand", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-[#EFE8DD] overflow-hidden", className)} role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", TONE[tone].bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ─── Tabs (single row, scrolls instead of wrapping) ──────────────────────────────────────────────── */

export function SegmentTabs<T extends string>({
  value,
  onChange,
  options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-[#E6DDCE] bg-[#FAF7F2] p-0.5" role="tablist">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
              active ? "bg-white text-[#221912] shadow-[0_1px_2px_rgba(34,25,18,0.08)]" : "text-[#8C7E6E] hover:text-[#221912]"
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn("tabular-nums text-[11px]", active ? "text-[#9C5B3C]" : "text-[#B5A897]")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Bar list chart: actual vs target per row ────────────────────────────────────────────────────── */

export interface BarRow {
  id: string | number;
  label: string;
  sublabel?: string;
  value: number;
  /** draws a target tick and computes attainment */
  target?: number;
  to?: string;
}

/**
 * Horizontal bars on a shared scale (max of all values/targets): one series colour, a neutral track, a dark target
 * tick, and a hover tooltip per row. Values and labels are text-coloured, never bar-coloured.
 */
export function BarList({ rows, unit = "", emptyText = "No data yet" }: { rows: BarRow[]; unit?: string; emptyText?: string }) {
  if (rows.length === 0) return <p className="text-[13px] text-[#8C7E6E] py-6 text-center">{emptyText}</p>;
  const max = Math.max(1, ...rows.map(r => Math.max(r.value, r.target ?? 0)));
  const fmt = (n: number) => n.toLocaleString();
  return (
    <ul className="space-y-3.5">
      {rows.map(r => {
        const pct = (r.value / max) * 100;
        const tgtPct = r.target ? (r.target / max) * 100 : undefined;
        const attain = r.target ? Math.round((r.value / r.target) * 100) : undefined;
        const tip = `${r.label}: ${fmt(r.value)}${unit ? " " + unit : ""}${r.target ? ` of ${fmt(r.target)} target (${attain}%)` : ""}`;
        const labelEl = (
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#221912] truncate">{r.label}</div>
            {r.sublabel && <div className="text-[11.5px] text-[#8C7E6E] truncate">{r.sublabel}</div>}
          </div>
        );
        return (
          <li key={r.id} className="group grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4" title={tip}>
            {r.to ? <Link to={r.to} className="hover:underline decoration-[#D6C7B3] underline-offset-2 min-w-0">{labelEl}</Link> : labelEl}
            <div className="relative h-2.5 rounded-full bg-[#EFE8DD]">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#9C5B3C] group-hover:bg-[#854B30] transition-colors"
                style={{ width: `${pct}%`, minWidth: r.value > 0 ? 4 : 0 }}
              />
              {tgtPct !== undefined && (
                <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-[#221912]/70" style={{ left: `calc(${tgtPct}% - 1px)` }} aria-hidden />
              )}
            </div>
            <div className="text-right whitespace-nowrap">
              <span className="text-[13px] font-semibold text-[#221912] tabular-nums">{fmt(r.value)}</span>
              {r.target !== undefined && <span className="text-[12px] text-[#8C7E6E] tabular-nums"> / {fmt(r.target)}</span>}
              {attain !== undefined && <span className="ml-2 text-[12px] font-semibold text-[#5C4D3E] tabular-nums">{attain}%</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Legend for BarList when targets are drawn */
export function BarLegend({ unit }: { unit?: string }) {
  return (
    <div className="flex items-center gap-4 text-[11.5px] text-[#8C7E6E]">
      <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#9C5B3C]" />Actual{unit ? ` (${unit})` : ""}</span>
      <span className="inline-flex items-center gap-1.5"><span className="w-0.5 h-3 rounded-full bg-[#221912]/70" />Target</span>
    </div>
  );
}

/* ─── Small helpers ───────────────────────────────────────────────────────────────────────────────── */

export function EmptyHint({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      {icon && <div className="w-10 h-10 rounded-xl bg-[#F6F1E8] text-[#B5A897] flex items-center justify-center mb-3 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>}
      <p className="text-[13.5px] font-semibold text-[#221912]">{title}</p>
      {children && <p className="text-[12.5px] text-[#8C7E6E] mt-1 max-w-md">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Label/value pair used inside cards */
export function Stat({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[11.5px] text-[#8C7E6E]">{label}</div>
      <div className="text-[13px] font-semibold text-[#221912] tabular-nums truncate">{children}</div>
    </div>
  );
}
