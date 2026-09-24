import { api } from "../../lib/api";

export type LineType = 
  | "PBS" 
  | "MODULAR_CELL" 
  | "UPS_HANGER" 
  | "FEEDER_LINE" 
  | "HYBRID_LEAN";

export type OperationalStatus = 
  | "ACTIVE" 
  | "CHANGEOVER" 
  | "IDLE" 
  | "MAINTENANCE";

export interface SewingLine {
  id: string | number;
  lineCode: string;
  lineName: string;
  lineType: LineType | string;
  floor?: string;
  department?: string;
  supervisorName?: string;
  ieInCharge?: string;
  qcInspector?: string;
  workstationCount: number;
  operatorCount: number;
  helperCount: number;
  machineCount: number;
  workingHours: number;
  capacityPerDay: number;
  targetEfficiencyPercent: number;
  operationalStatus: OperationalStatus | string;
  currentStyle?: string;
  currentBulletin?: string;
  active: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const LINE_TYPES: { id: LineType; label: string; badgeColor: string; description: string }[] = [
  { 
    id: "PBS", 
    label: "Progressive Bundle (PBS)", 
    badgeColor: "bg-[#FAF7F2] text-[#9C5B3C] border-[#E6DDCE]",
    description: "Traditional high-volume sequential bundle production flow."
  },
  { 
    id: "MODULAR_CELL", 
    label: "Modular Lean Cell", 
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Flexible U-shape cellular layout for quick style changes and high agile response."
  },
  { 
    id: "UPS_HANGER", 
    label: "UPS Overhead Hanger", 
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Computerized overhead hanger system delivering piece-by-piece to stations."
  },
  { 
    id: "FEEDER_LINE", 
    label: "Parts Prep Feeder", 
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Dedicated sub-assembly line feeding prepared collars, cuffs, and pockets to main line."
  },
  { 
    id: "HYBRID_LEAN", 
    label: "Hybrid Lean Line", 
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    description: "Combined bundle and one-piece-flow hybrid balance architecture."
  },
];

export const OPERATIONAL_STATUSES: { id: OperationalStatus; label: string; badgeColor: string; dotColor: string }[] = [
  { id: "ACTIVE", label: "Active Production", badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300", dotColor: "bg-emerald-500" },
  { id: "CHANGEOVER", label: "Style Changeover", badgeColor: "bg-amber-50 text-amber-800 border-amber-300", dotColor: "bg-amber-500" },
  { id: "IDLE", label: "Standby / Idle", badgeColor: "bg-slate-100 text-slate-700 border-slate-300", dotColor: "bg-slate-400" },
  { id: "MAINTENANCE", label: "Maintenance Overhaul", badgeColor: "bg-rose-50 text-rose-800 border-rose-300", dotColor: "bg-rose-500" },
];

export const linesApi = {
  getLines: async (active?: boolean): Promise<SewingLine[]> => {
    const params = active !== undefined ? { active } : {};
    return await api.get("/lines", { params });
  },

  getLineById: async (id: string | number): Promise<SewingLine> => {
    return await api.get(`/lines/${id}`);
  },

  getNextLineCode: async (): Promise<string> => {
    try {
      const res: any = await api.get("/lines/next-code");
      if (typeof res === "string") return res;
      return res?.data || res?.message || "LINE-01";
    } catch {
      return "LINE-01";
    }
  },

  createLine: async (line: Omit<SewingLine, "id" | "createdAt" | "updatedAt">): Promise<SewingLine> => {
    return await api.post("/lines", line);
  },

  updateLine: async (id: string | number, line: Partial<SewingLine>): Promise<SewingLine> => {
    return await api.put(`/lines/${id}`, line);
  },

  toggleStatus: async (id: string | number): Promise<SewingLine> => {
    return await api.patch(`/lines/${id}/toggle-status`);
  },

  deleteLine: async (id: string | number): Promise<void> => {
    return await api.delete(`/lines/${id}`);
  },
};
