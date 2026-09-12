/**
 * bulletinScenarioStore.ts
 * Persists and syncs applied line balancing scenarios from Operation Bulletins
 * to Planned Lines (LineBalancePage) scoped to a specific sewing line or bulletin.
 */

export interface AppliedBulletinScenario {
  targetLineId: string | number;
  targetLineName?: string;
  bulletinId?: string | number;
  bulletinCode: string;
  styleIds?: (string | number)[];
  scenarioId: string;
  scenarioName: string;
  badge: string;
  totalOperators: number;
  totalMachines: number;
  workstationCount: number;
  pitchTimeSecs: number;
  lineBalanceEfficiency: number;
  hourlyOutput100?: number;
  dailyOutput100?: number;
  bottleneckOpName?: string;
  bottleneckCycleTimeSecs?: number;
  stationAllocations: Record<string | number, number>; // opId / bulletinLineId / sequence / opCode -> count of allocated operators
  appliedAt: string;
}

const STORAGE_PREFIX = "sewnexa_applied_bulletin_scenario_";
export const SCENARIO_APPLIED_EVENT = "sewnexa_bulletin_scenario_applied";

/**
 * Save an applied scenario scoped to a line, bulletin, and styles.
 */
export function saveAppliedBulletinScenario(data: AppliedBulletinScenario): void {
  try {
    const serialized = JSON.stringify(data);
    const lineKey = String(data.targetLineId || "all");

    // 1. Scoped to line
    localStorage.setItem(`${STORAGE_PREFIX}line_${lineKey}`, serialized);
    if (data.bulletinId) {
      localStorage.setItem(`${STORAGE_PREFIX}line_${lineKey}_bulletin_${data.bulletinId}`, serialized);
      localStorage.setItem(`${STORAGE_PREFIX}bulletin_${data.bulletinId}`, serialized);
    }
    if (data.bulletinCode) {
      const codeKey = data.bulletinCode.toLowerCase().trim();
      localStorage.setItem(`${STORAGE_PREFIX}line_${lineKey}_code_${codeKey}`, serialized);
      localStorage.setItem(`${STORAGE_PREFIX}code_${codeKey}`, serialized);
    }

    // 2. Scoped to linked garment styles
    if (data.styleIds && Array.isArray(data.styleIds)) {
      data.styleIds.forEach(stId => {
        if (stId !== undefined && stId !== null && String(stId).trim()) {
          localStorage.setItem(`${STORAGE_PREFIX}style_${String(stId).trim()}`, serialized);
        }
      });
    }

    // 3. Keep active line mapping
    const activeMapRaw = localStorage.getItem(`${STORAGE_PREFIX}active_map`);
    const activeMap: Record<string, AppliedBulletinScenario> = activeMapRaw ? JSON.parse(activeMapRaw) : {};
    activeMap[lineKey] = data;
    if (data.bulletinId) {
      activeMap[`bulletin_${data.bulletinId}`] = data;
    }
    if (data.bulletinCode) {
      activeMap[`code_${data.bulletinCode.toLowerCase().trim()}`] = data;
    }
    localStorage.setItem(`${STORAGE_PREFIX}active_map`, JSON.stringify(activeMap));

    // 4. Keep last applied reference
    localStorage.setItem(`${STORAGE_PREFIX}last_applied`, serialized);

    // 5. Dispatch real-time custom event
    window.dispatchEvent(new CustomEvent(SCENARIO_APPLIED_EVENT, { detail: data }));
  } catch (err) {
    console.warn("Failed to persist applied bulletin scenario to localStorage:", err);
  }
}

/**
 * Retrieve applied scenario for a specific line and bulletin/style.
 * Returns null if no matching scenario is found.
 */
export function getAppliedBulletinScenarioForLine(
  lineId?: string | number | null,
  bulletinId?: string | number | null,
  bulletinCode?: string | null,
  styleId?: string | number | null
): AppliedBulletinScenario | null {
  try {
    const lineKey = lineId ? String(lineId) : "";

    // 1. Check exact line + bulletin id
    if (lineKey && bulletinId) {
      const byBull = localStorage.getItem(`${STORAGE_PREFIX}line_${lineKey}_bulletin_${bulletinId}`);
      if (byBull) return JSON.parse(byBull);
    }

    // 2. Check exact line + bulletin code
    if (lineKey && bulletinCode) {
      const byCode = localStorage.getItem(`${STORAGE_PREFIX}line_${lineKey}_code_${bulletinCode.toLowerCase().trim()}`);
      if (byCode) return JSON.parse(byCode);
    }

    // 3. Check line generic storage
    if (lineKey) {
      const byLine = localStorage.getItem(`${STORAGE_PREFIX}line_${lineKey}`);
      if (byLine) {
        const parsed: AppliedBulletinScenario = JSON.parse(byLine);
        if (bulletinId && parsed.bulletinId && String(parsed.bulletinId) === String(bulletinId)) {
          return parsed;
        }
        if (bulletinCode && parsed.bulletinCode && parsed.bulletinCode.toLowerCase() === bulletinCode.toLowerCase()) {
          return parsed;
        }
        if (styleId && parsed.styleIds && parsed.styleIds.some(s => String(s) === String(styleId))) {
          return parsed;
        }
        if (!bulletinId && !bulletinCode && !styleId) {
          return parsed;
        }
        // If line has a scenario and bulletin was not strictly mismatched
        if (String(parsed.targetLineId) === lineKey) {
          return parsed;
        }
      }
    }

    // 4. Check "all lines" scoped entry for this bulletin
    if (bulletinId) {
      const byAllBull = localStorage.getItem(`${STORAGE_PREFIX}line_all_bulletin_${bulletinId}`);
      if (byAllBull) return JSON.parse(byAllBull);
    }
    if (bulletinCode) {
      const byAllCode = localStorage.getItem(`${STORAGE_PREFIX}line_all_code_${bulletinCode.toLowerCase().trim()}`);
      if (byAllCode) return JSON.parse(byAllCode);
    }

    // 5. Check bulletin-level generic storage
    if (bulletinId) {
      const byBullGen = localStorage.getItem(`${STORAGE_PREFIX}bulletin_${bulletinId}`);
      if (byBullGen) return JSON.parse(byBullGen);
    }

    // 6. Check bulletin code generic storage
    if (bulletinCode) {
      const byCodeGen = localStorage.getItem(`${STORAGE_PREFIX}code_${bulletinCode.toLowerCase().trim()}`);
      if (byCodeGen) return JSON.parse(byCodeGen);
    }

    // 7. Check style-level generic storage
    if (styleId) {
      const byStyle = localStorage.getItem(`${STORAGE_PREFIX}style_${String(styleId).trim()}`);
      if (byStyle) return JSON.parse(byStyle);
    }

    // 8. Check active map
    const activeMapRaw = localStorage.getItem(`${STORAGE_PREFIX}active_map`);
    if (activeMapRaw) {
      const activeMap = JSON.parse(activeMapRaw);
      if (lineKey && activeMap[lineKey]) return activeMap[lineKey];
      if (bulletinId && activeMap[`bulletin_${bulletinId}`]) return activeMap[`bulletin_${bulletinId}`];
      if (bulletinCode && activeMap[`code_${bulletinCode.toLowerCase().trim()}`]) return activeMap[`code_${bulletinCode.toLowerCase().trim()}`];
      if (activeMap["all"]) return activeMap["all"];
    }

    // 9. Fallback to last applied if bulletin matches or no specific filter requested
    const last = localStorage.getItem(`${STORAGE_PREFIX}last_applied`);
    if (last) {
      const parsed: AppliedBulletinScenario = JSON.parse(last);
      if (bulletinId && parsed.bulletinId && String(parsed.bulletinId) === String(bulletinId)) return parsed;
      if (bulletinCode && parsed.bulletinCode && parsed.bulletinCode.toLowerCase() === bulletinCode.toLowerCase()) return parsed;
      if (styleId && parsed.styleIds && parsed.styleIds.some(s => String(s) === String(styleId))) return parsed;
      if (!bulletinId && !bulletinCode && !styleId) return parsed;
    }

    return null;
  } catch (err) {
    console.warn("Failed to read applied bulletin scenario from localStorage:", err);
    return null;
  }
}

/**
 * Retrieve applied scenario for a bulletin regardless of line.
 */
export function getAppliedBulletinScenarioForBulletin(
  bulletinId?: string | number | null,
  bulletinCode?: string | null,
  styleId?: string | number | null
): AppliedBulletinScenario | null {
  return getAppliedBulletinScenarioForLine("all", bulletinId, bulletinCode, styleId) ||
    getAppliedBulletinScenarioForLine(null, bulletinId, bulletinCode, styleId);
}

/**
 * Clear scenario specifically for a particular line or bulletin.
 */
export function clearAppliedBulletinScenarioForLine(
  lineId: string | number,
  bulletinId?: string | number | null,
  bulletinCode?: string | null
): void {
  try {
    const lineKey = String(lineId);
    localStorage.removeItem(`${STORAGE_PREFIX}line_${lineKey}`);
    if (bulletinId) {
      localStorage.removeItem(`${STORAGE_PREFIX}line_${lineKey}_bulletin_${bulletinId}`);
      localStorage.removeItem(`${STORAGE_PREFIX}bulletin_${bulletinId}`);
    }
    if (bulletinCode) {
      const codeKey = bulletinCode.toLowerCase().trim();
      localStorage.removeItem(`${STORAGE_PREFIX}line_${lineKey}_code_${codeKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}code_${codeKey}`);
    }

    const activeMapRaw = localStorage.getItem(`${STORAGE_PREFIX}active_map`);
    if (activeMapRaw) {
      const activeMap = JSON.parse(activeMapRaw);
      delete activeMap[lineKey];
      if (bulletinId) delete activeMap[`bulletin_${bulletinId}`];
      if (bulletinCode) delete activeMap[`code_${bulletinCode.toLowerCase().trim()}`];
      localStorage.setItem(`${STORAGE_PREFIX}active_map`, JSON.stringify(activeMap));
    }

    window.dispatchEvent(
      new CustomEvent(SCENARIO_APPLIED_EVENT, { 
        detail: { targetLineId: lineId, cleared: true } 
      })
    );
  } catch (err) {
    console.warn("Failed to clear applied bulletin scenario:", err);
  }
}

/**
 * Legacy getter for backward compatibility
 */
export function getAppliedBulletinScenario(
  bulletinId?: string | number | null,
  bulletinCode?: string | null
): AppliedBulletinScenario | null {
  return getAppliedBulletinScenarioForLine(null, bulletinId, bulletinCode);
}

export function clearAppliedBulletinScenario(
  bulletinId?: string | number | null,
  bulletinCode?: string | null
): void {
  clearAppliedBulletinScenarioForLine("all", bulletinId, bulletinCode);
}

