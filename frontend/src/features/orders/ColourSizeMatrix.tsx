import { Plus, Trash2, Palette, Layers } from "lucide-react";
import type { Size } from "../sizes/api";
import type { OrderType } from "./api";
import { type ColourRow, grandTotal, newColourRow, rowTotal, sizeTotal } from "./orderColours";
import { cn } from "../../utils/cn";

interface ColourSizeMatrixProps {
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  rows: ColourRow[];
  onRowsChange: (rows: ColourRow[]) => void;
  sizes: Size[];
  /** Colours used on other orders, offered as suggestions */
  colourSuggestions?: string[];
}

/**
 * Quantities per colour and size. Single colour = one row; Multiple colours = one row per colour.
 */
export function ColourSizeMatrix({ orderType, onOrderTypeChange, rows, onRowsChange, sizes, colourSuggestions = [] }: ColourSizeMatrixProps) {
  const multi = orderType === "MULTI_COLOR";
  const update = (id: string, patch: Partial<ColourRow>) => onRowsChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const setQty = (row: ColourRow, sizeId: string, value: string) => update(row.id, { qty: { ...row.qty, [sizeId]: value.replace(/[^\d]/g, "") } });
  const total = grandTotal(rows);
  const listId = "order-colour-suggestions";

  const chooseType = (type: OrderType) => {
    if (type === orderType) return;
    if (type === "SINGLE_COLOR") {
      // Keep the first colour that has quantities (the form blocks saving if others still have quantities)
      const filled = rows.filter(r => rowTotal(r) > 0 || r.color.trim());
      onRowsChange(filled.length > 0 ? filled : [rows[0] ?? newColourRow()]);
    } else if (rows.length < 2) {
      onRowsChange([...rows, newColourRow()]);
    }
    onOrderTypeChange(type);
  };

  return (
    <div className="border border-[#E6DDCE] rounded-xl bg-white shadow-2xs">
      <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E6DDCE] rounded-t-xl flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#9C5B3C]" />
          <h3 className="text-sm font-bold text-[#221912]">Colours &amp; Sizes</h3>
        </div>
        <div role="radiogroup" aria-label="Order type" className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6DDCE]">
          {([
            ["SINGLE_COLOR", "Single colour", "One colour, several sizes"],
            ["MULTI_COLOR", "Multiple colours", "Several colours, each with sizes"],
          ] as const).map(([type, label, hint]) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={orderType === type}
              title={hint}
              onClick={() => chooseType(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors",
                orderType === type ? "bg-[#9C5B3C] text-white" : "text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <datalist id={listId}>{colourSuggestions.map(c => <option key={c} value={c} />)}</datalist>
        <table className="w-full border-separate border-spacing-y-1.5 text-xs">
          <thead>
            <tr className="text-[10.5px] font-bold uppercase tracking-wide text-[#8C7E6E]">
              <th className="text-left px-1 min-w-[150px]">Colour</th>
              {sizes.map(sz => (
                <th key={sz.id} className="px-1 text-center min-w-[64px]" title={sz.label}>{sz.code}</th>
              ))}
              <th className="px-2 text-right min-w-[70px]">Total</th>
              {multi && <th className="w-8" aria-label="Remove" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td className="px-1">
                  <div className="relative">
                    <Palette className="w-3.5 h-3.5 text-[#9C5B3C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      list={listId}
                      value={row.color}
                      onChange={e => update(row.id, { color: e.target.value })}
                      placeholder={multi ? `Colour ${i + 1}` : "e.g. Navy Blue"}
                      aria-label={`Colour ${i + 1}`}
                      maxLength={100}
                      className="w-full h-9 pl-8 pr-2 bg-white border border-[#E6DDCE] rounded-lg font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
                    />
                  </div>
                </td>
                {sizes.map(sz => (
                  <td key={sz.id} className="px-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.qty[String(sz.id)] ?? ""}
                      onChange={e => setQty(row, String(sz.id), e.target.value)}
                      placeholder="0"
                      aria-label={`${row.color || `Colour ${i + 1}`} size ${sz.code} quantity`}
                      className="w-full h-9 px-2 text-right font-mono font-semibold bg-[#FAF7F2]/60 border border-[#E6DDCE] rounded-lg text-[#221912] focus:outline-none focus:border-[#9C5B3C] focus:bg-white"
                    />
                  </td>
                ))}
                <td className="px-2 text-right font-mono font-bold text-[#221912]">{rowTotal(row).toLocaleString()}</td>
                {multi && (
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => onRowsChange(rows.length > 1 ? rows.filter(r => r.id !== row.id) : [newColourRow()])}
                      className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      aria-label={`Remove ${row.color || `colour ${i + 1}`}`}
                      title="Remove colour"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-[11px] font-bold text-[#8C7E6E]">
              <td className="px-1 pt-2 border-t border-[#F0EAE0]">Total per size</td>
              {sizes.map(sz => (
                <td key={sz.id} className="px-2 pt-2 border-t border-[#F0EAE0] text-right font-mono">{sizeTotal(rows, String(sz.id)).toLocaleString() || "0"}</td>
              ))}
              <td className="px-2 pt-2 border-t border-[#F0EAE0] text-right font-mono text-[#9C5B3C] text-xs">{total.toLocaleString()} pcs</td>
              {multi && <td className="border-t border-[#F0EAE0]" />}
            </tr>
          </tfoot>
        </table>

        {multi && (
          <button
            type="button"
            onClick={() => onRowsChange([...rows, newColourRow()])}
            className="mt-2 w-full py-2 rounded-xl border border-dashed border-[#9C5B3C]/60 hover:border-[#9C5B3C] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] text-[#9C5B3C] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add colour
          </button>
        )}
        <p className="mt-2 text-[10.5px] text-[#8C7E6E]">
          {multi ? "One row per colour; leave a size blank if that colour doesn't have it." : "Enter the quantity for each size; leave sizes you don't need blank."}
        </p>
      </div>
    </div>
  );
}
