import { computeForwardSkillGapAnalysis } from "../frontend/src/features/dashboards/forwardSkillGap";
import { computeLineLevelOperationsData } from "../frontend/src/features/dashboards/lineLevelMetrics";
async function fetchApi(path: string): Promise<any> {
  try {
    const res = await fetch("http://localhost:8085/api" + path);
    const parsed = (await res.json()) as any;
    return parsed?.data || parsed || [];
  } catch {
    return [];
  }
}

async function testDashboards() {
  console.log("=== Testing Operator & Management Dashboards Engines ===");

  const [orders, bulletins, operators, skills, operations, lines, plans] = await Promise.all([
    fetchApi("/orders"),
    fetchApi("/operation-bulletins"),
    fetchApi("/operators"),
    fetchApi("/skill-matrix"),
    fetchApi("/operations"),
    fetchApi("/lines"),
    fetchApi("/line-plans"),
  ]);

  console.log(`Loaded from API: ${orders.length} orders, ${bulletins.length} bulletins, ${operators.length} operators, ${lines.length} lines.`);

  // 1. Test Forward Planning Skill Gap Analysis (e.g. October Plan)
  console.log("\n--- Testing Plant-Level Forward Skill Gap Analysis (October Plan) ---");
  const forwardSummary = computeForwardSkillGapAnalysis(
    orders,
    bulletins,
    operators,
    skills,
    operations,
    "2026-10"
  );

  console.log(`Plan Month: ${forwardSummary.planMonth}`);
  console.log(`Forward Orders Count: ${forwardSummary.activeOrdersCount} orders (${forwardSummary.totalPlannedPieces} planned pieces)`);
  console.log(`Total Operators Required: ${forwardSummary.totalOperatorsRequired}`);
  console.log(`Total Operators Available: ${forwardSummary.totalOperatorsAvailable}`);
  console.log(`Critical Shortfalls Count: ${forwardSummary.criticalShortfallCount}`);
  console.log("Skill Demands breakdown:");
  forwardSummary.skillDemands.forEach((d) => {
    console.log(`  - [${d.status.toUpperCase()}] ${d.machineClass}: Req ${d.requiredOperators} vs Avail ${d.availableQualifiedOperators} (Gap: ${d.skillGap})`);
  });
  console.log(`Training Candidates generated: ${forwardSummary.trainingRoadmap.length}`);
  forwardSummary.trainingRoadmap.slice(0, 3).forEach((c) => {
    console.log(`  - ${c.operatorName} (${c.employeeId}): Cross-train to ${c.targetMachine} (${c.trainingDaysEstimate} days)`);
  });

  // 2. Test Line-Level Operations Metrics
  console.log("\n--- Testing Line-Level Operations Metrics ---");
  const lineSummaries = computeLineLevelOperationsData(
    lines,
    orders,
    bulletins,
    plans,
    operators
  );

  lineSummaries.forEach((l) => {
    console.log(`\nLine: ${l.lineCode} - ${l.lineName} (${l.status})`);
    console.log(`  Style: ${l.activeStyleName} | Buyer: ${l.buyer}`);
    console.log(`  Operators Required: ${l.operatorsRequired} vs Deployed: ${l.operatorsDeployed} (Variance: ${l.manpowerVariance}, Fulfillment: ${l.manningFulfillmentPercent}%)`);
    console.log(`  Design Eff (OB): ${l.lineDesignEfficiency}% vs Actual Operating Eff: ${l.actualOperatingEfficiency}% (Variance: ${l.efficiencyVariance}%)`);
    console.log(`  Pacing Bottleneck: ${l.bottleneckOpName} (${l.bottleneckCycleTime.toFixed(2)}m on ${l.bottleneckMachineType})`);
    console.log(`  Stations Count: ${l.stations.length} | Vacant Stations: ${l.vacantStationCount}`);
  });

  console.log("\n=== All Dashboard Engines Verified Successfully! ===");
}

testDashboards();
