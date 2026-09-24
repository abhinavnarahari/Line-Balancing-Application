/**
 * globalPoolOptimizer.ts
 *
 * Enterprise-grade * Full-pool operator allocation engine for garment line balancing.
 * Optimizes assignment across the entire pool of operators and operations simultaneously.
 * Calibrated against operator skill ratings and cross-skill operation affinities.
 */

import type { OperationAffinity } from "../operations/api";
import type { Operator } from "../operators/api";
import { cycleTimeToRating, type SkillAssessment } from "../skill-matrix/api";

export interface OptimizerStationSlot {
  stationIndex: number;
  stationNum: number;
  slotIndex: number;
  operationId: string | number;
  operationCode: string;
  operationName: string;
  machineType: string;
  smvSeconds: number;
  requiredSkillRating?: string | number;
  currentOperatorId?: string | number | null;
}

export interface OptimizationResultSlot {
  stationIndex: number;
  stationNum: number;
  slotIndex: number;
  operationId: string | number;
  operationName: string;
  operatorId: string | number | null;
  operatorName?: string;
  employeeId?: string;
  assignedRating: number;
  assignedEfficiencyPct: number;
  effectiveCycleTimeSecs: number;
  isAffinityAssignment: boolean;
  affinitySourceOpName?: string;
  affinityTier?: string;
  affinityDowngrade?: number;
}

export interface EfficiencyMetrics {
  totalLineSmvSecs: number;
  totalManpowerAllocated: number;
  designedObBottleneckSecs: number;
  designedObEfficiency: number;       // Theoretical IE LBE %
  realPoolBottleneckSecs: number;
  realPoolAchievableEfficiency: number; // Floor-achievable LBE % with real pool
  realizationRatio: number;           // (Achievable / Designed) * 100
  efficiencyGapPct: number;           // Designed - Achievable
  capacityPerHourDesigned: number;
  capacityPerHourAchievable: number;
  outputDeficitPerHour: number;
  dailyOutputLossPerShift: number;    // Garments lost per shift due to skill deficit
  bottleneckStationNum: number;
  bottleneckOperationName: string;
  bottleneckOperatorName: string;
  bottleneckCycleTimeSecs: number;
  directSkillMatchCount: number;
  affinityMatchCount: number;
  unfulfilledSlotCount: number;
  swapRecommendations: SwapRecommendation[];
}

export interface SwapRecommendation {
  stationA: { stationNum: number; operationName: string; operatorName: string; currentRating: number };
  stationB: { stationNum: number; operationName: string; operatorName: string; currentRating: number };
  predictedEfficiencyGainPct: number;
  rational: string;
}

export interface GlobalOptimizerParams {
  stations: {
    stationNum: number;
    operationId: string | number;
    operationCode?: string;
    operationName?: string;
    machineType?: string;
    smvSeconds: number;
    requiredSkillRating?: string | number;
    operatorIds: (string | number | null)[];
  }[];
  operators: Operator[];
  skillAssessments: SkillAssessment[];
  affinities: OperationAffinity[];
  attendanceRecords?: { operatorId: string | number; status: string }[];
  externalAssignedOperatorIds?: Set<string>;
  taktTimeSecs: number;
  plannedEfficiency?: number;
  shiftHours?: number;
  fillOnlyEmpty?: boolean;
}

// Efficiency Multiplier based on Skill Rating (1 to 5)
// Standard Industrial Engineering Pace: 4 = 100% standard SMV pace
export const RATING_EFFICIENCY_MULTIPLIERS: Record<number, number> = {
  5: 1.20, // 120% efficiency (Fast / Expert)
  4: 1.00, // 100% standard benchmark
  3: 0.85, // 85% standard factory floor average
  2: 0.70, // 70% basic learner
  1: 0.55  // 55% novice / training
};

/**
 * Global Operator Allocation Optimizer
 */
export function runGlobalPoolOptimization(params: GlobalOptimizerParams): {
  updatedStationAssignments: (string | number | null)[][];
  metrics: EfficiencyMetrics;
  slotDetails: OptimizationResultSlot[];
} {
  const {
    stations,
    operators,
    skillAssessments,
    affinities,
    attendanceRecords = [],
    externalAssignedOperatorIds = new Set<string>(),
    taktTimeSecs = 60,
    plannedEfficiency = 80,
    shiftHours = 8,
    fillOnlyEmpty = false,
  } = params;

  if (!stations || stations.length === 0) {
    return {
      updatedStationAssignments: [],
      metrics: getEmptyMetrics(),
      slotDetails: [],
    };
  }

  // 1. Build Quick Lookup Maps
  const attendanceMap = new Map<string, string>();
  attendanceRecords.forEach(a => {
    attendanceMap.set(String(a.operatorId), a.status?.toUpperCase() || "PRESENT");
  });

  // Operator ID -> Map of Operation ID/Code/Name -> SkillAssessment
  const skillMatrixMap = new Map<string, Map<string, SkillAssessment>>();
  skillAssessments.forEach(sa => {
    const opIdStr = String(sa.operatorId);
    if (!skillMatrixMap.has(opIdStr)) {
      skillMatrixMap.set(opIdStr, new Map());
    }
    const inner = skillMatrixMap.get(opIdStr)!;
    inner.set(String(sa.operationId), sa);
    if (sa.operationCode) {
      inner.set(sa.operationCode.trim().toUpperCase(), sa);
    }
    if (sa.operationName) {
      inner.set(sa.operationName.trim().toLowerCase(), sa);
    }
  });

  // Operation ID -> Array of Affinities where primary = operation
  const affinityMap = new Map<string, OperationAffinity[]>();
  affinities.forEach(aff => {
    const pId = String(aff.primaryOperationId);
    if (!affinityMap.has(pId)) {
      affinityMap.set(pId, []);
    }
    affinityMap.get(pId)!.push(aff);
    if (aff.primaryOperationCode) {
      const codeKey = aff.primaryOperationCode.trim().toUpperCase();
      if (!affinityMap.has(codeKey)) {
        affinityMap.set(codeKey, []);
      }
      affinityMap.get(codeKey)!.push(aff);
    }
  });

  // 2. Flatten Line Stations into Demand Slots
  const demandSlots: OptimizerStationSlot[] = [];
  stations.forEach((st, stIdx) => {
    const slotCount = Math.max(1, st.operatorIds.length);
    for (let sIdx = 0; sIdx < slotCount; sIdx++) {
      demandSlots.push({
        stationIndex: stIdx,
        stationNum: st.stationNum,
        slotIndex: sIdx,
        operationId: st.operationId,
        operationCode: st.operationCode || "OP",
        operationName: st.operationName || `Station #${st.stationNum}`,
        machineType: st.machineType || "Single Needle Lockstitch",
        smvSeconds: st.smvSeconds > 0 ? st.smvSeconds : 30,
        requiredSkillRating: st.requiredSkillRating,
        currentOperatorId: st.operatorIds[sIdx] || null,
      });
    }
  });

  // 3. Gather Available Operators Pool
  const lockedInThisPlan = new Set<string>();
  if (fillOnlyEmpty) {
    demandSlots.forEach(slot => {
      if (slot.currentOperatorId) {
        lockedInThisPlan.add(String(slot.currentOperatorId));
      }
    });
  }

  const candidateOperators = operators.filter(op => {
    const strId = String(op.id);
    if (externalAssignedOperatorIds.has(strId)) return false;
    if (fillOnlyEmpty && lockedInThisPlan.has(strId)) return false;
    return op.active;
  });

  // 4. Slots to Allocate
  const slotsToAllocate = fillOnlyEmpty
    ? demandSlots.filter(s => !s.currentOperatorId)
    : demandSlots;

  // 5. Evaluate Compatibility & Cost Matrix
  interface MatchCandidate {
    operator: Operator;
    rating: number;
    efficiencyMultiplier: number;
    isAffinity: boolean;
    affinitySourceOpName?: string;
    affinityTier?: string;
    affinityDowngrade?: number;
    cost: number;
  }

  const getCandidateEvaluation = (
    op: Operator,
    slot: OptimizerStationSlot
  ): MatchCandidate => {
    const opIdStr = String(op.id);
    const targetOpIdStr = String(slot.operationId);
    const opSkills = skillMatrixMap.get(opIdStr);

    let rating = 1;
    let isAffinity = false;
    let sourceOpName: string | undefined;
    let affinityTier: string | undefined;
    let affinityDowngrade: number | undefined;
    let transferPct = 100;

    // Check direct primary skill match
    const directSkill = opSkills?.get(targetOpIdStr) ||
      (slot.operationCode ? opSkills?.get(slot.operationCode.trim().toUpperCase()) : undefined) ||
      (slot.operationName ? opSkills?.get(slot.operationName.trim().toLowerCase()) : undefined);

    if (directSkill) {
      if (directSkill.cycleTimeSeconds && directSkill.cycleTimeSeconds > 0) {
        rating = cycleTimeToRating(directSkill.cycleTimeSeconds, slot.operationName || directSkill.operationName, slot.smvSeconds / 60);
      } else {
        rating = directSkill.rating || 1;
      }
    } else {
      // Check operational affinity fallback
      // Find if this operator has any skill on an alternative operation that affinitizes to the target
      const possibleAffinities = affinityMap.get(targetOpIdStr) || 
        (slot.operationCode ? affinityMap.get(slot.operationCode.trim().toUpperCase()) : undefined) || 
        [];
      let bestAffinityRating = 0;
      let bestAff: OperationAffinity | null = null;

      for (const aff of possibleAffinities) {
        const altOpIdStr = String(aff.alternativeOperationId);
        const altSkill = opSkills?.get(altOpIdStr) || 
          (aff.alternativeOperationCode ? opSkills?.get(aff.alternativeOperationCode.trim().toUpperCase()) : undefined);
        if (altSkill) {
          let effRating = altSkill.rating || 1;
          if (altSkill.cycleTimeSeconds && altSkill.cycleTimeSeconds > 0) {
            effRating = cycleTimeToRating(altSkill.cycleTimeSeconds, aff.alternativeOperationName || altSkill.operationName);
          }
          if (effRating > bestAffinityRating) {
            bestAffinityRating = effRating;
            bestAff = aff;
          }
        }
      }

      if (bestAff && bestAffinityRating > 0) {
        isAffinity = true;
        rating = bestAffinityRating;
        sourceOpName = bestAff.alternativeOperationName || "Alternative Skill";
        affinityTier = bestAff.affinityLevel;
        affinityDowngrade = bestAff.ratingDowngrade;
        transferPct = Number(bestAff.efficiencyTransferPct) || 85;
      } else {
        // Novice floor fallback
        rating = 1;
        transferPct = 100;
      }
    }

    const baseEff = RATING_EFFICIENCY_MULTIPLIERS[rating] || 0.85;
    const effectiveEff = Math.round((baseEff * (transferPct / 100)) * 100) / 100;

    // Parse required skill rating for this slot
    let targetRating: number | null = null;
    let isPlusRating = false;
    if (slot.requiredSkillRating && slot.requiredSkillRating !== "ANY") {
      const reqStr = String(slot.requiredSkillRating).trim();
      if (reqStr === "3_PLUS") {
        targetRating = 3;
        isPlusRating = true;
      } else if (reqStr === "4_PLUS") {
        targetRating = 4;
        isPlusRating = true;
      } else {
        const num = Number(reqStr);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          targetRating = num;
        }
      }
    }

    // 1. Skill Rating and Qualification Scoring
    // Higher star operators (5 > 4 > 3 > 2 > 1) are fundamentally faster, higher-skilled, and more capable.
    // Lower cost = better candidate.
    const baseSkillCost = -(rating * 2000); // ★5: -10000, ★4: -8000, ★3: -6000, ★2: -4000, ★1: -2000

    let skillReqCost = 0;
    if (targetRating !== null) {
      if (rating >= targetRating) {
        // Meets or exceeds required rating (fully qualified)
        skillReqCost = -2000;
      } else {
        // Underqualified / skill deficit penalty
        skillReqCost = 5000 * (targetRating - rating);
      }
    }

    // 2. Direct Primary Skill vs Affinity vs Novice
    let skillTypeCost = 0;
    if (directSkill) {
      skillTypeCost = -2000; // Direct certification bonus
    } else if (isAffinity) {
      skillTypeCost = 400;   // Operational affinity slight detour
    } else {
      skillTypeCost = 10000; // Novice uncertified heavy penalty
    }

    // 3. Existing Operator Retention Priority
    // If this operator is ALREADY assigned to this slot (e.g. from Line Architecture),
    // apply a strong retention bonus so existing planned layouts are preserved.
    const isCurrentAssignee = slot.currentOperatorId && String(slot.currentOperatorId) === opIdStr;
    const retentionBonus = isCurrentAssignee ? -25000 : 0;

    // 4. Bottleneck Pacing Criticality:
    // Stations with high SMV relative to takt are the line's bottlenecks.
    const slotTargetSecs = slot.smvSeconds;
    const bottleneckCriticality = Math.max(1, slotTargetSecs / Math.max(1, taktTimeSecs));
    const skillDeficit = Math.max(0, 1.15 - effectiveEff);
    const bottleneckMismatchCost = bottleneckCriticality * skillDeficit * 1500;

    // 5. Attendance Penalty
    const attStatus = attendanceMap.get(opIdStr) || "PRESENT";
    let attPenalty = 0;
    if (attStatus === "ABSENT") attPenalty = 30000;
    else if (attStatus === "LATE") attPenalty = 100;

    // 6. Efficiency Multiplier Benefit
    const efficiencyCost = -(effectiveEff * 1000);

    // Total cost (lower is better)
    const totalCost = baseSkillCost + skillReqCost + skillTypeCost + retentionBonus + bottleneckMismatchCost + attPenalty + efficiencyCost;

    return {
      operator: op,
      rating,
      efficiencyMultiplier: effectiveEff,
      isAffinity,
      affinitySourceOpName: sourceOpName,
      affinityTier,
      affinityDowngrade,
      cost: totalCost,
    };
  };

  // 6. Global Matching using Successive Shortest Path / Min-Cost Bipartite Matching
  // Prioritize critical skill requirements and bottlenecks first
  const getSlotSkillDemandWeight = (slot: OptimizerStationSlot): number => {
    const reqStr = String(slot.requiredSkillRating || "ANY").trim();
    if (reqStr === "5") return 5000;
    if (reqStr === "4_PLUS") return 4500;
    if (reqStr === "4") return 4000;
    if (reqStr === "3_PLUS") return 3500;
    if (reqStr === "3") return 3000;
    if (reqStr === "2") return 2000;
    if (reqStr === "1") return 1000;
    return 0;
  };

  const sortedSlotIndices = slotsToAllocate
    .map((_, idx) => idx)
    .sort((a, b) => {
      const slotA = slotsToAllocate[a];
      const slotB = slotsToAllocate[b];
      const weightA = getSlotSkillDemandWeight(slotA);
      const weightB = getSlotSkillDemandWeight(slotB);
      if (weightB !== weightA) {
        return weightB - weightA; // Higher skill requirements first (5 -> 4 -> 3...)
      }
      // Tie-breaker: Sort descending by SMV (bottlenecks first)
      return slotB.smvSeconds - slotA.smvSeconds;
    });

  const assignedOperatorIds = new Set<string>(lockedInThisPlan);
  const slotAssignments = new Map<OptimizerStationSlot, MatchCandidate | null>();

  for (const sIdx of sortedSlotIndices) {
    const slot = slotsToAllocate[sIdx];

    // Candidate operators not yet assigned
    const availablePool = candidateOperators.filter(op => !assignedOperatorIds.has(String(op.id)));

    if (availablePool.length === 0) {
      slotAssignments.set(slot, null);
      continue;
    }

    // Evaluate all candidates for this slot
    const candidates = availablePool.map(op => getCandidateEvaluation(op, slot));

    // Sort by minimum cost
    candidates.sort((a, b) => a.cost - b.cost);

    const chosen = candidates[0];
    slotAssignments.set(slot, chosen);
    assignedOperatorIds.add(String(chosen.operator.id));
  }

  // 7. Calculate Per-Station Effective Cycle Times
  const currentStationTimes = new Map<number, number>();
  const stationAllocations = new Map<number, MatchCandidate[]>();

  demandSlots.forEach(slot => {
    let cand: MatchCandidate | null | undefined = slotAssignments.get(slot);
    if (!cand && slot.currentOperatorId) {
      const existingOp = operators.find(o => String(o.id) === String(slot.currentOperatorId));
      if (existingOp) {
        cand = getCandidateEvaluation(existingOp, slot);
      }
    }

    if (cand) {
      if (!stationAllocations.has(slot.stationNum)) {
        stationAllocations.set(slot.stationNum, []);
      }
      stationAllocations.get(slot.stationNum)!.push(cand);
    }
  });

  // Calculate per-station effective cycle times
  stations.forEach(st => {
    const allocated = stationAllocations.get(st.stationNum) || [];
    const totalEff = allocated.reduce((sum, c) => sum + c.efficiencyMultiplier, 0);
    const ct = totalEff > 0 ? st.smvSeconds / totalEff : st.smvSeconds;
    currentStationTimes.set(st.stationNum, ct);
  });

  // 8. Reconstruct Stations & Produce Detailed Output
  const updatedStationAssignments = stations.map(st => [...st.operatorIds]);
  const slotDetails: OptimizationResultSlot[] = [];
  let directSkillMatches = 0;
  let affinityMatches = 0;
  let unfulfilledSlots = 0;

  demandSlots.forEach(slot => {
    let chosen: MatchCandidate | null | undefined = slotAssignments.get(slot);
    if (!chosen && slot.currentOperatorId) {
      const existingOp = operators.find(o => String(o.id) === String(slot.currentOperatorId));
      if (existingOp) {
        chosen = getCandidateEvaluation(existingOp, slot);
      }
    }

    if (chosen) {
      updatedStationAssignments[slot.stationIndex][slot.slotIndex] = chosen.operator.id;

      if (chosen.isAffinity) affinityMatches++;
      else directSkillMatches++;

      slotDetails.push({
        stationIndex: slot.stationIndex,
        stationNum: slot.stationNum,
        slotIndex: slot.slotIndex,
        operationId: slot.operationId,
        operationName: slot.operationName,
        operatorId: chosen.operator.id,
        operatorName: chosen.operator.name,
        employeeId: chosen.operator.employeeId,
        assignedRating: chosen.rating,
        assignedEfficiencyPct: Math.round(chosen.efficiencyMultiplier * 100),
        effectiveCycleTimeSecs: Math.round((slot.smvSeconds / chosen.efficiencyMultiplier) * 10) / 10,
        isAffinityAssignment: chosen.isAffinity,
        affinitySourceOpName: chosen.affinitySourceOpName,
        affinityTier: chosen.affinityTier,
        affinityDowngrade: chosen.affinityDowngrade,
      });
    } else {
      updatedStationAssignments[slot.stationIndex][slot.slotIndex] = null;
      unfulfilledSlots++;
      slotDetails.push({
        stationIndex: slot.stationIndex,
        stationNum: slot.stationNum,
        slotIndex: slot.slotIndex,
        operationId: slot.operationId,
        operationName: slot.operationName,
        operatorId: null,
        assignedRating: 0,
        assignedEfficiencyPct: 0,
        effectiveCycleTimeSecs: slot.smvSeconds,
        isAffinityAssignment: false,
      });
    }
  });

  // 9. Compute Comprehensive Efficiency Metrics (Designed vs Real Pool Achievable)
  const totalLineSmvSecs = stations.reduce((sum, s) => sum + (s.smvSeconds > 0 ? s.smvSeconds : 0), 0);
  const totalManpowerAllocated = demandSlots.length;

  // Designed OB Bottleneck: assumes 100% standard operator efficiency (multiplier = 1.0)
  const designedStationTimes = stations.map(s => {
    const slotsCount = Math.max(1, s.operatorIds.length);
    return s.smvSeconds / slotsCount;
  });
  const designedObBottleneckSecs = Math.max(...designedStationTimes, 1);
  const designedObEfficiency = totalManpowerAllocated > 0 && designedObBottleneckSecs > 0
    ? Math.min(100, Math.round((totalLineSmvSecs / (totalManpowerAllocated * designedObBottleneckSecs)) * 1000) / 10)
    : 0;

  // Real Pool Bottleneck: reflects real assigned operator efficiency multipliers
  const realStationTimes = stations.map((s, idx) => {
    const assignedSlots = slotDetails.filter(d => d.stationIndex === idx && d.operatorId !== null);
    if (assignedSlots.length === 0) return s.smvSeconds;
    const totalEffMultiplier = assignedSlots.reduce(
      (sum, sl) => sum + (RATING_EFFICIENCY_MULTIPLIERS[sl.assignedRating] || 0.85),
      0
    );
    return totalEffMultiplier > 0 ? s.smvSeconds / totalEffMultiplier : s.smvSeconds;
  });

  const realPoolBottleneckSecs = Math.max(...realStationTimes, 1);
  const realPoolAchievableEfficiency = totalManpowerAllocated > 0 && realPoolBottleneckSecs > 0
    ? Math.min(100, Math.round((totalLineSmvSecs / (totalManpowerAllocated * realPoolBottleneckSecs)) * 1000) / 10)
    : 0;

  // Realization Ratio: Floor Realization of Engineering Design
  const realizationRatio = designedObEfficiency > 0
    ? Math.min(100, Math.round((realPoolAchievableEfficiency / designedObEfficiency) * 1000) / 10)
    : 100;

  const efficiencyGapPct = Math.max(0, Math.round((designedObEfficiency - realPoolAchievableEfficiency) * 10) / 10);

  // Capacities
  const capacityPerHourDesigned = designedObBottleneckSecs > 0
    ? Math.round(3600 / designedObBottleneckSecs)
    : 0;
  const capacityPerHourAchievable = realPoolBottleneckSecs > 0
    ? Math.round(3600 / realPoolBottleneckSecs)
    : 0;
  const outputDeficitPerHour = Math.max(0, capacityPerHourDesigned - capacityPerHourAchievable);
  const dailyOutputLossPerShift = Math.round(outputDeficitPerHour * shiftHours);

  // Find Bottleneck Station
  const bottleneckStationIndex = realStationTimes.indexOf(realPoolBottleneckSecs);
  const bottleneckStation = stations[bottleneckStationIndex] || stations[0];
  const bottleneckAssignedSlot = slotDetails.find(d => d.stationIndex === bottleneckStationIndex);

  // 10. Generate Intelligent Swap Recommendations
  const swapRecommendations: SwapRecommendation[] = [];
  // If bottleneck station has a low-rated operator and a slack station has a high-rated operator with matching skill/affinity
  if (bottleneckAssignedSlot && bottleneckAssignedSlot.assignedRating <= 2) {
    const slackSlot = slotDetails.find(d => {
      if (d.stationIndex === bottleneckStationIndex) return false;
      if (d.assignedRating < 4) return false;
      const stationTime = realStationTimes[d.stationIndex] || 0;
      return stationTime < taktTimeSecs * 0.75; // Has ample slack
    });

    if (slackSlot) {
      swapRecommendations.push({
        stationA: {
          stationNum: bottleneckStation.stationNum,
          operationName: bottleneckStation.operationName || "Pacing Station",
          operatorName: bottleneckAssignedSlot.operatorName || "Unassigned",
          currentRating: bottleneckAssignedSlot.assignedRating,
        },
        stationB: {
          stationNum: slackSlot.stationNum,
          operationName: slackSlot.operationName,
          operatorName: slackSlot.operatorName || "Operator",
          currentRating: slackSlot.assignedRating,
        },
        predictedEfficiencyGainPct: Math.round((efficiencyGapPct * 0.6) * 10) / 10,
        rational: `Station #${bottleneckStation.stationNum} (${bottleneckStation.operationName}) is pacing the line with a ★${bottleneckAssignedSlot.assignedRating} operator. Swapping with ★${slackSlot.assignedRating} operator on Station #${slackSlot.stationNum} relieves line choke and recovers throughput.`,
      });
    }
  }

  const metrics: EfficiencyMetrics = {
    totalLineSmvSecs,
    totalManpowerAllocated,
    designedObBottleneckSecs: Math.round(designedObBottleneckSecs * 10) / 10,
    designedObEfficiency,
    realPoolBottleneckSecs: Math.round(realPoolBottleneckSecs * 10) / 10,
    realPoolAchievableEfficiency,
    realizationRatio,
    efficiencyGapPct,
    capacityPerHourDesigned,
    capacityPerHourAchievable,
    outputDeficitPerHour,
    dailyOutputLossPerShift,
    bottleneckStationNum: bottleneckStation ? bottleneckStation.stationNum : 1,
    bottleneckOperationName: bottleneckStation ? (bottleneckStation.operationName || "Operation") : "—",
    bottleneckOperatorName: bottleneckAssignedSlot?.operatorName || "Unassigned",
    bottleneckCycleTimeSecs: Math.round(realPoolBottleneckSecs * 10) / 10,
    directSkillMatchCount: directSkillMatches,
    affinityMatchCount: affinityMatches,
    unfulfilledSlotCount: unfulfilledSlots,
    swapRecommendations,
  };

  return {
    updatedStationAssignments,
    metrics,
    slotDetails,
  };
}

function getEmptyMetrics(): EfficiencyMetrics {
  return {
    totalLineSmvSecs: 0,
    totalManpowerAllocated: 0,
    designedObBottleneckSecs: 0,
    designedObEfficiency: 0,
    realPoolBottleneckSecs: 0,
    realPoolAchievableEfficiency: 0,
    realizationRatio: 100,
    efficiencyGapPct: 0,
    capacityPerHourDesigned: 0,
    capacityPerHourAchievable: 0,
    outputDeficitPerHour: 0,
    dailyOutputLossPerShift: 0,
    bottleneckStationNum: 1,
    bottleneckOperationName: "—",
    bottleneckOperatorName: "—",
    bottleneckCycleTimeSecs: 0,
    directSkillMatchCount: 0,
    affinityMatchCount: 0,
    unfulfilledSlotCount: 0,
    swapRecommendations: [],
  };
}
