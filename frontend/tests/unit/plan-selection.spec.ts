import { expect, test } from "@playwright/test";
import { bestOrderForLine, checkPlanSave, ordersForLine, type SelectionContext } from "../../src/features/line-balance/planSelection";

const L1 = { id: 1, lineCode: "LINE-01", currentStyle: "STY-1376" };
const L8 = { id: 2, lineCode: "LINE-08", currentStyle: "STY-1376" };
const L5 = { id: 4, lineCode: "LINE-05", currentStyle: "STY-1722" };
const LX = { id: 9, lineCode: "LINE-99", currentStyle: "" };
const o = (id: number, styleNo: string, deliveryDate: string, status = "PLANNED") =>
  ({ id, orderNo: `PO-${id}`, styleId: styleNo === "STY-1376" ? 2 : styleNo === "STY-1722" ? 3 : 4, styleNo, status, deliveryDate });
const orders = [
  o(1, "STY-1376", "2026-12-20"),
  o(2, "STY-1376", "2026-11-30"),
  o(3, "STY-1376", "2026-11-20"),
  o(4, "STY-1722", "2026-11-15"),
  o(5, "STY-1376", "2026-11-10", "COMPLETED"),
  o(6, "STY-9999", "2026-11-10"),
];
const ctx: SelectionContext = {
  plans: [{ orderId: 1, lineId: 1 }, { orderId: 3, lineId: 2 }],
  lines: [L1, L8, L5, LX],
  styleHasBulletin: (_id, styleNo) => styleNo !== "STY-9999",
};

test("a line offers only its style's open orders: planned here, then by due date, then greyed out with the reason", () => {
  const list = ordersForLine(orders, L1, ctx).map(x => [x.order.orderNo, x.fit.selectable, x.fit.note]);
  expect(list).toEqual([
    ["PO-1", true, "✓ Planned on this line"],
    ["PO-2", true, "Not planned yet"],
    ["PO-3", false, "Planned on LINE-08"],
  ]);
  expect(ordersForLine(orders, L5, ctx).map(x => x.order.orderNo)).toEqual(["PO-4"]);
});

test("a line without an active style offers every open order, and orders without a bulletin can't be picked", () => {
  const list = ordersForLine(orders, LX, ctx).map(x => [x.order.orderNo, x.fit.selectable]);
  expect(list).toContainEqual(["PO-6", false]);
  expect(list.map(x => x[0])).not.toContain("PO-5"); // completed
});

test("picking a line selects its planned order, else its most urgent open order", () => {
  expect(bestOrderForLine(orders, L1, ctx)?.orderNo).toBe("PO-1");
  expect(bestOrderForLine(orders, L8, ctx)?.orderNo).toBe("PO-3");
  expect(bestOrderForLine(orders, L5, ctx)?.orderNo).toBe("PO-4");
  expect(bestOrderForLine([o(7, "STY-1722", "2026-12-01", "COMPLETED")], L5, ctx)).toBeUndefined();
});

test("saving is blocked for missing selections, wrong style, completed orders and missing bulletins; moving asks first", () => {
  expect(checkPlanSave({ order: undefined, line: undefined, shiftSelected: false, stationCount: 0, ctx }).errors)
    .toEqual(["Select a production order.", "Select a sewing line.", "Select a shift."]);
  expect(checkPlanSave({ order: orders[3], line: L1, shiftSelected: true, stationCount: 22, ctx }).errors[0])
    .toContain("LINE-01 is set up for STY-1376, but PO-4 is style STY-1722");
  expect(checkPlanSave({ order: orders[4], line: L1, shiftSelected: true, stationCount: 16, ctx }).errors[0]).toContain("completed");
  expect(checkPlanSave({ order: orders[1], line: L1, shiftSelected: true, stationCount: 0, ctx }).errors[0]).toContain("no operation bulletin");
  const move = checkPlanSave({ order: orders[2], line: L1, shiftSelected: true, stationCount: 16, ctx });
  expect(move.errors).toEqual([]);
  expect(move.confirm).toContain("PO-3 is planned on LINE-08. Saving moves its plan to LINE-01");
  expect(checkPlanSave({ order: orders[0], line: L1, shiftSelected: true, stationCount: 16, ctx })).toEqual({ errors: [] });
});
