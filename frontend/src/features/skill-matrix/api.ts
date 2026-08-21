import { api } from "../../lib/api";

export interface SkillAssessment {
  id: string | number;
  operatorId: string | number;
  operationId: string | number;
  rating: 1 | 2 | 3 | 4 | 5;
  cycleTimeSeconds: number; // in seconds
  revision: number;
  effectiveDate: string;
  notes?: string;
}

export const skillApi = {
  // Get all historical assessments
  getAllAssessments: async (operatorId?: string | number, operationId?: string | number): Promise<SkillAssessment[]> => {
    return await api.get("/skill-matrix/history", { params: { operatorId, operationId } });
  },

  // Get only the latest revision for each operator+operation pair
  getCurrentMatrix: async (operatorId?: string | number): Promise<SkillAssessment[]> => {
    return await api.get("/skill-matrix", { params: { operatorId } });
  },

  // Add a new assessment (automatically bumps revision)
  addAssessment: async (data: Omit<SkillAssessment, "id" | "revision">): Promise<SkillAssessment> => {
    return await api.post("/skill-matrix", data);
  }
};
