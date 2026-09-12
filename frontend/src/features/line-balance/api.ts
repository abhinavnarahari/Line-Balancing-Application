import { api } from "../../lib/api";

export interface LinePlanAssignment {
  stationId?: string | number | null;
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
  allowance?: number; // percentage
  allowancePfd?: string; // e.g. "5,4,1"
  plannedEfficiency?: number; // expected line efficiency percentage, e.g. 80
  status: 'draft' | 'active' | 'completed';
  assignments: LinePlanAssignment[];
}

export interface StationOperationDetail {
  id?: number;
  operationId: number;
  operationCode?: string;
  operationName?: string;
  bulletinLineId?: number;
  sequence: number;
  operationSmv: number;
  machineType?: string;
  isSplit?: boolean;
  splitRatio?: number;
  isQcCheckpoint?: boolean;
}

export interface WorkstationDetail {
  id?: number;
  stationIndex: number;
  stationCode: string;
  primaryMachineType?: string;
  allocatedOperators: number;
  effectiveTimeSecs: number;
  capacityPerHour: number;
  workloadPercent: number;
  isBottleneck: boolean;
  operations: StationOperationDetail[];
}

export interface OperatorPlacementDetail {
  id?: number;
  stationIndex: number;
  stationCode?: string;
  operatorId: number;
  operatorName?: string;
  operatorCode?: string;
  requiredSkillLevel?: number;
  actualSkillLevel?: number;
  matchStatus?: string;
  notes?: string;
}

export interface OptimizationRecommendation {
  id?: number;
  stationIndex: number;
  strategyType: string;
  title: string;
  reason: string;
  currentCycleTimeSecs: number;
  projectedCycleTimeSecs: number;
  projectedCapacityPerHour: number;
  status: string;
}

export interface BalanceDetailResponse {
  lineDesignId: number;
  designCode?: string;
  orderNo?: string;
  styleNo?: string;
  lineName?: string;
  shiftName?: string;
  targetHourlyOutput?: number;
  plannedEfficiency?: number;
  customerTaktSecs?: number;
  designedPitchSecs?: number;
  lineBalanceEfficiency?: number;
  totalWorkstations?: number;
  totalOperators?: number;
  bottleneckCount?: number;
  workstations: WorkstationDetail[];
  operatorPlacements: OperatorPlacementDetail[];
  recommendations: OptimizationRecommendation[];
}

export interface BalanceSaveRequest {
  lineDesignId: number;
  workstations: {
    stationIndex: number;
    stationCode: string;
    primaryMachineType?: string;
    allocatedOperators: number;
    effectiveTimeSecs?: number;
    capacityPerHour?: number;
    workloadPercent?: number;
    isBottleneck?: boolean;
    operations: {
      operationId: number;
      bulletinLineId?: number;
      sequence: number;
      operationSmv: number;
      machineType?: string;
      isSplit?: boolean;
      splitRatio?: number;
      isQcCheckpoint?: boolean;
    }[];
  }[];
  operatorPlacements?: {
    stationIndex: number;
    operatorId: number;
    requiredSkillLevel?: number;
    actualSkillLevel?: number;
    matchStatus?: string;
    notes?: string;
  }[];
}

export const enterpriseLineBalanceApi = {
  getBalance: async (lineDesignId: number | string): Promise<BalanceDetailResponse> => {
    return await api.get(`/line-balances/${lineDesignId}`);
  },

  saveBalance: async (data: BalanceSaveRequest): Promise<BalanceDetailResponse> => {
    return await api.post("/line-balances", data);
  },

  optimize: async (lineDesignId: number | string): Promise<BalanceDetailResponse> => {
    return await api.post(`/line-balances/${lineDesignId}/optimize`, {});
  }
};

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
