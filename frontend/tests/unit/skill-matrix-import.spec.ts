import { expect, test } from "@playwright/test";
import { parseSkillMatrixRows, skillMatrixTemplate } from "../../src/features/skill-matrix/skillMatrixImport";
import { ratingForCycleTime, ratingForEfficiency, SKILL_RATINGS } from "../../src/features/skill-matrix/skillScale";

const operators = [
  { id: 1, employeeId: "97416", name: "Lakshmi", role: "OPERATOR" },
  { id: 2, employeeId: "94861", name: "R S Sowmya", role: "OPERATOR" },
  { id: 3, employeeId: "50001", name: "QC Person", role: "QUALITY_CHECKER" },
];
const operations = [
  { id: 10, operationCode: "OP-001", name: "Att np to cup strap extn", standardSmv: 0.461 },
  { id: 11, operationCode: "OP-005", name: "T/s on shoulder (one side)", standardSmv: 0.207 },
];

test("factory bands: each level's planning efficiency and stored cycle time map back to the same level", () => {
  expect([0.75, 0.65, 0.45, 0.25].map(ratingForEfficiency)).toEqual([4, 3, 2, 1]);
  expect([0.70, 0.69, 0.55, 0.54, 0.33, 0.32].map(ratingForEfficiency)).toEqual([4, 3, 3, 2, 2, 1]);
  for (const op of operations) {
    const { ratings } = parseSkillMatrixRows(
      SKILL_RATINGS.map((r, i) => ({ "Employee ID": i === 0 ? "97416" : "94861", [`${op.name} (${op.operationCode})`]: r })).slice(0, 2),
      operators, operations, "2026-11-12");
    for (const r of ratings) expect(ratingForCycleTime(r.cycleTimeSeconds, op.standardSmv)).toBe(r.rating);
  }
});

test("rows in the export layout become ratings; blanks and '-' are skipped", () => {
  const { ratings, errors, operatorCount } = parseSkillMatrixRows([
    { "Employee ID": 97416, "Operator Name": "Lakshmi", Department: "Sewing Line 1", "Att np to cup strap extn (OP-001)": 4, "T/s on shoulder (one side) (OP-005)": "-" },
    { "Employee ID": "94861", "Att np to cup strap extn (OP-001)": "", "T/s on shoulder (one side) (OP-005)": 2 },
  ], operators, operations, "2026-11-12");
  expect(errors.messages).toEqual([]);
  expect(operatorCount).toBe(2);
  expect(ratings.map(r => [r.operatorId, r.operationId, r.rating, r.effectiveDate])).toEqual([
    [1, 10, 4, "2026-11-12"],
    [2, 11, 2, "2026-11-12"],
  ]);
});

test("problems are reported by Excel row", () => {
  const { errors } = parseSkillMatrixRows([
    { "Employee ID": "99999", "Att np to cup strap extn (OP-001)": 3 },
    { "Employee ID": "97416", "Att np to cup strap extn (OP-001)": 5 },
    { "Employee ID": "97416", "Att np to cup strap extn (OP-001)": 3 },
    { "Employee ID": "50001", "Att np to cup strap extn (OP-001)": 3 },
  ], operators, operations, "2026-11-12");
  expect(errors.messages).toEqual([
    "Row 2: Employee 99999 is not in Sewing Operators",
    'Row 3: "Att np to cup strap extn (OP-001)" must be a level from 1 to 4, or blank (got "5")',
    "Row 4: Employee 97416 is already on row 3",
    "Row 5: QC Person (50001) is non-machine workforce; skill levels can't be recorded",
  ]);
});

test("template has one column per operation, named like the export", () => {
  const headers = skillMatrixTemplate(operations).columns.map(c => c.header);
  expect(headers).toEqual(["Employee ID", "Operator Name", "Category", "Role", "Department",
    "Att np to cup strap extn (OP-001)", "T/s on shoulder (one side) (OP-005)"]);
});
