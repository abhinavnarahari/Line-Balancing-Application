import { expect, test } from "@playwright/test";
import { ORDERS_TEMPLATE, parseOrderRows } from "../../src/features/orders/orderImport";

const styles = [{ id: 1, styleNo: "ST-01", buyer: "Acme" }, { id: 2, styleNo: "ST-02", buyer: null }];
const sizes = [{ id: 10, code: "S", label: "Small" }, { id: 11, code: "M", label: "Medium" }];
const TODAY = "2026-11-12";

const row = (over: Record<string, unknown> = {}) => ({
  "Order No": "PO-1", "Style No": "ST-01", Color: "Navy", "Delivery Date": "2026-12-20", Size: "S", Quantity: 100, ...over,
});

test("rows with the same Order No become one order with a size breakdown and defaults", () => {
  const { orders, errors } = parseOrderRows(
    [row(), row({ Size: "Medium", Quantity: 250, "Style No": "", Color: "" }), row({ Quantity: 50 })],
    styles, sizes, [], TODAY);
  expect(errors.messages).toEqual([]);
  expect(orders).toEqual([{
    orderNo: "PO-1", buyer: "Acme", styleId: 1, color: "Navy", orderDate: TODAY, deliveryDate: "2026-12-20",
    plannedCompletionDate: undefined, status: "PLANNED",
    sizeLines: [{ color: "Navy", sizeId: 10, quantity: 150 }, { color: "Navy", sizeId: 11, quantity: 250 }],
  }]);
});

test("Excel serial dates and spelled-out statuses are accepted", () => {
  const { orders, errors } = parseOrderRows(
    [row({ "Delivery Date": 46376, "Order Date": "01-11-2026", Status: "In Production" })], styles, sizes, [], TODAY);
  expect(errors.messages).toEqual([]);
  expect(orders[0]).toMatchObject({ orderDate: "2026-11-01", deliveryDate: "2026-12-20", status: "IN_PRODUCTION" });
});

test("problems are reported per Excel row and nothing is returned as valid", () => {
  const { errors } = parseOrderRows([
    row({ "Order No": "PO-OLD" }),
    row({ "Order No": "PO-2", "Style No": "NOPE" }),
    row({ "Order No": "PO-3", "Style No": "ST-02" }),
    row({ "Order No": "PO-4", "Delivery Date": "2026-01-01" }),
    row({ "Order No": "PO-5", Size: "XXL", }),
    row({ "Order No": "PO-6", Quantity: 1.5 }),
  ], styles, sizes, ["po-old"], TODAY);
  expect(errors.ok).toBe(false);
  expect(errors.messages).toEqual([
    "Row 2: Order PO-OLD already exists",
    "Row 3: Style NOPE is not in the Style Catalog",
    "Row 5: Delivery Date is before the Order Date",
    "Row 6: Size XXL is not in Garment Sizes",
    'Row 7: Quantity must be a whole number above 0 (got "1.5")',
      ]);
});

test("rows without an Order No are grouped by style + color + delivery date and left for the server to number", () => {
  const { orders, errors } = parseOrderRows([
    row({ "Order No": "", Size: "S", Quantity: 100 }),
    row({ "Order No": "", Size: "M", Quantity: 200 }),
    row({ "Order No": "", Color: "Black", Size: "S", Quantity: 50 }),
    row({ "Order No": "", "Style No": "", Size: "M", Quantity: 10 }),
  ], styles, sizes, [], TODAY);
  expect(errors.messages).toEqual([
    "Row 5: Order No is blank, so Style No, Color and Delivery Date are needed to group this row into an order",
  ]);
  expect(orders.map(o => [o.orderNo, o.color, o.sizeLines])).toEqual([
    ["", "Navy", [{ color: "Navy", sizeId: 10, quantity: 100 }, { color: "Navy", sizeId: 11, quantity: 200 }]],
    ["", "Black", [{ color: "Black", sizeId: 10, quantity: 50 }]],
  ]);
});

test("rows of one Order No with different colours become one multi-colour order", () => {
  const { orders, errors } = parseOrderRows([
    row({ Size: "S", Quantity: 100 }),
    row({ Color: "Black", Size: "S", Quantity: 40 }),
    row({ Color: "", Size: "M", Quantity: 60 }),
    row({ Color: "black", Size: "S", Quantity: 5 }),
  ], styles, sizes, [], TODAY);
  expect(errors.messages).toEqual([]);
  expect(orders).toHaveLength(1);
  expect(orders[0].sizeLines).toEqual([
    { color: "Navy", sizeId: 10, quantity: 100 },
    { color: "Black", sizeId: 10, quantity: 45 },
    { color: "Navy", sizeId: 11, quantity: 60 },
  ]);
});

test("the template's example imports as one single-colour and one multi-colour order", () => {
  const ex = ORDERS_TEMPLATE.exampleRows!;
  const sts = [{ id: 1, styleNo: "STY-1376", buyer: null }, { id: 2, styleNo: "STY-1722", buyer: null }];
  const szs = [{ id: 10, code: "S", label: "Small" }, { id: 11, code: "M", label: "Medium" }, { id: 12, code: "L", label: "Large" }];
  const { orders, errors } = parseOrderRows(ex, sts, szs, [], "2026-11-24");
  expect(errors.messages).toEqual([]);
  expect(orders.map(o => [o.orderNo, o.orderType, [...new Set(o.sizeLines.map(l => l.color))], o.sizeLines.reduce((n, l) => n + l.quantity, 0)])).toEqual([
    ["PO-2026-101", "SINGLE_COLOR", ["Navy"], 1500],
    ["PO-2026-102", "MULTI_COLOR", ["Black", "White", "Mocha"], 1800],
  ]);
});

test("an Order Type that doesn't match the colours is reported", () => {
  const { errors } = parseOrderRows([
    row({ "Order No": "PO-A", "Order Type": "Single colour", Color: "Navy" }),
    row({ "Order No": "PO-A", Color: "Black", Size: "M" }),
    row({ "Order No": "PO-B", "Order Type": "Multiple colours" }),
    row({ "Order No": "PO-C", "Order Type": "striped" }),
  ], styles, sizes, [], TODAY);
  expect(errors.messages).toEqual([
    'Row 5: Order Type must be Single colour or Multiple colours (got "striped")',
    "Row 2: Order PO-A is Single colour but has 2 colours; use Multiple colours",
    "Row 4: Order PO-B is Multiple colours but has only one colour; use Single colour",
  ]);
});
