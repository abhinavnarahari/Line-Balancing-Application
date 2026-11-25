import { expect, test } from "@playwright/test";
import { lineRunsStyle, lineStyleNo } from "../../src/features/lines/lineStyle";

test("a line's active style is matched to an order's style", () => {
  expect(lineStyleNo({ currentStyle: "STY-1376" })).toBe("STY-1376");
  expect(lineStyleNo({ currentStyle: "STY-1376 - Sports bra" })).toBe("STY-1376");
  expect(lineStyleNo({ currentStyle: "" })).toBe("");
  expect(lineRunsStyle({ currentStyle: "sty-1376" }, "STY-1376")).toBe(true);
  expect(lineRunsStyle({ currentStyle: "STY-1376" }, "STY-1722")).toBe(false);
  expect(lineRunsStyle({ currentStyle: null as unknown as string }, "STY-1376")).toBe(false);
});
