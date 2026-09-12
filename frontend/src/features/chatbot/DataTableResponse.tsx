import React, { useState } from "react";
import { Download, Check, AlertTriangle } from "lucide-react";
import type { StructuredPayload } from "./types";

interface DataTableResponseProps {
  payload: StructuredPayload;
}

export const DataTableResponse: React.FC<DataTableResponseProps> = ({ payload }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!payload.rows || payload.rows.length === 0) return null;

  const headers = payload.headers || Object.keys(payload.rows[0]);

  const exportCSV = () => {
    const csvContent = [
      headers.join(","),
      ...payload.rows!.map((row) =>
        headers
          .map((h, cIdx) => {
            const val = row[h] !== undefined ? row[h] : row[Object.keys(row)[cIdx]];
            const strVal = String(val ?? "").replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(payload.title || "sewnexa_data").toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border border-[#E6DDCE] bg-white overflow-hidden shadow-xs">
      {payload.title && (
        <div className="bg-[#FAF7F2] px-3.5 py-2 border-b border-[#E6DDCE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#221912] uppercase tracking-wider">{payload.title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EDE7DE] text-[#6B5C50] font-semibold">
              {payload.rows.length} rows
            </span>
          </div>
          <button
            onClick={exportCSV}
            className="text-[11px] font-medium text-[#8C7E6E] hover:text-[#9C5B3C] flex items-center gap-1 cursor-pointer transition-colors p-1 rounded hover:bg-white/80"
            title="Download CSV"
          >
            {downloaded ? <Check className="h-3 w-3 text-emerald-600" /> : <Download className="h-3 w-3" />}
            <span>{downloaded ? "Saved" : "CSV"}</span>
          </button>
        </div>
      )}
      <div className="overflow-x-auto max-h-64 custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF7F2] text-[#8C7E6E] font-semibold sticky top-0 border-b border-[#E6DDCE] z-10 shadow-2xs">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-1.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE1]">
            {payload.rows.map((row, rIdx) => {
              const isBottleneckRow = headers.some((h) => {
                const val = String(row[h] || "").toUpperCase();
                return (
                  val === "YES" ||
                  val.includes("BOTTLENECK") ||
                  val.includes("OVERLOAD") ||
                  val.includes("CRITICAL") ||
                  val === "GAP" ||
                  val === "TRAINING_REQUIRED"
                );
              });

              return (
                <tr
                  key={rIdx}
                  className={`transition-colors ${
                    isBottleneckRow
                      ? "bg-amber-50/80 hover:bg-amber-100/80 border-l-2 border-l-amber-600 font-medium"
                      : "hover:bg-[#FAF7F2]/60"
                  }`}
                >
                  {headers.map((h, cIdx) => {
                    const val = row[h] !== undefined ? row[h] : row[Object.keys(row)[cIdx]];
                    const strVal = String(val ?? "").trim();
                    const upperVal = strVal.toUpperCase();

                    const isBottleneckCell =
                      upperVal === "YES" ||
                      upperVal.includes("BOTTLENECK") ||
                      upperVal.includes("OVERLOAD") ||
                      upperVal.includes("CRITICAL") ||
                      upperVal === "GAP" ||
                      upperVal === "TRAINING_REQUIRED";

                    const isSuccessCell =
                      upperVal === "MATCH" ||
                      upperVal === "EXCELLENT" ||
                      upperVal === "NORMAL" ||
                      upperVal === "OPTIMAL" ||
                      upperVal === "QUALIFIED";

                    return (
                      <td key={cIdx} className="px-3 py-1.5 text-[#221912] whitespace-nowrap">
                        {isBottleneckCell ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 font-bold text-[10px] border border-amber-300 shadow-2xs">
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-700" />
                            {val}
                          </span>
                        ) : isSuccessCell ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 shadow-2xs">
                            {val}
                          </span>
                        ) : typeof val === "number" ? (
                          <span className="font-mono font-medium">{val}</span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

