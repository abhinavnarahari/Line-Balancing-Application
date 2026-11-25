import { expect, test } from "@playwright/test";
import { checkColourRows, grandTotal, linesFromRows, rowsFromOrder, type ColourRow } from "../../src/features/orders/orderColours";

const r = (color: string, qty: Record<string, string>): ColourRow => ({ id: color || "x", color, qty });

test("rows are built per colour from an order (older lines use the order colour)", () => {
  const rows = rowsFromOrder({ color: "BLACK, WHITE", sizeLines: [
    { sizeId: 1, quantity: 100, color: "BLACK" }, { sizeId: 2, quantity: 50, color: "WHITE" }, { sizeId: 2, quantity: 20, color: "black" },
  ] });
  expect(rows.map(x => [x.color, x.qty])).toEqual([["BLACK", { "1": "100", "2": "20" }], ["WHITE", { "2": "50" }]]);
  expect(rowsFromOrder({ color: "Navy", sizeLines: [{ sizeId: 3, quantity: 7 }] }).map(x => [x.color, x.qty])).toEqual([["Navy", { "3": "7" }]]);
});

test("lines and totals come from the grid; blanks are skipped", () => {
  const rows = [r("Navy", { "1": "100", "2": "" }), r(" Grey ", { "1": "0", "2": "40" })];
  expect(linesFromRows(rows)).toEqual([{ color: "Navy", sizeId: "1", quantity: 100 }, { color: "Grey", sizeId: "2", quantity: 40 }]);
  expect(grandTotal(rows)).toBe(140);
});

test("the grid is checked against the order type", () => {
  expect(checkColourRows("SINGLE_COLOR", [r("Navy", { "1": "10" })])).toEqual([]);
  expect(checkColourRows("MULTI_COLOR", [r("Navy", { "1": "10" }), r("Grey", { "1": "5" })])).toEqual([]);
  expect(checkColourRows("SINGLE_COLOR", [r("Navy", { "1": "10" }), r("Grey", { "1": "5" })])[0]).toContain("single-colour order has one colour");
  expect(checkColourRows("MULTI_COLOR", [r("Navy", { "1": "10" }), r("", {})])[0]).toContain("at least two colours");
  expect(checkColourRows("MULTI_COLOR", [r("Navy", { "1": "10" }), r("navy", { "2": "5" })])).toContain('"navy" is entered twice; put its sizes in one row.');
  expect(checkColourRows("SINGLE_COLOR", [r("", { "1": "10" })])).toEqual(["Colour 1 has quantities but no colour name."]);
  expect(checkColourRows("SINGLE_COLOR", [r("Navy", {})])).toContain("Enter a quantity for at least one size.");
});
