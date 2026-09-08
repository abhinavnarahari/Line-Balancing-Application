export interface ActivityLog {
  id: number;
  entityType: string;
  entityId: number;
  userName: string;
  action: string;
  logType: string;
  secure: boolean;
  timestamp: string;
}

export const activityApi = {
  getActivities: async (_entityType: string, _entityId: number | string): Promise<ActivityLog[]> => {
    // Mock implementation for now
    return [];
  },
};
