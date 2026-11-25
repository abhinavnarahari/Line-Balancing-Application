import type { ImportTemplate } from "../../utils/excel";

/*
 * Import of a line plan in the "Export Plan" layout of Planned Lines & Balancing (one plan per file).
 * Rows are matched to the stations of the selected order's bulletin; operator names or employee IDs
 * fill the station's operator slots. Nothing is saved: the user reviews the table and saves the plan.
 */

export const LINE_PLAN_TEMPLATE: ImportTemplate = {
  name: "Line Plan",
  columns: [
    { header: "Station #", aliases: ["Station", "Seq", "Sequence"], description: "For reading only; stations follow the bulletin order" },
    { header: "Operation Code", aliases: ["Op Code"], description: "Operation code from the bulletin (or give the name)", example: "OP-001" },
    { header: "Operation Name", aliases: ["Operation"], description: "Used when the code doesn't match", example: "Att np to cup strap extn" },
    { header: "Machine Type", description: "For reading only" },
    { header: "SMV (Sec)", aliases: ["SMV (sec)", "SMV"], description: "For reading only; SMV comes from the bulletin" },
    { header: "Assigned Operators", aliases: ["Operators", "Operator"], description: "Operator names or employee IDs, separated by / or ,", example: "Lakshmi / R S Sowmya" },
    { header: "Allocated Operators", aliases: ["Manpower", "No. of Operators"], description: "Number of operators at the station, or their names (like Assigned Operators)", example: 2 },
  ],
};

export interface PlanStation {
  operationId: string | number;
  operationCode: string;
  operationName: string;
  operatorIds: (string | number | null)[];
}

export interface PlanOperator {
  id: string | number;
  employeeId: string;
  name: string;
  department?: string | null;
}

export interface LinePlanImportResult<T extends PlanStation> {
  stations: T[];
  matchedStations: number;
  assignedOperators: number;
  problems: string[];
}

const tidy = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim().toLowerCase();
const digits = (s: unknown) => String(s ?? "").match(/(\d+)\s*$/)?.[1]?.replace(/^0+/, "") ?? "";

function cell(row: Record<string, unknown>, header: string): unknown {
  const col = LINE_PLAN_TEMPLATE.columns.find(c => c.header === header)!;
  const names = [col.header, ...(col.aliases ?? [])].map(n => n.toLowerCase());
  const key = Object.keys(row).find(k => names.includes(k.trim().toLowerCase()));
  return key === undefined ? undefined : row[key];
}

/** A plain number in "Allocated Operators" is a headcount. */
const isCount = (v: unknown) => String(v ?? "").trim() !== "" && Number.isFinite(Number(v)) && Number(v) < 1000;

/** Names or IDs in a cell: "Rani/Anusha K L, Pushpa" → ["Rani", "Anusha K L", "Pushpa"]; "Unassigned" → []. */
function splitPeople(value: unknown): string[] {
  const text = String(value ?? "").trim();
  if (!text || /^unassigned$/i.test(text) || /^-+$/.test(text)) return [];
  return text.split(/[/,;]/).map(s => s.trim()).filter(Boolean);
}

/**
 * Applies imported rows to the current stations. `lineCode` (e.g. "LINE-01") picks between operators
 * who share a name, using the line number in their department ("Sewing Line 1").
 */
/**
 * A file can hold several plans one after another (each block starting with a repeated header row, like the
 * planned-line sheet with one block per line). Picks the block whose named operators belong to the selected line.
 */
export function pickPlanBlock(rows: Record<string, unknown>[], operators: PlanOperator[], lineCode?: string) {
  const blocks: { start: number; rows: Record<string, unknown>[] }[] = [{ start: 0, rows: [] }];
  rows.forEach((row, i) => {
    const isHeader = tidy(cell(row, "Operation Code")) === "operation code" || tidy(cell(row, "Operation Name")) === "operation name";
    if (isHeader) blocks.push({ start: i + 1, rows: [] });
    else blocks[blocks.length - 1].rows.push(row);
  });
  const nonEmpty = blocks.filter(b => b.rows.some(r => cell(r, "Operation Code") || cell(r, "Operation Name")));
  if (nonEmpty.length <= 1) return { rows: nonEmpty[0]?.rows ?? [], offset: nonEmpty[0]?.start ?? 0, blockCount: nonEmpty.length, chosen: 0 };
  const lineNo = digits(lineCode);
  const onLine = new Set(operators.filter(o => lineNo && digits(o.department) === lineNo).map(o => tidy(o.name)));
  const score = (b: { rows: Record<string, unknown>[] }) => b.rows
    .flatMap(r => [...splitPeople(cell(r, "Assigned Operators")), ...(isCount(cell(r, "Allocated Operators")) ? [] : splitPeople(cell(r, "Allocated Operators")))])
    .filter(n => onLine.has(tidy(n))).length;
  let best = 0;
  nonEmpty.forEach((b, i) => { if (score(b) > score(nonEmpty[best])) best = i; });
  return { rows: nonEmpty[best].rows, offset: nonEmpty[best].start, blockCount: nonEmpty.length, chosen: best };
}

export function applyLinePlanRows<T extends PlanStation>(
  rows: Record<string, unknown>[],
  stations: T[],
  operators: PlanOperator[],
  lineCode?: string,
  rowOffset = 0,
): LinePlanImportResult<T> {
  const problems: string[] = [];
  const next = stations.map(s => ({ ...s, operatorIds: [...s.operatorIds] }));
  const lineNo = digits(lineCode);
  const byEmployee = new Map(operators.map(o => [String(o.employeeId).trim().toLowerCase(), o]));
  const byName = new Map<string, PlanOperator[]>();
  for (const o of operators) {
    const k = tidy(o.name);
    byName.set(k, [...(byName.get(k) ?? []), o]);
  }
  const usedOperators = new Map<string, string>(); // operator id -> station label (one station per operator)

  const findOperator = (token: string): PlanOperator | string => {
    const byId = byEmployee.get(token.trim().toLowerCase());
    if (byId) return byId;
    const candidates = byName.get(tidy(token)) ?? [];
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      const onLine = lineNo ? candidates.filter(o => digits(o.department) === lineNo) : [];
      if (onLine.length === 1) return onLine[0];
      return `"${token}" matches ${candidates.length} operators (${candidates.map(o => o.employeeId).join(", ")}); use the employee ID`;
    }
    return `"${token}" is not a sewing operator`;
  };

  let matchedStations = 0;
  let assignedOperators = 0;
  rows.forEach((row, i) => {
    const code = String(cell(row, "Operation Code") ?? "").trim();
    const name = String(cell(row, "Operation Name") ?? "").trim();
    if (!code && !name) return; // blank line
    const rowLabel = `Row ${i + rowOffset + 2}`;
    // Code first; bulletins exported elsewhere may restart codes, so a code whose name disagrees falls back to the name
    let idx = code ? next.findIndex(s => s.operationCode.toLowerCase() === code.toLowerCase()) : -1;
    if (idx >= 0 && name && tidy(next[idx].operationName) !== tidy(name)) idx = -1;
    if (idx < 0 && name) idx = next.findIndex(s => tidy(s.operationName) === tidy(name));
    if (idx < 0) {
      problems.push(`${rowLabel}: operation "${name || code}" is not in this plan's bulletin`);
      return;
    }
    matchedStations++;
    const station = next[idx];
    // "Allocated Operators" may be a headcount (2) or names; "Assigned Operators" is always people (names or IDs)
    const allocated = cell(row, "Allocated Operators");
    const people = [...splitPeople(cell(row, "Assigned Operators")), ...(isCount(allocated) ? [] : splitPeople(allocated))];
    const count = isCount(allocated) ? Math.max(0, Math.round(Number(allocated))) : 0;

    const ids: (string | number)[] = [];
    for (const token of people) {
      const found = findOperator(token);
      if (typeof found === "string") { problems.push(`${rowLabel} (${station.operationName}): ${found}`); continue; }
      const key = String(found.id);
      if (ids.some(x => String(x) === key)) continue;
      if (usedOperators.has(key)) {
        problems.push(`${rowLabel} (${station.operationName}): ${found.name} (${found.employeeId}) is already on ${usedOperators.get(key)}`);
        continue;
      }
      usedOperators.set(key, station.operationName);
      ids.push(found.id);
    }
    assignedOperators += ids.length;
    const slots = Math.max(1, ids.length, count, people.length);
    station.operatorIds = [...ids, ...Array(slots - ids.length).fill(null)];
  });
  return { stations: next, matchedStations, assignedOperators, problems };
}
