import { api } from "../../lib/api";
import type {
  PlanningContextResponse,
  OperatorPoolItem,
  LineRequirementItem,
  PreflightValidationResponse,
  OptimizationRequest,
  OptimizationResponse,
  AuditLogItem,
  RunSummaryItem,
} from "./types";

export const allocationApi = {
  // Get Planning Context
  getPlanningContext: (date?: string, shiftId?: number, lineIds?: number[]): Promise<PlanningContextResponse> => {
    return api.get("/operator-allocation/planning-context", {
      params: {
        date,
        shiftId,
        lineIds: lineIds && lineIds.length > 0 ? lineIds.join(",") : undefined,
      },
    });
  },

  // Get Operator Pool
  getOperatorPool: (date?: string, shiftId?: number): Promise<OperatorPoolItem[]> => {
    return api.get("/operator-allocation/operator-pool", {
      params: { date, shiftId },
    });
  },

  // Get Line Requirements
  getLineRequirements: (lineIds?: number[]): Promise<LineRequirementItem[]> => {
    return api.get("/operator-allocation/line-requirements", {
      params: {
        lineIds: lineIds && lineIds.length > 0 ? lineIds.join(",") : undefined,
      },
    });
  },

  // Validate Constraints
  validate: (request: OptimizationRequest): Promise<PreflightValidationResponse> => {
    return api.post("/operator-allocation/validate", request);
  },

  // Optimize Allocation
  optimize: (request: OptimizationRequest): Promise<OptimizationResponse> => {
    return api.post("/operator-allocation/optimize", request);
  },

  // Get Run Detail
  getRunDetail: (runId: number): Promise<OptimizationResponse> => {
    return api.get(`/operator-allocation/runs/${runId}`);
  },

  // Manual Override
  manualOverride: (
    runId: number,
    payload: {
      lineId: number;
      stationIndex: number;
      operatorId?: number | null;
      pinAsFixed?: boolean;
      justification?: string;
      performedBy?: string;
    }
  ): Promise<OptimizationResponse> => {
    return api.post(`/operator-allocation/runs/${runId}/override`, payload);
  },

  // Approve Plan
  approveRun: (
    runId: number,
    payload: { approvedBy: string; notes?: string }
  ): Promise<OptimizationResponse> => {
    return api.post(`/operator-allocation/runs/${runId}/approve`, payload);
  },

  // Apply Plan to Lines
  applyRun: (
    runId: number,
    payload: { appliedBy: string; notes?: string; updateFloorAssignments?: boolean }
  ): Promise<OptimizationResponse> => {
    return api.post(`/operator-allocation/runs/${runId}/apply`, payload);
  },

  // Get Audit Logs
  getAuditLogs: (runId: number): Promise<AuditLogItem[]> => {
    return api.get(`/operator-allocation/runs/${runId}/audits`);
  },

  // Get All Optimization Runs
  getAllRuns: (): Promise<RunSummaryItem[]> => {
    return api.get("/operator-allocation/runs");
  },
};
