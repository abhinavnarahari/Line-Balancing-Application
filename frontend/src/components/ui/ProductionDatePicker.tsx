import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { toLocalDateString } from "../../utils/date";

/*
 * Date picker for production screens: ‹ day ›, the date written out ("Mon, 13 Oct 2026 · Yesterday"), and a calendar
 * that marks the days with production recorded so they can be found at a glance.
 */

export interface ProductionDay { date: string; runs: number; goodQty: number }

interface ProductionDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  /** Days with production recorded (marked in the calendar) */
  productionDays?: ProductionDay[];
  /** "field" = full-width form control; "compact" = toolbar control */
  variant?: "field" | "compact";
  label?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
};

export function formatLongDate(iso: string): string {
  return parse(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** "Today", "Yesterday", "Tomorrow", "5 days ago", "in 3 days" */
export function relativeDay(iso: string, today = toLocalDateString()): string {
  const diff = Math.round((parse(iso).getTime() - parse(today).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return diff < 0 ? `${-diff} days ago` : `in ${diff} days`;
}

export function ProductionDatePicker({ value, onChange, productionDays = [], variant = "compact", label }: ProductionDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const d = parse(value); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const boxRef = useRef<HTMLDivElement>(null);
  const today = toLocalDateString();
  const days = useMemo(() => new Map(productionDays.map(d => [d.date, d])), [productionDays]);
  const latest = productionDays.length ? productionDays[productionDays.length - 1].date : null;
  const current = days.get(value);

  useEffect(() => {
    if (!open) return;
    const d = parse(value);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, value]);

  // Calendar cells for the shown month, weeks starting Monday
  const cells = useMemo(() => {
    const first = new Date(month);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= count; d++) out.push(toLocalDateString(new Date(month.getFullYear(), month.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const pick = (iso: string) => { onChange(iso); setOpen(false); };
  const shiftMonth = (n: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const monthDays = productionDays.filter(d => d.date.startsWith(toLocalDateString(month).slice(0, 7)));

  const stepBtn = "p-1.5 rounded-lg hover:bg-[#F6F1E8] text-[#8C7E6E] hover:text-[#221912] transition-colors cursor-pointer";

  return (
    <div ref={boxRef} className={cn("relative", variant === "field" && "w-full")}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[#221912]">{label}</span>
          {variant === "field" && value !== today && (
            <button type="button" onClick={() => onChange(today)} className="text-[11px] font-bold text-[#9C5B3C] hover:underline cursor-pointer">
              Today
            </button>
          )}
        </div>
      )}
      <div className={cn(
        "flex items-center gap-1 bg-white border border-[#E6DDCE] shadow-2xs",
        variant === "field" ? "h-11 rounded-2xl px-1.5 w-full" : "p-1 rounded-xl"
      )}>
        <button type="button" className={stepBtn} onClick={() => onChange(addDays(value, -1))} aria-label="Previous day" title="Previous day">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Date: ${formatLongDate(value)}. Change date`}
          className="flex-1 min-w-0 flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[#FAF7F2] cursor-pointer text-left"
        >
          <CalendarDays className="w-4 h-4 text-[#9C5B3C] shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-[#221912] truncate">{formatLongDate(value)}</span>
            <span className={cn("block text-[10px] font-semibold truncate", current ? "text-emerald-700" : "text-[#8C7E6E]")}>
              {relativeDay(value, today)}{current ? ` · ${current.goodQty.toLocaleString()} pcs recorded` : " · no production recorded"}
            </span>
          </span>
        </button>
        <button type="button" className={stepBtn} onClick={() => onChange(addDays(value, 1))} aria-label="Next day" title="Next day">
          <ChevronRight className="w-4 h-4" />
        </button>
        {variant === "compact" && value !== today && (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[10px] font-extrabold text-[#9C5B3C] border border-[#E6DDCE] hover:bg-white transition-colors cursor-pointer shrink-0"
          >
            Today
          </button>
        )}
      </div>

      {open && (
        <div role="dialog" aria-label="Choose a date" className="absolute z-50 mt-1.5 w-72 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" className={stepBtn} onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-[#221912]">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
            <button type="button" className={stepBtn} onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map(w => <span key={w} className="text-[9.5px] font-bold uppercase text-[#8C7E6E] py-1">{w}</span>)}
            {cells.map((iso, i) => {
              if (!iso) return <span key={`e${i}`} />;
              const info = days.get(iso);
              const selected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pick(iso)}
                  aria-pressed={selected}
                  aria-label={`${formatLongDate(iso)}${info ? `, ${info.goodQty} pieces recorded` : ""}`}
                  title={info ? `${info.runs} runs · ${info.goodQty.toLocaleString()} good pcs` : undefined}
                  className={cn(
                    "relative h-8 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                    selected ? "bg-[#9C5B3C] text-white" : info ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100" : "text-[#221912] hover:bg-[#F6F1E8]",
                    isToday && !selected && "ring-1 ring-[#9C5B3C]",
                    parse(iso).getDay() === 0 && !selected && !info && "text-[#B8A99A]"
                  )}
                >
                  {parse(iso).getDate()}
                  {info && <span className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full", selected ? "bg-white" : "bg-emerald-600")} />}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[#F0EAE0] flex items-center justify-between gap-2 text-[10.5px]">
            <span className="flex items-center gap-1.5 text-[#8C7E6E]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" /> Production recorded{monthDays.length ? ` (${monthDays.length} day${monthDays.length === 1 ? "" : "s"})` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              {latest && latest !== value && (
                <button type="button" onClick={() => pick(latest)} className="font-bold text-emerald-700 hover:underline cursor-pointer">Latest production</button>
              )}
              <button type="button" onClick={() => pick(today)} className="font-bold text-[#9C5B3C] hover:underline cursor-pointer">Today</button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
