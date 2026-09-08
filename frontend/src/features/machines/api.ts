import { api } from "../../lib/api";

export type MachineStatus = "AVAILABLE" | "IN_USE" | "UNDER_MAINTENANCE" | "IDLE";

export interface Machine {
  id: string | number;
  machineCode: string;
  machineType: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  lineId?: string | number | null;
  lineCode?: string;
  lineName?: string;
  status: MachineStatus;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const machinesApi = {
  getMachines: async (params?: { active?: boolean; lineId?: string | number; machineType?: string }): Promise<Machine[]> => {
    return await api.get("/machines", { params });
  },

  getMachineById: async (id: string | number): Promise<Machine> => {
    return await api.get(`/machines/${id}`);
  },

  createMachine: async (machine: Omit<Machine, "id">): Promise<Machine> => {
    return await api.post("/machines", machine);
  },

  updateMachine: async (id: string | number, machine: Partial<Machine>): Promise<Machine> => {
    return await api.put(`/machines/${id}`, machine);
  },

  toggleStatus: async (id: string | number): Promise<Machine> => {
    return await api.patch(`/machines/${id}/toggle-status`);
  },
};
