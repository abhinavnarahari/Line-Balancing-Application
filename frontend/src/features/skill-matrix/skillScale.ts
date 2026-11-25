/**
 * The factory's 4-level skill scale (quarters of the skill circle). Every skill rating in the app uses it,
 * and it must match backend common/skill/SkillScale.java.
 *
 *  1  In training             20–25% of target
 *  2  Needs supervisor help   40–50%
 *  3  Independent             60–70%  achieves target without help, solves problems
 *  4  Expert                  >70%    achieves target and can train others
 */
export type SkillRating = 1 | 2 | 3 | 4;

export const MIN_SKILL_RATING = 1;
export const MAX_SKILL_RATING = 4;
/** From this level an operator can run the operation on their own ("certified"). */
export const INDEPENDENT_RATING: SkillRating = 3;
export const DEFAULT_REQUIRED_RATING: SkillRating = INDEPENDENT_RATING;
export const SKILL_RATINGS: SkillRating[] = [4, 3, 2, 1];

export interface SkillLevelInfo {
  rating: SkillRating;
  /** e.g. "Independent" */
  name: string;
  /** Factory legend band, e.g. "60–70%" */
  band: string;
  /** What the operator can do at this level (factory legend wording). */
  description: string;
  /** Efficiency assumed for planning (share of standard output). */
  planningEfficiency: number;
  /** Lowest measured efficiency that earns this level. */
  minEfficiency: number;
  /** Tailwind classes for a badge. */
  badge: string;
  /** Fill colour for the quarter-circle icon. */
  color: string;
}

export const SKILL_LEVELS: Record<SkillRating, SkillLevelInfo> = {
  4: {
    rating: 4, name: "Expert", band: ">70%",
    description: "Achieves target and can train others",
    planningEfficiency: 0.75, minEfficiency: 0.70,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200", color: "#15803d",
  },
  3: {
    rating: 3, name: "Independent", band: "60–70%",
    description: "Achieves target without supervisor help and solves problems",
    planningEfficiency: 0.65, minEfficiency: 0.55,
    badge: "bg-sky-50 text-sky-700 border-sky-200", color: "#0369a1",
  },
  2: {
    rating: 2, name: "Needs support", band: "40–50%",
    description: "Achieves target with supervisor help",
    planningEfficiency: 0.45, minEfficiency: 0.33,
    badge: "bg-amber-50 text-amber-700 border-amber-200", color: "#b45309",
  },
  1: {
    rating: 1, name: "In training", band: "20–25%",
    description: "Under training",
    planningEfficiency: 0.25, minEfficiency: 0,
    badge: "bg-rose-50 text-rose-700 border-rose-200", color: "#be123c",
  },
};

/** Whole rating 1–4 (out-of-range and fractional values are rounded and clamped). */
export function clampRating(value: number): SkillRating {
  if (!Number.isFinite(value)) return MIN_SKILL_RATING;
  return Math.max(MIN_SKILL_RATING, Math.min(MAX_SKILL_RATING, Math.round(value))) as SkillRating;
}

/** Level for a measured efficiency (standard time / actual cycle time, as a fraction: 0.72 = 72%). */
export function ratingForEfficiency(efficiency: number): SkillRating {
  for (const r of SKILL_RATINGS) {
    if (efficiency >= SKILL_LEVELS[r].minEfficiency) return r;
  }
  return 1;
}

/** Efficiency assumed for planning at a level (fraction). */
export function planningEfficiency(rating: number): number {
  return SKILL_LEVELS[clampRating(rating)].planningEfficiency;
}

/** Expected cycle time (seconds) at a level for an operation with the given standard minutes. */
export function expectedCycleSeconds(rating: number, smvMinutes: number): number {
  const smvSec = (smvMinutes > 0 ? smvMinutes : 0.5) * 60;
  return Math.round((smvSec / planningEfficiency(rating)) * 10) / 10;
}

/** Level for a measured cycle time against the operation's standard minutes. */
export function ratingForCycleTime(seconds: number, smvMinutes?: number): SkillRating {
  if (!(seconds > 0)) return 1;
  const smvSec = (smvMinutes && smvMinutes > 0 ? smvMinutes : 0.5) * 60;
  return ratingForEfficiency(smvSec / seconds);
}

export function skillLevelName(rating: number | null | undefined): string {
  return rating && rating > 0 ? SKILL_LEVELS[clampRating(rating)].name : "Not rated";
}
