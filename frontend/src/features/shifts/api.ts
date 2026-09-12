import { api } from "../../lib/api";
import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "./types";
export type { Shift, CreateShiftDTO, UpdateShiftDTO } from "./types";

export const shiftsApi = {
  getShifts: async (active?: boolean): Promise<Shift[]> => {
    const params = active !== undefined ? { active } : {};
    return await api.get("/shifts", { params });
  },

  createShift: async (shift: CreateShiftDTO): Promise<Shift> => {
    return await api.post("/shifts", shift);
  },

  updateShift: async (id: string | number, shift: UpdateShiftDTO): Promise<Shift> => {
    return await api.put(`/shifts/${id}`, shift);
  },

  toggleActive: async (id: string | number): Promise<void> => {
    return await api.patch(`/shifts/${id}/toggle-status`);
  },

  deleteShift: async (id: string | number): Promise<void> => {
    return await api.delete(`/shifts/${id}`);
  },
};
