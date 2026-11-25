import type { ImportTemplate } from "../../utils/excel";
import { excelDateToIso, RowErrors } from "../../utils/importParsing";
import type { CreateOrderDTO, OrderStatus, OrderType } from "./api";

/**
 * Order import layout: one row per size of an order. Rows with the same Order No make one order
 * (rows without an Order No are grouped by Style No + Color + Delivery Date and numbered by the server);
 * the order details (style, buyer, dates, status) are read from its rows and must agree. Rows of one order with
 * different colours make a multi-colour order (a blank colour on a later row = the order's first colour).
 */
export const ORDERS_TEMPLATE: ImportTemplate = {
  name: "Production Orders",
  columns: [
    { header: "Order No", aliases: ["Order Number", "PO No", "PO Number"], description: "Optional. Repeat it on one row per size. Blank = numbered automatically (PO-<year>-<next>); rows without it are grouped into one order by Style No + Color + Delivery Date.", example: "PO-2026-101" },
    { header: "Style No", required: true, aliases: ["Style", "Style Code"], description: "Must exist in the Style Catalog", example: "ST-2026-01" },
    { header: "Buyer", description: "Optional. Blank = the style's buyer (if it has one)", example: "Buyer name" },
    { header: "Order Type", aliases: ["Type", "Colour Type", "Color Type"], description: "Single colour or Multiple colours (optional; blank = decided from the colours). Fill it on the order's first row.", example: "Multiple colours" },
    { header: "Color", required: true, aliases: ["Colour"], description: "Colour of this row's size. A multi-colour order repeats its Order No on one row per colour and size; a blank colour on a later row = the order's first colour.", example: "Navy" },
    { header: "Order Date", description: "Date (blank = today)", example: "2026-11-12" },
    { header: "Delivery Date", required: true, aliases: ["Delivery", "Ship Date"], description: "Date, not before the order date", example: "2026-12-20" },
    { header: "Plan to Complete Date", aliases: ["Planned Completion Date", "Plan Completion Date"], description: "Date (optional)", example: "2026-12-15" },
    { header: "Status", description: "Planned, In Production, On Hold or Completed (blank = Planned)", example: "Planned" },
    { header: "Size", required: true, aliases: ["Size Code"], description: "Size code or label from Garment Sizes", example: "M" },
    { header: "Quantity", required: true, aliases: ["Qty", "Order Qty"], description: "Pieces for this size (whole number above 0)", example: 500 },
  ],
  exampleNotes: [
    "Example only: this sheet is never imported. Fill your orders in the \"Data\" sheet.",
    "One row per colour and size. PO-2026-101 is a single-colour order (Navy); PO-2026-102 is a multi-colour order (Black, White, Mocha).",
    "Order details (style, dates, status, type) are read from an order's first row; later rows can leave them blank.",
  ],
  exampleRows: [
    { "Order No": "PO-2026-101", "Style No": "STY-1376", "Order Type": "Single colour", "Color": "Navy", "Order Date": "2026-11-24", "Delivery Date": "2026-12-20", "Plan to Complete Date": "2026-12-15", "Status": "Planned", "Size": "S", "Quantity": 500 },
    { "Order No": "PO-2026-101", "Color": "Navy", "Size": "M", "Quantity": 700 },
    { "Order No": "PO-2026-101", "Color": "Navy", "Size": "L", "Quantity": 300 },
    { "Order No": "PO-2026-102", "Style No": "STY-1722", "Order Type": "Multiple colours", "Color": "Black", "Order Date": "2026-11-24", "Delivery Date": "2026-12-31", "Status": "Planned", "Size": "S", "Quantity": 400 },
    { "Order No": "PO-2026-102", "Color": "Black", "Size": "M", "Quantity": 600 },
    { "Order No": "PO-2026-102", "Color": "White", "Size": "S", "Quantity": 250 },
    { "Order No": "PO-2026-102", "Color": "White", "Size": "M", "Quantity": 350 },
    { "Order No": "PO-2026-102", "Color": "Mocha", "Size": "L", "Quantity": 200 },
  ],
};

const STATUSES: OrderStatus[] = ["PLANNED", "IN_PRODUCTION", "ON_HOLD", "COMPLETED"];

interface StyleRef { id: string | number; styleNo: string; buyer?: string | null }
interface SizeRef { id: string | number; code: string; label: string }

export interface OrderImportResult {
  orders: CreateOrderDTO[];
  errors: RowErrors;
}

/** Value of a template column in a row, using its header or any alias (case-insensitive). */
function cell(row: Record<string, unknown>, header: string): string {
  const col = ORDERS_TEMPLATE.columns.find(c => c.header === header)!;
  const names = [col.header, ...(col.aliases ?? [])].map(n => n.toLowerCase());
  for (const key of Object.keys(row)) {
    if (names.includes(key.trim().toLowerCase())) {
      const v = row[key];
      return v === null || v === undefined ? "" : String(v).trim();
    }
  }
  return "";
}

function rawCell(row: Record<string, unknown>, header: string): unknown {
  const col = ORDERS_TEMPLATE.columns.find(c => c.header === header)!;
  const names = [col.header, ...(col.aliases ?? [])].map(n => n.toLowerCase());
  const key = Object.keys(row).find(k => names.includes(k.trim().toLowerCase()));
  return key === undefined ? undefined : row[key];
}

/** Validates every row and groups them into orders. Nothing should be saved unless `errors.ok`. */
export function parseOrderRows(
  rows: Record<string, unknown>[],
  styles: StyleRef[],
  sizes: SizeRef[],
  existingOrderNos: string[],
  today: string,
): OrderImportResult {
  const errors = new RowErrors();
  const styleByNo = new Map(styles.map(s => [s.styleNo.trim().toUpperCase(), s]));
  const sizeByKey = new Map<string, SizeRef>();
  for (const s of sizes) {
    sizeByKey.set(s.label.trim().toUpperCase(), s);
    sizeByKey.set(s.code.trim().toUpperCase(), s); // code wins over a label with the same text
  }
  const existing = new Set(existingOrderNos.map(n => n.trim().toUpperCase()));

  type Draft = CreateOrderDTO & { firstRow: number; qty: Map<string, { color: string; sizeId: string | number; quantity: number }> };
  const drafts = new Map<string, Draft>();

  rows.forEach((row, i) => {
    const orderNo = cell(row, "Order No");
    const sizeText = cell(row, "Size");
    const qtyText = cell(row, "Quantity");
    if (!orderNo && !sizeText && !qtyText && !cell(row, "Style No")) return; // blank line

    if (orderNo && existing.has(orderNo.toUpperCase())) { errors.add(i, `Order ${orderNo} already exists`); return; }

    // Order-level fields
    const styleNo = cell(row, "Style No");
    const style = styleByNo.get(styleNo.toUpperCase());
    const color = cell(row, "Color");
    const rawOrderDate = rawCell(row, "Order Date");
    const orderDate = cell(row, "Order Date") ? excelDateToIso(rawOrderDate) : today;
    const rawDelivery = rawCell(row, "Delivery Date");
    const deliveryDate = excelDateToIso(rawDelivery);
    const rawPlan = rawCell(row, "Plan to Complete Date");
    const planDate = cell(row, "Plan to Complete Date") ? excelDateToIso(rawPlan) : null;
    const statusText = cell(row, "Status").toUpperCase().replace(/[\s-]+/g, "_");
    const typeText = cell(row, "Order Type").toLowerCase().replace(/[\s_-]+/g, "");
    const orderType: OrderType | undefined | null = !typeText ? undefined
      : ["single", "singlecolour", "singlecolor", "single_color"].includes(typeText) ? "SINGLE_COLOR"
      : ["multi", "multiple", "multiplecolours", "multiplecolors", "multicolour", "multicolor", "multi_color"].includes(typeText) ? "MULTI_COLOR"
      : null;
    const status = (statusText || "PLANNED") as OrderStatus;

    // Without an Order No, the order is identified by its style, color and delivery date
    if (!orderNo && (!styleNo || !cell(row, "Color") || !cell(row, "Delivery Date"))) {
      errors.add(i, "Order No is blank, so Style No, Color and Delivery Date are needed to group this row into an order");
      return;
    }
    const key = orderNo
      ? orderNo.toUpperCase()
      : `AUTO|${styleNo.toUpperCase()}|${cell(row, "Color").toUpperCase()}|${deliveryDate ?? cell(row, "Delivery Date")}`;
    const orderLabel = orderNo || `for ${styleNo} / ${cell(row, "Color")}`;

    let draft = drafts.get(key);
    if (!draft) {
      if (!styleNo) errors.add(i, "Style No is required");
      else if (!style) errors.add(i, `Style ${styleNo} is not in the Style Catalog`);
      if (!color) errors.add(i, "Color is required");
      if (!orderDate) errors.add(i, `Order Date is not a valid date (got "${cell(row, "Order Date")}")`);
      if (!deliveryDate) errors.add(i, cell(row, "Delivery Date") ? `Delivery Date is not a valid date (got "${cell(row, "Delivery Date")}")` : "Delivery Date is required");
      if (cell(row, "Plan to Complete Date") && !planDate) errors.add(i, `Plan to Complete Date is not a valid date (got "${cell(row, "Plan to Complete Date")}")`);
      if (orderDate && deliveryDate && deliveryDate < orderDate) errors.add(i, "Delivery Date is before the Order Date");
      if (orderDate && planDate && planDate < orderDate) errors.add(i, "Plan to Complete Date is before the Order Date");
      if (!STATUSES.includes(status)) errors.add(i, `Status must be Planned, In Production, On Hold or Completed (got "${cell(row, "Status")}")`);
      if (orderType === null) errors.add(i, `Order Type must be Single colour or Multiple colours (got "${cell(row, "Order Type")}")`);
      const buyer = cell(row, "Buyer") || style?.buyer?.trim() || "";

      draft = {
        orderNo, buyer, styleId: style?.id ?? "", color,
        orderDate: orderDate ?? "", deliveryDate: deliveryDate ?? "",
        plannedCompletionDate: planDate ?? undefined,
        status: STATUSES.includes(status) ? status : "PLANNED",
        orderType: orderType ?? undefined,
        sizeLines: [], firstRow: i, qty: new Map(),
      };
      drafts.set(key, draft);
    } else {
      // Later rows of the same order may leave order details blank, but must not contradict the first row
      const first = draft;
      const differs = (label: string, value: string, expected: string) => {
        if (value && value.toUpperCase() !== expected.toUpperCase()) {
          errors.add(i, `${label} "${value}" differs from row ${first.firstRow + 2} of order ${orderLabel}`);
        }
      };
      differs("Style No", styleNo, styles.find(s => s.id === first.styleId)?.styleNo ?? styleNo);
      if (cell(row, "Delivery Date") && deliveryDate !== draft.deliveryDate) {
        errors.add(i, `Delivery Date differs from row ${draft.firstRow + 2} of order ${orderLabel}`);
      }
    }

    // Size line
    if (!sizeText) { errors.add(i, "Size is required"); return; }
    const size = sizeByKey.get(sizeText.toUpperCase());
    if (!size) { errors.add(i, `Size ${sizeText} is not in Garment Sizes`); return; }
    const qty = Number(qtyText);
    if (!qtyText || !Number.isInteger(qty) || qty <= 0) {
      errors.add(i, `Quantity must be a whole number above 0 (got "${qtyText}")`);
      return;
    }
    // A later row may leave the colour blank (= the order's first colour); same colour + size rows are added up
    const lineColour = color || draft.color;
    const lineKey = `${lineColour.toUpperCase()}|${size.id}`;
    const prev = draft.qty.get(lineKey);
    draft.qty.set(lineKey, { color: prev?.color ?? lineColour, sizeId: size.id, quantity: (prev?.quantity ?? 0) + qty });
  });

  for (const d of drafts.values()) {
    const colours = new Set([...d.qty.values()].map(l => l.color.toUpperCase()));
    if (d.orderType === "SINGLE_COLOR" && colours.size > 1) {
      errors.add(d.firstRow, `Order ${d.orderNo || "(no order no)"} is Single colour but has ${colours.size} colours; use Multiple colours`);
    }
    if (d.orderType === "MULTI_COLOR" && colours.size < 2) {
      errors.add(d.firstRow, `Order ${d.orderNo || "(no order no)"} is Multiple colours but has only one colour; use Single colour`);
    }
  }

  const orders: CreateOrderDTO[] = [...drafts.values()].map(d => ({
    orderNo: d.orderNo, buyer: d.buyer, styleId: d.styleId, color: d.color,
    orderDate: d.orderDate, deliveryDate: d.deliveryDate, plannedCompletionDate: d.plannedCompletionDate,
    status: d.status,
    ...(d.orderType ? { orderType: d.orderType } : {}),
    sizeLines: [...d.qty.values()].map(l => ({ color: l.color, sizeId: l.sizeId, quantity: l.quantity })),
  }));
  return { orders, errors };
}
