import { api } from "../../lib/api";

export interface HourCell {
  entryId: number | null;
  shiftHour: number;
  startTime: string;
  endTime: string;
  targetQty: number;
  actualQty: number;
  goodQty: number;
  rejectQty: number;
  efficiencyPercent: number;
  status: string;
}

export interface OperationRow {
  operationId: number;
  operationCode: string;
  operationName: string;
  sequence: number;
  samMinutes: number;
  hourlyTarget: number;
  operatorId?: number;
  operatorEmployeeId?: string;
  operatorName?: string;
  totalActual: number;
  totalGood: number;
  totalReject: number;
  totalTarget: number;
  efficiencyPercent: number;
  hours: Record<number, HourCell>;
}

export interface HourlyBoardResponse {
  linePlanId: number;
  orderNo: string;
  shiftName: string;
  logDate: string;
  totalShiftHours: number;
  shiftStartTime: string;
  shiftEndTime: string;
  lineEfficiencyPercent: number;
  totalActualOutput: number;
  totalTargetOutput: number;
  operationsOnTarget: number;
  operationsBehind: number;
  rows: OperationRow[];
}

export interface HourlyEntryRequest {
  linePlanId: number;
  operationId: number;
  operatorId: number;
  logDate: string;
  shiftHour: number;
  hourStartTime?: string;
  hourEndTime?: string;
  targetQty?: number;
  actualQty: number;
  goodQty: number;
  rejectQty?: number;
  samMinutes?: number;
  notes?: string;
}

export const hourlyBoardApi = {
  getBoard: (params: {
    linePlanId?: number | string;
    orderId?: number | string;
    shiftId?: number | string;
    date?: string;
  }): Promise<HourlyBoardResponse> =>
    api.get("/hourly-production/board", { params }),

  assignOperator: (linePlanId: number, operationId: number, operatorId?: number): Promise<void> =>
    api.patch(`/hourly-production/assign?linePlanId=${linePlanId}&operationId=${operationId}${operatorId ? `&operatorId=${operatorId}` : ""}`),

  saveEntry: (data: HourlyEntryRequest): Promise<HourCell> =>
    api.post("/hourly-production/entry", data),

  bulkSave: (entries: HourlyEntryRequest[]): Promise<number> =>
    api.post("/hourly-production/bulk", entries),
};