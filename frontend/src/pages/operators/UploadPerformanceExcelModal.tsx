import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { skillApi, cycleTimeToRating, type PerformanceLogInput } from "../../features/skill-matrix/api";
import type { Operation } from "../../features/operations/api";
import type { Operator } from "../../features/operators/api";

interface UploadPerformanceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator?: Operator | null;
  allOperators: Operator[];
  allOperations: Operation[];
  onSuccess: () => void;
}

interface ParsedTestRow {
  employeeId: string;
  operatorId: number;
  operatorName: string;
  operationCodeOrName: string;
  operationId: number;
  operationName: string;
  logDate: string;
  cycleTimeSeconds: number;
  recordedBy: string;
  notes: string;
}

export function UploadPerformanceExcelModal({
  isOpen,
  onClose,
  operator,
  allOperators,
  allOperations,
  onSuccess,
}: UploadPerformanceExcelModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTestRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const defaultEmpId = operator?.employeeId || allOperators[0]?.employeeId || "EMP-1201";
    const sampleOp1 = allOperations[0]?.name || "Shoulder Join";
    const sampleOp2 = allOperations[1]?.name || "Neck Rib Attach";
    const today = new Date().toISOString().split("T")[0];

    const templateData = [
      {
        "Employee ID": defaultEmpId,
        "Operation": sampleOp1,
        "Test Date (YYYY-MM-DD)": today,
        "Cycle Time (Seconds)": 14,
        "Tested By": "Line Manager",
        "Notes": "Test Run 1",
      },
      {
        "Employee ID": defaultEmpId,
        "Operation": sampleOp1,
        "Test Date (YYYY-MM-DD)": today,
        "Cycle Time (Seconds)": 16,
        "Tested By": "Line Manager",
        "Notes": "Test Run 2",
      },
      {
        "Employee ID": defaultEmpId,
        "Operation": sampleOp1,
        "Test Date (YYYY-MM-DD)": today,
        "Cycle Time (Seconds)": 18,
        "Tested By": "Line Manager",
        "Notes": "Test Run 3",
      },
      {
        "Employee ID": defaultEmpId,
        "Operation": sampleOp2,
        "Test Date (YYYY-MM-DD)": today,
        "Cycle Time (Seconds)": 8,
        "Tested By": "Line Manager",
        "Notes": "Test Run 1",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance_Tests");
    XLSX.writeFile(workbook, "Operator_Performance_Test_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    parseExcel(selected);
  };

  const parseExcel = async (fileObj: File) => {
    setParseErrors([]);
    setParsedRows([]);

    try {
      const buffer = await fileObj.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rawData.length === 0) {
        setParseErrors(["The uploaded sheet contains no data rows."]);
        return;
      }

      const rows: ParsedTestRow[] = [];
      const errors: string[] = [];

      rawData.forEach((item, index) => {
        const rowNum = index + 2;

        // Flexible key matching
        const empCode = String(
          item["Employee ID"] ||
            item["EmployeeID"] ||
            item["Emp ID"] ||
            item["Employee Code"] ||
            item["Operator ID"] ||
            (operator ? operator.employeeId : "")
        ).trim();

        const opField = String(
          item["Operation"] ||
            item["Operation Name"] ||
            item["Operation Code"] ||
            item["OperationCode"] ||
            ""
        ).trim();

        const dateField = String(
          item["Test Date (YYYY-MM-DD)"] ||
            item["Test Date"] ||
            item["Date"] ||
            new Date().toISOString().split("T")[0]
        ).trim();

        const cycleTimeField = parseFloat(
          String(
            item["Cycle Time (Seconds)"] ||
              item["Cycle Time"] ||
              item["CycleTime"] ||
              item["Time (sec)"] ||
              item["Seconds"] ||
              ""
          )
        );

        const testerField = String(
          item["Tested By"] || item["Recorded By"] || item["Manager"] || "Manager"
        ).trim();

        const notesField = String(item["Notes"] || item["Observation"] || "").trim();

        // Match Operator
        const matchedOp = allOperators.find(
          (o) =>
            o.employeeId.toLowerCase() === empCode.toLowerCase() ||
            String(o.id) === empCode
        ) || (operator && operator.employeeId.toLowerCase() === empCode.toLowerCase() ? operator : null);

        if (!matchedOp) {
          errors.push(`Row ${rowNum}: Employee '${empCode}' not found in system.`);
          return;
        }

        // Match Operation
        const matchedOperation = allOperations.find(
          (op) =>
            op.name.toLowerCase() === opField.toLowerCase() ||
            op.operationCode.toLowerCase() === opField.toLowerCase() ||
            String(op.id) === opField
        );

        if (!matchedOperation) {
          errors.push(`Row ${rowNum}: Operation '${opField}' not recognized.`);
          return;
        }

        if (isNaN(cycleTimeField) || cycleTimeField <= 0) {
          errors.push(`Row ${rowNum}: Invalid cycle time '${cycleTimeField}'. Must be positive number of seconds.`);
          return;
        }

        rows.push({
          employeeId: matchedOp.employeeId,
          operatorId: Number(matchedOp.id),
          operatorName: matchedOp.name,
          operationCodeOrName: opField,
          operationId: Number(matchedOperation.id),
          operationName: matchedOperation.name,
          logDate: dateField,
          cycleTimeSeconds: Math.round(cycleTimeField),
          recordedBy: testerField,
          notes: notesField,
        });
      });

      setParsedRows(rows);
      setParseErrors(errors);
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setParseErrors(["Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file."]);
    }
  };

  // Group summary for preview
  const groupedSummary = React.useMemo(() => {
    const map = new Map<
      string,
      {
        operatorId: string | number;
        operationId: string | number;
        date: string;
        operatorName: string;
        employeeId: string;
        operationName: string;
        times: number[];
      }
    >();
    parsedRows.forEach((r) => {
      const key = `${r.operatorId}_${r.operationId}_${r.logDate}`;
      if (!map.has(key)) {
        map.set(key, {
          operatorId: r.operatorId,
          operationId: r.operationId,
          date: r.logDate,
          operatorName: r.operatorName,
          employeeId: r.employeeId,
          operationName: r.operationName,
          times: [],
        });
      }
      map.get(key)!.times.push(r.cycleTimeSeconds);
    });

    return Array.from(map.entries()).map(([key, data]) => {
      const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
      return {
        key,
        ...data,
        count: data.times.length,
        avg: avg.toFixed(1),
        rating: cycleTimeToRating(avg, data.operationName),
      };
    });
  }, [parsedRows]);

  const handleUploadSubmit = async (status: "DRAFT" | "SUBMITTED") => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    try {
      const payload: PerformanceLogInput[] = parsedRows.map((r) => ({
        operatorId: r.operatorId,
        operationId: r.operationId,
        logDate: r.logDate,
        actualCycleTimeSeconds: r.cycleTimeSeconds,
        recordedBy: r.recordedBy,
        status,
        notes: r.notes,
      }));

      await skillApi.batchAddPerformanceLogs(payload);

      // If submitting, also directly write assessments so Skill Matrix reflects immediately
      if (status === "SUBMITTED") {
        for (const item of groupedSummary) {
          try {
            await skillApi.addAssessment({
              operatorId: Number(item.operatorId),
              operationId: Number(item.operationId),
              rating: item.rating as 1 | 2 | 3 | 4 | 5,
              cycleTimeSeconds: Math.round(Number(item.avg)),
              effectiveDate: item.date,
              notes: `Excel submitted ${item.count} test runs (Avg: ${item.avg}s)`,
            });
          } catch (assessErr) {
            console.warn("Direct assessment update fallback:", assessErr);
          }
        }
      }

      onSuccess();
      onClose();
      setFile(null);
      setParsedRows([]);
      setParseErrors([]);
    } catch (err) {
      console.error("Failed to upload batch performance logs:", err);
      alert("Failed to save performance test logs. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Performance Test Data via Excel"
      subtitle="Import multiple operator performance test timings. Choose to save as draft or submit directly to update the Skill Matrix."
    >
      <div className="space-y-4">
        {/* Template Download Banner */}
        <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#2563EB]" />
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Download Standard Template</div>
              <div className="text-[11px] text-[#64748B]">Excel template pre-formatted with required columns</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F172A] text-xs font-bold rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Template
          </button>
        </div>

        {/* Drag & Drop / File Input Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E2E8F0] hover:border-[#2563EB] bg-[#F8FAFC] hover:bg-[#F8FAFC] rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <Upload className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
          <p className="text-xs font-bold text-[#0F172A]">
            {file ? file.name : "Click to select or drag & drop Excel / CSV file"}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">Supports .xlsx, .xls, and .csv files</p>
        </div>

        {/* Errors Box */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{parseErrors.length} Issue(s) found in Excel file:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
              {parseErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Parsed {parsedRows.length} Test Runs ({groupedSummary.length} Operation Summaries)
              </span>
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-bold text-[#64748B] uppercase">
                  <tr>
                    <th className="py-2 px-3">Operator</th>
                    <th className="py-2 px-3">Operation</th>
                    <th className="py-2 px-2 text-center">Tests</th>
                    <th className="py-2 px-2 text-center">Avg Time</th>
                    <th className="py-2 px-3 text-right">Auto Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {groupedSummary.map((item) => (
                    <tr key={item.key} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2 px-3 font-semibold text-[#0F172A]">
                        {item.operatorName} <span className="text-[#64748B] font-normal font-mono text-[10px]">({item.employeeId})</span>
                      </td>
                      <td className="py-2 px-3 text-[#0F172A]">{item.operationName}</td>
                      <td className="py-2 px-2 text-center font-bold text-[#0F172A]">{item.count}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-[#2563EB]">{item.avg}s</td>
                      <td className="py-2 px-3 text-right">
                        <span className="inline-block bg-[#0F172A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Rating {item.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons: Import as Draft vs Submit */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#F1F5F9]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 h-9 text-xs font-semibold text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUploadSubmit("DRAFT")}
              disabled={uploading || parsedRows.length === 0}
              className="px-4 h-9 text-xs font-bold text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] rounded-lg disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              Import as Draft
            </button>
            <button
              type="button"
              onClick={() => handleUploadSubmit("SUBMITTED")}
              disabled={uploading || parsedRows.length === 0}
              className="px-5 h-9 text-xs font-bold text-white bg-[#0F172A] rounded-lg hover:bg-[#3A2E24] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {uploading ? "Importing..." : `Submit & Reflect ${groupedSummary.length} Ratings`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
