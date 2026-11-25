import { expect, test } from "@playwright/test";
import { parseProductionRows } from "../../src/features/production-logs/productionImport";

const operators = [
  { id: 1, employeeId: "97416", name: "Lakshmi", role: "OPERATOR" },
  { id: 2, employeeId: "50001", name: "QC Person", role: "QUALITY_CHECKER" },
];
const operations = [{ id: 10, operationCode: "OP-001", name: "Att np to cup strap extn", standardSmv: 0.45 }];
const orders = [{ id: 7, orderNo: "PO-2026-001" }];
const row = (over: Record<string, unknown> = {}) => ({
  "Employee ID": "97416", "Operation Code": "OP-001", "Start Time": "09:00", "End Time": "10:00", "Good Qty": 120, ...over,
});

test("valid rows become runs with defaults (page date, reject 0, completed = good + reject, SMV from the operation)", () => {
  const { runs, errors, dates } = parseProductionRows([
    row(),
    row({ Date: "13.11.2026", "Operation Code": "", "Operation Name": "Att np  to cup strap extn", "Start Time": 0.4375, "End Time": "11:30", "Good Qty": 50, "Reject Qty": 3, "Order No": "po-2026-001" }),
  ], operators, operations, orders, [], "2026-11-12");
  expect(errors.messages).toEqual([]);
  expect(dates).toEqual(["2026-11-12", "2026-11-13"]);
  expect(runs).toEqual([
    expect.objectContaining({ operatorId: 1, operationId: 10, logDate: "2026-11-12", startTime: "09:00:00", endTime: "10:00:00", goodQty: 120, rejectQty: 0, completedQty: 120, targetQty: 0, samMinutes: 0.45 }),
    expect.objectContaining({ orderId: 7, logDate: "2026-11-13", startTime: "10:30:00", goodQty: 50, rejectQty: 3, completedQty: 53 }),
  ]);
});

test("problems are reported per Excel row, including runs already recorded", () => {
  const { runs, errors } = parseProductionRows([
    row({ "Employee ID": "99999" }),
    row({ "Employee ID": "50001" }),
    row({ "Operation Code": "OP-999" }),
    row({ "Order No": "PO-X" }),
    row({ "Start Time": "25:00" }),
    row({ "Good Qty": 10, "Reject Qty": 2, "Completed Qty": 11 }),
    row({ "Good Qty": -1 }),
    row({ "Start Time": "08:00", "End Time": "08:00" }),
    row({ "Start Time": "14:00", "End Time": "15:00" }),
  ], operators, operations, orders, [{ operatorId: 1, logDate: "2026-11-12", startTime: "14:00:00" }], "2026-11-12");
  expect(runs).toEqual([]);
  expect(errors.messages).toEqual([
    "Row 2: Employee 99999 is not in Sewing Operators",
    "Row 3: QC Person (50001) is non-machine workforce",
    'Row 4: Operation "OP-999" is not in the Operations master',
    "Row 5: Order PO-X does not exist",
    'Row 6: Start Time must be HH:mm (got "25:00")',
    "Row 7: Good (10) + Reject (2) must equal Completed (11)",
    'Row 8: Good Qty must be a whole number of 0 or more (got "-1")',
    "Row 9: End Time must be after Start Time",
    "Row 10: Lakshmi (97416) already has a run starting 14:00 on 2026-11-12",
  ]);
});
