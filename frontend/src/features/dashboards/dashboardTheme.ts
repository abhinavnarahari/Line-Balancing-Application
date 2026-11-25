/** Colour tokens shared by the dashboards (see DashboardUI.tsx for the components). */
export const DASH = {
  ink: "#221912",
  muted: "#8C7E6E",
  faint: "#B5A897",
  border: "#E6DDCE",
  divider: "#F0EAE0",
  subtle: "#FAF7F2",
  brand: "#9C5B3C",
  track: "#EFE8DD",
} as const;

export type Tone = "neutral" | "good" | "warn" | "critical" | "info" | "brand";

export const TONE: Record<Tone, { text: string; bg: string; border: string; dot: string; bar: string }> = {
  neutral: { text: "text-[#5C4D3E]", bg: "bg-[#F6F1E8]", border: "border-[#E6DDCE]", dot: "bg-[#B5A897]", bar: "bg-[#B5A897]" },
  good: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  warn: { text: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", bar: "bg-amber-500" },
  critical: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", bar: "bg-rose-500" },
  info: { text: "text-sky-800", bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500", bar: "bg-sky-500" },
  brand: { text: "text-[#7A452D]", bg: "bg-[#FBF5EF]", border: "border-[#EBD9C8]", dot: "bg-[#9C5B3C]", bar: "bg-[#9C5B3C]" },
};

export const toneClasses = (tone: Tone) => TONE[tone];
