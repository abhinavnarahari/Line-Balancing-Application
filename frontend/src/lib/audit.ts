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
      // Backend stores the entity class simple name (e.g. "SewingLine"); accept "SEWING_LINE" style too.
      params.entityName = /^[A-Z0-9_]+$/.test(entityName)
        ? entityName.split("_").filter(Boolean).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join("")
        : entityName;
    }
    if (entityId) params.entityId = String(entityId);
    const data = await api.get<any, AuditLog[]>("/audit-logs", { params });
    return data;
  }
};
