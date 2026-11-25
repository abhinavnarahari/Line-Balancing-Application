import { SKILL_LEVELS, skillLevelName, type SkillRating } from "../skill-matrix/skillScale";

/*
 * Cycle-time bands for each skill level of an operation (factory 4-level scale, see skillScale.ts).
 * By default the bands come from the operation's standard time (SMV) and the efficiency band of each level;
 * an IE can override them per operation (stored in this browser).
 */

export interface OperationRatingTier {
  minSec: number;
  maxSec: number;
  label: string; // e.g. "26–29 sec"
  efficiencyLabel?: string; // e.g. ">70%"
  skillLevel: string; // level name, e.g. "Independent"
  badgeColor: string; // Tailwind color styles
  criteria?: string;
}

export interface OperationRatingBenchmark {
  operationName: string;
  operationCode: string;
  defaultSmv: number; // in minutes
  isCustom?: boolean;
  rating4: OperationRatingTier | null;
  rating3: OperationRatingTier | null;
  rating2: OperationRatingTier | null;
  rating1: OperationRatingTier | null;
  notes?: string;
}

export const TIER_KEYS = ["rating4", "rating3", "rating2", "rating1"] as const;
export type TierKey = (typeof TIER_KEYS)[number];
export const tierKey = (rating: SkillRating): TierKey => `rating${rating}` as TierKey;

/** Per-operation overrides (v2 = 4-level scale; older 5-level overrides are ignored). */
const CUSTOM_BENCHMARKS_STORAGE_KEY = "sewnexa_operation_benchmarks_v2";
export const BENCHMARKS_UPDATED_EVENT = "qtexpro_benchmarks_updated";

export function getCustomBenchmarks(): Record<string, OperationRatingBenchmark> {
  try {
    const raw = localStorage.getItem(CUSTOM_BENCHMARKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeKey(str: string): string {
  return str.trim().toLowerCase();
}

function notify(detail: unknown) {
  try {
    window.dispatchEvent(new CustomEvent(BENCHMARKS_UPDATED_EVENT, { detail }));
  } catch {
    /* no window (tests) */
  }
}

export function saveCustomBenchmark(operationKey: string, benchmark: OperationRatingBenchmark): void {
  try {
    const all = getCustomBenchmarks();
    all[normalizeKey(operationKey)] = { ...benchmark, isCustom: true };
    localStorage.setItem(CUSTOM_BENCHMARKS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save custom benchmark:", e);
  }
  notify({ operationKey });
}

export function resetBenchmarkToDefault(operationKey: string): void {
  try {
    const all = getCustomBenchmarks();
    delete all[normalizeKey(operationKey)];
    localStorage.setItem(CUSTOM_BENCHMARKS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Failed to reset benchmark:", e);
  }
  notify({ operationKey, reset: true });
}

export function resetAllBenchmarksToDefault(): void {
  try {
    localStorage.removeItem(CUSTOM_BENCHMARKS_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to reset all benchmarks:", e);
  }
  notify({ resetAll: true });
}

export function subscribeToBenchmarkChanges(listener: () => void): () => void {
  window.addEventListener(BENCHMARKS_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(BENCHMARKS_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function tier(rating: SkillRating, minSec: number, maxSec: number | null): OperationRatingTier {
  const info = SKILL_LEVELS[rating];
  return {
    minSec,
    maxSec: maxSec ?? Number.MAX_SAFE_INTEGER,
    label: maxSec === null ? `> ${minSec} sec` : minSec <= 0 ? `≤ ${maxSec} sec` : `${minSec}–${maxSec} sec`,
    efficiencyLabel: info.band,
    skillLevel: info.name,
    badgeColor: info.badge,
    criteria: info.description,
  };
}

/** Bands from the standard time: a level is earned while efficiency (SMV ÷ cycle time) stays at or above its minimum. */
export function generateDynamicSmvBenchmark(
  operationName: string,
  operationCode: string,
  smvMinutes: number = 0.5
): OperationRatingBenchmark {
  const safeSmv = smvMinutes > 0 ? smvMinutes : 0.5;
  const smvSec = safeSmv * 60;
  const max4 = Math.max(1, Math.round(smvSec / SKILL_LEVELS[4].minEfficiency));
  const max3 = Math.max(max4 + 1, Math.round(smvSec / SKILL_LEVELS[3].minEfficiency));
  const max2 = Math.max(max3 + 1, Math.round(smvSec / SKILL_LEVELS[2].minEfficiency));
  return {
    operationName,
    operationCode,
    defaultSmv: safeSmv,
    rating4: tier(4, 0, max4),
    rating3: tier(3, max4, max3),
    rating2: tier(2, max3, max2),
    rating1: tier(1, max2, null),
  };
}

/**
 * Benchmark for an operation: the IE's override for it if one was saved, otherwise bands from its SMV.
 */
export function getBenchmarkForOperation(nameOrCode?: string, fallbackSmv?: number): OperationRatingBenchmark | null {
  if (!nameOrCode) return null;
  const clean = normalizeKey(nameOrCode);
  const custom = getCustomBenchmarks();
  if (custom[clean]) return custom[clean];
  for (const b of Object.values(custom)) {
    if (b.operationCode.toLowerCase() === clean || b.operationName.toLowerCase() === clean) return b;
  }
  return generateDynamicSmvBenchmark(nameOrCode, "OP-GEN", fallbackSmv && fallbackSmv > 0 ? fallbackSmv : 0.5);
}

/** Skill level (1–4) for a measured cycle time on an operation. */
export function getRatingForOperationCycleTime(seconds: number, operationNameOrCode?: string, defaultSmv?: number): SkillRating {
  if (!(seconds > 0)) return 1;
  const b = getBenchmarkForOperation(operationNameOrCode ?? "operation", defaultSmv);
  if (!b) return 1;
  if (b.rating4 && seconds <= b.rating4.maxSec) return 4;
  if (b.rating3 && seconds <= b.rating3.maxSec) return 3;
  if (b.rating2 && seconds <= b.rating2.maxSec) return 2;
  return 1;
}

/** Cycle-time band label of a level for an operation, e.g. "26–29 sec". */
export function getRatingRangeLabel(rating: number, operationNameOrCode?: string, defaultSmv?: number): string {
  const b = getBenchmarkForOperation(operationNameOrCode ?? "operation", defaultSmv);
  if (!b || rating < 1 || rating > 4) return "—";
  return b[tierKey(rating as SkillRating)]?.label ?? "—";
}

/** Level name: 1 In training, 2 Needs support, 3 Independent, 4 Expert. */
export function getRatingTitle(rating: number): string {
  return rating >= 1 && rating <= 4 ? skillLevelName(rating) : "Not Evaluated";
}
