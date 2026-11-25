import { expect, test } from "@playwright/test";
import { toLocalDateString } from "../../src/utils/date";
import { RowErrors, excelDateToIso, excelTimeToHms } from "../../src/utils/importParsing";

test.describe("toLocalDateString", () => {
  test("formats the local calendar date, not the UTC one", () => {
    // 01:00 local time must still be "today" (toISOString would give yesterday east of UTC)
    const d = new Date(2026, 9, 21, 1, 0, 0);
    expect(toLocalDateString(d)).toBe("2026-10-21");
  });

  test("pads month and day", () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 12))).toBe("2026-01-05");
  });
});

test.describe("excelDateToIso", () => {
  for (const [input, expected] of [
    [45306, "2024-01-15"],
    ["2024-02-29", "2024-02-29"],
    ["2023-02-29", null],
    ["15/01/2024", "2024-01-15"],
    ["15-01-2024", "2024-01-15"],
    ["05.10.2026", "2026-10-05"],
    ["31.02.2026", null],
    ["not a date", null],
    ["", null],
  ] as const) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      expect(excelDateToIso(input)).toBe(expected);
    });
  }
});

test.describe("excelTimeToHms", () => {
  for (const [input, expected] of [
    [1 / 3, "08:00:00"],
    [0.6875, "16:30:00"],
    ["8:05", "08:05:00"],
    ["17:30:15", "17:30:15"],
    ["24:00", null],
    ["7.30", null],
  ] as const) {
    test(`${JSON.stringify(input)} -> ${expected}`, () => {
      expect(excelTimeToHms(input)).toBe(expected);
    });
  }
});

test("RowErrors numbers rows like Excel (header is row 1)", () => {
  const errors = new RowErrors();
  expect(errors.ok).toBe(true);
  errors.add(0, "Name is required");
  errors.add(9, "Age must be 16-70");
  expect(errors.ok).toBe(false);
  expect(errors.messages).toEqual(["Row 2: Name is required", "Row 11: Age must be 16-70"]);
});
