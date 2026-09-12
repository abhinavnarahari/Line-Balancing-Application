import { api } from "../../lib/api";

export interface LineDesignMachine {
  id?: number;
  machineType: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  notes?: string;
}

export interface LineDesign {
  id?: number;
  designCode: string;
  capacityPlanId?: number;
  orderId?: number;
  orderNo?: string;
  styleId?: number;
  styleNo?: string;
  bulletinId?: number;
  bulletinCode?: string;
  lineId: number;
  lineCode?: string;
  lineName?: string;
  shiftId?: number;
  shiftName?: string;
  totalWorkstations: number;
  totalOperators: number;
  totalHelpers: number;
  totalQc: number;
  totalMachines: number;
  targetHourlyOutput?: number;
  plannedEfficiency?: number;
  designedPitchSecs?: number;
  lineBalanceEfficiency?: number;
  strategyName?: string;
  stationAllocations?: string;
  workstationsJson?: string;
  status: string;
  version?: number;
  createdBy?: string;
  approvedBy?: string;
  releasedBy?: string;
  machines: LineDesignMachine[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LineDesignRequest {
  designCode?: string;
  capacityPlanId?: number;
  orderId?: number;
  bulletinId?: number;
  lineId: number;
  shiftId?: number;
  totalWorkstations: number;
  totalOperators: number;
  totalHelpers?: number;
  totalQc?: number;
  totalMachines?: number;
  targetHourlyOutput?: number;
  plannedEfficiency?: number;
  designedPitchSecs?: number;
  lineBalanceEfficiency?: number;
  strategyName?: string;
  stationAllocations?: string;
  workstationsJson?: string;
  status?: string;
  machines?: {
    machineType: string;
    requiredQty: number;
    availableQty?: number;
    notes?: string;
  }[];
}

export const lineDesignApi = {
  getDesigns: async (orderId?: number | string): Promise<LineDesign[]> => {
    const query = orderId ? `?orderId=${orderId}` : "";
    return await api.get(`/line-designs${query}`);
  },

  getDesignById: async (id: number | string): Promise<LineDesign> => {
    return await api.get(`/line-designs/${id}`);
  },

  saveDesign: async (data: LineDesignRequest): Promise<LineDesign> => {
    return await api.post("/line-designs", data);
  },

  updateDesign: async (id: number | string, data: LineDesignRequest): Promise<LineDesign> => {
    return await api.put(`/line-designs/${id}`, data);
  },

  deleteDesign: async (id: number | string): Promise<void> => {
    return await api.delete(`/line-designs/${id}`);
  },

  updateStatus: async (id: number | string, status: string, user?: string): Promise<LineDesign> => {
    const params = new URLSearchParams();
    params.append("status", status);
    if (user) params.append("user", user);
    return await api.patch(`/line-designs/${id}/status?${params.toString()}`, {});
  }
};
