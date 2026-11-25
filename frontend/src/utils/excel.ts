import * as XLSX from 'xlsx';

/* ── Column picking ─────────────────────────────────────────────────────────── */

export interface SheetColumns {
  sheet: string;
  columns: string[];
}

/** Selected header names per sheet name. */
export type ColumnSelection = Record<string, string[]>;

export interface ColumnPickRequest {
  fileName: string;
  sheets: SheetColumns[];
}

type ColumnPicker = (request: ColumnPickRequest) => Promise<ColumnSelection | null>;

let columnPicker: ColumnPicker | null = null;

/** Registered by <ExportColumnsDialogHost/>; without it, exports simply include every column. */
export function registerColumnPicker(picker: ColumnPicker | null) {
  columnPicker = picker;
}

/** Header row (first row) of a sheet, in column order. Empty header cells are named "Column N". */
export function getSheetHeaders(ws: XLSX.WorkSheet): string[] {
  if (!ws || !ws["!ref"]) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const text = cell ? String(cell.w ?? cell.v ?? "").trim() : "";
    headers.push(text || `Column ${c - range.s.c + 1}`);
  }
  return headers;
}

/** Copy of the sheet with only the given header columns (in their original order); cell values and formats are kept. */
export function keepSheetColumns(ws: XLSX.WorkSheet, keep: string[]): XLSX.WorkSheet {
  if (!ws || !ws["!ref"]) return ws;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const headers = getSheetHeaders(ws);
  const wanted = new Set(keep);
  const kept = headers.map((h, i) => (wanted.has(h) ? range.s.c + i : -1)).filter(c => c >= 0);

  const out: XLSX.WorkSheet = {};
  kept.forEach((srcC, k) => {
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: srcC })];
      if (cell) out[XLSX.utils.encode_cell({ r, c: range.s.c + k })] = cell;
    }
  });
  if (kept.length > 0) {
    out["!ref"] = XLSX.utils.encode_range({ s: range.s, e: { r: range.e.r, c: range.s.c + kept.length - 1 } });
  }
  const cols = ws["!cols"];
  if (cols) out["!cols"] = kept.map(c => cols[c - range.s.c] ?? {});
  return out;
}

/** Workbook with only the selected columns of each sheet; sheets with nothing selected are left out. */
export function applyColumnSelection(wb: XLSX.WorkBook, selection: ColumnSelection): XLSX.WorkBook {
  const out = XLSX.utils.book_new();
  for (const name of wb.SheetNames) {
    const keep = selection[name];
    const ws = wb.Sheets[name];
    if (keep === undefined) {
      XLSX.utils.book_append_sheet(out, ws, name);
    } else if (keep.length > 0) {
      XLSX.utils.book_append_sheet(out, keepSheetColumns(ws, keep), name);
    }
  }
  return out;
}

/**
 * Saves a workbook after letting the user choose which columns to include (when the picker is available).
 * Resolves to false if the user cancelled.
 */
export async function saveWorkbook(wb: XLSX.WorkBook, fileName: string): Promise<boolean> {
  const name = fileName.replace(/\.xlsx$/i, "");
  const sheets = wb.SheetNames.map(sheet => ({ sheet, columns: getSheetHeaders(wb.Sheets[sheet]) }))
    .filter(s => s.columns.length > 0);

  let finalWb = wb;
  if (columnPicker && sheets.length > 0) {
    const selection = await columnPicker({ fileName: name, sheets });
    if (!selection) return false;
    finalWb = applyColumnSelection(wb, selection);
    if (finalWb.SheetNames.length === 0) return false;
  }
  XLSX.writeFile(finalWb, `${name}.xlsx`);
  return true;
}

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return saveWorkbook(wb, fileName);
};

/* ── Import ──────────────────────────────────────────────────────────────────── */

/** Uploaded spreadsheets larger than this are rejected before parsing (protects the tab from huge files). */
export const MAX_EXCEL_BYTES = 10 * 1024 * 1024;

export const readFromExcel = async <T,>(file: File): Promise<T[]> => {
  if (file.size > MAX_EXCEL_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is 10 MB.`);
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  return XLSX.utils.sheet_to_json<T>(workbook.Sheets[firstSheetName]);
};

/** What the import reads from the first sheet of a file. */
export interface ImportColumn {
  header: string;
  required?: boolean;
  /** Other header spellings the import also accepts. */
  aliases?: string[];
  description?: string;
  example?: string | number;
}

export interface ImportTemplate {
  /** Used for the template file name, e.g. "Shifts" → Shifts_Import_Template.xlsx */
  name: string;
  columns: ImportColumn[];
  /** Optional worked example, written to an "Example" sheet (never imported: the import reads the first sheet) */
  exampleRows?: Record<string, unknown>[];
  /** Lines of explanation shown above the example rows */
  exampleNotes?: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

/** The template column a file header belongs to (by header or alias, ignoring case), if any. */
export function matchImportColumn(template: ImportTemplate, header: string): ImportColumn | undefined {
  const h = norm(header);
  return template.columns.find(c => norm(c.header) === h || (c.aliases ?? []).some(a => norm(a) === h));
}

/** Blank template: the first sheet has only the headers (so nothing gets imported by accident), the second explains each column. */
export function downloadImportTemplate(template: ImportTemplate) {
  const wb = XLSX.utils.book_new();
  const headers = template.columns.map(c => c.header);
  const data = XLSX.utils.aoa_to_sheet([headers]);
  data["!cols"] = headers.map(h => ({ wch: Math.max(14, h.length + 4) }));
  XLSX.utils.book_append_sheet(wb, data, "Data");

  const guide = XLSX.utils.aoa_to_sheet([
    ["Column", "Required", "What to enter", "Example"],
    ...template.columns.map(c => [c.header, c.required ? "Yes" : "No", c.description ?? "", c.example ?? ""]),
    [],
    ["Fill your rows in the \"Data\" sheet. Keep the header names as they are; optional columns can be removed or left blank."],
  ]);
  guide["!cols"] = [{ wch: 26 }, { wch: 10 }, { wch: 60 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, guide, "Instructions");

  if (template.exampleRows?.length) {
    const notes = (template.exampleNotes ?? []).map(n => [n]);
    const example = XLSX.utils.aoa_to_sheet([...notes, ...(notes.length ? [[]] : []), headers,
      ...template.exampleRows.map(r => headers.map(h => r[h] ?? ""))]);
    example["!cols"] = headers.map(h => ({ wch: Math.max(14, h.length + 4) }));
    XLSX.utils.book_append_sheet(wb, example, "Example");
  }

  XLSX.writeFile(wb, `${template.name.replace(/\s+/g, "_")}_Import_Template.xlsx`);
}

export interface ParsedImportFile {
  workbook: XLSX.WorkBook;
  sheetName: string;
  headers: string[];
  rowCount: number;
}

/** Reads the header row and data-row count of the first sheet (the sheet every import reads). */
export async function inspectImportFile(file: File): Promise<ParsedImportFile> {
  if (file.size > MAX_EXCEL_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is 10 MB.`);
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The file has no sheets.");
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  const headers = rows.length > 0 ? getSheetHeaders(ws) : [];
  return { workbook, sheetName, headers, rowCount: Math.max(0, rows.length - 1) };
}

/** A new .xlsx File whose first sheet keeps only the chosen columns; other sheets are unchanged. */
export function fileWithColumns(parsed: ParsedImportFile, keep: string[], originalName: string): File {
  const wb = applyColumnSelection(parsed.workbook, { [parsed.sheetName]: keep });
  const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const name = originalName.replace(/\.(xlsx|xls|csv)$/i, "") + ".xlsx";
  return new File([bytes], name, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
