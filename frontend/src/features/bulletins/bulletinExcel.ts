import * as XLSX from "xlsx";
import { readFromExcel } from "../../utils/excel";
import { 
  bulletinsApi, 
  type OperationBulletin, 
  type CreateBulletinDTO, 
  type BulletinLine,
  type BulletinStatus 
} from "./api";
import { operationsApi, type Operation } from "../operations/api";
import { stylesApi, type Style } from "../styles/api";
import { notifyMasterDataUpdated } from "../../utils/masterDataEvents";

/**
 * Supported fields across Operation Bulletin Header and Lines
 * (Garment Section, Predecessors, Stitch, Seam, and Attachment have been removed)
 */
export interface OperationBulletinExcelRow {
  // Bulletin Header Fields
  "Bulletin Code": string;
  "Bulletin Name": string;
  "Description"?: string;
  "Version"?: number;
  "Revision Number"?: number;
  "Status"?: string;
  "Effective From"?: string;
  "Effective To"?: string;
  "Styles"?: string;

  // Operation Line Fields
  "Sequence": number;
  "Operation Code": string;
  "Operation Name": string;
  "Machine Type": string;
  "SMV (sec)": number;
  "Skill Rating Required": number;
  "Parallelizable"?: string;
  "Split Allowed"?: string;
  "Split Type"?: string;
  "WIP Threshold"?: number;
  "Notes"?: string;
}

/**
 * Standard column layout & widths for polished Excel appearance
 */
const BULLETIN_EXCEL_COL_WIDTHS = [
  { wch: 18 }, // Bulletin Code
  { wch: 30 }, // Bulletin Name
  { wch: 32 }, // Description
  { wch: 10 }, // Version
  { wch: 14 }, // Revision Number
  { wch: 14 }, // Status
  { wch: 16 }, // Effective From
  { wch: 16 }, // Effective To
  { wch: 22 }, // Styles
  { wch: 10 }, // Sequence
  { wch: 18 }, // Operation Code
  { wch: 32 }, // Operation Name
  { wch: 28 }, // Machine Type
  { wch: 14 }, // SMV (sec)
  { wch: 18 }, // Skill Rating Required
  { wch: 14 }, // Parallelizable
  { wch: 14 }, // Split Allowed
  { wch: 14 }, // Split Type
  { wch: 16 }, // WIP Threshold
  { wch: 32 }, // Notes
];

/**
 * Export complete bulletins without the removed sections to an Excel workbook
 */
export function exportBulletinsDetailed(
  bulletins: OperationBulletin[], 
  fileName?: string
): void {
  const rows: any[] = [];

  bulletins.forEach(b => {
    const styleString = (b.styles || []).map(s => s.styleNo).join(", ");
    const lines = b.lines && b.lines.length > 0 ? b.lines : [];

    if (lines.length === 0) {
      // Create at least one row for empty bulletin so header info is preserved
      rows.push({
        "Bulletin Code": b.bulletinCode,
        "Bulletin Name": b.name,
        "Description": b.description || "",
        "Version": b.version || 1,
        "Revision Number": b.revisionNumber || 1,
        "Status": b.status || "DRAFT",
        "Effective From": b.effectiveFrom || "",
        "Effective To": b.effectiveTo || "",
        "Styles": styleString,
        "Sequence": 1,
        "Operation Code": "",
        "Operation Name": "",
        "Machine Type": "",
        "SMV (sec)": 0,
        "Skill Rating Required": 3,
        "Parallelizable": "Yes",
        "Split Allowed": "No",
        "Split Type": "NONE",
        "WIP Threshold": 20,
        "Notes": "",
      });
      return;
    }

    lines.forEach(l => {
      // Strictly seconds for SMV (minutes * 60)
      const smvSec = Math.round(Number(l.smv || 0) * 60 * 10) / 10;

      rows.push({
        "Bulletin Code": b.bulletinCode,
        "Bulletin Name": b.name,
        "Description": b.description || "",
        "Version": b.version || 1,
        "Revision Number": b.revisionNumber || 1,
        "Status": b.status || "DRAFT",
        "Effective From": b.effectiveFrom || "",
        "Effective To": b.effectiveTo || "",
        "Styles": styleString,
        "Sequence": l.sequence,
        "Operation Code": l.operationCode || "",
        "Operation Name": l.operationName || "",
        "Machine Type": l.machineType || "Single Needle Lockstitch",
        "SMV (sec)": smvSec,
        "Skill Rating Required": l.skillRatingRequired || 3,
        "Parallelizable": l.isParallelizable ? "Yes" : "No",
        "Split Allowed": l.splitAllowed ? "Yes" : "No",
        "Split Type": l.splitType || "NONE",
        "WIP Threshold": l.wipThreshold ?? 20,
        "Notes": l.notes || "",
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = BULLETIN_EXCEL_COL_WIDTHS;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Operation Bulletins");

  const resolvedName = fileName || `Operation_Bulletins_Full_${new Date().toISOString().split("T")[0]}`;
  XLSX.writeFile(wb, `${resolvedName}.xlsx`);
}

/**
 * Generate a complete Excel template with realistic sample data
 */
export function downloadBulletinTemplate(fileName?: string): void {
  const sampleRows = [
    {
      "Bulletin Code": "OB-POLO-001",
      "Bulletin Name": "Men's Classic Polo Shirt Flow",
      "Description": "100% Cotton pique short sleeve polo shirt with ribbed collar and placket",
      "Version": 1,
      "Revision Number": 1,
      "Status": "PUBLISHED",
      "Effective From": "2026-01-01",
      "Effective To": "2026-12-31",
      "Styles": "POLO-101, POLO-102",
      "Sequence": 1,
      "Operation Code": "OP-PL-01",
      "Operation Name": "Fuse Collar Band & Placket",
      "Machine Type": "Manual / Hand Ironing & Pressing",
      "SMV (sec)": 22.0,
      "Skill Rating Required": 2,
      "Parallelizable": "No",
      "Split Allowed": "No",
      "Split Type": "NONE",
      "WIP Threshold": 30,
      "Notes": "Press at 160°C for 10 seconds",
    },
    {
      "Bulletin Code": "OB-POLO-001",
      "Bulletin Name": "Men's Classic Polo Shirt Flow",
      "Description": "100% Cotton pique short sleeve polo shirt with ribbed collar and placket",
      "Version": 1,
      "Revision Number": 1,
      "Status": "PUBLISHED",
      "Effective From": "2026-01-01",
      "Effective To": "2026-12-31",
      "Styles": "POLO-101, POLO-102",
      "Sequence": 2,
      "Operation Code": "OP-PL-02",
      "Operation Name": "Placket Box Runstitch",
      "Machine Type": "Single Needle Lockstitch (SNLS)",
      "SMV (sec)": 45.0,
      "Skill Rating Required": 4,
      "Parallelizable": "Yes",
      "Split Allowed": "Yes",
      "Split Type": "RATIO",
      "WIP Threshold": 20,
      "Notes": "Ensure symmetrical box point",
    },
    {
      "Bulletin Code": "OB-POLO-001",
      "Bulletin Name": "Men's Classic Polo Shirt Flow",
      "Description": "100% Cotton pique short sleeve polo shirt with ribbed collar and placket",
      "Version": 1,
      "Revision Number": 1,
      "Status": "PUBLISHED",
      "Effective From": "2026-01-01",
      "Effective To": "2026-12-31",
      "Styles": "POLO-101, POLO-102",
      "Sequence": 3,
      "Operation Code": "OP-PL-03",
      "Operation Name": "Join Shoulders with Mobilon Tape",
      "Machine Type": "4-Thread Overlock",
      "SMV (sec)": 28.0,
      "Skill Rating Required": 3,
      "Parallelizable": "Yes",
      "Split Allowed": "Yes",
      "Split Type": "RATIO",
      "WIP Threshold": 25,
      "Notes": "Insert reinforcement tape evenly",
    },
    {
      "Bulletin Code": "OB-POLO-001",
      "Bulletin Name": "Men's Classic Polo Shirt Flow",
      "Description": "100% Cotton pique short sleeve polo shirt with ribbed collar and placket",
      "Version": 1,
      "Revision Number": 1,
      "Status": "PUBLISHED",
      "Effective From": "2026-01-01",
      "Effective To": "2026-12-31",
      "Styles": "POLO-101, POLO-102",
      "Sequence": 4,
      "Operation Code": "OP-PL-04",
      "Operation Name": "Attach Ribbed Collar & Trim",
      "Machine Type": "Single Needle Lockstitch (SNLS)",
      "SMV (sec)": 52.0,
      "Skill Rating Required": 5,
      "Parallelizable": "No",
      "Split Allowed": "Yes",
      "Split Type": "RATIO",
      "WIP Threshold": 15,
      "Notes": "Critical seam: maintain 1/4\" margin",
    },
    {
      "Bulletin Code": "OB-POLO-001",
      "Bulletin Name": "Men's Classic Polo Shirt Flow",
      "Description": "100% Cotton pique short sleeve polo shirt with ribbed collar and placket",
      "Version": 1,
      "Revision Number": 1,
      "Status": "PUBLISHED",
      "Effective From": "2026-01-01",
      "Effective To": "2026-12-31",
      "Styles": "POLO-101, POLO-102",
      "Sequence": 5,
      "Operation Code": "OP-PL-05",
      "Operation Name": "Side Seam & Vent Construction",
      "Machine Type": "4-Thread Overlock",
      "SMV (sec)": 36.5,
      "Skill Rating Required": 3,
      "Parallelizable": "Yes",
      "Split Allowed": "Yes",
      "Split Type": "RATIO",
      "WIP Threshold": 20,
      "Notes": "Leave 2\" vent at bottom slit",
    },
    {
      "Bulletin Code": "OB-TEE-001",
      "Bulletin Name": "Crew Neck T-Shirt Line Flow",
      "Description": "Basic 180 GSM single jersey crew neck t-shirt line routing",
      "Version": 1,
      "Revision Number": 1,
      "Status": "DRAFT",
      "Effective From": "2026-02-01",
      "Effective To": "",
      "Styles": "TEE-BASIC",
      "Sequence": 1,
      "Operation Code": "OP-TS-01",
      "Operation Name": "Join Left Shoulder",
      "Machine Type": "4-Thread Overlock",
      "SMV (sec)": 18.0,
      "Skill Rating Required": 2,
      "Parallelizable": "Yes",
      "Split Allowed": "No",
      "Split Type": "NONE",
      "WIP Threshold": 30,
      "Notes": "Include back neck twill tape",
    },
    {
      "Bulletin Code": "OB-TEE-001",
      "Bulletin Name": "Crew Neck T-Shirt Line Flow",
      "Description": "Basic 180 GSM single jersey crew neck t-shirt line routing",
      "Version": 1,
      "Revision Number": 1,
      "Status": "DRAFT",
      "Effective From": "2026-02-01",
      "Effective To": "",
      "Styles": "TEE-BASIC",
      "Sequence": 2,
      "Operation Code": "OP-TS-02",
      "Operation Name": "Attach Rib Neckband",
      "Machine Type": "4-Thread Overlock",
      "SMV (sec)": 32.5,
      "Skill Rating Required": 4,
      "Parallelizable": "Yes",
      "Split Allowed": "Yes",
      "Split Type": "RATIO",
      "WIP Threshold": 20,
      "Notes": "Distribute stretch evenly along neck opening",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws["!cols"] = BULLETIN_EXCEL_COL_WIDTHS;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bulletin Import Template");

  const resolvedName = fileName || "Operation_Bulletin_Import_Template";
  XLSX.writeFile(wb, `${resolvedName}.xlsx`);
}

/**
 * Normalized field extraction helper with multi-alias support
 */
function getRowValue(row: Record<string, any>, aliases: string[]): any {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
      return row[alias];
    }
    // Also try case-insensitive check
    const lowerAlias = alias.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase() === lowerAlias) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return row[key];
        }
      }
    }
  }
  return undefined;
}

/**
 * Boolean normalizer for Yes/No, True/False, 1/0
 */
function normalizeBoolean(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "boolean") return val;
  const s = String(val).trim().toLowerCase();
  if (s === "yes" || s === "true" || s === "1" || s === "y") return true;
  if (s === "no" || s === "false" || s === "0" || s === "n") return false;
  return defaultVal;
}

/**
 * Date normalizer for Excel serial numbers or standard strings
 */
function normalizeDate(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "number") {
    try {
      const d = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    } catch {
      return undefined;
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return undefined;
}

export interface ImportResult {
  success: boolean;
  bulletinsCreated: number;
  bulletinsUpdated: number;
  totalLinesProcessed: number;
  newOperationsCreated: number;
  newStylesCreated: number;
  errors: string[];
}

/**
 * Parse an Excel file and import Operation Bulletins
 */
export async function importBulletinsFromExcel(
  file: File,
  existingBulletins: OperationBulletin[],
  existingOperations: Operation[],
  existingStyles: Style[]
): Promise<ImportResult> {
  const errors: string[] = [];
  let bulletinsCreated = 0;
  let bulletinsUpdated = 0;
  let totalLinesProcessed = 0;
  let newOperationsCreated = 0;
  let newStylesCreated = 0;

  // Local mutable catalogs so newly created styles/ops in the same batch can be linked
  const localOps = [...existingOperations];
  const localStyles = [...existingStyles];

  let rawRows: Record<string, any>[] = [];
  try {
    rawRows = await readFromExcel<Record<string, any>>(file);
  } catch (err: any) {
    return {
      success: false,
      bulletinsCreated: 0,
      bulletinsUpdated: 0,
      totalLinesProcessed: 0,
      newOperationsCreated: 0,
      newStylesCreated: 0,
      errors: [`Failed to read Excel file: ${err.message || String(err)}`],
    };
  }

  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      bulletinsCreated: 0,
      bulletinsUpdated: 0,
      totalLinesProcessed: 0,
      newOperationsCreated: 0,
      newStylesCreated: 0,
      errors: ["Excel sheet is empty. Please ensure data exists in the first sheet."],
    };
  }

  // Group rows by Bulletin Code
  const groupedBulletins = new Map<string, Record<string, any>[]>();

  rawRows.forEach((row, idx) => {
    const rawCode = getRowValue(row, [
      "Bulletin Code", "BulletinCode", "bulletin_code", "Code", "OB Code", "OB_CODE"
    ]);
    const rawName = getRowValue(row, [
      "Bulletin Name", "BulletinName", "bulletin_name", "Name", "Title"
    ]);

    // Skip completely blank rows
    if (!rawCode && !rawName && !getRowValue(row, ["Operation Code", "Operation Name", "Sequence"])) {
      return;
    }

    const groupKey = (rawCode ? String(rawCode).trim().toUpperCase() : "") ||
      (rawName ? `NAME_${String(rawName).trim().toUpperCase()}` : `ROW_GROUP_${idx + 1}`);

    if (!groupedBulletins.has(groupKey)) {
      groupedBulletins.set(groupKey, []);
    }
    groupedBulletins.get(groupKey)!.push(row);
  });

  if (groupedBulletins.size === 0) {
    return {
      success: false,
      bulletinsCreated: 0,
      bulletinsUpdated: 0,
      totalLinesProcessed: 0,
      newOperationsCreated: 0,
      newStylesCreated: 0,
      errors: ["No valid bulletin rows found. Please check column headers against the template."],
    };
  }

  // Process each bulletin group
  for (const [groupKey, rows] of groupedBulletins.entries()) {
    try {
      const firstRow = rows[0];

      // Extract Bulletin Header Fields
      const rawCode = getRowValue(firstRow, [
        "Bulletin Code", "BulletinCode", "bulletin_code", "Code", "OB Code"
      ]);
      const bulletinCode = rawCode ? String(rawCode).trim().toUpperCase() : `OB-${Date.now().toString().slice(-4)}`;

      const rawName = getRowValue(firstRow, [
        "Bulletin Name", "BulletinName", "bulletin_name", "Name", "Title"
      ]);
      const bulletinName = rawName ? String(rawName).trim() : `Operation Bulletin ${bulletinCode}`;

      const description = getRowValue(firstRow, ["Description", "description", "Desc"]) || "";
      const version = parseInt(getRowValue(firstRow, ["Version", "version", "Ver"]) || "1", 10) || 1;
      const revisionNumber = parseInt(getRowValue(firstRow, ["Revision Number", "Revision", "revisionNumber", "Rev"]) || "1", 10) || 1;

      const rawStatus = String(getRowValue(firstRow, ["Status", "status"]) || "DRAFT").trim().toUpperCase();
      const validStatuses: BulletinStatus[] = ["DRAFT", "UNDER_REVIEW", "APPROVED", "RELEASED", "PUBLISHED", "ARCHIVED", "OBSOLETE"];
      const status: BulletinStatus = validStatuses.includes(rawStatus as any) ? (rawStatus as BulletinStatus) : "DRAFT";

      const effectiveFrom = normalizeDate(getRowValue(firstRow, ["Effective From", "EffectiveFrom", "effective_from"]));
      const effectiveTo = normalizeDate(getRowValue(firstRow, ["Effective To", "EffectiveTo", "effective_to"]));

      // Resolve Style IDs
      const rawStyles = getRowValue(firstRow, [
        "Styles", "Style", "Linked Styles", "Garment Styles", "Style No", "Style Code"
      ]);
      const styleIds: (string | number)[] = [];

      if (rawStyles) {
        const styleTokens = String(rawStyles).split(",").map(s => s.trim()).filter(Boolean);
        for (const token of styleTokens) {
          let foundStyle = localStyles.find(
            s => s.styleNo.toLowerCase() === token.toLowerCase() || String(s.id) === token
          );
          if (!foundStyle) {
            try {
              foundStyle = await stylesApi.createStyle({
                styleNo: token.toUpperCase(),
                buyer: "Master Import",
                description: `Auto-registered during Bulletin ${bulletinCode} import`,
                season: "Standard",
                productType: "Garment",
                active: true,
              });
              localStyles.push(foundStyle);
              newStylesCreated += 1;
            } catch (styleErr) {
              console.warn(`Could not auto-create style '${token}':`, styleErr);
            }
          }
          if (foundStyle && foundStyle.id) {
            styleIds.push(foundStyle.id);
          }
        }
      }

      // Extract & Process Operation Lines
      const linesPayload: CreateBulletinDTO["lines"] = [];

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];

        // Sequence
        const seqVal = parseInt(getRowValue(row, ["Sequence", "Seq", "Seq #", "Step", "Order"]) || String(rIdx + 1), 10);
        const sequence = !isNaN(seqVal) && seqVal > 0 ? seqVal : rIdx + 1;

        // Operation Code & Name
        const opCode = String(getRowValue(row, ["Operation Code", "Op Code", "OperationCode", "Code"]) || "").trim();
        const opName = String(getRowValue(row, ["Operation Name", "Operation", "OperationName", "Name"]) || "").trim();

        if (!opCode && !opName) continue;

        // Machine Type
        const machineType = String(
          getRowValue(row, ["Machine Type", "Machine", "Machinery", "machineType"]) || "Single Needle Lockstitch"
        ).trim();

        // SMV in SECONDS
        const rawSec = getRowValue(row, [
          "SMV (sec)", "SMV (Sec)", "SMV (secs)", "SMV (Seconds)", 
          "SMV", "Standard SMV (sec)", "Standard SMV", "Cycle Time (sec)", "SAM (sec)"
        ]);
        const parsedSec = rawSec !== undefined ? parseFloat(String(rawSec).replace(/[^0-9.]/g, "")) : 30;
        const validSec = !isNaN(parsedSec) && parsedSec > 0 ? parsedSec : 30;
        const smvMinutes = validSec / 60;

        // Skill Rating Required (1 to 5)
        const rawSkill = parseInt(getRowValue(row, [
          "Skill Rating Required", "Skill Rating", "Skill Level", "Skill Required", "Rating"
        ]) || "3", 10);
        const skillRatingRequired = Math.max(1, Math.min(5, isNaN(rawSkill) ? 3 : rawSkill));

        // Parallelizable
        const rawParallel = getRowValue(row, ["Parallelizable", "Is Parallelizable", "Parallel"]);
        const isParallelizable = normalizeBoolean(rawParallel, true);

        // Split Allowed & Split Type
        const rawSplit = getRowValue(row, ["Split Allowed", "Can Split", "Allow Split"]);
        const splitAllowed = normalizeBoolean(rawSplit, false);

        const rawSplitType = String(getRowValue(row, ["Split Type", "Split Method"]) || "NONE").trim().toUpperCase();
        const splitType = ["NONE", "RATIO", "EQUAL", "BATCH"].includes(rawSplitType) ? rawSplitType : (splitAllowed ? "RATIO" : "NONE");

        // WIP Threshold
        const rawWip = parseInt(getRowValue(row, ["WIP Threshold", "WIP Threshold (pcs)", "WIP Buffer", "Buffer"]) || "20", 10);
        const wipThreshold = !isNaN(rawWip) && rawWip >= 0 ? rawWip : 20;

        // Notes
        const notes = String(getRowValue(row, ["Notes", "Remarks", "Quality Points", "Comments"]) || "").trim();

        // Resolve or Auto-Create Master Operation
        let matchedOp = localOps.find(
          o => (opCode && o.operationCode?.toUpperCase() === opCode.toUpperCase()) ||
               (opName && o.name?.toLowerCase() === opName.toLowerCase())
        );

        if (!matchedOp) {
          try {
            const newOpPayload = {
              operationCode: opCode || `OP-${Date.now().toString().slice(-4)}-${sequence}`,
              name: opName || `Operation ${opCode || sequence}`,
              description: notes || `Auto-created from bulletin import (${bulletinCode})`,
              sequence: sequence,
              active: true,
              standardSmv: smvMinutes,
              machineType: machineType,
              skillLevelRequired: skillRatingRequired,
            };
            matchedOp = await operationsApi.createOperation(newOpPayload);
            localOps.push(matchedOp);
            newOperationsCreated += 1;
          } catch (opCreateErr) {
            console.warn(`Failed to auto-create operation for '${opCode || opName}':`, opCreateErr);
            matchedOp = localOps[0];
          }
        }

        if (!matchedOp || !matchedOp.id) {
          errors.push(`Row ${rIdx + 1}: Could not find or create operation for '${opName || opCode}' in bulletin '${bulletinCode}'.`);
          continue;
        }

        linesPayload.push({
          sequence,
          operationId: matchedOp.id,
          smv: smvMinutes,
          machineType,
          skillRatingRequired,
          section: "MAIN_ASSEMBLY",
          predecessorIds: "",
          isParallelizable,
          splitAllowed,
          splitType,
          stitchType: "",
          seamType: "",
          attachmentType: "",
          wipThreshold,
          notes,
        });

        totalLinesProcessed += 1;
      }

      if (linesPayload.length === 0) {
        errors.push(`Bulletin '${bulletinCode}' has no valid operation lines. Skipped.`);
        continue;
      }

      // Check if this bulletin already exists
      const existing = existingBulletins.find(
        b => b.bulletinCode?.toUpperCase() === bulletinCode.toUpperCase()
      );

      const bulletinPayload: CreateBulletinDTO = {
        bulletinCode,
        name: bulletinName,
        description,
        version,
        revisionNumber,
        status,
        effectiveFrom,
        effectiveTo,
        styleIds,
        lines: linesPayload,
      };

      if (existing && existing.id) {
        await bulletinsApi.updateBulletin(existing.id, bulletinPayload);
        bulletinsUpdated += 1;
      } else {
        await bulletinsApi.createBulletin(bulletinPayload);
        bulletinsCreated += 1;
      }

    } catch (bulletinErr: any) {
      console.error(`Failed to process bulletin group '${groupKey}':`, bulletinErr);
      errors.push(
        `Failed to import '${groupKey}': ${bulletinErr?.response?.data?.message || bulletinErr?.message || String(bulletinErr)}`
      );
    }
  }

  notifyMasterDataUpdated("bulletin");
  if (newOperationsCreated > 0) notifyMasterDataUpdated("operation");
  if (newStylesCreated > 0) notifyMasterDataUpdated("style");

  return {
    success: (bulletinsCreated + bulletinsUpdated) > 0,
    bulletinsCreated,
    bulletinsUpdated,
    totalLinesProcessed,
    newOperationsCreated,
    newStylesCreated,
    errors,
  };
}

/**
 * Specifically parses operation lines for populating directly into BulletinForm
 */
export async function parseLinesForBulletinForm(
  file: File,
  existingOperations: Operation[]
): Promise<{ lines: BulletinLine[]; newOpsCount: number; errors: string[] }> {
  const errors: string[] = [];
  const lines: BulletinLine[] = [];
  let newOpsCount = 0;
  const localOps = [...existingOperations];

  const rawRows = await readFromExcel<Record<string, any>>(file);

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const opCode = String(getRowValue(row, ["Operation Code", "Op Code", "OperationCode", "Code"]) || "").trim();
    const opName = String(getRowValue(row, ["Operation Name", "Operation", "OperationName", "Name"]) || "").trim();

    if (!opCode && !opName) continue;

    const seqVal = parseInt(getRowValue(row, ["Sequence", "Seq", "Seq #", "Step"]) || String(lines.length + 1), 10);
    const sequence = !isNaN(seqVal) && seqVal > 0 ? seqVal : lines.length + 1;

    const machineType = String(
      getRowValue(row, ["Machine Type", "Machine", "Machinery", "machineType"]) || "Single Needle Lockstitch"
    ).trim();

    const rawSec = getRowValue(row, ["SMV (sec)", "SMV (Sec)", "SMV", "Standard SMV (sec)", "Cycle Time (sec)"]);
    const parsedSec = rawSec !== undefined ? parseFloat(String(rawSec).replace(/[^0-9.]/g, "")) : 30;
    const validSec = !isNaN(parsedSec) && parsedSec > 0 ? parsedSec : 30;
    const smvMinutes = validSec / 60;

    const rawSkill = parseInt(getRowValue(row, ["Skill Rating Required", "Skill Rating", "Skill Level"]) || "3", 10);
    const skillRatingRequired = Math.max(1, Math.min(5, isNaN(rawSkill) ? 3 : rawSkill)) as 1 | 2 | 3 | 4 | 5;

    const isParallelizable = normalizeBoolean(getRowValue(row, ["Parallelizable", "Is Parallelizable"]), true);
    const splitAllowed = normalizeBoolean(getRowValue(row, ["Split Allowed", "Can Split"]), false);
    const rawSplitType = String(getRowValue(row, ["Split Type"]) || "NONE").trim().toUpperCase();
    const splitType = ["NONE", "RATIO", "EQUAL", "BATCH"].includes(rawSplitType) ? rawSplitType : (splitAllowed ? "RATIO" : "NONE");

    const rawWip = parseInt(getRowValue(row, ["WIP Threshold", "WIP Threshold (pcs)"]) || "20", 10);
    const wipThreshold = !isNaN(rawWip) && rawWip >= 0 ? rawWip : 20;
    const notes = String(getRowValue(row, ["Notes", "Remarks"]) || "").trim();

    let matchedOp = localOps.find(
      o => (opCode && o.operationCode?.toUpperCase() === opCode.toUpperCase()) ||
           (opName && o.name?.toLowerCase() === opName.toLowerCase())
    );

    if (!matchedOp) {
      try {
        matchedOp = await operationsApi.createOperation({
          operationCode: opCode || `OP-${Date.now().toString().slice(-4)}-${sequence}`,
          name: opName || `Operation ${opCode || sequence}`,
          description: notes || "Auto-created during bulletin line import",
          sequence,
          active: true,
          standardSmv: smvMinutes,
          machineType,
          skillLevelRequired: skillRatingRequired,
        });
        localOps.push(matchedOp);
        newOpsCount += 1;
      } catch (e) {
        matchedOp = localOps[0];
      }
    }

    if (!matchedOp) {
      errors.push(`Row ${idx + 1}: Operation '${opCode || opName}' could not be matched.`);
      continue;
    }

    lines.push({
      id: `imported-line-${Date.now()}-${sequence}`,
      sequence,
      operationId: matchedOp.id,
      operationCode: matchedOp.operationCode || opCode,
      operationName: matchedOp.name || opName,
      smv: smvMinutes,
      machineType,
      skillRatingRequired,
      section: "MAIN_ASSEMBLY",
      predecessorIds: "",
      isParallelizable,
      splitAllowed,
      splitType,
      stitchType: "",
      seamType: "",
      attachmentType: "",
      wipThreshold,
      notes,
    });
  }

  return { lines, newOpsCount, errors };
}
