import { api } from "../../lib/api";

export interface SkillAssessment {
  id: string | number;
  operatorId: string | number;
  operationId: string | number;
  rating: 1 | 2 | 3 | 4 | 5;
  cycleTimeSeconds: number;
  revision: number;
  effectiveDate: string;
  notes?: string;
}

export interface PerformanceLog {
  id: string | number;
  operatorId: string | number;
  operatorName?: string;
  employeeId?: string;
  operationId: string | number;
  operationName?: string;
  operationCode?: string;
  logDate: string;
  actualCycleTimeSeconds: number;
  recordedBy?: string;
  notes?: string;
  createdAt?: string;
}

export const skillApi = {
  getAllAssessments: async (operatorId?: string | number, operationId?: string | number): Promise<SkillAssessment[]> => {
    return await api.get("/skill-matrix/history", { params: { operatorId, operationId } });
  },

  getCurrentMatrix: async (operatorId?: string | number): Promise<SkillAssessment[]> => {
    return await api.get("/skill-matrix", { params: { operatorId } });
  },

  addAssessment: async (data: Omit<SkillAssessment, "id" | "revision">): Promise<SkillAssessment> => {
    return await api.post("/skill-matrix", data);
  },

  getPerformanceLogs: async (operatorId: string | number): Promise<PerformanceLog[]> => {
    return await api.get("/skill-matrix/performance-logs", { params: { operatorId } });
  },

  addPerformanceLog: async (data: { operatorId: string | number; operationId: string | number; logDate: string; actualCycleTimeSeconds: number; recordedBy?: string; notes?: string }): Promise<PerformanceLog> => {
    return await api.post("/skill-matrix/performance-logs", data);
  },

  autoUpdateSkillMatrix: async (operatorId: string | number): Promise<SkillAssessment[]> => {
    return await api.post("/skill-matrix/auto-update", null, { params: { operatorId } });
  },
};
