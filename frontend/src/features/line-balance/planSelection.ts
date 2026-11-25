import { lineRunsStyle, lineStyleNo } from "../lines/lineStyle";

/*
 * Which production orders belong on a sewing line, and whether a line plan may be saved.
 * The link is the style: a line is set up for a style (Sewing Lines → Active Style), an order has a style,
 * and the style's operation bulletin supplies the operations. One plan per order (it lives on one line).
 */

export interface SelOrder { id?: string | number; orderNo: string; styleId: string | number; styleNo?: string; status: string; deliveryDate: string; plannedCompletionDate?: string }
export interface SelLine { id: string | number; lineCode: string; currentStyle?: string | null }
export interface SelPlan { orderId: string | number; lineId?: string | number | null }

export type OrderFitKind = "planned-here" | "available" | "planned-elsewhere" | "no-bulletin" | "other-style" | "completed";

export interface OrderFit {
  kind: OrderFitKind;
  /** Can be picked for this line */
  selectable: boolean;
  /** Short reason shown next to the order */
  note: string;
  plannedLineCode?: string;
}

export interface SelectionContext {
  plans: SelPlan[];
  lines: SelLine[];
  /** Whether a style (by id or style no) has an operation bulletin */
  styleHasBulletin: (styleId: string | number, styleNo?: string) => boolean;
}

const due = (o: SelOrder) => o.plannedCompletionDate || o.deliveryDate || "9999-12-31";

export function orderFitForLine(order: SelOrder, line: SelLine | undefined, ctx: SelectionContext): OrderFit {
  if (order.status === "COMPLETED") return { kind: "completed", selectable: false, note: "Completed" };
  const lineHasStyle = !!lineStyleNo(line);
  if (line && lineHasStyle && !lineRunsStyle(line, order.styleNo)) {
    return { kind: "other-style", selectable: false, note: `Style ${order.styleNo ?? "?"}; this line runs ${lineStyleNo(line)}` };
  }
  const plan = ctx.plans.find(p => String(p.orderId) === String(order.id) && p.lineId);
  if (plan && line && String(plan.lineId) !== String(line.id)) {
    const code = ctx.lines.find(l => String(l.id) === String(plan.lineId))?.lineCode ?? "another line";
    return { kind: "planned-elsewhere", selectable: false, note: `Planned on ${code}`, plannedLineCode: code };
  }
  if (!ctx.styleHasBulletin(order.styleId, order.styleNo)) {
    return { kind: "no-bulletin", selectable: false, note: `No bulletin for ${order.styleNo ?? "this style"}` };
  }
  if (plan && line && String(plan.lineId) === String(line.id)) return { kind: "planned-here", selectable: true, note: "✓ Planned on this line" };
  return { kind: "available", selectable: true, note: order.status === "ON_HOLD" ? "On hold · not planned yet" : "Not planned yet" };
}

const RANK: Record<OrderFitKind, number> = { "planned-here": 0, available: 1, "planned-elsewhere": 2, "no-bulletin": 3, "other-style": 4, completed: 5 };

/**
 * Orders to offer for a line: its style's orders (planned here first, then available by due date, then the ones
 * that can't be picked with the reason). Other styles and completed orders are left out. A line without an
 * Active Style offers every open order.
 */
export function ordersForLine<T extends SelOrder>(orders: T[], line: SelLine | undefined, ctx: SelectionContext): { order: T; fit: OrderFit }[] {
  return orders
    .map(order => ({ order, fit: orderFitForLine(order, line, ctx) }))
    .filter(x => x.fit.kind !== "other-style" && x.fit.kind !== "completed")
    .sort((a, b) => RANK[a.fit.kind] - RANK[b.fit.kind] || due(a.order).localeCompare(due(b.order)) || a.order.orderNo.localeCompare(b.order.orderNo));
}

/** The order to show when a line is picked: its planned order, else the most urgent open order of its style. */
export function bestOrderForLine<T extends SelOrder>(orders: T[], line: SelLine | undefined, ctx: SelectionContext): T | undefined {
  return ordersForLine(orders, line, ctx).find(x => x.fit.selectable)?.order;
}

export interface SaveCheck {
  /** Saving is not allowed while any of these hold */
  errors: string[];
  /** Saving is allowed after the user confirms this */
  confirm?: string;
}

export function checkPlanSave(input: {
  order?: SelOrder;
  line?: SelLine;
  shiftSelected: boolean;
  stationCount: number;
  ctx: SelectionContext;
}): SaveCheck {
  const { order, line, shiftSelected, stationCount, ctx } = input;
  const errors: string[] = [];
  if (!order) errors.push("Select a production order.");
  if (!line) errors.push("Select a sewing line.");
  if (!shiftSelected) errors.push("Select a shift.");
  if (!order || !line) return { errors };
  if (order.status === "COMPLETED") errors.push(`${order.orderNo} is completed; it can't be planned.`);
  if (lineStyleNo(line) && !lineRunsStyle(line, order.styleNo)) {
    errors.push(`${line.lineCode} is set up for ${lineStyleNo(line)}, but ${order.orderNo} is style ${order.styleNo}. Pick a ${order.styleNo} line, or change ${line.lineCode}'s Active Style in Sewing Lines.`);
  }
  if (stationCount === 0) errors.push(`There are no operations to plan: style ${order.styleNo} has no operation bulletin.`);
  if (errors.length) return { errors };
  const plan = ctx.plans.find(p => String(p.orderId) === String(order.id) && p.lineId);
  if (plan && String(plan.lineId) !== String(line.id)) {
    const from = ctx.lines.find(l => String(l.id) === String(plan.lineId))?.lineCode ?? "another line";
    return { errors, confirm: `${order.orderNo} is planned on ${from}. Saving moves its plan to ${line.lineCode} (the ${from} plan for this order is replaced). Continue?` };
  }
  return { errors };
}
