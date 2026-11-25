import { expect, test } from "@playwright/test";
import { applyLinePlanRows, pickPlanBlock } from "../../src/features/line-balance/linePlanImport";

const stations = [
  { operationId: 1, operationCode: "OP-001", operationName: "Att np to cup strap extn", operatorIds: [null] as (string | number | null)[] },
  { operationId: 3, operationCode: "OP-003", operationName: "Basting outer & inner panels", operatorIds: [null] as (string | number | null)[] },
];
const operators = [
  { id: 10, employeeId: "97416", name: "Lakshmi", department: "Sewing Line 1" },
  { id: 11, employeeId: "94861", name: "R S Sowmya", department: "Sewing Line 1" },
  { id: 12, employeeId: "118185", name: "Kavitha", department: "Sewing Line 5" },
  { id: 13, employeeId: "102569", name: "Kavitha", department: "Sewing Line 1" },
  { id: 14, employeeId: "144035", name: "Roopa", department: "Sewing Line 8" },
];

test("names (or IDs) fill the stations; a shared name is resolved by the selected line", () => {
  const r = applyLinePlanRows([
    { "Operation Code": "OP-001", "Operation Name": "Att np to cup strap extn", "Allocated Operators": "R S Sowmya/Lakshmi" },
    { "Operation Code": "OP-0099", "Operation Name": "Basting outer &  inner panels", "Assigned Operators": "Kavitha, 144035", "Allocated Operators": 3 },
  ], stations, operators, "LINE-01");
  expect(r.problems).toEqual([]);
  expect(r.stations.map(s => s.operatorIds)).toEqual([[11, 10], [13, 14, null]]);
  expect(r.matchedStations).toBe(2);
  expect(r.assignedOperators).toBe(4);
});

test("unknown operations, unknown people and double placements are reported, not guessed", () => {
  const r = applyLinePlanRows([
    { "Operation Name": "Trimming", "Assigned Operators": "Lakshmi" },
    { "Operation Code": "OP-001", "Assigned Operators": "Nobody / Lakshmi" },
    { "Operation Code": "OP-003", "Assigned Operators": "Lakshmi / Kavitha" },
  ], stations, operators, "LINE-08");
  expect(r.problems).toEqual([
    'Row 2: operation "Trimming" is not in this plan\'s bulletin',
    'Row 3 (Att np to cup strap extn): "Nobody" is not a sewing operator',
    "Row 4 (Basting outer & inner panels): Lakshmi (97416) is already on Att np to cup strap extn",
    'Row 4 (Basting outer & inner panels): "Kavitha" matches 2 operators (118185, 102569); use the employee ID',
  ]);
  expect(r.stations.map(s => s.operatorIds)).toEqual([[10, null], [null, null]]);
});

test("a file with several plans uses the block whose operators are on the selected line", () => {
  const rows = [
    { "Operation Code": "OP-001", "Operation Name": "Att np to cup strap extn", "Allocated Operators": "Lakshmi" },
    { "Operation Code": "Operation Code", "Operation Name": "Operation Name" },
    { "Operation Code": "OP-001", "Operation Name": "Att np to cup strap extn", "Allocated Operators": "Roopa" },
  ];
  const b8 = pickPlanBlock(rows, operators, "LINE-08");
  expect([b8.blockCount, b8.chosen, b8.offset]).toEqual([2, 1, 2]);
  expect(applyLinePlanRows(b8.rows, stations, operators, "LINE-08", b8.offset).stations[0].operatorIds).toEqual([14]);
  expect(pickPlanBlock(rows, operators, "LINE-01").chosen).toBe(0);
});

test("a single employee ID in Assigned Operators is a person, not a headcount", () => {
  const r = applyLinePlanRows([
    { "Operation Code": "OP-001", "Assigned Operators": "97416", "Allocated Operators": 1 },
    { "Operation Code": "OP-003", "Assigned Operators": 102569 },
  ], stations, operators, "LINE-01");
  expect(r.problems).toEqual([]);
  expect(r.stations.map(s => s.operatorIds)).toEqual([[10], [13]]);
});
