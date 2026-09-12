import React from "react";
import type { StructuredPayload } from "./types";

interface ChartResponseProps {
  payload: StructuredPayload;
}

export const ChartResponse: React.FC<ChartResponseProps> = ({ payload }) => {
  if (!payload.chartData || payload.chartData.length === 0) return null;

  const maxVal = Math.max(
    ...payload.chartData.map((d) => Math.max(Number(d.target || 0), Number(d.actual || 0))),
    1
  );

  return (
    <div className="mt-3 rounded-xl border border-[#E6DDCE] bg-white p-3.5 shadow-xs">
      {payload.title && (
        <div className="text-xs font-bold text-[#221912] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>{payload.title}</span>
          <span className="text-[10px] font-mono font-medium text-[#8C7E6E]">{payload.chartData.length} items</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[10px] font-semibold text-[#8C7E6E]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-xs bg-[#D4C8B8]" />
          <span>Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-xs bg-[#9C5B3C]" />
          <span>Actual Output</span>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="space-y-3 pt-1">
        {payload.chartData.map((item, idx) => {
          const target = Number(item.target || 0);
          const actual = Number(item.actual || 0);
          const targetPct = Math.min(100, Math.round((target / maxVal) * 100));
          const actualPct = Math.min(100, Math.round((actual / maxVal) * 100));
          const achievementPct = target > 0 ? Math.round((actual / target) * 100) : 0;
          const isMet = actual >= target && target > 0;

          return (
            <div key={idx} className="space-y-1 bg-[#FAF7F2]/50 p-2 rounded-lg border border-[#EDE7DE]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#221912]">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#8C7E6E]">
                    <strong className="text-[#9C5B3C]">{actual}</strong> / {target} pcs
                  </span>
                  {target > 0 && (
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                        isMet ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {achievementPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Dual Bar Track */}
              <div className="h-3.5 bg-white rounded-md overflow-hidden border border-[#E6DDCE] relative flex flex-col justify-center px-0.5">
                {/* Target Bar */}
                <div
                  className="h-1 bg-[#D4C8B8] rounded-full mb-0.5 transition-all duration-500"
                  style={{ width: `${targetPct}%` }}
                />
                {/* Actual Bar */}
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    isMet ? "bg-emerald-600" : "bg-[#9C5B3C]"
                  }`}
                  style={{ width: `${actualPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

