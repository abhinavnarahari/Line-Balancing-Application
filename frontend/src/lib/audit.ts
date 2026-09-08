import { api } from "./api";

export interface AuditLog {
  id: number;
  entityName: string;
  entityId: string;
  action: string;
  details?: string;
  performedBy: string;
  timestamp: string;
}

export const auditApi = {
  getRecentLogs: async (entityName?: string, entityId?: string | number): Promise<AuditLog[]> => {
    const params: Record<string, string> = {};
    if (entityName) {
      params.entityName = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();
    }
    if (entityId) params.entityId = String(entityId);
    const data = await api.get<any, AuditLog[]>("/audit-logs", { params });
    return data;
  }
};
