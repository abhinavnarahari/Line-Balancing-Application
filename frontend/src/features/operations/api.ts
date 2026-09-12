import { api } from "../../lib/api";

export interface Operation {
  id: string | number;
  operationCode: string;
  code?: string;
  name: string;
  description: string;
  sequence: number;
  active: boolean;
  standardSmv?: number;
  defaultSmv?: number;
  machineType?: string;
  defaultMachineType?: string;
  skillLevel?: number;
  skillLevelRequired?: number;
  defaultSkillRating?: number;
}

export type AffinityLevel = "DIRECT_SUBSTITUTE" | "SIMILAR_TECHNIQUE" | "BASIC_COMPATIBLE";

export interface OperationAffinity {
  id: string | number;
  primaryOperationId: string | number;
  primaryOperationCode?: string;
  primaryOperationName?: string;
  primaryMachineType?: string;
  alternativeOperationId: string | number;
  alternativeOperationCode?: string;
  alternativeOperationName?: string;
  alternativeMachineType?: string;
  alternativeStandardSmv?: number;
  affinityLevel: AffinityLevel;
  efficiencyTransferPct: number;
  ratingDowngrade: number;
  machineCompatible: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationAffinityInput {
  alternativeOperationId: string | number;
  affinityLevel?: AffinityLevel;
  efficiencyTransferPct?: number;
  ratingDowngrade?: number;
  machineCompatible?: boolean;
  notes?: string;
  createSymmetric?: boolean;
}

export const operationsApi = {
  getOperations: async (active?: boolean): Promise<Operation[]> => {
    const params = active !== undefined ? { active } : {};
    return await api.get("/operations", { params });
  },

  createOperation: async (op: Omit<Operation, "id">): Promise<Operation> => {
    return await api.post("/operations", op);
  },

  updateOperation: async (id: string | number, op: Omit<Operation, "id">): Promise<Operation> => {
    return await api.put(`/operations/${id}`, op);
  },

  toggleActive: async (id: string | number): Promise<void> => {
    return await api.patch(`/operations/${id}/toggle-status`);
  },

  deleteOperation: async (id: string | number): Promise<void> => {
    return await api.delete(`/operations/${id}`);
  },

  getAffinities: async (operationId: string | number): Promise<OperationAffinity[]> => {
    return await api.get(`/operations/${operationId}/affinities`);
  },

  getAllAffinities: async (): Promise<OperationAffinity[]> => {
    return await api.get("/operations/affinities/all");
  },

  addAffinity: async (operationId: string | number, data: OperationAffinityInput): Promise<OperationAffinity> => {
    return await api.post(`/operations/${operationId}/affinities`, data);
  },

  deleteAffinity: async (affinityId: string | number): Promise<void> => {
    return await api.delete(`/operations/affinities/${affinityId}`);
  },

  deleteAffinityPair: async (primaryId: string | number, altId: string | number): Promise<void> => {
    return await api.delete(`/operations/${primaryId}/affinities/${altId}`);
  },
};

