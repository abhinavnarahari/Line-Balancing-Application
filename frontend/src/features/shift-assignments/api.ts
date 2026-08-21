import { api } from "../../lib/api";

export interface ShiftAssignment {
  id: string | number;
  operatorId: string | number;
  shiftId: string | number;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string | null; // null means active indefinitely
  status: "Active" | "Scheduled" | "Completed";
  createdAt?: string;
}

export type AssignShiftDTO = Omit<ShiftAssignment, "id" | "status" | "createdAt">;

export const shiftAssignmentApi = {
  getAssignments: async (operatorId?: string | number): Promise<ShiftAssignment[]> => {
    const params = operatorId !== undefined ? { operatorId } : {};
    return await api.get("/shift-assignments", { params });
  },

  assignShift: async (data: AssignShiftDTO): Promise<ShiftAssignment> => {
    return await api.post("/shift-assignments", data);
  },

  endAssignment: async (id: string | number, endDate: string): Promise<ShiftAssignment> => {
    return await api.patch(`/shift-assignments/${id}/end`, null, { params: { endDate } });
  },

  deleteAssignment: async (id: string | number): Promise<void> => {
    return await api.delete(`/shift-assignments/${id}`);
  },
};
