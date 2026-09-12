import { api } from "../../lib/api";

export interface CapacityPlan {
  id?: string | number;
  planCode: string;
  orderId: string | number;
  orderNo?: string;
  styleId?: string | number;
  styleNo?: string;
  bulletinId?: string | number;
  bulletinCode?: string;
  shiftId?: string | number;
  shiftName?: string;
  orderQuantity: number;
  availableDays: number;
  targetHourlyOutput: number;
  plannedEfficiency: number;
  allowancePfd?: string;
  totalSmvMinutes: number;
  customerTaktSecs: number;
  requiredDesignCapacity: number;
  designedPitchSecs: number;
  theoreticalManpower: number;
  plannedManpower: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CapacityPlanRequest {
  planCode?: string;
  orderId: string | number;
  styleId?: string | number;
  bulletinId?: string | number;
  shiftId?: string | number;
  orderQuantity: number;
  availableDays: number;
  targetHourlyOutput?: number;
  plannedEfficiency?: number;
  allowancePfd?: string;
  totalSmvMinutes?: number;
}

export const capacityApi = {
  getPlans: async (orderId?: string | number): Promise<CapacityPlan[]> => {
    const query = orderId ? `?orderId=${orderId}` : "";
    return await api.get(`/capacity-plans${query}`);
  },

  getPlanById: async (id: string | number): Promise<CapacityPlan> => {
    return await api.get(`/capacity-plans/${id}`);
  },

  savePlan: async (data: CapacityPlanRequest): Promise<CapacityPlan> => {
    return await api.post("/capacity-plans", data);
  },

  updatePlan: async (id: string | number, data: CapacityPlanRequest): Promise<CapacityPlan> => {
    return await api.put(`/capacity-plans/${id}`, data);
  },

  deletePlan: async (id: string | number): Promise<void> => {
    return await api.delete(`/capacity-plans/${id}`);
  }
};
