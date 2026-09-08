import { api } from "../../lib/api";

export interface LinePlanAssignment {
  bulletinLineId?: string | number | null;
  operationId: string | number;
  operatorId: string | number | null;
  isQcCheckpoint?: boolean;
}

export interface LinePlan {
  id: string | number;
  orderId: string | number;
  shiftId: string | number;
  lineId?: string | number | null;
  lineCode?: string;
  lineName?: string;
  targetOutput: number;
  allowance: number; // percentage
  allowancePfd?: string; // e.g. "5,4,1"
  status: 'draft' | 'active' | 'completed';
  assignments: LinePlanAssignment[];
}

export const linePlanApi = {
  getPlanForOrder: async (orderId: string | number): Promise<LinePlan | null> => {
    try {
      return await api.get("/line-plans", { params: { orderId } });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getAllPlans: async (): Promise<LinePlan[]> => {
    return await api.get("/line-plans");
  },

  getPlanById: async (id: string | number): Promise<LinePlan> => {
    return await api.get(`/line-plans/${id}`);
  },

  savePlan: async (data: Omit<LinePlan, "id" | "status"> & { targetOutput?: number }): Promise<LinePlan> => {
    return await api.post("/line-plans", data);
  },

  deletePlan: async (id: string | number): Promise<void> => {
    await api.delete(`/line-plans/${id}`);
  },

  deletePlanByOrderId: async (orderId: string | number): Promise<void> => {
    await api.delete("/line-plans", { params: { orderId } });
  }
};
