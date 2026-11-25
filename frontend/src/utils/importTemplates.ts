import type { ImportTemplate } from "./excel";

/*
 * The columns each master-data import reads. They feed the downloadable template and the
 * "columns to import" check in the import dialog, so keep them in step with the page's import handler.
 */

export const SHIFTS_TEMPLATE: ImportTemplate = {
  name: "Shifts",
  columns: [
    { header: "Shift Code", required: true, description: "Short unique code", example: "A" },
    { header: "Name", required: true, description: "Shift name", example: "A Shift" },
    { header: "Start Time", required: true, description: "24-hour time HH:mm", example: "08:00" },
    { header: "End Time", required: true, description: "24-hour time HH:mm (earlier than start = overnight)", example: "17:00" },
    { header: "Status", description: "Active or Inactive (blank = Active)", example: "Active" },
  ],
};

export const SIZES_TEMPLATE: ImportTemplate = {
  name: "Sizes",
  columns: [
    { header: "Code", required: true, description: "Unique size code", example: "M" },
    { header: "Label", required: true, description: "Display name", example: "Medium" },
    { header: "Sequence", description: "Sort order (blank = 1)", example: 3 },
    { header: "Status", description: "Active or Inactive (blank = Active)", example: "Active" },
  ],
};

export const OPERATIONS_TEMPLATE: ImportTemplate = {
  name: "Operations",
  columns: [
    { header: "Operation Code", required: true, description: "Unique code; an existing code is updated", example: "OP-001" },
    { header: "Name", required: true, description: "Operation name", example: "Attach collar" },
    { header: "Machine Type", description: "Machine used (blank = Single Needle Lockstitch)", example: "Single Needle Lockstitch" },
    { header: "Standard SMV (sec)", aliases: ["Standard SMV (Sec)", "Standard SMV", "SMV (sec)", "SMV (Sec)", "SMV"], description: "Standard time in seconds (blank = 30)", example: 42 },
    { header: "Sequence", description: "Order in the garment flow", example: 10 },
    { header: "Description", description: "Free text" },
    { header: "Status", description: "Active or Inactive (blank = Active)", example: "Active" },
  ],
};

export const MACHINES_TEMPLATE: ImportTemplate = {
  name: "Machines",
  columns: [
    { header: "Machine Code", required: true, description: "Unique machine code", example: "SNL-001" },
    { header: "Machine Type", required: true, description: "Type of machine", example: "Single Needle Lockstitch" },
    { header: "Brand", description: "Manufacturer", example: "Juki" },
    { header: "Model", description: "Model number", example: "DDL-8700" },
    { header: "Serial Number", description: "Serial number" },
    { header: "Status", description: "AVAILABLE, IN_USE, IDLE or UNDER_MAINTENANCE (blank = AVAILABLE)", example: "AVAILABLE" },
  ],
};

export const LINES_TEMPLATE: ImportTemplate = {
  name: "Sewing Lines",
  columns: [
    { header: "Line Code", required: true, aliases: ["lineCode"], description: "Unique line code", example: "LINE-01" },
    { header: "Line Name", aliases: ["lineName"], description: "Display name (blank = Line <code>)", example: "Line 1" },
    { header: "Line Type", aliases: ["lineType"], description: "PBS, MODULAR, etc. (blank = PBS)", example: "PBS" },
    { header: "Floor / Location", aliases: ["floor"], description: "Where the line is", example: "Unit 1 - Floor 1" },
    { header: "Department", aliases: ["department"], description: "Department", example: "Sewing" },
    { header: "Line Supervisor", aliases: ["supervisorName"], description: "Supervisor name" },
    { header: "IE In-Charge", aliases: ["ieInCharge"], description: "Industrial engineer" },
    { header: "QC Lead", aliases: ["qcInspector"], description: "Quality lead" },
    { header: "Workstations", aliases: ["workstationCount"], description: "Number of workstations (blank = 24)", example: 24 },
    { header: "No. of Operators", aliases: ["operatorCount"], description: "Planned operators (blank = 20)", example: 20 },
    { header: "Floaters / Helpers", aliases: ["helperCount"], description: "Helpers (blank = 2)", example: 2 },
    { header: "No. of Machines", aliases: ["machineCount"], description: "Machines on the line (blank = 22)", example: 22 },
    { header: "Working Hours", aliases: ["workingHours"], description: "Hours per day (blank = 8)", example: 8 },
    { header: "Capacity/Day (pcs)", aliases: ["capacityPerDay"], description: "Pieces per day (blank = 1000)", example: 1000 },
    { header: "Target Efficiency %", aliases: ["targetEfficiencyPercent"], description: "Target efficiency (blank = 85)", example: 85 },
    { header: "Operational Status", aliases: ["operationalStatus"], description: "ACTIVE, IDLE, etc. (blank = ACTIVE)", example: "ACTIVE" },
    { header: "Active Style", aliases: ["currentStyle"], description: "Style currently running" },
    { header: "Active Bulletin", aliases: ["currentBulletin"], description: "Bulletin currently running" },
    { header: "Notes", aliases: ["notes"], description: "Free text" },
  ],
};

export const OPERATORS_TEMPLATE: ImportTemplate = {
  name: "Operators",
  columns: [
    { header: "Employee ID", required: true, description: "Unique employee number", example: "EMP-1001" },
    { header: "Name", required: true, description: "Full name", example: "Lakshmi Devi" },
    { header: "Age", description: "Whole number from 16 to 70 (optional)", example: 28 },
    { header: "Gender", description: "Male, Female or Other (blank = Other)", example: "Female" },
    { header: "Department", description: "Department (blank = Sewing)", example: "Sewing" },
    { header: "Joining Date", description: "Date (blank = today)", example: "2024-06-01" },
    { header: "Status", description: "Active or Inactive (blank = Active)", example: "Active" },
  ],
};

export const STYLES_TEMPLATE: ImportTemplate = {
  name: "Styles",
  columns: [
    { header: "Style No", required: true, description: "Unique style number", example: "ST-2026-01" },
    { header: "Buyer", description: "Buyer / brand (optional)", example: "Buyer name" },
    { header: "Description", description: "Free text" },
    { header: "Product Type", description: "e.g. Polo, T-Shirt", example: "Polo" },
    { header: "Season", description: "e.g. SS26", example: "SS26" },
    { header: "Status", description: "Active or Inactive (blank = Active)", example: "Active" },
  ],
};

/** Bulletin import accepts many header spellings and fills sensible defaults, so no column is strictly required. */
export const BULLETINS_TEMPLATE: ImportTemplate = {
  name: "Operation Bulletins",
  columns: [
    { header: "Bulletin Code", aliases: ["BulletinCode", "bulletin_code", "Code", "OB Code", "OB_CODE"] },
    { header: "Bulletin Name", aliases: ["BulletinName", "bulletin_name", "Name", "Title"] },
    { header: "Description", aliases: ["description", "Desc"] },
    { header: "Version", aliases: ["version", "Ver"] },
    { header: "Revision Number", aliases: ["Revision", "revisionNumber", "Rev"] },
    { header: "Status", aliases: ["status"] },
    { header: "Effective From", aliases: ["EffectiveFrom", "effective_from"] },
    { header: "Effective To", aliases: ["EffectiveTo", "effective_to"] },
    { header: "Styles", aliases: ["Style", "Linked Styles", "Garment Styles", "Style No", "Style Code"] },
    { header: "Sequence", aliases: ["Seq", "Seq #", "Step", "Order"] },
    { header: "Operation Code", aliases: ["Op Code", "OperationCode"] },
    { header: "Operation Name", aliases: ["Operation", "OperationName"] },
    { header: "Machine Type", aliases: ["Machine", "Machinery", "machineType"] },
    { header: "SMV (sec)", aliases: ["SMV (Sec)", "SMV (secs)", "SMV (Seconds)", "SMV", "Standard SMV (sec)", "Standard SMV", "Cycle Time (sec)", "SAM (sec)"] },
    { header: "Skill Rating Required", aliases: ["Skill Rating", "Skill Level", "Skill Required", "Rating"], description: "Skill level 1–4 (1 in training, 2 needs support, 3 independent, 4 expert); blank = 3", example: 3 },
    { header: "Parallelizable", aliases: ["Is Parallelizable", "Parallel"] },
    { header: "Split Allowed", aliases: ["Can Split", "Allow Split"] },
    { header: "Split Type", aliases: ["Split Method"] },
    { header: "WIP Threshold", aliases: ["WIP Threshold (pcs)", "WIP Buffer", "Buffer"] },
    { header: "Notes", aliases: ["Remarks", "Quality Points", "Comments"] },
  ],
};
