/**
 * Overall Plant Command Center — Metrics Engine
 *
 * Aggregates data from all sources to produce a single executive view:
 * - Plant KPI scorecards
 * - Order pipeline analysis
 * - Workforce deployment snapshot
 * - Line status grid
 */

import type { Order } from "../orders/api";
import type { OperationBulletin } from "../bulletins/api";
import type { Operator } from "../operators/api";
import type { SkillAssessment } from "../skill-matrix/api";
import type { SewingLine } from "../lines/api";
import type { LinePlan } from "../line-balance/api";

// ─── Order Pipeline ───────────────────────────────────────────────────────────

export interface OrderPipelineItem {
  id: string | number;
  orderNo: string;
  buyer: string;
  styleNo: string;
  totalQuantity: number;
  status: string;
  deliveryDate: string;
  daysUntilDelivery: number;
  urgency: "critical" | "high" | "normal" | "completed";
  hasOB: boolean;
  hasPlan: boolean;
  assignedLineName: string | null;
  fulfillmentPercent: number;
}

// ─── Line Status ──────────────────────────────────────────────────────────────

export interface LineStatusSummary {
  lineId: string | number;
  lineCode: string;
  lineName: string;
  operatorsRequired: number;
  operatorsDeployed: number;
  manningPercent: number;
  status: "Running" | "Needs Attention" | "No Plan" | "Ramping Up";
  activeOrderNo: string;
  buyer: string;
  hasPlan: boolean;
  designEfficiency: number;
}

// ─── Workforce Snapshot ───────────────────────────────────────────────────────

export interface WorkforceSnapshot {
  totalActive: number;
  totalInactive: number;
  seatedCount: number;
  unallocatedCount: number;
  seatedPercent: number;
  avgSkillRating: number;
  skillDistribution: { rating: number; count: number; label: string }[];
}

// ─── Plant KPIs ───────────────────────────────────────────────────────────────

export interface PlantKPIs {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalPlannedPcs: number;
  activeLines: number;
  totalLines: number;
  avgLineEfficiency: number;   // Computed from real bulletin SMV data
  effectiveBulletins: number;  // Bulletins with lines > 0
  totalOperators: number;
  activeOperators: number;
  seatedOperators: number;
  unallocatedOperators: number;
  manningFulfillmentPercent: number; // Across all lines
  totalRequiredAcrossLines: number;
  totalDeployedAcrossLines: number;
}

// ─── Computation Functions ────────────────────────────────────────────────────

export function computePlantKPIs(
  orders: Order[],
  bulletins: OperationBulletin[],
  operators: Operator[],
  _skillMatrix: SkillAssessment[],
  lines: SewingLine[],
  linePlans: LinePlan[]
): PlantKPIs {
  const activeOrders = orders.filter(
    (o) => o.status === "IN_PRODUCTION" || o.status === "PLANNED"
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalPlannedPcs = orders.reduce((sum, o) => {
    const qty =
      o.totalQuantity ||
      (o.sizeLines ? o.sizeLines.reduce((s: number, l: any) => s + l.quantity, 0) : 0);
    return sum + qty;
  }, 0);

  const activeLines = lines.filter((l) => l.active !== false);
  const totalLines = lines.length;

  // Compute average line efficiency from real bulletin SMV data
  const publishedBulletins = bulletins.filter((b) => b.lines && b.lines.length > 0);
  let totalEff = 0;
  let effCount = 0;
  publishedBulletins.forEach((b) => {
    const smvs = b.lines.map((l) => Number(l.smv) || 0).filter((v) => v > 0);
    if (smvs.length > 0) {
      const totalSmv = smvs.reduce((s, v) => s + v, 0);
      const maxSmv = Math.max(...smvs);
      const eff = maxSmv > 0 ? Math.round((totalSmv / (b.lines.length * maxSmv)) * 1000) / 10 : 0;
      if (eff > 0) { totalEff += eff; effCount++; }
    }
  });
  const avgLineEfficiency = effCount > 0 ? Math.round((totalEff / effCount) * 10) / 10 : 0;

  // Workforce
  const totalOperators = operators.length;
  const activeOperators = operators.filter((o) => o.active !== false).length;

  // Seated = those with real plan assignments
  const seatedIds = new Set<string>();
  linePlans.forEach((plan) => {
    (plan.assignments || []).forEach((asg) => {
      if (asg.operatorId != null) seatedIds.add(String(asg.operatorId));
    });
  });
  const activeOpsList = operators.filter((o) => o.active !== false);
  const seatedOperators = activeOpsList.filter(
    (o) => seatedIds.has(String(o.id)) || seatedIds.has(o.employeeId)
  ).length;
  const unallocatedOperators = activeOperators - seatedOperators;

  // Manning across all active lines
  const totalRequiredAcrossLines = activeLines.reduce(
    (sum, l) => sum + (Number(l.operatorCount) || 0),
    0
  );
  const totalDeployedAcrossLines = seatedOperators;
  const manningFulfillmentPercent =
    totalRequiredAcrossLines > 0
      ? Math.min(100, Math.round((totalDeployedAcrossLines / totalRequiredAcrossLines) * 100))
      : 0;

  return {
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
    totalPlannedPcs,
    activeLines: activeLines.length,
    totalLines,
    avgLineEfficiency,
    effectiveBulletins: publishedBulletins.length,
    totalOperators,
    activeOperators,
    seatedOperators,
    unallocatedOperators,
    manningFulfillmentPercent,
    totalRequiredAcrossLines,
    totalDeployedAcrossLines,
  };
}

export function computeOrderPipeline(
  orders: Order[],
  bulletins: OperationBulletin[],
  linePlans: LinePlan[],
  lines: SewingLine[]
): OrderPipelineItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build sets for fast lookup of styles with Operation Bulletins
  const styleIdsWithOB = new Set<string>();
  const styleNosWithOB = new Set<string>();
  bulletins.forEach((b) => {
    if (b.lines && b.lines.length > 0) {
      (b.styles || []).forEach((s) => {
        if (s.id != null) styleIdsWithOB.add(String(s.id));
        if (s.styleNo) styleNosWithOB.add(s.styleNo.toLowerCase().trim());
      });
    }
  });

  // Plan map: orderId → plan
  const planByOrderId = new Map<string, LinePlan>();
  linePlans.forEach((p) => {
    if (p.orderId != null) planByOrderId.set(String(p.orderId), p);
  });

  // Line map: lineId → lineName
  const lineById = new Map<string, string>();
  lines.forEach((l) => lineById.set(String(l.id), l.lineName));

  return orders
    .map((order): OrderPipelineItem => {
      const qty =
        order.totalQuantity ||
        (order.sizeLines
          ? order.sizeLines.reduce((s: number, l: any) => s + l.quantity, 0)
          : 0);

      const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
      const daysUntilDelivery = deliveryDate
        ? Math.round((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let urgency: OrderPipelineItem["urgency"] = "normal";
      if (order.status === "COMPLETED") {
        urgency = "completed";
      } else if (daysUntilDelivery < 0) {
        urgency = "critical";
      } else if (daysUntilDelivery <= 7) {
        urgency = "critical";
      } else if (daysUntilDelivery <= 21) {
        urgency = "high";
      }

      const hasOB =
        (order.styleId != null && styleIdsWithOB.has(String(order.styleId))) ||
        (order.styleNo != null && styleNosWithOB.has(order.styleNo.toLowerCase().trim())) ||
        (order as any).hasOB === true;
      const plan = planByOrderId.get(String(order.id)) || null;
      const hasPlan = plan !== null;

      let assignedLineName: string | null = null;
      if (plan?.lineId) assignedLineName = lineById.get(String(plan.lineId)) || null;
      if (!assignedLineName && plan?.lineName) assignedLineName = plan.lineName;

      const deployedCount = plan
        ? (plan.assignments || []).filter((a) => a.operatorId != null).length
        : 0;

      // Find required operators from the line assigned
      let requiredCount = 0;
      if (plan?.lineId) {
        const ln = lines.find((l) => String(l.id) === String(plan.lineId));
        requiredCount = Number(ln?.operatorCount) || 0;
      }

      const fulfillmentPercent =
        requiredCount > 0 ? Math.min(100, Math.round((deployedCount / requiredCount) * 100)) : 0;

      return {
        id: order.id ?? order.orderNo,
        orderNo: order.orderNo,
        buyer: order.buyer || "—",
        styleNo: order.styleNo || `Style #${order.styleId}`,
        totalQuantity: qty,
        status: order.status,
        deliveryDate: order.deliveryDate || "—",
        daysUntilDelivery,
        urgency,
        hasOB,
        hasPlan,
        assignedLineName,
        fulfillmentPercent,
      };
    })
    .sort((a, b) => a.daysUntilDelivery - b.daysUntilDelivery);
}

export function computeLineStatusGrid(
  lines: SewingLine[],
  orders: Order[],
  linePlans: LinePlan[]
): LineStatusSummary[] {
  const activeLines = lines.filter((l) => l.active !== false);

  const planByLineId = new Map<string, LinePlan>();
  linePlans.forEach((p) => {
    if (p.lineId != null) planByLineId.set(String(p.lineId), p);
    if (p.lineCode) planByLineId.set(p.lineCode, p);
  });

  const orderById = new Map<string, Order>();
  orders.forEach((o) => orderById.set(String(o.id), o));

  return activeLines.map((line) => {
    const plan =
      planByLineId.get(String(line.id)) ||
      planByLineId.get(line.lineCode) ||
      null;

    const order = plan ? orderById.get(String(plan.orderId)) || null : null;
    const hasPlan = plan !== null;

    const requiredOps = Number(line.operatorCount) || 0;
    const deployedOps = plan
      ? (plan.assignments || []).filter((a) => a.operatorId != null).length
      : 0;

    const manningPercent =
      requiredOps > 0 ? Math.min(100, Math.round((deployedOps / requiredOps) * 100)) : 0;

    let status: LineStatusSummary["status"] = "No Plan";
    if (hasPlan) {
      if (deployedOps === 0 || manningPercent < 50) {
        status = "Needs Attention";
      } else if (manningPercent < 80) {
        status = "Ramping Up";
      } else {
        status = "Running";
      }
    }

    // Compute design efficiency from line's targetEfficiencyPercent or default
    const designEfficiency = Number(line.targetEfficiencyPercent) || 80;

    return {
      lineId: line.id,
      lineCode: line.lineCode,
      lineName: line.lineName,
      operatorsRequired: requiredOps,
      operatorsDeployed: deployedOps,
      manningPercent,
      status,
      activeOrderNo: order?.orderNo || (hasPlan ? "—" : "No Order"),
      buyer: order?.buyer || "—",
      hasPlan,
      designEfficiency,
    };
  });
}

export function computeWorkforceSnapshot(
  operators: Operator[],
  skillMatrix: SkillAssessment[],
  linePlans: LinePlan[]
): WorkforceSnapshot {
  const totalActive = operators.filter((o) => o.active !== false).length;
  const totalInactive = operators.filter((o) => o.active === false).length;

  const seatedIds = new Set<string>();
  linePlans.forEach((plan) => {
    (plan.assignments || []).forEach((asg) => {
      if (asg.operatorId != null) seatedIds.add(String(asg.operatorId));
    });
  });

  const activeOpsList = operators.filter((o) => o.active !== false);
  const seatedCount = activeOpsList.filter(
    (o) => seatedIds.has(String(o.id)) || seatedIds.has(o.employeeId)
  ).length;
  const unallocatedCount = totalActive - seatedCount;
  const seatedPercent = totalActive > 0 ? Math.round((seatedCount / totalActive) * 100) : 0;

  // Average skill rating from skill matrix
  const ratings = skillMatrix.map((s) => s.rating || 0).filter((r) => r > 0);
  const avgSkillRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

  // Skill distribution
  const skillDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: ratings.filter((rv) => rv === r).length,
    label: r === 5 ? "Expert" : r === 4 ? "Advanced" : r === 3 ? "Standard" : r === 2 ? "Basic" : "Trainee",
  }));

  return {
    totalActive,
    totalInactive,
    seatedCount,
    unallocatedCount,
    seatedPercent,
    avgSkillRating,
    skillDistribution,
  };
}
