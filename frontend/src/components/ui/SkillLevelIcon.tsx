import { clampRating, SKILL_LEVELS, MAX_SKILL_RATING } from "../../features/skill-matrix/skillScale";

/**
 * The factory skill circle: one filled quarter per level, filled in the same order as the paper matrix
 * (1 = top-right, 2 = top half, 3 = top half + bottom-right, 4 = full).
 */
const QUARTERS = [
  "M12 12 L12 2 A10 10 0 0 1 22 12 Z", // top-right
  "M12 12 L2 12 A10 10 0 0 1 12 2 Z", // top-left
  "M12 12 L22 12 A10 10 0 0 1 12 22 Z", // bottom-right
  "M12 12 L12 22 A10 10 0 0 1 2 12 Z", // bottom-left
];

interface SkillLevelIconProps {
  /** 0 or empty = not rated (empty circle) */
  rating?: number | null;
  size?: number;
  className?: string;
  /** Use one neutral colour instead of the level colour. */
  mono?: boolean;
  /** Hide from screen readers when a text label sits next to it. */
  decorative?: boolean;
}

export function SkillLevelIcon({ rating, size = 16, className, mono, decorative }: SkillLevelIconProps) {
  const filled = rating && rating > 0 ? clampRating(rating) : 0;
  const info = filled ? SKILL_LEVELS[filled] : null;
  const color = mono ? "currentColor" : info?.color ?? "#94a3b8";
  const label = info ? `Level ${filled} of ${MAX_SKILL_RATING}: ${info.name}` : "Not rated";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
    >
      {!decorative && <title>{label}</title>}
      {QUARTERS.slice(0, filled).map(d => <path key={d} d={d} fill={color} />)}
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1" opacity="0.45" />
      <line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

/** Icon plus level name, e.g. ◕ Independent */
export function SkillLevelBadge({ rating, size = 14, showName = true }: { rating?: number | null; size?: number; showName?: boolean }) {
  const filled = rating && rating > 0 ? clampRating(rating) : 0;
  const info = filled ? SKILL_LEVELS[filled] : null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10.5px] font-bold ${info ? info.badge : "bg-slate-50 text-slate-500 border-slate-200"}`}
      title={info ? `${info.name} (${info.band}) — ${info.description}` : "Not rated"}
    >
      <SkillLevelIcon rating={filled} size={size} decorative />
      {showName ? (info ? info.name : "Not rated") : filled || "—"}
    </span>
  );
}
