import { api } from "../../lib/api";

export interface SewingLine {
  id: string | number;
  lineCode: string;
  lineName: string;
  floor?: string;
  supervisorName?: string;
  operatorCount: number;
  machineCount: number;
  workingHours: number;
  capacityPerDay: number;
  targetEfficiencyPercent: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

  createLine: async (line: Omit<SewingLine, "id">): Promise<SewingLine> => {
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
