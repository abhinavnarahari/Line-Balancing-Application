/**
 * Line design stationAllocations as "key → operator count". Older saves of this page stored a list of operator
 * assignments instead ({bulletinLineId, operationId, operatorId}); count those per bulletin line and operation.
 */
export function toAllocationCounts(raw: unknown): Record<string, number> | null {
  if (Array.isArray(raw)) {
    const counts: Record<string, number> = {};
    for (const a of raw as { bulletinLineId?: number | null; operationId?: number | null }[]) {
      if (a?.bulletinLineId != null) counts[String(a.bulletinLineId)] = (counts[String(a.bulletinLineId)] || 0) + 1;
      else if (a?.operationId != null) counts[String(a.operationId)] = (counts[String(a.operationId)] || 0) + 1;
    }
    return counts;
  }
  if (!raw || typeof raw !== "object") return null;
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) counts[k] = Math.round(n);
  }
  return counts;
}
