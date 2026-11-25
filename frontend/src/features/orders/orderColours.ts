import type { Order, OrderType } from "./api";

/** One colour of an order with a quantity per size id (strings while typing). */
export interface ColourRow {
  id: string;
  color: string;
  qty: Record<string, string>;
}

let seq = 0;
export const newColourRow = (color = ""): ColourRow => ({ id: `c${Date.now()}-${seq++}`, color, qty: {} });

const toInt = (v: string | undefined) => {
  const n = Number(String(v ?? "").trim());
  return Number.isInteger(n) && n > 0 ? n : 0;
};

/** Rows for editing an existing order: one per colour, in first-seen order. */
export function rowsFromOrder(order: Pick<Order, "color" | "sizeLines"> | null | undefined): ColourRow[] {
  if (!order || !order.sizeLines?.length) return [newColourRow(order?.color ?? "")];
  const rows = new Map<string, ColourRow>();
  for (const l of order.sizeLines) {
    const colour = (l.color ?? order.color ?? "").trim();
    const key = colour.toUpperCase();
    if (!rows.has(key)) rows.set(key, newColourRow(colour));
    const row = rows.get(key)!;
    row.qty[String(l.sizeId)] = String(toInt(row.qty[String(l.sizeId)]) + l.quantity);
  }
  return [...rows.values()];
}

export const rowTotal = (row: ColourRow) => Object.values(row.qty).reduce((n, v) => n + toInt(v), 0);
export const sizeTotal = (rows: ColourRow[], sizeId: string) => rows.reduce((n, r) => n + toInt(r.qty[sizeId]), 0);
export const grandTotal = (rows: ColourRow[]) => rows.reduce((n, r) => n + rowTotal(r), 0);

/** Problems that stop saving, in the user's words. Empty = OK. */
export function checkColourRows(type: OrderType, rows: ColourRow[]): string[] {
  const problems: string[] = [];
  const used = rows.filter(r => rowTotal(r) > 0 || r.color.trim());
  const withQty = rows.filter(r => rowTotal(r) > 0);
  if (withQty.length === 0) problems.push("Enter a quantity for at least one size.");
  used.forEach((r, i) => {
    if (!r.color.trim()) problems.push(`Colour ${i + 1} has quantities but no colour name.`);
    else if (rowTotal(r) === 0) problems.push(`"${r.color.trim()}" has no quantities; enter them or remove the colour.`);
  });
  const seen = new Set<string>();
  for (const r of used) {
    const key = r.color.trim().toUpperCase();
    if (key && seen.has(key)) problems.push(`"${r.color.trim()}" is entered twice; put its sizes in one row.`);
    if (key) seen.add(key);
  }
  if (type === "SINGLE_COLOR" && used.length > 1) problems.push("A single-colour order has one colour. Remove the other colours or choose Multiple colours.");
  if (type === "MULTI_COLOR" && withQty.length < 2) problems.push("A multi-colour order needs at least two colours with quantities. Add a colour or choose Single colour.");
  return problems;
}

/** Lines to send: one per colour + size with a quantity. */
export function linesFromRows(rows: ColourRow[]): { color: string; sizeId: string; quantity: number }[] {
  return rows.flatMap(r => Object.entries(r.qty)
    .map(([sizeId, v]) => ({ color: r.color.trim(), sizeId, quantity: toInt(v) }))
    .filter(l => l.quantity > 0 && l.color));
}
