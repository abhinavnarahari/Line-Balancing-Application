import { api } from "./api";

export interface AuditLog {
  id: number;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

export const auditApi = {
  getRecentLogs: async (entityName?: string): Promise<AuditLog[]> => {
    const params = entityName ? { entityName } : {};
    const { data } = await api.get<AuditLog[]>("/audit-logs", { params });
    return data;
  }
};
