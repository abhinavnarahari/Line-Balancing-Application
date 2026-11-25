import { useState } from "react";
import { cn } from "../../utils/cn";

/*
 * Yamazumi (stacked work) chart: one bar per station = its cycle time (SMV ÷ operators, adjusted for skill).
 * A station is a bottleneck in this chart when its cycle time is above the design pitch line (takt × planned
 * efficiency). The same rule colours the bar, the station label and the header count, in every view.
 */

export interface YamazumiStation {
  stationNum: number;
  operationName: string;
  operationCode: string;
  smvSeconds: number;
  effectiveTimeSecs: number;
  allocatedOps: number;
  capacityPerHour: number;
  loadPercent: number;
  isWipBottleneck?: boolean;
  queueWip?: number;
  wipThreshold?: number;
}

interface YamazumiChartProps {
  data: YamazumiStation[];
  taktTimeSecs: number;
  designedPitchTimeSecs: number;
  requiredHourlyTarget: number;
  requiredDesignCapacity: number;
  plannedEfficiency: number;
  lineBalanceEfficiency: number;
  onAddOperator: (stationIndex: number) => void;
}

type View = "time" | "capacity" | "load";

/** Axis maximum and tick step with round numbers (5, 10, 20, 25, 50 …), about 4–6 ticks. */
export function niceAxis(maxValue: number): { max: number; step: number } {
  const target = Math.max(maxValue, 1) * 1.1;
  const raw = target / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? 10 * pow;
  return { max: Math.ceil(target / step) * step, step };
}

export function YamazumiChart({
  data, taktTimeSecs, designedPitchTimeSecs, requiredHourlyTarget, requiredDesignCapacity,
  plannedEfficiency, lineBalanceEfficiency, onAddOperator,
}: YamazumiChartProps) {
  const [view, setView] = useState<View>("time");
  const [hovered, setHovered] = useState<number | null>(null);

  const pitch = designedPitchTimeSecs > 0 ? designedPitchTimeSecs : taktTimeSecs;
  // One rule for "bottleneck" everywhere in the chart: cycle time above the design pitch line
  const overPitch = (s: YamazumiStation) => pitch > 0 && s.effectiveTimeSecs > pitch + 0.05;
  const bottlenecks = data.filter(overPitch).length;
  const wipAlerts = data.filter(s => s.isWipBottleneck).length;
  // Average of what the bars show (not total SMV ÷ stations, which ignores extra operators)
  const avgCycle = data.length ? data.reduce((n, s) => n + s.effectiveTimeSecs, 0) / data.length : 0;
  const designCapacity = pitch > 0 ? 3600 / pitch : requiredDesignCapacity;

  const value = (s: YamazumiStation) => view === "time" ? s.effectiveTimeSecs : view === "capacity" ? s.capacityPerHour : s.loadPercent;
  const refLines: { key: string; value: number; label: string; style: string; text: string }[] = view === "time"
    ? [
        { key: "pitch", value: pitch, label: `Design pitch ${pitch.toFixed(1)}s`, style: "border-t-2 border-dashed border-[#9C5B3C]", text: "text-[#9C5B3C]" },
        { key: "takt", value: taktTimeSecs, label: `Customer takt ${taktTimeSecs.toFixed(1)}s`, style: "border-t border-dashed border-slate-500", text: "text-slate-600" },
        { key: "avg", value: avgCycle, label: `Average ${avgCycle.toFixed(1)}s`, style: "border-t border-dotted border-[#8C7E6E]", text: "text-[#8C7E6E]" },
      ]
    : view === "capacity"
    ? [
        { key: "cap", value: designCapacity, label: `Design capacity ${designCapacity.toFixed(0)} pcs/h`, style: "border-t-2 border-dashed border-[#9C5B3C]", text: "text-[#9C5B3C]" },
        { key: "target", value: requiredHourlyTarget, label: `Customer target ${requiredHourlyTarget.toFixed(0)} pcs/h`, style: "border-t border-dashed border-slate-500", text: "text-slate-600" },
      ]
    : [{ key: "100", value: 100, label: "100% of design pitch", style: "border-t-2 border-dashed border-[#9C5B3C]", text: "text-[#9C5B3C]" }];
  const lines = refLines.filter(l => l.value > 0);

  const { max, step } = niceAxis(Math.max(...data.map(value), ...lines.map(l => l.value), 1));
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const unit = view === "time" ? "s" : view === "load" ? "%" : "";
  const pct = (v: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const cols = { gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))` };
  const h = hovered !== null ? data[hovered] : null;

  return (
    <div className="bg-white border border-[#E6DDCE] rounded-2xl shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E6DDCE] bg-[#FDFBF7] rounded-t-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#221912]">Yamazumi / Pitch Line Balance Chart</h3>
            <span className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-bold font-mono border",
              bottlenecks === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}>
              {bottlenecks === 0 ? "All stations within pitch" : `${bottlenecks} of ${data.length} stations over pitch`}
            </span>
            {wipAlerts > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold font-mono border bg-amber-50 text-amber-800 border-amber-200">
                {wipAlerts} WIP alert{wipAlerts === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8C7E6E] mt-0.5">
            Design pitch <strong className="text-[#9C5B3C] font-mono">{pitch.toFixed(1)}s</strong> = takt {taktTimeSecs.toFixed(1)}s × {plannedEfficiency}% planned efficiency
            · Line balance efficiency <strong className="text-[#221912] font-mono">{lineBalanceEfficiency}%</strong>
          </p>
        </div>
        <div role="tablist" aria-label="Chart view" className="flex items-center bg-[#F6F1E8] p-1 rounded-xl border border-[#E6DDCE] shadow-2xs">
          {([["time", "Cycle Time (s)"], ["capacity", "Capacity (pcs/hr)"], ["load", "Workload (%)"]] as const).map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                view === v ? "bg-[#9C5B3C] text-white shadow-xs" : "text-[#8C7E6E] hover:text-[#221912]")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Hovered station details (outside the plot, so never clipped) */}
        <div className="min-h-[46px] rounded-xl border border-[#E6DDCE] bg-[#FAF7F2] px-3 py-2 text-xs flex items-center gap-x-5 gap-y-1 flex-wrap">
          {h ? (
            <>
              <span className="font-bold text-[#221912]">#{h.stationNum} {h.operationName}</span>
              <span className="font-mono text-[#8C7E6E]">{h.operationCode}</span>
              <span>SMV <b className="font-mono">{h.smvSeconds.toFixed(1)}s</b></span>
              <span>Operators <b className="font-mono">{h.allocatedOps}</b></span>
              <span>Cycle <b className={cn("font-mono", overPitch(h) ? "text-rose-700" : "text-emerald-700")}>{h.effectiveTimeSecs.toFixed(1)}s</b></span>
              <span>Capacity <b className="font-mono">{h.capacityPerHour} pcs/h</b></span>
              <span className={overPitch(h) ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                {overPitch(h) ? `+${(h.effectiveTimeSecs - pitch).toFixed(1)}s over pitch` : "Within pitch"}
              </span>
              {h.isWipBottleneck && <span className="text-amber-800 font-bold">WIP {h.queueWip} pcs (limit {h.wipThreshold})</span>}
              <button type="button" onClick={() => onAddOperator(hovered!)}
                className="ml-auto px-2.5 py-1 bg-[#9C5B3C] hover:bg-[#B06C49] text-white text-[11px] font-bold rounded-lg cursor-pointer">
                +1 operator
              </button>
            </>
          ) : (
            <span className="text-[#8C7E6E]">Point at a bar to see the station; click it to keep it selected.</span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Y axis */}
          <div className="w-10 shrink-0 relative h-64 select-none" aria-hidden>
            {ticks.map(t => (
              <span key={t} className="absolute right-1 text-[11px] font-mono font-semibold text-[#8C7E6E] translate-y-1/2 leading-none" style={{ bottom: `${pct(t)}%` }}>
                {t}{unit}
              </span>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {/* Plot */}
            <div className="relative h-64 border-l border-b border-[#E6DDCE] bg-slate-50/30">
              {ticks.map(t => <div key={t} className="absolute left-0 right-0 border-b border-[#E6DDCE]/50" style={{ bottom: `${pct(t)}%` }} />)}
              {lines.map(l => <div key={l.key} className={cn("absolute left-0 right-0 z-20 pointer-events-none", l.style)} style={{ bottom: `${pct(l.value)}%` }} />)}

              <div className="absolute inset-0 grid gap-1.5 px-2 items-end z-10" style={cols}>
                {data.map((s, i) => {
                  const v = value(s);
                  const height = Math.max(1.5, pct(v));
                  const bad = view === "load" ? s.loadPercent > 100 + 0.5 : overPitch(s);
                  // Time view: green up to the pitch line, red above it
                  const greenShare = view === "time" && bad ? Math.min(100, (pitch / s.effectiveTimeSecs) * 100) : 100;
                  const labelInside = height > 12;
                  return (
                    <button
                      key={s.stationNum ?? i}
                      type="button"
                      onMouseEnter={() => setHovered(i)}
                      onFocus={() => setHovered(i)}
                      onClick={() => setHovered(i)}
                      aria-label={`Station ${s.stationNum} ${s.operationName}: ${v}${unit}${bad ? ", over pitch" : ""}`}
                      className="relative h-full flex flex-col justify-end items-stretch cursor-pointer focus:outline-none"
                    >
                      {!labelInside && <span className="text-center font-mono font-bold text-[10px] text-[#221912] mb-0.5">{Math.round(v)}{unit}</span>}
                      <span
                        className={cn("relative w-full rounded-t-md overflow-hidden flex flex-col justify-end", hovered === i && "ring-2 ring-[#9C5B3C]")}
                        style={{ height: `${height}%` }}
                      >
                        {view === "time" ? (
                          <>
                            <span className="absolute top-0 left-0 right-0 bg-[#E11D48]" style={{ height: `${100 - greenShare}%` }} />
                            <span className="absolute bottom-0 left-0 right-0 bg-[#10B981]" style={{ height: `${greenShare}%` }} />
                          </>
                        ) : (
                          <span className={cn("absolute inset-0", bad ? "bg-[#E11D48]" : "bg-[#10B981]")} />
                        )}
                        {labelInside && (
                          <span className="relative mb-1 text-center font-mono font-bold text-[10px] text-white drop-shadow-xs">{Math.round(v)}{unit}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Station labels: same grid as the bars, so they always line up */}
            <div className="grid gap-1.5 px-2 mt-1.5" style={cols}>
              {data.map((s, i) => (
                <div key={s.stationNum ?? i} className="text-center min-w-0 select-none" title={`${s.operationCode} · ${s.operationName}`}>
                  <span className={cn("text-[11px] font-mono font-bold block leading-tight", overPitch(s) ? "text-[#E11D48]" : "text-[#221912]")}>
                    #{s.stationNum}{s.isWipBottleneck && <span className="text-amber-600" title="WIP above limit"> •</span>}
                  </span>
                  <span className="text-[9px] text-[#8C7E6E] truncate block font-mono">{s.operationCode}</span>
                  {s.allocatedOps > 1 && <span className="text-[9px] text-[#9C5B3C] font-mono font-bold block">×{s.allocatedOps}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend with the reference values */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-[#E6DDCE] text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#10B981]" /> {view === "time" ? "Within pitch" : view === "capacity" ? "Meets design capacity" : "≤ 100%"}</span>
          <span className="flex items-center gap-1.5 text-[#E11D48]"><span className="w-3 h-3 rounded-sm bg-[#E11D48]" /> {view === "time" ? "Over pitch (bottleneck)" : view === "capacity" ? "Below design capacity" : "Over 100%"}</span>
          {lines.map(l => (
            <span key={l.key} className={cn("flex items-center gap-1.5 font-medium", l.text)}>
              <span className={cn("w-5 h-0", l.style)} /> {l.label}
            </span>
          ))}
          {wipAlerts > 0 && <span className="flex items-center gap-1.5 text-amber-700"><b>•</b> WIP above the station's limit</span>}
        </div>
      </div>
    </div>
  );
}
