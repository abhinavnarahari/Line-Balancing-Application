import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "./Modal";
import { registerColumnPicker, type ColumnPickRequest, type ColumnSelection } from "../../utils/excel";

/** Exports of the same kind (file name without its date) remember the last column choice in this browser. */
const memoryKey = (fileName: string) =>
  "excel-export-columns:" + fileName.replace(/[_\s-]*\d{4}-\d{2}-\d{2}.*$/, "").replace(/[_\s-]*\d+$/, "");

function loadRemembered(fileName: string): ColumnSelection | null {
  try {
    const raw = localStorage.getItem(memoryKey(fileName));
    return raw ? (JSON.parse(raw) as ColumnSelection) : null;
  } catch {
    return null;
  }
}

function remember(fileName: string, selection: ColumnSelection) {
  try {
    localStorage.setItem(memoryKey(fileName), JSON.stringify(selection));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

interface Pending {
  request: ColumnPickRequest;
  resolve: (selection: ColumnSelection | null) => void;
}

/** Mounted once in the app layout; every Excel export asks it which columns to include. */
export function ExportColumnsDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const pendingRef = useRef<Pending | null>(null);
  pendingRef.current = pending;

  useEffect(() => {
    registerColumnPicker(request => new Promise(resolve => {
      pendingRef.current?.resolve(null);
      const remembered = loadRemembered(request.fileName);
      const initial: Record<string, Set<string>> = {};
      for (const s of request.sheets) {
        const prev = remembered?.[s.sheet]?.filter(c => s.columns.includes(c));
        // A remembered choice only applies if it still matches columns in this export
        initial[s.sheet] = new Set(prev && prev.length > 0 ? prev : s.columns);
      }
      setSelected(initial);
      setPending({ request, resolve });
    }));
    return () => {
      registerColumnPicker(null);
      pendingRef.current?.resolve(null);
    };
  }, []);

  if (!pending) return null;
  const { request } = pending;
  const multiSheet = request.sheets.length > 1;
  const total = request.sheets.reduce((n, s) => n + s.columns.length, 0);
  const chosen = request.sheets.reduce((n, s) => n + (selected[s.sheet]?.size ?? 0), 0);

  const finish = (result: ColumnSelection | null) => {
    pending.resolve(result);
    setPending(null);
  };

  const toggle = (sheet: string, column: string) => {
    setSelected(prev => {
      const next = new Set(prev[sheet]);
      if (next.has(column)) next.delete(column); else next.add(column);
      return { ...prev, [sheet]: next };
    });
  };

  const setAll = (sheet: string, columns: string[]) =>
    setSelected(prev => ({ ...prev, [sheet]: new Set(columns) }));

  const download = () => {
    const result: ColumnSelection = {};
    for (const s of request.sheets) {
      // Keep the export's own column order
      result[s.sheet] = s.columns.filter(c => selected[s.sheet]?.has(c));
    }
    remember(request.fileName, result);
    finish(result);
  };

  return (
    <Modal
      isOpen
      onClose={() => finish(null)}
      title="Export to Excel"
      subtitle="Choose the columns to include in the file."
      maxWidth="max-w-xl"
      zIndexClass="z-[100000]"
    >
      <div className="space-y-5">
        {request.sheets.map(s => {
          const sel = selected[s.sheet] ?? new Set<string>();
          return (
            <fieldset key={s.sheet} className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <legend className="text-xs font-bold text-[#221912]">
                  {multiSheet ? s.sheet : "Columns"}
                  <span className="ml-2 font-mono font-semibold text-[#8C7E6E]">{sel.size}/{s.columns.length}</span>
                </legend>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <button type="button" className="text-[#9C5B3C] hover:underline cursor-pointer" onClick={() => setAll(s.sheet, s.columns)}>Select all</button>
                  <button type="button" className="text-[#8C7E6E] hover:underline cursor-pointer" onClick={() => setAll(s.sheet, [])}>Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {s.columns.map(col => (
                  <label
                    key={col}
                    className="flex items-center gap-2.5 rounded-lg border border-[#EFE7DA] px-3 py-2 text-xs text-[#221912] hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[#9C5B3C] cursor-pointer"
                      checked={sel.has(col)}
                      onChange={() => toggle(s.sheet, col)}
                    />
                    <span className="truncate" title={col}>{col}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-5 pt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#8C7E6E]">
          {chosen === 0 ? "Select at least one column." : `${chosen} of ${total} columns`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => finish(null)}
            className="h-9 px-4 rounded-xl border border-[#E6DDCE] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#8C7E6E] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={download}
            disabled={chosen === 0}
            className="h-9 px-4 rounded-xl bg-[#9C5B3C] hover:bg-[#854D33] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
