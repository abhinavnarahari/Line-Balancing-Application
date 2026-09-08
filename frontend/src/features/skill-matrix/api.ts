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
  status?: "DRAFT" | "SUBMITTED";
  notes?: string;
  createdAt?: string;
}

export interface PerformanceLogInput {
  operatorId: string | number;
  operationId: string | number;
  logDate: string;
  actualCycleTimeSeconds: number;
  recordedBy?: string;
  status?: "DRAFT" | "SUBMITTED";
  notes?: string;
}

import { getRatingForOperationCycleTime } from "../operations/ratingBenchmarks";

export function cycleTimeToRating(
  seconds: number,
  operationNameOrCode?: string,
  defaultSmv?: number
): 1 | 2 | 3 | 4 | 5 {
  return getRatingForOperationCycleTime(seconds, operationNameOrCode, defaultSmv);
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

  getPerformanceLogs: async (operatorId?: string | number): Promise<PerformanceLog[]> => {
    return await api.get("/skill-matrix/performance-logs", { params: operatorId ? { operatorId } : {} });
  },

  addPerformanceLog: async (data: PerformanceLogInput): Promise<PerformanceLog> => {
    return await api.post("/skill-matrix/performance-logs", data);
  },

  batchAddPerformanceLogs: async (data: PerformanceLogInput[]): Promise<PerformanceLog[]> => {
    try {
      return (await api.post("/skill-matrix/performance-logs/batch", data)) as any;
    } catch (err) {
      console.warn("Batch endpoint failed or unavailable, executing sequential fallback:", err);
      const results: PerformanceLog[] = [];
      for (const item of data) {
        const res = (await api.post("/skill-matrix/performance-logs", item)) as any;
        results.push(res);
      }
      return results;
    }
  },

  submitPerformanceLog: async (id: string | number): Promise<PerformanceLog> => {
    try {
      return (await api.post(`/skill-matrix/performance-logs/${id}/submit`)) as any;
    } catch (err) {
      console.warn("Submit endpoint fallback:", err);
      return {} as PerformanceLog;
    }
  },

  submitBatchPerformanceLogs: async (ids: (string | number)[]): Promise<PerformanceLog[]> => {
    try {
      return (await api.post("/skill-matrix/performance-logs/submit-batch", ids)) as any;
    } catch (err) {
      console.warn("Batch submit fallback, executing individual submissions:", err);
      const results: PerformanceLog[] = [];
      for (const id of ids) {
        try {
          const res = (await api.post(`/skill-matrix/performance-logs/${id}/submit`)) as any;
          results.push(res);
        } catch (e) {
          console.error(`Failed to submit log ${id}:`, e);
        }
      }
      return results;
    }
  },

  deletePerformanceLog: async (id: string | number): Promise<void> => {
    return await api.delete(`/skill-matrix/performance-logs/${id}`);
  },

  autoUpdateSkillMatrix: async (operatorId: string | number): Promise<SkillAssessment[]> => {
    return await api.post("/skill-matrix/auto-update", null, { params: { operatorId } });
  },

  clearOperatorSkillData: async (operatorId: string | number): Promise<void> => {
    return await api.delete(`/skill-matrix/operator/${operatorId}/clear`);
  },
};
