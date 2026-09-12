import { generateLineBalancingScenarios, type OperationStepInput } from "../frontend/src/features/bulletins/lineBalancingScenarios";

// Real-world 30-operation Knit Polo Shirt routing
const sampleOps: OperationStepInput[] = [
  { id: 1, sequence: 1, name: "Fuse Collar Band", smv: 0.25, machineType: "Continuous Fusing Press" },
  { id: 2, sequence: 2, name: "Collar Make (Run Stitch)", smv: 0.45, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 3, sequence: 3, name: "Collar Trim & Turn", smv: 0.20, machineType: "Manual Work / Inspection Station" },
  { id: 4, sequence: 4, name: "Collar Topstitch", smv: 0.40, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 5, sequence: 5, name: "Placket Fuse", smv: 0.22, machineType: "Heat Transfer / Flat Press" },
  { id: 6, sequence: 6, name: "Placket Crease Iron", smv: 0.35, machineType: "Vacuum Ironing Table" },
  { id: 7, sequence: 7, name: "Sew Left Placket", smv: 0.52, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 8, sequence: 8, name: "Sew Right Placket", smv: 0.50, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 9, sequence: 9, name: "Box Stitch & Cut Placket", smv: 0.85, machineType: "Single Needle Lockstitch (SNLS)" }, // Critical Bottleneck #1
  { id: 10, sequence: 10, name: "Join Shoulder with Tape", smv: 0.42, machineType: "4-Thread Overlock (504/514)" },
  { id: 11, sequence: 11, name: "Collar Attach to Neck", smv: 0.62, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 12, sequence: 12, name: "Neck Binding / Moon Patch", smv: 0.48, machineType: "Feed-off-the-Arm (Interlock)" },
  { id: 13, sequence: 13, name: "Attach Size Label", smv: 0.18, machineType: "Single Needle Lockstitch (SNLS)" }, // Short op candidate
  { id: 14, sequence: 14, name: "Attach Care Label", smv: 0.16, machineType: "Single Needle Lockstitch (SNLS)" }, // Short op candidate
  { id: 15, sequence: 15, name: "Sleeve Hemming", smv: 0.55, machineType: "Flatlock 3-Needle (Coverstitch 600)" },
  { id: 16, sequence: 16, name: "Sleeve Attach to Armhole", smv: 0.82, machineType: "4-Thread Overlock (504/514)" }, // Critical Bottleneck #2
  { id: 17, sequence: 17, name: "Side Seam & Join Slit", smv: 0.65, machineType: "4-Thread Overlock (504/514)" },
  { id: 18, sequence: 18, name: "Side Slit Binding", smv: 0.40, machineType: "Single Needle Lockstitch (SNLS)" },
  { id: 19, sequence: 19, name: "Side Slit Bartack", smv: 0.28, machineType: "Electronic Bartack (42-stitch)" },
  { id: 20, sequence: 20, name: "Bottom Hemming", smv: 0.60, machineType: "Flatlock 3-Needle (Coverstitch 600)" },
  { id: 21, sequence: 21, name: "Button Hole Mark", smv: 0.15, machineType: "Manual Work / Inspection Station" },
  { id: 22, sequence: 22, name: "Sew Button Hole (2 Holes)", smv: 0.32, machineType: "Buttonhole Indexer (Lockstitch 301)" },
  { id: 23, sequence: 23, name: "Sew Button (2 Buttons)", smv: 0.30, machineType: "Button Sewing Machine (Electronic)" },
  { id: 24, sequence: 24, name: "Thread Trimming", smv: 0.40, machineType: "Manual Work / Inspection Station" },
  { id: 25, sequence: 25, name: "Initial Garment QC Check", smv: 0.45, machineType: "Manual Work / Inspection Station" },
  { id: 26, sequence: 26, name: "Spot Cleaning", smv: 0.20, machineType: "Spot Cleaning Machine" },
  { id: 27, sequence: 27, name: "Final Garment Pressing", smv: 0.50, machineType: "Vacuum Ironing Table" },
  { id: 28, sequence: 28, name: "Hangtag Attach", smv: 0.22, machineType: "Manual Work / Inspection Station" },
  { id: 29, sequence: 29, name: "Fold & Polybag Packing", smv: 0.42, machineType: "Manual Work / Inspection Station" },
  { id: 30, sequence: 30, name: "Carton Packing", smv: 0.30, machineType: "Manual Work / Inspection Station" },
];

// Test Case 2: Classic 30-Machine Line where 2 bottlenecks cause 70% efficiency
const classicOps: OperationStepInput[] = Array.from({ length: 30 }, (_, i) => {
  if (i === 8) return { id: i + 1, sequence: i + 1, name: "Box Stitch Placket", smv: 0.80, machineType: "Single Needle Lockstitch (SNLS)" };
  if (i === 15) return { id: i + 1, sequence: i + 1, name: "Sleeve Attach", smv: 0.78, machineType: "4-Thread Overlock (504/514)" };
  if (i === 20) return { id: i + 1, sequence: i + 1, name: "Bottom Hem", smv: 0.60, machineType: "Flatlock 3-Needle (Coverstitch 600)" };
  return { id: i + 1, sequence: i + 1, name: `Sewing Step ${i + 1}`, smv: 0.55, machineType: "Single Needle Lockstitch (SNLS)" };
});

console.log("\n=============================================================");
console.log("=== Testing Classic 30-Machine Line (Target: 70% -> 83% Jump) ===");
const scenariosClassic = generateLineBalancingScenarios(classicOps, 30, 8);
scenariosClassic.forEach((s) => {
  console.log(`\n[${s.badge}] ${s.name}: ${s.headlineInsight}`);
  console.log(`Machines: ${s.totalMachines} | Eff: ${s.lineBalanceEfficiency}% | Output: ${s.hourlyOutput85} pcs/hr (${s.dailyOutput85}/shift)`);
  if (s.chokeReliefList.length > 0) {
    s.chokeReliefList.forEach(c => console.log(`   -> Relieved ${c.opName}: ${c.beforeCycle}m -> ${c.afterCycle}m (${c.allocatedMachines}x ${c.machineType})`));
  }
});

const scenarios = generateLineBalancingScenarios(sampleOps, 30, 8);
scenarios.forEach((s) => {
  console.log("\n-------------------------------------------------------------");
  console.log(`SCENARIO: [${s.badge}] ${s.name}`);
  console.log(`Headline: ${s.headlineInsight}`);
  console.log(`Machines: ${s.totalMachines} | Efficiency: ${s.lineBalanceEfficiency}% (Delay: ${s.balanceDelay}%)`);
  console.log(`Output (85%): ${s.hourlyOutput85} pcs/hr (${s.dailyOutput85} pcs/8h shift)`);
  console.log(`Pitch Time: ${s.pitchTime.toFixed(2)} min | Bottleneck: ${s.bottleneckOpName} (${s.bottleneckCycleTime.toFixed(2)}m)`);
  console.log(`Labor Productivity: ${s.laborProductivity} pcs/op/hr`);
  console.log(`ROI: ${s.roiMetric}`);
  console.log(`Senior IE Rationale: ${s.humanIeRationale}`);
  if (s.chokeReliefList && s.chokeReliefList.length > 0) {
    console.log("Choke Relief Stations:");
    s.chokeReliefList.forEach(c => {
      console.log(`  - ${c.opName}: ${c.beforeCycle.toFixed(2)}m -> ${c.afterCycle.toFixed(2)}m with ${c.allocatedMachines}x ${c.machineType}`);
    });
  }
  if (s.clusteringOpportunities && s.clusteringOpportunities.length > 0) {
    console.log("Clustering Opportunities:");
    s.clusteringOpportunities.forEach(cl => {
      console.log(`  - ${cl.recommendation}`);
    });
  }
});
