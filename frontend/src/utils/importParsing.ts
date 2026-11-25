/** Helpers for validating spreadsheet rows before import (row numbers match Excel: header is row 1). */

/** Excel stores dates as days since 1899-12-30; also accepts YYYY-MM-DD and DD-MM-YYYY / DD/MM/YYYY / DD.MM.YYYY strings and Date objects. */
export function excelDateToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && isFinite(value) && value > 0) {
    const ms = Math.round(value) * 86400000 + Date.UTC(1899, 11, 30);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return isoIfValid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // day-first, as used in India (05-10-2026, 05/10/2026, 05.10.2026)
  if (m) return isoIfValid(+m[3], +m[2], +m[1]);
  return null;
}

function isoIfValid(y: number, mo: number, d: number): string | null {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/** Excel stores times as a fraction of a day; also accepts "HH:mm" / "HH:mm:ss" strings. Returns "HH:mm:ss". */
export function excelTimeToHms(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && isFinite(value) && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}:00`;
  }
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m || +m[1] > 23 || +m[2] > 59 || (m[3] !== undefined && +m[3] > 59)) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}`;
}

/** Collects "Row N: problem" messages; `ok` is false once any problem was added. */
export class RowErrors {
  readonly messages: string[] = [];
  add(rowIndex: number, problem: string) {
    this.messages.push(`Row ${rowIndex + 2}: ${problem}`);
  }
  get ok() {
    return this.messages.length === 0;
  }
  summary(max = 12) {
    const shown = this.messages.slice(0, max).join("\n");
    return this.messages.length > max ? `${shown}\n…and ${this.messages.length - max} more` : shown;
  }
}
