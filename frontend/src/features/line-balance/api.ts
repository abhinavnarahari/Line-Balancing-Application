import { api } from "../../lib/api";

export interface LinePlanAssignment {
  bulletinLineId: string | number;
  operationId: string | number;
  operatorId: string | number | null;
}

export interface LinePlan {
  id: string | number;
  orderId: string | number;
  shiftId: string | number;
  targetOutput: number;
  allowance: number; // percentage
  status: 'draft' | 'active' | 'completed';
  assignments: LinePlanAssignment[];
}

export const linePlanApi = {
  getPlanForOrder: async (orderId: string | number): Promise<LinePlan | null> => {
    try {
      return await api.get("/line-plans", { params: { orderId } });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Return null if plan is not found (which is valid for new orders)
      }
      throw error;
    }
  },

  savePlan: async (data: Omit<LinePlan, "id" | "status" | "targetOutput">): Promise<LinePlan> => {
    return await api.post("/line-plans", data);
  }
};
