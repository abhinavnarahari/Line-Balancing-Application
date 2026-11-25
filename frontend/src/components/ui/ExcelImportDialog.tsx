import { useRef, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Lock, Upload } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "../../utils/cn";
import {
  downloadImportTemplate, fileWithColumns, inspectImportFile, matchImportColumn,
  type ImportTemplate, type ParsedImportFile,
} from "../../utils/excel";
import { getErrorMessage } from "../../lib/api";

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  template?: ImportTemplate;
  /** Replaces the generated blank template (e.g. a template with a worked example). */
  onDownloadTemplate?: () => void;
  onImport: (file: File) => void;
}

/** Import in three steps: get the template, choose a file, choose which of its columns to import. */
export function ExcelImportDialog({ isOpen, onClose, title, template, onDownloadTemplate, onImport }: ExcelImportDialogProps) {
  const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsed(null);
    setFileName("");
    setError("");
    setKeep(new Set());
  };

  const close = () => {
    reset();
    onClose();
  };

  const isRequired = (header: string) => !!(template && matchImportColumn(template, header)?.required);
  const isKnown = (header: string) => !template || !!matchImportColumn(template, header);

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setFileName(file.name);
    setReading(true);
    try {
      const result = await inspectImportFile(file);
      setParsed(result);
      // Columns the import understands are on by default; unrecognised ones are off
      setKeep(new Set(result.headers.filter(isKnown)));
    } catch (err) {
      setError(`Could not read the file: ${getErrorMessage(err)}`);
    } finally {
      setReading(false);
    }
  };

  const toggle = (header: string) => {
    if (isRequired(header)) return;
    setKeep(prev => {
      const next = new Set(prev);
      if (next.has(header)) next.delete(header); else next.add(header);
      return next;
    });
  };

  const missingRequired = parsed && template
    ? template.columns.filter(c => c.required && !parsed.headers.some(h => matchImportColumn(template, h) === c))
    : [];
  const canImport = !!parsed && parsed.rowCount > 0 && missingRequired.length === 0 && keep.size > 0;

  const runImport = () => {
    if (!parsed || !canImport) return;
    const columns = parsed.headers.filter(h => keep.has(h));
    const file = fileWithColumns(parsed, columns, fileName);
    close();
    onImport(file);
  };

  const downloadTemplate = () => {
    if (onDownloadTemplate) onDownloadTemplate();
    else if (template) downloadImportTemplate(template);
  };

  const requiredNames = template?.columns.filter(c => c.required).map(c => c.header) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} subtitle="Import rows from an Excel file (.xlsx or .xls)." maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Step 1: template */}
        {(template || onDownloadTemplate) && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E6DDCE] bg-[#FAF7F2] px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#221912]">1. Start from the template</p>
              <p className="text-[11px] text-[#8C7E6E] leading-relaxed">
                {requiredNames.length > 0
                  ? <>Required columns: <span className="font-semibold text-[#221912]">{requiredNames.join(", ")}</span>. The Instructions sheet explains each column.</>
                  : "Has the column headers the import expects, with notes on each column."}
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="shrink-0 h-9 px-3.5 rounded-xl border border-[#E6DDCE] bg-white hover:bg-[#F6F1E8] text-xs font-bold text-[#9C5B3C] flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>
        )}

        {/* Step 2: file */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#221912]">{template || onDownloadTemplate ? "2. " : ""}Choose your file</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-[#E6DDCE] hover:border-[#9C5B3C]/60 bg-white px-4 py-4 flex items-center gap-3 text-left cursor-pointer"
          >
            <span className="w-9 h-9 rounded-lg bg-[#F6F1E8] flex items-center justify-center text-[#9C5B3C] shrink-0">
              {fileName ? <FileSpreadsheet className="w-4.5 h-4.5" /> : <Upload className="w-4.5 h-4.5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-[#221912] truncate">{fileName || "Select an Excel file"}</span>
              <span className="block text-[11px] text-[#8C7E6E]">
                {reading ? "Reading…" : parsed ? `${parsed.rowCount} data row${parsed.rowCount === 1 ? "" : "s"} in "${parsed.sheetName}" · click to choose another` : "The first sheet is imported"}
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            aria-label="Excel file to import"
            onChange={e => { chooseFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          {error && <p className="text-[11px] font-semibold text-rose-700">{error}</p>}
        </div>

        {/* Step 3: columns */}
        {parsed && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-[#221912]">
                {template || onDownloadTemplate ? "3. " : ""}Columns to import
                <span className="ml-2 font-mono font-semibold text-[#8C7E6E]">{keep.size}/{parsed.headers.length}</span>
              </p>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <button type="button" className="text-[#9C5B3C] hover:underline cursor-pointer" onClick={() => setKeep(new Set(parsed.headers.filter(isKnown)))}>All</button>
                <button type="button" className="text-[#8C7E6E] hover:underline cursor-pointer" onClick={() => setKeep(new Set(parsed.headers.filter(isRequired)))}>Required only</button>
              </div>
            </div>

            {missingRequired.length > 0 && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>The file is missing required column{missingRequired.length === 1 ? "" : "s"}: <b>{missingRequired.map(c => c.header).join(", ")}</b>. Use the template headers.</span>
              </div>
            )}
            {parsed.rowCount === 0 && (
              <p className="text-[11px] font-semibold text-rose-700">The first sheet has no data rows below the headers.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {parsed.headers.map(h => {
                const required = isRequired(h);
                const known = isKnown(h);
                return (
                  <label
                    key={h}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs",
                      required ? "border-[#E6DDCE] bg-[#FAF7F2] cursor-default" : "border-[#EFE7DA] hover:bg-[#FAF7F2] cursor-pointer",
                      !known && "opacity-70"
                    )}
                    title={required ? "Required: always imported" : known ? undefined : "This import does not use this column"}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[#9C5B3C] cursor-pointer disabled:cursor-default"
                      checked={keep.has(h)}
                      disabled={required}
                      onChange={() => toggle(h)}
                    />
                    <span className="truncate text-[#221912]">{h}</span>
                    {required && <Lock className="w-3 h-3 text-[#8C7E6E] shrink-0 ml-auto" aria-label="Required" />}
                    {!known && <span className="ml-auto shrink-0 text-[10px] text-[#8C7E6E]">not used</span>}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-[#8C7E6E] leading-relaxed">
              Unticked columns are ignored, as if they were not in the file. Required columns are always imported.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="h-9 px-4 rounded-xl border border-[#E6DDCE] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#8C7E6E] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={runImport}
          disabled={!canImport}
          className="h-9 px-4 rounded-xl bg-[#9C5B3C] hover:bg-[#854D33] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          {parsed && parsed.rowCount > 0 ? `Import ${parsed.rowCount} row${parsed.rowCount === 1 ? "" : "s"}` : "Import"}
        </button>
      </div>
    </Modal>
  );
}
