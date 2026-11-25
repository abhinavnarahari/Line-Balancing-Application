import { expect, test } from "@playwright/test";
import { formatLongDate, relativeDay } from "../../src/components/ui/ProductionDatePicker";

test("dates are written out with the weekday and a relative day", () => {
  expect(formatLongDate("2026-10-31")).toBe("Sat, 31 Oct 2026");
  expect(["2026-11-13", "2026-11-12", "2026-11-14", "2026-10-31", "2026-11-16"].map(d => relativeDay(d, "2026-11-13")))
    .toEqual(["Today", "Yesterday", "Tomorrow", "13 days ago", "in 3 days"]);
});
