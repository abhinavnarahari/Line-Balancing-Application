import { useState, useEffect } from "react";
import { RecentActivityLog, type ActivityItem } from "../ui/PremiumUI";
import { auditApi } from "../../lib/audit";

interface AuditedRecentActivityLogProps {
  entityName?: string;
}

export function AuditedRecentActivityLog({ entityName }: AuditedRecentActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await auditApi.getRecentLogs(entityName);
        const mapped: ActivityItem[] = logs.map(log => ({
          id: log.id.toString(),
          action: `${log.action} ${log.entityName} (#${log.entityId})`,
          user: log.performedBy,
          timestamp: new Date(log.timestamp).toLocaleString(),
        }));
        setActivities(mapped);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [entityName]);

  return <RecentActivityLog activities={activities} />;
}
