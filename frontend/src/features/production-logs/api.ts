import { api } from "../../lib/api";

export interface PieceProductionLogRequest {
  operatorId: number | string;
  operationId?: number | string;
  operationName?: string;
  orderId?: number | string;
  targetQty: number;
  completedQty: number;
  goodQty: number;
  rejectQty: number;
  startTime: string; // "10:05" or "10:05:00"
  endTime: string;   // "10:32" or "10:32:00"
  samMinutes?: number;
  machineCode?: string;
  logDate?: string;  // "YYYY-MM-DD"
  notes?: string;
}

export interface PieceProductionLog {
  id: number;
  operatorId: number;
  operatorEmployeeId: string;
  operatorName: string;
  department?: string;
  operationId?: number;
  operationCode?: string;
  operationName: string;
  orderId?: number;
  orderNo?: string;
  targetQty: number;
  completedQty: number;
  goodQty: number;
  rejectQty: number;
  startTime: string;
  endTime: string;
  actualTimeMinutes: number;
  samMinutes: number;
  machineCode?: string;
  logDate: string;
  hourSlot: number;
  notes?: string;
  earnedMinutes: number;
  efficiencyPercent: number;
  defectRatePercent: number;
  createdAt?: string;
}

export interface HourlySlotSummary {
  hour: number;
  timeLabel: string;
  targetQty: number;
  completedQty: number;
  goodQty: number;
  rejectQty: number;
  workMinutes: number;
  earnedMinutes: number;
  efficiencyPercent: number;
  operations: string;
  machines: string;
  entryCount: number;
}

export interface OperatorTimesheet24h {
  operatorId: number;
  employeeId: string;
  operatorName: string;
  department: string;
  machineCode: string;
  hourlySlots: Record<number, HourlySlotSummary>;
  totalTarget: number;
  totalCompleted: number;
  totalGood: number;
  totalReject: number;
  totalWorkMinutes: number;
  totalEarnedMinutes: number;
  efficiencyPercent: number;
  defectRatePercent: number;
  rawLogs: PieceProductionLog[];
}

export const pieceProductionApi = {
  recordPiece: (data: PieceProductionLogRequest): Promise<PieceProductionLog> =>
    api.post("/piece-production/record", data),

  updateLog: async (id: number, data: PieceProductionLogRequest): Promise<PieceProductionLog> => {
    try {
      return await api.put(`/piece-production/${id}`, data);
    } catch (err: any) {
      // Fallback for live hot-reload sync: if PUT is not mapped on running instance, delete old and re-create
      if (err.response?.status === 405 || err.response?.status === 404) {
        try {
          await api.delete(`/piece-production/${id}`);
          return await api.post("/piece-production/record", data);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  getLogs: (date?: string): Promise<PieceProductionLog[]> =>
    api.get(`/piece-production/logs${date ? `?date=${date}` : ""}`),

  get24hTimesheet: (date?: string): Promise<OperatorTimesheet24h[]> =>
    api.get(`/piece-production/timesheet-24h${date ? `?date=${date}` : ""}`),

  deleteLog: (id: number): Promise<void> =>
    api.delete(`/piece-production/${id}`),
};
