/**
 * ============================================================================
 * REAL-WORLD GARMENT INDUSTRY LINE BALANCING ENGINE
 * ============================================================================
 *
 * Based on standard Industrial Engineering (IE) practice used in apparel
 * manufacturing factories (MAS Holdings, Shahi Exports, Brandix, GSDCost).
 *
 * CORE IE FORMULAS:
 *
 *  1. Pitch Time (PT) = Total SAM / N_operators   [min/piece]
 *     - The target cycle time per workstation for one garment.
 *     - Equivalent to Takt Time when production rate matches demand.
 *
 *  2. Theoretical Manning Ratio (Ti) = SMV_i / PT
 *     - Ti >= 1.20: operation is a bottleneck → split into parallel benches
 *     - 0.60 < Ti < 1.20: balanced, assign 1 operator
 *     - Ti <= 0.60: under-utilized → cluster with adjacent compatible operation
 *
 *  3. Line Balance Efficiency (LBE) = Total SAM / (N_operators × CT_bottleneck)
 *     - Standard smoothness index used in GSD and FastReact.
 *
 *  4. Output @ 85% = Round(60 × 0.85 / CT_bottleneck)   [pcs/hr]
 *     - 85% is the standard industrial factory efficiency target.
 *     - 100% = theoretical maximum, 70% = learning curve / style changeover.
 *
 *  5. Lost Capacity = (Balanced 85% Output − Actual 85% Output) × Shift Hours
 *     - Garments lost per shift due to imbalance vs a perfectly balanced line.
 * ============================================================================
 */

export interface OperationStepInput {
  id: string | number;
  sequence?: number;
  name: string;
  code?: string;
  smv: number;
  machineType?: string;
}

export type StationStatus = "bottleneck" | "over_pitch" | "balanced" | "under_utilized";

export interface StationAllocationDetail {
  id: string | number;
  sequence: number;
  name: string;
  code?: string;
  machineType: string;
  rawSmv: number;
  allocatedMachines: number;
  effectiveCycleTime: number;
  theoreticalPitchRatio: number; // Ti = SMV / PT
  isBottleneck: boolean;
  status: StationStatus;
}

export interface WorkstationAllocation {
  stationNumber: number;
  stationCode: string;           // "WS-01", "WS-04A", "WS-04B", "WS-06 (Comb)"
  stationName: string;
  operations: {
    id: string | number;
    sequence: number;
    name: string;
    code?: string;
    smv: number;
    machineType: string;
  }[];
  primaryMachineType: string;
  allocatedOperators: number;
  allocatedMachines: number;
  totalStationSmv: number;
  effectiveCycleTime: number;
  theoreticalManning: number;    // Ti = totalStationSmv / pitchTime
  workstationType: "single" | "parallel" | "combined";
  status: StationStatus;
  isBottleneck: boolean;
  stationCapacity100: number;    // pcs/hr at 100% for this one station
  stationCapacity85: number;     // pcs/hr at 85% for this one station
  varianceVsPitch: number;       // effectiveCycleTime - pitchTime
}

export interface ChokeReliefItem {
  opName: string;
  machineType: string;
  rawSmv: number;
  beforeCycle: number;
  afterCycle: number;
  allocatedMachines: number;
}

export interface ClusteringOpportunity {
  op1Name: string;
  op1Smv: number;
  op2Name: string;
  op2Smv: number;
  combinedSmv: number;
  machineType: string;
  recommendation: string;
}

export interface BalancingScenario {
  id: "baseline" | "recommended" | "peak";
  name: string;
  badge: string;
  tagline: string;
  totalMachines: number;         // Total physical machines on floor
  totalOperators: number;        // Total operators deployed
  totalOperations: number;       // Total distinct operations in the bulletin
  workstationCount: number;      // Total distinct workstation benches
  singleStationCount: number;
  parallelStationCount: number;  // Total parallel benches
  parallelOperationCount?: number; // Number of distinct operations that are parallelized
  combinedStationCount: number;
  lineBalanceEfficiency: number; // LBE % = totalSMV / (N × CT_bottleneck) × 100
  balanceDelay: number;          // 100 - LBE
  bottleneckCycleTime: number;   // Effective cycle time of the pacing station (min)
  bottleneckOpName: string;
  bottleneckMachineType: string;
  pitchTime: number;             // Total SAM / N_operators (min/piece)
  taktSeconds: string;           // Takt in seconds (pitch × 60)
  plannedEfficiency: number;     // Active floor target efficiency % (e.g. 80%)
  targetHourlyOutput?: number;   // Target hourly output required by Capacity Plan
  hourlyOutputPlanned: number;   // pcs/hr at planned efficiency
  dailyOutputPlanned: number;    // pcs/shift at planned efficiency
  hourlyOutput100: number;       // pcs/hr at 100% efficiency
  hourlyOutput85: number;        // pcs/hr at 85%
  hourlyOutput70: number;        // pcs/hr at 70% (style ramp-up / learning curve)
  dailyOutput85: number;         // pcs/shift at 85%
  dailyOutput100: number;        // pcs/shift at 100%
  dailyOutput70: number;         // pcs/shift at 70%
  shiftHours: number;
  laborProductivity: number;     // pcs/operator/hr at 85%
  laborProductivityDelta: number;
  lostCapacityPerShift: number;  // Garments lost due to imbalance vs perfectly balanced line
  stationAllocations: Record<string | number, number>; // opId → machine count
  stationDetails: StationAllocationDetail[];
  workstations: WorkstationAllocation[];
  machineLedger: Record<string, number>;
  headlineInsight: string;
  humanIeRationale: string;
  specificAdjustments: string[];
  chokeReliefList: ChokeReliefItem[];
  clusteringOpportunities: ClusteringOpportunity[];
  roiMetric: string;
  colorTheme: "amber" | "emerald" | "indigo";
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Core IE Metrics Evaluator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a given station allocation and computes all IE metrics.
 *
 * Key formula:
 *   - N_operators = number of operators (one per physical workstation bench)
 *   - Pitch Time  = Total SAM / N_operators
 *   - LBE         = Total SAM / (N_operators × CT_bottleneck) × 100
 *   - Output @85% = floor(60 × 0.85 / CT_bottleneck)
 */
function evaluateConfiguration(
  ops: OperationStepInput[],
  allocations: Record<string | number, number>,
  shiftHours: number = 8,
  plannedEfficiency: number = 80
) {
  const totalSmv = ops.reduce((acc, o) => acc + Math.max(0, Number(o.smv) || 0), 0);

  // totalOperators = sum of machines (each machine needs 1 operator)
  const totalOperators = Object.values(allocations).reduce((a, b) => a + Math.max(1, b), 0);

  if (ops.length === 0 || totalSmv <= 0 || totalOperators <= 0) {
    return nullResult(ops, shiftHours);
  }

  // Find the bottleneck (highest effective cycle time after machine splitting)
  let bottleneckTime = 0;
  let bottleneckOp = ops[0];

  ops.forEach((op) => {
    const smv = Math.max(0.01, Number(op.smv) || 0.01);
    const machines = Math.max(1, allocations[op.id] || 1);
    const effectiveTime = smv / machines;
    if (effectiveTime > bottleneckTime) {
      bottleneckTime = effectiveTime;
      bottleneckOp = op;
    }
  });

  // ── CORRECT GARMENT IE FORMULAS ──────────────────────────────────────────

  // Pitch Time = Total SAM / N operators
  const pitchTime = totalSmv / totalOperators;

  // Line Balance Efficiency = Total SAM / (N × CT_bottleneck)
  // This is the standard smoothness index — how close every station is to the bottleneck pace
  const rawEfficiency = (totalSmv / (totalOperators * bottleneckTime)) * 100;
  const efficiency = Math.min(100, Math.round(rawEfficiency * 10) / 10);
  const balanceDelay = Math.max(0, Math.round((100 - efficiency) * 10) / 10);

  // Output (Theory of Constraints — line output = slowest station output)
  const effFactor = (plannedEfficiency || 80) / 100;
  const output100 = bottleneckTime > 0 ? Math.floor(60 / bottleneckTime) : 0;
  const outputPlanned = bottleneckTime > 0 ? Math.floor((60 * effFactor) / bottleneckTime) : 0;
  const output85 = bottleneckTime > 0 ? Math.floor((60 * 0.85) / bottleneckTime) : 0;
  const output70 = bottleneckTime > 0 ? Math.floor((60 * 0.70) / bottleneckTime) : 0;

  const dailyOutputPlanned = outputPlanned * shiftHours;
  const dailyOutput85 = output85 * shiftHours;
  const dailyOutput100 = output100 * shiftHours;
  const dailyOutput70 = output70 * shiftHours;

  // Labor Productivity = pcs per operator per hour at planned efficiency
  const laborProductivity = totalOperators > 0
    ? Math.round((outputPlanned / totalOperators) * 100) / 100
    : 0;

  // Takt = bottleneck cycle in seconds at line pacing pace (matching Pacing Cycle exactly)
  const taktSec = bottleneckTime > 0 ? (bottleneckTime * 60).toFixed(1) : "0.0";

  // Lost Capacity = garments lost per shift because of imbalance at 100% efficiency
  // A perfectly balanced line at 100% would produce: round(60 / pitchTime) pcs/hr
  // Actual production is constrained by bottleneck: output100
  // So garments lost per shift = (balancedOutput100 - output100) × shiftHours
  const balancedOutput100 = pitchTime > 0 ? Math.round(60 / pitchTime) : 0;
  const lostCapacityPerShift = Math.max(0, (balancedOutput100 - output100) * shiftHours);

  // Station-level detail with correct Ti ratios
  const stationDetails: StationAllocationDetail[] = ops.map((op, idx) => {
    const smv = Math.max(0.01, Number(op.smv) || 0.01);
    const mCount = Math.max(1, allocations[op.id] || 1);
    const effectiveTime = smv / mCount;
    const isBottleneck = Math.abs(effectiveTime - bottleneckTime) < 0.0005;

    // Ti = SMV_i / Pitch Time (not effective time — we compare raw SMV to pitch)
    const ti = pitchTime > 0 ? Math.round((smv / pitchTime) * 100) / 100 : 1;

    let status: StationStatus = "balanced";
    if (isBottleneck) {
      status = "bottleneck";
    } else if (pitchTime > 0 && effectiveTime > pitchTime * 1.10) {
      status = "over_pitch";
    } else if (pitchTime > 0 && effectiveTime < pitchTime * 0.60) {
      status = "under_utilized";
    }

    return {
      id: op.id,
      sequence: op.sequence || idx + 1,
      name: op.name,
      code: op.code,
      machineType: op.machineType || "Single Needle Lockstitch (SNLS)",
      rawSmv: Math.round(smv * 10000) / 10000,
      allocatedMachines: mCount,
      effectiveCycleTime: Math.round(effectiveTime * 10000) / 10000,
      theoreticalPitchRatio: ti,
      isBottleneck,
      status,
    };
  });

  // Machine ledger — how many of each machine type the floor needs
  const machineLedger: Record<string, number> = {};
  ops.forEach((op) => {
    const mType = (op.machineType || "Single Needle Lockstitch (SNLS)").trim();
    const count = Math.max(1, allocations[op.id] || 1);
    machineLedger[mType] = (machineLedger[mType] || 0) + count;
  });

  return {
    totalSmv,
    totalOperators,
    bottleneckTime,
    bottleneckOp,
    efficiency,
    balanceDelay,
    plannedEfficiency,
    outputPlanned,
    dailyOutputPlanned,
    output100,
    output85,
    output70,
    dailyOutput85,
    dailyOutput100,
    dailyOutput70,
    laborProductivity,
    lostCapacityPerShift,
    pitchTime,
    taktSec,
    stationDetails,
    machineLedger,
  };
}

function nullResult(ops: OperationStepInput[], shiftHours: number, plannedEfficiency: number = 80) {
  return {
    totalSmv: 0,
    totalOperators: 0,
    bottleneckTime: 0,
    bottleneckOp: ops[0] || null,
    efficiency: 0,
    balanceDelay: 0,
    plannedEfficiency,
    outputPlanned: 0,
    dailyOutputPlanned: 0,
    output100: 0,
    output85: 0,
    output70: 0,
    dailyOutput85: 0,
    dailyOutput100: 0,
    dailyOutput70: 0,
    laborProductivity: 0,
    lostCapacityPerShift: 0,
    pitchTime: 0,
    taktSec: "0.0",
    stationDetails: [] as StationAllocationDetail[],
    machineLedger: {} as Record<string, number>,
    shiftHours,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Greedy Bottleneck Leveling Heuristic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Iteratively adds machines to the operation with the highest effective cycle time.
 * This mimics what a Senior IE does when walking the floor and deciding where to
 * add a parallel machine or second operator.
 */
function greedyLeveling(
  ops: OperationStepInput[],
  baseAllocations: Record<string | number, number>,
  machinesToAdd: number
): { allocations: Record<string | number, number>; addedList: { op: OperationStepInput; count: number }[] } {
  const allocations = { ...baseAllocations };
  const addedMap: Record<string | number, number> = {};

  for (let step = 0; step < machinesToAdd; step++) {
    // Find the worst paced station
    let worstTime = -1;
    let worstOpId: string | number | null = null;

    ops.forEach((op) => {
      const smv = Math.max(0.01, Number(op.smv) || 0.01);
      const m = allocations[op.id] || 1;
      const effective = smv / m;
      if (effective > worstTime) {
        worstTime = effective;
        worstOpId = op.id;
      }
    });

    if (worstOpId !== null) {
      allocations[worstOpId] = (allocations[worstOpId] || 1) + 1;
      addedMap[worstOpId] = (addedMap[worstOpId] || 0) + 1;
    }
  }

  const addedList = Object.entries(addedMap).map(([opId, count]) => {
    const op = ops.find((o) => String(o.id) === String(opId))!;
    return { op, count };
  });

  return { allocations, addedList };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Operation Clustering Identifier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds pairs of low-SMV operations that could be combined under one operator.
 * In real garment factories, operators on short operations are idle most of the cycle.
 * Combining two short-SMV compatible steps under one multi-skilled operator
 * eliminates the idle delay and reduces headcount without sacrificing output.
 */
function findClusteringOpportunities(
  ops: OperationStepInput[],
  pitchTime: number
): ClusteringOpportunity[] {
  if (pitchTime <= 0) return [];

  // Low-utilization threshold: operations where Ti <= 0.60
  const lowThreshold = pitchTime * 0.60;
  const lowOps = ops.filter((o) => {
    const smv = Number(o.smv) || 0;
    return smv > 0 && smv <= lowThreshold;
  });

  const opportunities: ClusteringOpportunity[] = [];
  const paired = new Set<string | number>();

  for (let i = 0; i < lowOps.length; i++) {
    if (paired.has(lowOps[i].id)) continue;

    for (let j = i + 1; j < lowOps.length; j++) {
      if (paired.has(lowOps[j].id)) continue;

      const opA = lowOps[i];
      const opB = lowOps[j];
      const combined = (Number(opA.smv) || 0) + (Number(opB.smv) || 0);

      // Only cluster if combined SMV is within 1.15× pitch (don't over-load the operator)
      if (combined <= pitchTime * 1.15) {
        const machA = (opA.machineType || "").toLowerCase();
        const machB = (opB.machineType || "").toLowerCase();
        const compatible =
          machA === machB ||
          (machA.includes("lockstitch") && machB.includes("lockstitch")) ||
          (machA.includes("overlock") && machB.includes("overlock")) ||
          (machA.includes("flatlock") && machB.includes("flatlock")) ||
          machA.includes("manual") || machB.includes("manual") ||
          machA.includes("iron") || machB.includes("iron");

        if (compatible) {
          opportunities.push({
            op1Name: opA.name,
            op1Smv: Number(opA.smv),
            op2Name: opB.name,
            op2Smv: Number(opB.smv),
            combinedSmv: Math.round(combined * 1000) / 1000,
            machineType: opA.machineType || "Standard Workstation",
            recommendation: `Combine "${opA.name}" (${Number(opA.smv).toFixed(2)}m, Ti=${(Number(opA.smv)/pitchTime).toFixed(2)}) + "${opB.name}" (${Number(opB.smv).toFixed(2)}m, Ti=${(Number(opB.smv)/pitchTime).toFixed(2)}) → 1 multi-skilled operator. Combined cycle ${combined.toFixed(2)}m vs pitch ${pitchTime.toFixed(2)}m.`,
          });
          paired.add(opA.id);
          paired.add(opB.id);
          break;
        }
      }
    }
  }

  return opportunities;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Shopfloor Workstation Layout Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the physical shopfloor workstation layout.
 *
 * Workstation Types:
 *   - SINGLE: 1 operation, 1 operator, 1 machine — standard bench
 *   - PARALLEL: 1 operation split across N side-by-side benches (WS-04A, WS-04B)
 *     Used when Ti >= 1.20 to cut effective cycle time by 1/N
 *   - COMBINED: 2 short operations merged under 1 multi-skilled operator (WS-06 Comb)
 *     Used when Ti <= 0.60 for both operations
 */
function buildWorkstationPlan(
  ops: OperationStepInput[],
  allocations: Record<string | number, number>,
  clusterPairs: ClusteringOpportunity[],
  pitchTime: number,
  bottleneckTime: number
): {
  workstations: WorkstationAllocation[];
  singleCount: number;
  parallelStationGroups: number;  // Groups of parallel benches (e.g. WS-04A+B = 1 group)
  parallelBenchCount: number;     // Individual benches in parallel groups
  combinedCount: number;
  totalOperators: number;
  totalMachines: number;
} {
  const workstations: WorkstationAllocation[] = [];
  const processedOpIds = new Set<string | number>();
  let wsNum = 1;
  let singleCount = 0;
  let parallelStationGroups = 0;
  let parallelBenchCount = 0;
  let combinedCount = 0;

  // Index pairs by operation id for fast lookup
  const clusterMap = new Map<string | number, ClusteringOpportunity>();
  clusterPairs.forEach((cp) => {
    const op1 = ops.find((o) => o.name === cp.op1Name);
    const op2 = ops.find((o) => o.name === cp.op2Name);
    if (op1 && op2) {
      clusterMap.set(op1.id, cp);
      clusterMap.set(op2.id, cp);
    }
  });

  function makeStatus(effective: number): StationStatus {
    const isBneck = Math.abs(effective - bottleneckTime) < 0.0005;
    if (isBneck) return "bottleneck";
    if (pitchTime > 0 && effective > pitchTime * 1.10) return "over_pitch";
    if (pitchTime > 0 && effective < pitchTime * 0.60) return "under_utilized";
    return "balanced";
  }

  ops.forEach((op, idx) => {
    if (processedOpIds.has(op.id)) return;

    const rawSmv = Math.max(0.01, Number(op.smv) || 0.01);
    const mCount = Math.max(1, allocations[op.id] || 1);
    const cluster = clusterMap.get(op.id);

    // ── CASE 1: COMBINED WORKSTATION ─────────────────────────────────────
    // When this op is flagged for clustering AND it has only 1 machine
    if (cluster && mCount === 1) {
      const op1 = ops.find((o) => o.name === cluster.op1Name);
      const op2 = ops.find((o) => o.name === cluster.op2Name);

      if (op1 && op2 && !processedOpIds.has(op1.id) && !processedOpIds.has(op2.id)) {
        const smv1 = Math.max(0.01, Number(op1.smv) || 0.01);
        const smv2 = Math.max(0.01, Number(op2.smv) || 0.01);
        const combinedSmv = smv1 + smv2;
        const effective = combinedSmv;  // 1 operator does both operations sequentially
        const ti = pitchTime > 0 ? Math.round((combinedSmv / pitchTime) * 1000) / 1000 : 1;
        const cap100 = effective > 0 ? Math.floor(60 / effective) : 0;
        const cap85 = effective > 0 ? Math.floor((60 * 0.85) / effective) : 0;
        const variance = pitchTime > 0 ? Math.round((effective - pitchTime) * 1000) / 1000 : 0;
        const status = makeStatus(effective);
        const isBneck = status === "bottleneck";

        workstations.push({
          stationNumber: wsNum,
          stationCode: `WS-${String(wsNum).padStart(2, "0")} (Comb)`,
          stationName: `${op1.name} + ${op2.name}`,
          operations: [
            { id: op1.id, sequence: op1.sequence || idx + 1, name: op1.name, code: op1.code, smv: smv1, machineType: op1.machineType || "SNLS" },
            { id: op2.id, sequence: op2.sequence || idx + 2, name: op2.name, code: op2.code, smv: smv2, machineType: op2.machineType || "SNLS" },
          ],
          primaryMachineType: op1.machineType || op2.machineType || "Single Needle Lockstitch (SNLS)",
          allocatedOperators: 1,
          allocatedMachines: 1,
          totalStationSmv: Math.round(combinedSmv * 1000) / 1000,
          effectiveCycleTime: Math.round(effective * 1000) / 1000,
          theoreticalManning: ti,
          workstationType: "combined",
          status,
          isBottleneck: isBneck,
          stationCapacity100: cap100,
          stationCapacity85: cap85,
          varianceVsPitch: variance,
        });

        processedOpIds.add(op1.id);
        processedOpIds.add(op2.id);
        wsNum++;
        combinedCount++;
        return;
      }
    }

    // ── CASE 2: PARALLEL WORKSTATIONS ────────────────────────────────────
    // When Ti >= 1.20 → split across N side-by-side benches
    if (mCount >= 2) {
      const effective = rawSmv / mCount;
      const ti = pitchTime > 0 ? Math.round((rawSmv / pitchTime) * 1000) / 1000 : mCount;
      const cap100 = effective > 0 ? Math.floor(60 / effective) : 0;
      const cap85 = effective > 0 ? Math.floor((60 * 0.85) / effective) : 0;
      const variance = pitchTime > 0 ? Math.round((effective - pitchTime) * 1000) / 1000 : 0;
      const status = makeStatus(effective);
      const isBneck = status === "bottleneck";

      for (let sub = 0; sub < mCount; sub++) {
        const subLetter = String.fromCharCode(65 + sub); // A, B, C…
        workstations.push({
          stationNumber: wsNum,
          stationCode: `WS-${String(wsNum).padStart(2, "0")}${subLetter}`,
          stationName: `${op.name} (Bench ${subLetter})`,
          operations: [
            { id: op.id, sequence: op.sequence || idx + 1, name: op.name, code: op.code, smv: rawSmv, machineType: op.machineType || "SNLS" },
          ],
          primaryMachineType: op.machineType || "Single Needle Lockstitch (SNLS)",
          allocatedOperators: 1,
          allocatedMachines: 1,
          totalStationSmv: rawSmv,
          effectiveCycleTime: Math.round(effective * 1000) / 1000,
          theoreticalManning: ti,
          workstationType: "parallel",
          status,
          isBottleneck: isBneck,
          stationCapacity100: cap100,
          stationCapacity85: cap85,
          varianceVsPitch: variance,
        });
      }

      processedOpIds.add(op.id);
      wsNum++;
      parallelStationGroups++;
      parallelBenchCount += mCount;
      return;
    }

    // ── CASE 3: SINGLE DEDICATED WORKSTATION ─────────────────────────────
    const effective = rawSmv;
    const ti = pitchTime > 0 ? Math.round((rawSmv / pitchTime) * 1000) / 1000 : 1;
    const cap100 = effective > 0 ? Math.floor(60 / effective) : 0;
    const cap85 = effective > 0 ? Math.floor((60 * 0.85) / effective) : 0;
    const variance = pitchTime > 0 ? Math.round((effective - pitchTime) * 1000) / 1000 : 0;
    const status = makeStatus(effective);
    const isBneck = status === "bottleneck";

    workstations.push({
      stationNumber: wsNum,
      stationCode: `WS-${String(wsNum).padStart(2, "0")}`,
      stationName: op.name,
      operations: [
        { id: op.id, sequence: op.sequence || idx + 1, name: op.name, code: op.code, smv: rawSmv, machineType: op.machineType || "SNLS" },
      ],
      primaryMachineType: op.machineType || "Single Needle Lockstitch (SNLS)",
      allocatedOperators: 1,
      allocatedMachines: 1,
      totalStationSmv: rawSmv,
      effectiveCycleTime: Math.round(effective * 1000) / 1000,
      theoreticalManning: ti,
      workstationType: "single",
      status,
      isBottleneck: isBneck,
      stationCapacity100: cap100,
      stationCapacity85: cap85,
      varianceVsPitch: variance,
    });

    processedOpIds.add(op.id);
    wsNum++;
    singleCount++;
  });

  const totalOperators = workstations.reduce((a, ws) => a + ws.allocatedOperators, 0);
  const totalMachines = workstations.reduce((a, ws) => a + ws.allocatedMachines, 0);

  return {
    workstations,
    singleCount,
    parallelStationGroups,
    parallelBenchCount,
    combinedCount,
    totalOperators,
    totalMachines,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: How Many Extra Machines to Add for Scenario 2 (Recommended)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds the optimal number of extra machines to satisfy the Capacity Plan target output,
 * or reaches >= 82% LBE with the best marginal return.
 */
function findOptimalAddCountForRecommended(
  ops: OperationStepInput[],
  baseAllocations: Record<string | number, number>,
  baseEfficiency: number,
  shiftHours: number,
  plannedEfficiency: number = 80,
  targetHourlyOutput?: number,
  designedPitchSecs?: number
): number {
  const maxSearch = Math.min(Math.max(4, Math.round(ops.length * 0.8)), 16);

  // If a targetHourlyOutput is requested from Capacity Plan, solve for target feasibility!
  if (targetHourlyOutput && targetHourlyOutput > 0) {
    for (let testAdd = 0; testAdd <= maxSearch; testAdd++) {
      const { allocations: testAlloc } = testAdd === 0 
        ? { allocations: { ...baseAllocations } } 
        : greedyLeveling(ops, baseAllocations, testAdd);
      const testEval = evaluateConfiguration(ops, testAlloc, shiftHours, plannedEfficiency);
      if (testEval.outputPlanned >= targetHourlyOutput) {
        return testAdd;
      }
    }
  } else if (designedPitchSecs && designedPitchSecs > 0) {
    const targetPitchMins = designedPitchSecs / 60;
    for (let testAdd = 0; testAdd <= maxSearch; testAdd++) {
      const { allocations: testAlloc } = testAdd === 0 
        ? { allocations: { ...baseAllocations } } 
        : greedyLeveling(ops, baseAllocations, testAdd);
      const testEval = evaluateConfiguration(ops, testAlloc, shiftHours, plannedEfficiency);
      if (testEval.bottleneckTime <= targetPitchMins * 1.02) {
        return testAdd;
      }
    }
  }

  // Fallback: search for best ROI or >= 82% LBE
  let bestAdd = 1;
  let bestGainPerMachine = 0;

  for (let testAdd = 1; testAdd <= maxSearch; testAdd++) {
    const { allocations: testAlloc } = greedyLeveling(ops, baseAllocations, testAdd);
    const testEval = evaluateConfiguration(ops, testAlloc, shiftHours, plannedEfficiency);
    const effGain = testEval.efficiency - baseEfficiency;
    const gainPerMachine = effGain / testAdd;

    if (testEval.efficiency >= 82) {
      return testAdd;
    }

    if (gainPerMachine > bestGainPerMachine) {
      bestGainPerMachine = gainPerMachine;
      bestAdd = testAdd;
    }
  }

  return Math.max(1, bestAdd);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Main Scenario Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates 3 real-world garment manufacturing IE scenarios.
 *
 * SCENARIO 1 — Baseline / Direct Routing (Un-Leveled)
 *   One machine per operation step, pure sequential flow.
 *   Shows the raw un-balanced line as it would look without IE intervention.
 *
 * SCENARIO 2 — Standard Garment IE Leveled Line (Recommended)
 *   Splits bottlenecks into parallel benches to fulfill the Capacity Plan target output,
 *   clusters low-SMV compatible operations under multi-skilled operators.
 *
 * SCENARIO 3 — High-Volume Modular Surge (Peak Capacity)
 *   Aggressively levels all stations above pitch for high-volume surge capacity.
 */
export function generateLineBalancingScenarios(
  ops: OperationStepInput[],
  shiftHours: number = 8,
  userTargetManpower?: number,
  plannedEfficiency: number = 80,
  targetHourlyOutput?: number,
  designedPitchSecs?: number
): BalancingScenario[] {
  if (!ops || ops.length === 0) return [];

  // Filter out rows with no SMV
  const validOps = ops.filter((o) => (Number(o.smv) || 0) > 0);
  if (validOps.length === 0) return [];

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Baseline (1 machine per step)
  // ──────────────────────────────────────────────────────────────────────────
  const baseAllocations: Record<string | number, number> = {};
  validOps.forEach((o) => { baseAllocations[o.id] = 1; });

  const evalBase = evaluateConfiguration(validOps, baseAllocations, shiftHours, plannedEfficiency);
  const baseClusters = findClusteringOpportunities(validOps, evalBase.pitchTime);
  const wsPlanBase = buildWorkstationPlan(
    validOps, baseAllocations, [], evalBase.pitchTime, evalBase.bottleneckTime
  );

  const scenario1: BalancingScenario = {
    id: "baseline",
    name: "Baseline Setup",
    badge: "Direct Routing (Un-Leveled)",
    tagline: `${evalBase.totalOperators} operators, ${evalBase.efficiency}% LBE — ${evalBase.balanceDelay}% balance delay${
      targetHourlyOutput ? ` (${evalBase.outputPlanned} of ${targetHourlyOutput} pcs/hr target)` : ""
    }`,
    totalMachines: wsPlanBase.totalMachines,
    totalOperators: wsPlanBase.totalOperators,
    totalOperations: validOps.length,
    workstationCount: wsPlanBase.workstations.length,
    singleStationCount: wsPlanBase.singleCount,
    parallelStationCount: wsPlanBase.parallelBenchCount,
    parallelOperationCount: wsPlanBase.parallelStationGroups,
    combinedStationCount: wsPlanBase.combinedCount,
    lineBalanceEfficiency: evalBase.efficiency,
    balanceDelay: evalBase.balanceDelay,
    bottleneckCycleTime: Math.round(evalBase.bottleneckTime * 1000) / 1000,
    bottleneckOpName: evalBase.bottleneckOp?.name || "—",
    bottleneckMachineType: evalBase.bottleneckOp?.machineType || "—",
    pitchTime: Math.round(evalBase.pitchTime * 1000) / 1000,
    taktSeconds: evalBase.taktSec,
    plannedEfficiency,
    targetHourlyOutput,
    hourlyOutputPlanned: evalBase.outputPlanned,
    dailyOutputPlanned: evalBase.dailyOutputPlanned,
    hourlyOutput100: evalBase.output100,
    hourlyOutput85: evalBase.output85,
    hourlyOutput70: evalBase.output70,
    dailyOutput85: evalBase.dailyOutput85,
    dailyOutput100: evalBase.dailyOutput100,
    dailyOutput70: evalBase.dailyOutput70,
    shiftHours,
    laborProductivity: evalBase.laborProductivity,
    laborProductivityDelta: 0,
    lostCapacityPerShift: evalBase.lostCapacityPerShift,
    stationAllocations: baseAllocations,
    stationDetails: evalBase.stationDetails,
    workstations: wsPlanBase.workstations,
    machineLedger: evalBase.machineLedger,
    headlineInsight: `Un-leveled line at ${evalBase.efficiency}% LBE. "${evalBase.bottleneckOp?.name}" paces the line at ${(evalBase.bottleneckTime * 60).toFixed(1)}s/pc, causing ${evalBase.lostCapacityPerShift} garments lost per ${shiftHours}h shift.`,
    humanIeRationale: `Direct 1-to-1 operator-per-operation routing. Pitch time is ${(evalBase.pitchTime * 60).toFixed(1)}s/pc but the bottleneck "${evalBase.bottleneckOp?.name}" (${(evalBase.bottleneckTime * 60).toFixed(1)}s) forces the entire line to pace at ${evalBase.outputPlanned} pcs/hr @ ${plannedEfficiency}%. This creates ${evalBase.balanceDelay}% idle waiting time across other operators.`,
    specificAdjustments: [
      `${evalBase.totalOperators} operators, one per operation step (pure sequential flow)`,
      `Bottleneck: "${evalBase.bottleneckOp?.name}" at ${(evalBase.bottleneckTime * 60).toFixed(1)}s/pc`,
      ...(baseClusters.length > 0 ? [`${baseClusters.length} short operations identified as multi-skilling candidates`] : []),
    ],
    chokeReliefList: [],
    clusteringOpportunities: baseClusters,
    roiMetric: `Benchmark: ${evalBase.outputPlanned} pcs/hr @ ${plannedEfficiency}% — ${evalBase.laborProductivity} pcs/op/hr`,
    colorTheme: "amber",
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Standard IE Leveled Line (Recommended — Best ROI)
  // ──────────────────────────────────────────────────────────────────────────
  const recAddCount = findOptimalAddCountForRecommended(
    validOps, baseAllocations, evalBase.efficiency, shiftHours, plannedEfficiency, targetHourlyOutput, designedPitchSecs
  );

  const { allocations: recAllocations, addedList: recAdded } = greedyLeveling(
    validOps, baseAllocations, recAddCount
  );

  const evalRec = evaluateConfiguration(validOps, recAllocations, shiftHours, plannedEfficiency);
  const recClusters = findClusteringOpportunities(validOps, evalRec.pitchTime);
  const wsPlanRec = buildWorkstationPlan(
    validOps, recAllocations, recClusters.slice(0, 2), evalRec.pitchTime, evalRec.bottleneckTime
  );

  const recChokeList: ChokeReliefItem[] = recAdded
    .map((item) => ({
      opName: item.op.name,
      machineType: item.op.machineType || "Single Needle Lockstitch (SNLS)",
      rawSmv: Number(item.op.smv),
      beforeCycle: Math.round((Number(item.op.smv) / (baseAllocations[item.op.id] || 1)) * 1000) / 1000,
      afterCycle: Math.round((Number(item.op.smv) / (recAllocations[item.op.id] || 1)) * 1000) / 1000,
      allocatedMachines: recAllocations[item.op.id],
    }))
    .sort((a, b) => b.rawSmv - a.rawSmv);

  const recSpecifics: string[] = [
    ...recChokeList.map(
      (c) => `Parallel bench on "${c.opName}": cycle ${(c.beforeCycle * 60).toFixed(1)}s → ${(c.afterCycle * 60).toFixed(1)}s (${c.allocatedMachines}× machines)`
    ),
    ...(wsPlanRec.combinedCount > 0
      ? [`${wsPlanRec.combinedCount} combined workstation(s) for low-SMV step clustering`]
      : []),
  ];

  const effGainRec = (evalRec.efficiency - evalBase.efficiency).toFixed(1);
  const outGainRec = evalRec.outputPlanned - evalBase.outputPlanned;
  const prodDeltaRec = Math.round((evalRec.laborProductivity - evalBase.laborProductivity) * 100) / 100;

  const isTargetMet = targetHourlyOutput ? evalRec.outputPlanned >= targetHourlyOutput : true;

  const scenario2: BalancingScenario = {
    id: "recommended",
    name: "Optimized Balance",
    badge: isTargetMet ? "Target Feasible (Best ROI)" : "Standard IE Leveled Line",
    tagline: `${wsPlanRec.workstations.length} workstations at ${evalRec.efficiency}% LBE — ${evalRec.outputPlanned} pcs/hr${
      targetHourlyOutput ? ` (Target: ${targetHourlyOutput} pcs/hr ${isTargetMet ? "✓ Met" : "Deficit"})` : ` (+${effGainRec}% LBE)`
    }`,
    totalMachines: wsPlanRec.totalMachines,
    totalOperators: wsPlanRec.totalOperators,
    totalOperations: validOps.length,
    workstationCount: wsPlanRec.workstations.length,
    singleStationCount: wsPlanRec.singleCount,
    parallelStationCount: wsPlanRec.parallelBenchCount,
    parallelOperationCount: wsPlanRec.parallelStationGroups,
    combinedStationCount: wsPlanRec.combinedCount,
    lineBalanceEfficiency: evalRec.efficiency,
    balanceDelay: evalRec.balanceDelay,
    bottleneckCycleTime: Math.round(evalRec.bottleneckTime * 1000) / 1000,
    bottleneckOpName: evalRec.bottleneckOp?.name || "—",
    bottleneckMachineType: evalRec.bottleneckOp?.machineType || "—",
    pitchTime: Math.round(evalRec.pitchTime * 1000) / 1000,
    taktSeconds: evalRec.taktSec,
    plannedEfficiency,
    targetHourlyOutput,
    hourlyOutputPlanned: evalRec.outputPlanned,
    dailyOutputPlanned: evalRec.dailyOutputPlanned,
    hourlyOutput100: evalRec.output100,
    hourlyOutput85: evalRec.output85,
    hourlyOutput70: evalRec.output70,
    dailyOutput85: evalRec.dailyOutput85,
    dailyOutput100: evalRec.dailyOutput100,
    dailyOutput70: evalRec.dailyOutput70,
    shiftHours,
    laborProductivity: evalRec.laborProductivity,
    laborProductivityDelta: prodDeltaRec,
    lostCapacityPerShift: evalRec.lostCapacityPerShift,
    stationAllocations: recAllocations,
    stationDetails: evalRec.stationDetails,
    workstations: wsPlanRec.workstations,
    machineLedger: evalRec.machineLedger,
    headlineInsight: `Target-aligned line: LBE reaches ${evalRec.efficiency}% (+${effGainRec}%). Delivers ${evalRec.outputPlanned} pcs/hr (+${outGainRec}/hr over baseline @ ${plannedEfficiency}%).`,
    humanIeRationale: `Parallel benches on the worst bottlenecks cut pacing cycle from ${(evalBase.bottleneckTime * 60).toFixed(1)}s to ${(evalRec.bottleneckTime * 60).toFixed(1)}s. Balance Delay drops from ${evalBase.balanceDelay}% to ${evalRec.balanceDelay}%, fulfilling customer order pace.`,
    specificAdjustments: recSpecifics.length > 0 ? recSpecifics : ["Balanced pacing across all operations"],
    chokeReliefList: recChokeList,
    clusteringOpportunities: recClusters,
    roiMetric: `+${outGainRec} pcs/hr (+${Math.round((outGainRec / Math.max(1, evalBase.outputPlanned)) * 100)}%) — ${recAddCount} extra bench(es) configured`,
    colorTheme: "emerald",
  };

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: High-Volume Modular Surge (Peak Capacity)
  // ──────────────────────────────────────────────────────────────────────────
  let peakAddCount: number;
  if (userTargetManpower && userTargetManpower > evalBase.totalOperators + recAddCount) {
    peakAddCount = userTargetManpower - evalBase.totalOperators;
  } else {
    // Add 2 to 4 extra benches beyond scenario 2 for a true high-volume burst (+20% to +35% capacity)
    peakAddCount = recAddCount + Math.max(2, Math.ceil(validOps.length * 0.25));
    peakAddCount = Math.min(peakAddCount, Math.ceil(validOps.length * 0.75));
  }

  const { allocations: peakAllocations, addedList: peakAdded } = greedyLeveling(
    validOps, baseAllocations, peakAddCount
  );

  const evalPeak = evaluateConfiguration(validOps, peakAllocations, shiftHours, plannedEfficiency);
  const peakClusters = findClusteringOpportunities(validOps, evalPeak.pitchTime);
  const wsPlanPeak = buildWorkstationPlan(
    validOps, peakAllocations, peakClusters.slice(0, 4), evalPeak.pitchTime, evalPeak.bottleneckTime
  );

  const peakChokeList: ChokeReliefItem[] = peakAdded
    .map((item) => ({
      opName: item.op.name,
      machineType: item.op.machineType || "Single Needle Lockstitch (SNLS)",
      rawSmv: Number(item.op.smv),
      beforeCycle: Math.round((Number(item.op.smv) / (baseAllocations[item.op.id] || 1)) * 1000) / 1000,
      afterCycle: Math.round((Number(item.op.smv) / (peakAllocations[item.op.id] || 1)) * 1000) / 1000,
      allocatedMachines: peakAllocations[item.op.id],
    }))
    .sort((a, b) => b.rawSmv - a.rawSmv);

  const peakSpecifics: string[] = peakChokeList.slice(0, 5).map(
    (c) => `${c.allocatedMachines}× machines on "${c.opName}": ${(c.afterCycle * 60).toFixed(1)}s effective cycle`
  );

  const effGainPeak = (evalPeak.efficiency - evalBase.efficiency).toFixed(1);
  const outGainPeak = evalPeak.outputPlanned - evalBase.outputPlanned;
  const prodDeltaPeak = Math.round((evalPeak.laborProductivity - evalBase.laborProductivity) * 100) / 100;

  const surgePcs = targetHourlyOutput ? evalPeak.outputPlanned - targetHourlyOutput : outGainPeak;

  const scenario3: BalancingScenario = {
    id: "peak",
    name: "Peak Capacity",
    badge: "High-Volume Modular Surge",
    tagline: `${wsPlanPeak.workstations.length} workstations at ${evalPeak.efficiency}% LBE — ${evalPeak.outputPlanned} pcs/hr${
      targetHourlyOutput ? ` (+${Math.max(0, surgePcs)} pcs/hr surge above target)` : ` @ ${plannedEfficiency}%`
    }`,
    totalMachines: wsPlanPeak.totalMachines,
    totalOperators: wsPlanPeak.totalOperators,
    totalOperations: validOps.length,
    workstationCount: wsPlanPeak.workstations.length,
    singleStationCount: wsPlanPeak.singleCount,
    parallelStationCount: wsPlanPeak.parallelBenchCount,
    parallelOperationCount: wsPlanPeak.parallelStationGroups,
    combinedStationCount: wsPlanPeak.combinedCount,
    lineBalanceEfficiency: evalPeak.efficiency,
    balanceDelay: evalPeak.balanceDelay,
    bottleneckCycleTime: Math.round(evalPeak.bottleneckTime * 1000) / 1000,
    bottleneckOpName: evalPeak.bottleneckOp?.name || "—",
    bottleneckMachineType: evalPeak.bottleneckOp?.machineType || "—",
    pitchTime: Math.round(evalPeak.pitchTime * 1000) / 1000,
    taktSeconds: evalPeak.taktSec,
    plannedEfficiency,
    targetHourlyOutput,
    hourlyOutputPlanned: evalPeak.outputPlanned,
    dailyOutputPlanned: evalPeak.dailyOutputPlanned,
    hourlyOutput100: evalPeak.output100,
    hourlyOutput85: evalPeak.output85,
    hourlyOutput70: evalPeak.output70,
    dailyOutput85: evalPeak.dailyOutput85,
    dailyOutput100: evalPeak.dailyOutput100,
    dailyOutput70: evalPeak.dailyOutput70,
    shiftHours,
    laborProductivity: evalPeak.laborProductivity,
    laborProductivityDelta: prodDeltaPeak,
    lostCapacityPerShift: evalPeak.lostCapacityPerShift,
    stationAllocations: peakAllocations,
    stationDetails: evalPeak.stationDetails,
    workstations: wsPlanPeak.workstations,
    machineLedger: evalPeak.machineLedger,
    headlineInsight: `Peak Surge: ${evalPeak.efficiency}% LBE (+${effGainPeak}% from baseline). Delivers ${evalPeak.outputPlanned} pcs/hr (+${outGainPeak}/hr over baseline @ ${plannedEfficiency}%).`,
    humanIeRationale: `High-volume export configuration. Every station exceeding pitch is multi-manned so the effective bottleneck drops to ${(evalPeak.bottleneckTime * 60).toFixed(1)}s. Balance Delay is only ${evalPeak.balanceDelay}%, ensuring near-maximum throughput.`,
    specificAdjustments: peakSpecifics.length > 0 ? peakSpecifics : ["All operations running at near-pitch synchronization"],
    chokeReliefList: peakChokeList,
    clusteringOpportunities: peakClusters,
    roiMetric: `+${outGainPeak} pcs/hr (+${Math.round((outGainPeak / Math.max(1, evalBase.outputPlanned)) * 100)}%) across ${wsPlanPeak.workstations.length} workstations`,
    colorTheme: "indigo",
  };

  return [scenario1, scenario2, scenario3];
}
