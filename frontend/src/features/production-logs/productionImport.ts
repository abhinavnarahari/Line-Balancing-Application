import type { ImportTemplate } from "../../utils/excel";
import { excelDateToIso, excelTimeToHms, RowErrors } from "../../utils/importParsing";
import type { PieceProductionLogRequest } from "./api";

/*
 * Production import for Production Monitoring: one row per piece run (an operator doing one operation
 * from a start time to an end time). Every row is checked first; runs are saved together or not at all.
 */
export const PRODUCTION_TEMPLATE: ImportTemplate = {
  name: "Production Runs",
  columns: [
    { header: "Date", aliases: ["Log Date"], description: "Production date (blank = the date selected on the page)", example: "2026-11-13" },
    { header: "Employee ID", required: true, aliases: ["Emp No", "Operator ID"], description: "Sewing operator's employee ID", example: "97416" },
    { header: "Operator Name", aliases: ["Name"], description: "For reading only" },
    { header: "Order No", aliases: ["PO", "PO No", "Order"], description: "Production order (optional)", example: "PO-2026-001" },
    { header: "Operation Code", aliases: ["Op Code"], description: "Operation code (or give the name)", example: "OP-001" },
    { header: "Operation Name", aliases: ["Operation"], description: "Used when there is no code", example: "Att np to cup strap extn" },
    { header: "Start Time", required: true, aliases: ["Start", "From"], description: "24-hour HH:mm", example: "09:00" },
    { header: "End Time", required: true, aliases: ["End", "To"], description: "24-hour HH:mm (earlier than start = past midnight)", example: "10:00" },
    { header: "Good Qty", required: true, aliases: ["Good", "Good Pieces"], description: "Good pieces", example: 120 },
    { header: "Reject Qty", aliases: ["Reject", "Rejects", "Rework"], description: "Rejected / rework pieces (blank = 0)", example: 2 },
    { header: "Completed Qty", aliases: ["Completed", "Total Qty"], description: "Blank = good + reject; if given it must equal good + reject", example: 122 },
    { header: "Target Qty", aliases: ["Target"], description: "Target for the run (blank = 0)", example: 125 },
    { header: "Machine Code", aliases: ["Machine"], description: "Optional" },
    { header: "Notes", aliases: ["Remarks"], description: "Optional" },
  ],
};

interface OperatorRef { id: string | number; employeeId: string; name: string; role?: string | null; active?: boolean }
interface OperationRef { id: string | number; operationCode: string; name: string; standardSmv?: number | string | null }
interface OrderRef { id?: string | number; orderNo: string }
interface ExistingRun { operatorId: number | string; logDate: string; startTime: string; operationId?: number | string | null }

const NON_MACHINE = new Set(["QUALITY_CHECKER", "LINE_SUPERVISOR", "HELPER"]);
const tidy = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim().toLowerCase();

function raw(row: Record<string, unknown>, header: string): unknown {
  const col = PRODUCTION_TEMPLATE.columns.find(c => c.header === header)!;
  const names = [col.header, ...(col.aliases ?? [])].map(n => n.toLowerCase());
  const key = Object.keys(row).find(k => names.includes(k.trim().toLowerCase()));
  return key === undefined ? undefined : row[key];
}
const text = (row: Record<string, unknown>, header: string) => String(raw(row, header) ?? "").trim();

/** Whole number ≥ 0, or null if blank; NaN if not a whole number. */
function qty(row: Record<string, unknown>, header: string): number | null {
  const t = text(row, header);
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export function parseProductionRows(
  rows: Record<string, unknown>[],
  operators: OperatorRef[],
  operations: OperationRef[],
  orders: OrderRef[],
  existing: ExistingRun[],
  defaultDate: string,
): { runs: PieceProductionLogRequest[]; errors: RowErrors; dates: string[] } {
  const errors = new RowErrors();
  const byEmployee = new Map(operators.map(o => [String(o.employeeId).trim().toLowerCase(), o]));
  const opByCode = new Map(operations.map(o => [o.operationCode.trim().toLowerCase(), o]));
  const opByName = new Map(operations.map(o => [tidy(o.name), o]));
  const orderByNo = new Map(orders.map(o => [o.orderNo.trim().toLowerCase(), o]));
  const taken = new Set(existing.map(e => `${e.operatorId}|${e.logDate}|${String(e.startTime).slice(0, 5)}`));
  const runs: PieceProductionLogRequest[] = [];
  const dates = new Set<string>();

  rows.forEach((row, i) => {
    const emp = text(row, "Employee ID");
    const opCode = text(row, "Operation Code");
    const opName = text(row, "Operation Name");
    if (!emp && !opCode && !opName && !text(row, "Good Qty")) return; // blank line
    const before = errors.messages.length;

    const operator = byEmployee.get(emp.toLowerCase());
    if (!emp) errors.add(i, "Employee ID is required");
    else if (!operator) errors.add(i, `Employee ${emp} is not in Sewing Operators`);
    else if (operator.role && NON_MACHINE.has(operator.role)) errors.add(i, `${operator.name} (${emp}) is non-machine workforce`);

    const operation = (opCode && opByCode.get(opCode.toLowerCase())) || (opName ? opByName.get(tidy(opName)) : undefined);
    if (!opCode && !opName) errors.add(i, "Operation Code or Operation Name is required");
    else if (!operation) errors.add(i, `Operation "${opCode || opName}" is not in the Operations master`);

    const orderNo = text(row, "Order No");
    const order = orderNo ? orderByNo.get(orderNo.toLowerCase()) : undefined;
    if (orderNo && !order) errors.add(i, `Order ${orderNo} does not exist`);

    const dateCell = raw(row, "Date");
    const logDate = text(row, "Date") ? excelDateToIso(dateCell) : defaultDate;
    if (!logDate) errors.add(i, `Date is not a valid date (got "${text(row, "Date")}")`);

    const start = excelTimeToHms(raw(row, "Start Time"));
    const end = excelTimeToHms(raw(row, "End Time"));
    if (!start) errors.add(i, `Start Time must be HH:mm (got "${text(row, "Start Time")}")`);
    if (!end) errors.add(i, `End Time must be HH:mm (got "${text(row, "End Time")}")`);
    if (start && end) {
      const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
      let mins = toMin(end) - toMin(start);
      if (mins < 0) mins += 24 * 60;
      if (mins === 0) errors.add(i, "End Time must be after Start Time");
      else if (mins > 12 * 60) errors.add(i, `Run is ${Math.round(mins / 60)} hours long; check Start and End Time`);
    }

    const good = qty(row, "Good Qty");
    const reject = qty(row, "Reject Qty") ?? 0;
    const completedGiven = qty(row, "Completed Qty");
    const target = qty(row, "Target Qty") ?? 0;
    if (good === null) errors.add(i, "Good Qty is required");
    for (const [label, v] of [["Good Qty", good], ["Reject Qty", reject], ["Completed Qty", completedGiven], ["Target Qty", target]] as const) {
      if (v !== null && Number.isNaN(v)) errors.add(i, `${label} must be a whole number of 0 or more (got "${text(row, label)}")`);
    }
    const completed = completedGiven ?? ((good ?? 0) + reject);
    if (completedGiven !== null && good !== null && !Number.isNaN(completedGiven + good + reject) && good + reject !== completedGiven) {
      errors.add(i, `Good (${good}) + Reject (${reject}) must equal Completed (${completedGiven})`);
    }

    // Same operator, date and start time as a recorded run (or an earlier valid row) = the same run imported twice
    const slot = operator && logDate && start ? `${operator.id}|${logDate}|${start.slice(0, 5)}` : "";
    if (slot && taken.has(slot)) errors.add(i, `${operator!.name} (${emp}) already has a run starting ${start!.slice(0, 5)} on ${logDate}`);

    if (errors.messages.length > before || !operator || !operation || !logDate || !start || !end || good === null) return;
    taken.add(slot);
    dates.add(logDate);
    runs.push({
      operatorId: operator.id,
      operationId: operation.id,
      operationName: operation.name,
      orderId: order?.id,
      targetQty: target,
      completedQty: completed,
      goodQty: good,
      rejectQty: reject,
      startTime: start,
      endTime: end,
      samMinutes: Number(operation.standardSmv) > 0 ? Number(operation.standardSmv) : undefined,
      machineCode: text(row, "Machine Code") || undefined,
      logDate,
      notes: text(row, "Notes") || undefined,
    });
  });
  return { runs, errors, dates: [...dates].sort() };
}
