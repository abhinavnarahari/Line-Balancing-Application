import { RecentActivityLog } from "../ui/PremiumUI";

interface AuditedRecentActivityLogProps {
  entityName?: string;
}

export function AuditedRecentActivityLog({ entityName }: AuditedRecentActivityLogProps) {
  return <RecentActivityLog entityType={entityName} />;
}
