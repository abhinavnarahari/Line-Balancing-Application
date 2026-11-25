import type { ImportTemplate } from "../../utils/excel";
import { RowErrors } from "../../utils/importParsing";
import { toLocalDateString } from "../../utils/date";
import { expectedCycleSeconds, MAX_SKILL_RATING, SKILL_LEVELS, type SkillRating } from "./skillScale";

/*
 * Skill matrix import, in the same layout as the Skill Matrix export:
 *   Employee ID | Operator Name | … | <Operation name (CODE)> | <Operation name (CODE)> | …
 * Each operation cell holds a level 1–4; blank or "-" means "not rated" (an existing rating is left as it is).
 */

interface OperatorRef { id: string | number; employeeId: string; name: string; role?: string | null }
interface OperationRef { id: string | number; operationCode: string; name: string; standardSmv?: number | string | null }

export interface SkillRatingImport {
  operatorId: string | number;
  operationId: string | number;
  rating: SkillRating;
  cycleTimeSeconds: number;
  effectiveDate: string;
  notes: string;
}

const NON_MACHINE_ROLES = new Set(["QUALITY_CHECKER", "LINE_SUPERVISOR", "HELPER"]);
const INFO_COLUMNS = ["Employee ID", "Operator Name", "Category", "Role", "Department"];

export const operationColumnHeader = (op: OperationRef) => `${op.name} (${op.operationCode})`;

/** Template columns: the operator columns plus one column per operation in the Operations master. */
export function skillMatrixTemplate(operations: OperationRef[]): ImportTemplate {
  const levels = ([4, 3, 2, 1] as SkillRating[]).map(r => `${r} = ${SKILL_LEVELS[r].name}`).join(", ");
  return {
    name: "Skill Matrix",
    columns: [
      { header: "Employee ID", required: true, aliases: ["Emp No", "Employee No", "EmpID"], description: "Must exist in Sewing Operators", example: "97416" },
      { header: "Operator Name", aliases: ["Emp Name", "Name"], description: "For reading only; not imported", example: "Lakshmi" },
      { header: "Category", description: "For reading only; not imported" },
      { header: "Role", description: "For reading only; not imported" },
      { header: "Department", description: "For reading only; not imported" },
      ...operations.map(op => ({
        header: operationColumnHeader(op),
        aliases: [op.operationCode, op.name],
        description: `Skill level 1–${MAX_SKILL_RATING} (${levels}); blank or - = not rated`,
        example: 3,
      })),
    ],
  };
}

/** Operation a column belongs to: "Name (CODE)", the code alone, or the exact operation name. */
function operationForHeader(header: string, byCode: Map<string, OperationRef>, byName: Map<string, OperationRef>): OperationRef | undefined {
  const h = header.trim();
  const code = h.match(/\(([^()]+)\)\s*$/)?.[1];
  if (code && byCode.has(code.trim().toUpperCase())) return byCode.get(code.trim().toUpperCase());
  return byCode.get(h.toUpperCase()) ?? byName.get(h.toLowerCase());
}

export function parseSkillMatrixRows(
  rows: Record<string, unknown>[],
  operators: OperatorRef[],
  operations: OperationRef[],
  today = toLocalDateString(),
): { ratings: SkillRatingImport[]; errors: RowErrors; operatorCount: number; unknownColumns: string[] } {
  const errors = new RowErrors();
  const byEmployee = new Map(operators.map(o => [String(o.employeeId).trim().toUpperCase(), o]));
  const byCode = new Map(operations.map(o => [o.operationCode.trim().toUpperCase(), o]));
  const byName = new Map(operations.map(o => [o.name.trim().toLowerCase(), o]));

  const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const idHeader = headers.find(h => ["employee id", "emp no", "employee no", "empid"].includes(h.trim().toLowerCase()));
  const opColumns = headers
    .filter(h => h !== idHeader && !INFO_COLUMNS.some(c => c.toLowerCase() === h.trim().toLowerCase()) && !["emp name", "name"].includes(h.trim().toLowerCase()))
    .map(h => ({ header: h, op: operationForHeader(h, byCode, byName) }));
  const unknownColumns = opColumns.filter(c => !c.op).map(c => c.header);

  const ratings: SkillRatingImport[] = [];
  const seenEmployees = new Map<string, number>();
  rows.forEach((row, i) => {
    const employeeId = String(row[idHeader ?? "Employee ID"] ?? "").trim();
    const hasAnyRating = opColumns.some(c => !isBlank(row[c.header]));
    if (!employeeId) {
      if (hasAnyRating) errors.add(i, "Employee ID is required");
      return;
    }
    const key = employeeId.toUpperCase();
    if (seenEmployees.has(key)) {
      errors.add(i, `Employee ${employeeId} is already on row ${seenEmployees.get(key)! + 2}`);
      return;
    }
    seenEmployees.set(key, i);
    const operator = byEmployee.get(key);
    if (!operator) { errors.add(i, `Employee ${employeeId} is not in Sewing Operators`); return; }
    if (operator.role && NON_MACHINE_ROLES.has(operator.role) && hasAnyRating) {
      errors.add(i, `${operator.name} (${employeeId}) is non-machine workforce; skill levels can't be recorded`);
      return;
    }
    for (const { header, op } of opColumns) {
      const raw = row[header];
      if (isBlank(raw) || !op) continue;
      const value = Number(String(raw).trim());
      if (!Number.isInteger(value) || value < 1 || value > MAX_SKILL_RATING) {
        errors.add(i, `"${header}" must be a level from 1 to ${MAX_SKILL_RATING}, or blank (got "${raw}")`);
        continue;
      }
      const rating = value as SkillRating;
      // The server derives the level shown from the cycle time, so store the time that matches the level
      const smv = Number(op.standardSmv) || 0.5;
      ratings.push({
        operatorId: operator.id,
        operationId: op.id,
        rating,
        cycleTimeSeconds: Math.max(1, Math.round(expectedCycleSeconds(rating, smv))),
        effectiveDate: today,
        notes: "Imported from skill matrix",
      });
    }
  });
  return { ratings, errors, operatorCount: seenEmployees.size, unknownColumns };
}

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || s === "-" || s === "—";
}
