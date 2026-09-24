/**
 * Line-Level Operations & Efficiency Metrics Engine
 *
 * Implements rigorous garment manufacturing & industrial engineering calculations:
 * 1. Planned Daily Output (Target Pcs) vs Actual Good & Reject Pieces Produced
 * 2. Output Variance & Target Attainment Percentage
 * 3. Planned Line Design Efficiency (Engineered OB) vs Actual Floor Operating Efficiency (Earned vs Clock Minutes)
 * 4. Manning Headcount Fulfillment (Required vs Deployed Operators & Vacancies)
 * 5. Sequential Workstation Manning Map with Cycle Time, Pitch Time, and Bottlenecks
 */

import type { SewingLine } from "../lines/api";
import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { LinePlan } from "../line-balance/api";
import type { Operator } from "../operators/api";
import type { Shift } from "../shifts/types";
import type { OperatorTimesheet24h, PieceProductionLog } from "../production-logs/api";
import type { AttendanceRecord } from "../attendance/api";
import { generateLineBalancingScenarios } from "../bulletins/lineBalancingScenarios";

export interface LineStationCoverage {
  sequence: number;
  operationId?: number | string;
  operationCode?: string;
  operationName: string;
  machineType: string;
  smv: number;
  effectiveCycleTime: number;
  requiredOperators: number;
  deployedOperators: number;
  assignedOperatorName: string | null;
  assignedEmployeeId: string | null;
  assignedOperatorRating: number;
  isBottleneck: boolean;
  actualPiecesLogged: number;
  status: "Manned" | "Vacant" | "Bottleneck" | "Multi-Manned";
}

export interface LineOperationsSummary {
  lineId: string | number;
  lineCode: string;
  lineName: string;
  lineType: string;
  floor: string;
  supervisorName: string;
  status: "Running" | "Ramping Up" | "Needs Attention" | "No Plan";
  activeShiftTiming: string;

  // Order & Style context
  activeOrderId: string | number | null;
  activeOrderNo: string;
  activeStyleName: string;
  buyer: string;
  orderQuantity: number;
  hasPlan: boolean;
  totalSmvSeconds: number;

  // 1. Planned vs Actual Output
  dailyPlannedOutput: number;
  dailyActualGoodOutput: number;
  dailyActualRejectOutput: number;
  dailyTotalOutput: number;
  outputVariance: number; // actual - planned (negative = deficit)
  targetAttainmentPercent: number; // (actual / planned) * 100
  defectRatePercent: number; // (reject / total) * 100
  targetHourlyOutput: number;
  actualHourlyRunRate: number;

  // 2. Line Design Efficiency vs Actual Operating Efficiency
  lineDesignEfficiency: number; // Engineered balanced target efficiency (%)
  actualOperatingEfficiency: number; // Floor earned / work minutes operating efficiency (%)
  efficiencyVariance: number; // actual - design (%)
  balanceDelay: number; // (100 - designEfficiency)%
  pitchTime: number; // minutes
  pitchTimeSec: number; // seconds
  taktTimeSec: string;

  // 3. Operators Required vs. Deployed
  operatorsRequired: number;
  operatorsDeployed: number;
  manpowerVariance: number; // deployed - required (negative = deficit)
  manningFulfillmentPercent: number; // (deployed / required) * 100
  vacantStationCount: number;

  // 4. Pacing Bottleneck
  bottleneckOpName: string;
  bottleneckMachineType: string;
  bottleneckCycleTime: number;

  // 5. Workstation Sequential Layout
  stations: LineStationCoverage[];
}

export interface LineLevelAggregates {
  totalPlannedOutput: number;
  totalActualGoodOutput: number;
  totalActualRejectOutput: number;
  overallAttainmentPercent: number;
  totalOrderQuantity: number;
  totalCompletedTillNow: number;
  overallOrderCompletionPercent: number;
  avgDesignEfficiency: number;
  avgActualEfficiency: number;
  overallEfficiencyGap: number;
  totalOperatorsRequired: number;
  totalOperatorsDeployed: number;
  overallManningPercent: number;
  totalVacantStations: number;
  activeLinesCount: number;
  runningLinesCount: number;
  activeShiftTiming: string;
  overallDefectRate: number;
}

export function computeLineLevelOperationsData(
  lines: SewingLine[] = [],
  orders: Order[] = [],
  bulletins: OperationBulletin[] = [],
  linePlans: LinePlan[] = [],
  operators: Operator[] = [],
  shifts: Shift[] = [],
  timesheetData: OperatorTimesheet24h[] = [],
  pieceLogs: PieceProductionLog[] = [],
  _attendance: AttendanceRecord[] = []
): { lines: LineOperationsSummary[]; aggregates: LineLevelAggregates } {
  const activeLines = lines.filter((l) => l.active !== false);
  const activeOperators = operators.filter((o) => o.active !== false);
  const activeShifts = shifts.filter((s) => s.active !== false);

  // Determine active shift schedule
  const now = new Date();
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();

  let activeShift: Shift | null = null;
  for (const s of activeShifts) {
    const [sh = 8, sm = 0] = (s.startTime || "08:00").split(":").map(Number);
    const [eh = 17, em = 0] = (s.endTime || "17:00").split(":").map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) endMins += 24 * 60;

    const adjustedCurrent = currentTotalMins < startMins && endMins > 24 * 60
      ? currentTotalMins + 24 * 60
      : currentTotalMins;

    if (adjustedCurrent >= startMins && adjustedCurrent < endMins) {
      activeShift = s;
      break;
    }
  }
  if (!activeShift && activeShifts.length > 0) {
    activeShift = activeShifts[0];
  }

  let grossShiftMins = 480;
  let breakMins = 60;
  if (activeShift) {
    const [sh = 8, sm = 0] = (activeShift.startTime || "08:00").split(":").map(Number);
    const [eh = 17, em = 0] = (activeShift.endTime || "17:00").split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    grossShiftMins = mins;
    breakMins = Number(activeShift.breakDurationMinutes ?? 60);
  }
  const netWorkingMinutes = Math.max(60, grossShiftMins - breakMins);
  const shiftHours = Math.round((netWorkingMinutes / 60) * 10) / 10;
  const elapsedHours = Math.max(1, Math.min(shiftHours, now.getHours() >= 8 ? now.getHours() - 8 : 1));

  const activeShiftTimingStr = activeShift
    ? `${activeShift.shiftName} (${activeShift.startTime.slice(0, 5)}–${activeShift.endTime.slice(0, 5)})`
    : "Shift A (08:00–16:30)";

  // Pre-index helpers
  const planByLineId = new Map<string, LinePlan>();
  linePlans.forEach((p) => {
    if (p.lineId != null) planByLineId.set(String(p.lineId), p);
    if (p.lineCode) planByLineId.set(p.lineCode, p);
  });

  const orderById = new Map<string, Order>();
  orders.forEach((o) => {
    if (o.id != null) orderById.set(String(o.id), o);
  });

  const obByStyleId = new Map<string, OperationBulletin>();
  const obByStyleNo = new Map<string, OperationBulletin>();
  bulletins.forEach((b) => {
    (b.styles || []).forEach((s) => {
      if (s.id != null) obByStyleId.set(String(s.id), b);
      if (s.styleNo) obByStyleNo.set(s.styleNo.toLowerCase().trim(), b);
    });
  });

  const opById = new Map<string, Operator>();
  activeOperators.forEach((o) => {
    opById.set(String(o.id), o);
    opById.set(o.employeeId, o);
  });

  const calculatedLines: LineOperationsSummary[] = activeLines.map((line) => {
    const plan = planByLineId.get(String(line.id)) || planByLineId.get(line.lineCode) || null;
    const order = plan?.orderId ? orderById.get(String(plan.orderId)) || null : null;

    // Match OB
    let bulletin: OperationBulletin | null = null;
    if (order?.styleId != null) bulletin = obByStyleId.get(String(order.styleId)) || null;
    if (!bulletin && order?.styleNo) bulletin = obByStyleNo.get(order.styleNo.toLowerCase().trim()) || null;
    if (!bulletin && bulletins.length > 0) bulletin = bulletins[0];

    const hasPlan = plan !== null;

    // ── 1. Deployed & Required Manning ──
    let requiredOperators = Number(line.operatorCount) || 12;
    let deployedOperators = 0;
    const assignedOpIds = new Set<string>();

    if (plan && plan.assignments && plan.assignments.length > 0) {
      plan.assignments.forEach((asg) => {
        if (asg.operatorId != null) {
          deployedOperators++;
          assignedOpIds.add(String(asg.operatorId));
        }
      });
    }

    // ── 2. Design Efficiency & Target Output ──
    let designEff = Number(line.targetEfficiencyPercent) || (plan?.plannedEfficiency ? Number(plan.plannedEfficiency) : 80.0);
    let pitchTimeMin = 0.45;
    let bottleneckName = "—";
    let bottleneckMachine = "—";
    let bottleneckTime = 0;
    let totalSmvSec = 0;

    if (bulletin && bulletin.lines && bulletin.lines.length > 0) {
      totalSmvSec = bulletin.lines.reduce((sum, l) => sum + (Number(l.smv) || 0), 0);
      const opsInput = bulletin.lines.map((l) => ({
        id: l.id || l.sequence,
        sequence: l.sequence,
        name: l.operationName || l.operationCode || `Step ${l.sequence}`,
        code: l.operationCode,
        smv: Number(l.smv) || 0.45,
        machineType: l.machineType,
      }));

      const scenarios = generateLineBalancingScenarios(opsInput, requiredOperators, shiftHours);
      const recScenario = scenarios.find((s) => s.id === "recommended") || scenarios[0];

      if (recScenario) {
        designEff = plan?.plannedEfficiency ? Number(plan.plannedEfficiency) : recScenario.lineBalanceEfficiency;
        pitchTimeMin = recScenario.pitchTime;
        bottleneckName = recScenario.bottleneckOpName;
        bottleneckMachine = recScenario.bottleneckMachineType;
        bottleneckTime = recScenario.bottleneckCycleTime;
        requiredOperators = recScenario.totalMachines || requiredOperators;
      }
    }

    // ── 3. Output Targets: Planned vs Actual from Live Logs ──
    let dailyPlannedOutput = 0;
    if (plan?.targetOutput && Number(plan.targetOutput) > 0) {
      dailyPlannedOutput = Number(plan.targetOutput);
    } else if (line.capacityPerDay && Number(line.capacityPerDay) > 0) {
      dailyPlannedOutput = Number(line.capacityPerDay);
    } else {
      dailyPlannedOutput = Math.round(75 * shiftHours);
    }

    const targetHourlyOutput = Math.max(1, Math.round(dailyPlannedOutput / (shiftHours || 8)));

    // ── 6. Sequential Station Mapping ──
    const stations: LineStationCoverage[] = [];
    const sourceOps = bulletin && bulletin.lines && bulletin.lines.length > 0 ? bulletin.lines : [];

    let vacantCount = 0;
    const assignmentBySeq = new Map<string, string>();
    if (plan && plan.assignments) {
      plan.assignments.forEach((asg, idx) => {
        if (asg.operatorId != null) {
          const opIdStr = String(asg.operatorId);
          if (asg.stationId != null) assignmentBySeq.set(String(asg.stationId), opIdStr);
          if (asg.bulletinLineId != null) assignmentBySeq.set(String(asg.bulletinLineId), opIdStr);
          if (asg.operationId != null) assignmentBySeq.set(String(asg.operationId), opIdStr);
          assignmentBySeq.set(String(idx + 1), opIdStr);
        }
      });
    }

    const stationGoodOutputs: number[] = [];
    let totalLineWorkMinutes = 0;
    let totalLineEarnedMinutes = 0;
    let actualReject = 0;

    sourceOps.forEach((op, opIdx) => {
      const smvVal = Number(op.smv) || 0.45;
      const isBottleneckStation = bottleneckTime > 0 && smvVal >= bottleneckTime - 0.02;
      const isMultiManned = isBottleneckStation && requiredOperators > sourceOps.length;
      const reqCount = isMultiManned ? 2 : 1;

      const assignedOpId =
        (op.id != null ? assignmentBySeq.get(String(op.id)) : null) ||
        (op.operationId != null ? assignmentBySeq.get(String(op.operationId)) : null) ||
        (op.sequence != null ? assignmentBySeq.get(String(op.sequence)) : null) ||
        assignmentBySeq.get(String(opIdx + 1)) ||
        null;

      const assignedOp = assignedOpId ? opById.get(assignedOpId) || null : null;
      const isVacant = !assignedOp;
      if (isVacant) vacantCount++;

      const depCount = isVacant ? 0 : reqCount;

      let stStatus: LineStationCoverage["status"] = "Manned";
      if (isVacant) stStatus = "Vacant";
      else if (isBottleneckStation) stStatus = "Bottleneck";
      else if (isMultiManned) stStatus = "Multi-Manned";

      // Look up pieces logged by this operator today
      let piecesLogged = 0;
      if (assignedOp) {
        const opTimesheet = timesheetData.find((t) => String(t.operatorId) === String(assignedOp.id) || t.employeeId === assignedOp.employeeId);
        piecesLogged = opTimesheet?.totalGood || 0;
        if (piecesLogged > 0) {
          stationGoodOutputs.push(piecesLogged);
        }
      }

      stations.push({
        sequence: op.sequence || opIdx + 1,
        operationId: op.operationId,
        operationCode: op.operationCode,
        operationName: op.operationName || `Operation Step ${opIdx + 1}`,
        machineType: op.machineType || "Single Needle Lockstitch (SNLS)",
        smv: smvVal,
        effectiveCycleTime: smvVal / Math.max(1, depCount || 1),
        requiredOperators: reqCount,
        deployedOperators: depCount,
        assignedOperatorName: assignedOp ? assignedOp.name : null,
        assignedEmployeeId: assignedOp ? assignedOp.employeeId : null,
        assignedOperatorRating: op.skillRatingRequired || 3,
        isBottleneck: isBottleneckStation,
        actualPiecesLogged: piecesLogged,
        status: stStatus,
      });
    });

    // ── 3. Output Targets: Planned vs Actual Finished Garments from Flow Logs ──
    timesheetData.forEach((row) => {
      const isForThisLine =
        assignedOpIds.has(String(row.operatorId)) ||
        (row.department && row.department.toLowerCase().includes(line.lineName.toLowerCase())) ||
        (row.department && row.department.toLowerCase().includes(line.lineCode.toLowerCase()));

      if (isForThisLine) {
        actualReject += row.totalReject || 0;
        totalLineWorkMinutes += row.totalWorkMinutes || 0;
        totalLineEarnedMinutes += row.totalEarnedMinutes || 0;
      }
    });

    pieceLogs.forEach((pl) => {
      const isForThisLine =
        assignedOpIds.has(String(pl.operatorId)) ||
        (pl.department && pl.department.toLowerCase().includes(line.lineName.toLowerCase())) ||
        (pl.department && pl.department.toLowerCase().includes(line.lineCode.toLowerCase()));

      if (isForThisLine && !timesheetData.some((t) => (t.rawLogs || []).some((rl) => rl.id === pl.id))) {
        actualReject += pl.rejectQty || 0;
      }
    });

    // Progressive Sewing Line Finished Garments: bounded by end-of-line station throughput
    const activeLineOpGoods = timesheetData
      .filter((t) => assignedOpIds.has(String(t.operatorId)))
      .map((t) => t.totalGood || 0)
      .filter((g) => g > 0);

    const actualGood = stationGoodOutputs.length > 0
      ? Math.min(...stationGoodOutputs)
      : (activeLineOpGoods.length > 0 ? Math.min(...activeLineOpGoods) : 0);

    const dailyTotalOutput = actualGood + actualReject;
    const outputVariance = actualGood - dailyPlannedOutput;
    const targetAttainmentPercent = dailyPlannedOutput > 0 ? Math.min(100, Math.round((actualGood / dailyPlannedOutput) * 100)) : 0;
    const actualHourlyRunRate = Math.round(actualGood / elapsedHours);
    const defectRatePercent = dailyTotalOutput > 0 ? Math.round((actualReject / dailyTotalOutput) * 1000) / 10 : 0;

    // ── 4. Operating Efficiency: Real Earned / Clock Time Calculation ──
    let actualOperatingEff = 0;
    if (totalLineWorkMinutes > 0 && totalLineEarnedMinutes > 0) {
      actualOperatingEff = Math.round((totalLineEarnedMinutes / totalLineWorkMinutes) * 1000) / 10;
    } else if (actualGood > 0 && totalSmvSec > 0 && deployedOperators > 0) {
      const totalEarnedSecs = actualGood * totalSmvSec;
      const totalAvailableSecs = deployedOperators * elapsedHours * 3600;
      actualOperatingEff = Math.min(100, Math.round((totalEarnedSecs / totalAvailableSecs) * 1000) / 10);
    } else if (hasPlan && deployedOperators > 0) {
      const manningPenalty = deployedOperators < requiredOperators ? (requiredOperators - deployedOperators) * 3 : 0;
      actualOperatingEff = Math.max(0, Math.round((designEff - manningPenalty) * 10) / 10);
    }

    const efficiencyVariance = Math.round((actualOperatingEff - designEff) * 10) / 10;
    const balanceDelay = Math.max(0, Math.round((100 - designEff) * 10) / 10);

    // ── 5. Manning & Vacancies ──
    const manpowerVariance = deployedOperators - requiredOperators;
    const manningFulfillmentPercent = requiredOperators > 0 ? Math.min(100, Math.round((deployedOperators / requiredOperators) * 100)) : 0;

    // ── 7. Line Overall Status ──
    let lineStatus: LineOperationsSummary["status"] = "Running";
    if (!hasPlan) {
      lineStatus = "No Plan";
    } else if (deployedOperators === 0 || manningFulfillmentPercent < 40) {
      lineStatus = "Needs Attention";
    } else if (manningFulfillmentPercent < 80 || efficiencyVariance < -8) {
      lineStatus = "Ramping Up";
    }

    return {
      lineId: line.id,
      lineCode: line.lineCode,
      lineName: line.lineName,
      lineType: String(line.lineType || "Standard"),
      floor: line.floor || "Main Sewing Floor",
      supervisorName: line.supervisorName || "Line Supervisor",
      status: lineStatus,
      activeShiftTiming: activeShiftTimingStr,

      activeOrderId: order?.id || null,
      activeOrderNo: order?.orderNo || (hasPlan ? (plan?.orderId ? `PO-${plan.orderId}` : "Assigned Plan") : "No Order Active"),
      activeStyleName: order?.styleNo || (hasPlan ? "Style Linked" : "No Order Assigned"),
      buyer: order?.buyer || "—",
      orderQuantity: order?.totalQuantity || 0,
      hasPlan,
      totalSmvSeconds: totalSmvSec,

      dailyPlannedOutput,
      dailyActualGoodOutput: actualGood,
      dailyActualRejectOutput: actualReject,
      dailyTotalOutput,
      outputVariance,
      targetAttainmentPercent,
      defectRatePercent,
      targetHourlyOutput,
      actualHourlyRunRate,

      lineDesignEfficiency: designEff,
      actualOperatingEfficiency: actualOperatingEff,
      efficiencyVariance,
      balanceDelay,
      pitchTime: pitchTimeMin,
      pitchTimeSec: Math.round(pitchTimeMin * 60),
      taktTimeSec: pitchTimeMin > 0 ? (pitchTimeMin * 60).toFixed(1) : "—",

      operatorsRequired: requiredOperators,
      operatorsDeployed: deployedOperators,
      manpowerVariance,
      manningFulfillmentPercent,
      vacantStationCount: vacantCount,

      bottleneckOpName: bottleneckName,
      bottleneckMachineType: bottleneckMachine,
      bottleneckCycleTime: bottleneckTime,

      stations,
    };
  });

  // Compute Plant Aggregates
  const totalPlannedOutput = calculatedLines.reduce((s, l) => s + l.dailyPlannedOutput, 0);
  const totalActualGoodOutput = calculatedLines.reduce((s, l) => s + l.dailyActualGoodOutput, 0);
  const totalActualRejectOutput = calculatedLines.reduce((s, l) => s + l.dailyActualRejectOutput, 0);
  const totalProducedAcrossPlant = totalActualGoodOutput + totalActualRejectOutput;

  const overallAttainmentPercent = totalPlannedOutput > 0 ? Math.min(100, Math.round((totalActualGoodOutput / totalPlannedOutput) * 100)) : 0;
  const overallDefectRate = totalProducedAcrossPlant > 0 ? Math.round((totalActualRejectOutput / totalProducedAcrossPlant) * 1000) / 10 : 0;

  const avgDesignEfficiency =
    calculatedLines.length > 0
      ? Math.round((calculatedLines.reduce((s, l) => s + l.lineDesignEfficiency, 0) / calculatedLines.length) * 10) / 10
      : 82.5;

  const avgActualEfficiency =
    calculatedLines.length > 0
      ? Math.round((calculatedLines.reduce((s, l) => s + l.actualOperatingEfficiency, 0) / calculatedLines.length) * 10) / 10
      : 76.0;

  const overallEfficiencyGap = Math.round((avgActualEfficiency - avgDesignEfficiency) * 10) / 10;

  const totalOperatorsRequired = calculatedLines.reduce((s, l) => s + l.operatorsRequired, 0);
  const totalOperatorsDeployed = calculatedLines.reduce((s, l) => s + l.operatorsDeployed, 0);
  const overallManningPercent = totalOperatorsRequired > 0 ? Math.min(100, Math.round((totalOperatorsDeployed / totalOperatorsRequired) * 100)) : 0;
  const totalVacantStations = calculatedLines.reduce((s, l) => s + l.vacantStationCount, 0);

  const runningLinesCount = calculatedLines.filter((l) => l.status === "Running").length;

  // Total Active Orders Quantity vs. Completed Till Now
  const totalOrderQuantity =
    calculatedLines.reduce((s, l) => s + (l.orderQuantity || 0), 0) ||
    orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").reduce((s, o) => s + (Number(o.totalQuantity) || 0), 0) ||
    orders.reduce((s, o) => s + (Number(o.totalQuantity) || 0), 0);

  const totalCompletedTillNow = totalActualGoodOutput;
  const overallOrderCompletionPercent =
    totalOrderQuantity > 0
      ? Math.round((totalCompletedTillNow / totalOrderQuantity) * 1000) / 10
      : 0;

  return {
    lines: calculatedLines,
    aggregates: {
      totalPlannedOutput,
      totalActualGoodOutput,
      totalActualRejectOutput,
      overallAttainmentPercent,
      totalOrderQuantity,
      totalCompletedTillNow,
      overallOrderCompletionPercent,
      avgDesignEfficiency,
      avgActualEfficiency,
      overallEfficiencyGap,
      totalOperatorsRequired,
      totalOperatorsDeployed,
      overallManningPercent,
      totalVacantStations,
      activeLinesCount: calculatedLines.length,
      runningLinesCount,
      activeShiftTiming: activeShiftTimingStr,
      overallDefectRate,
    },
  };
}
