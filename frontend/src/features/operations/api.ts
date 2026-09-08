import { api } from "../../lib/api";

export interface Operation {
  id: string | number;
  operationCode: string;
  name: string;
  description: string;
  sequence: number;
  active: boolean;
  standardSmv?: number;
  machineType?: string;
  skillLevel?: number;
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
};
