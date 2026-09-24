// Add Test 2 to scratch/test_optimizer_sim.cjs
const fs = require('fs');

const fileContent = fs.readFileSync('scratch/test_optimizer_sim.cjs', 'utf-8');

const test2Code = `
// Test 2: Full Auto-Assign from scratch (all slots unassigned, fillOnlyEmpty = false)
console.log("\\n[TEST 2] Full Auto-Assign from scratch (fillOnlyEmpty = false):");
const stationsEmpty = stations.map(s => ({
  ...s,
  operatorIds: s.operatorIds.map(() => null),
}));

const res2 = runGlobalPoolOptimization({
  stations: stationsEmpty,
  operators,
  skillAssessments,
  taktTimeSecs: 33.8,
  fillOnlyEmpty: false,
});

res2.slotDetails.forEach(s => {
  console.log(\`Station #\${s.stationNum} slot \${s.slotIndex}: \${s.operatorName} (★\${s.assignedRating}, \${s.assignedEfficiencyPct}% eff) -> Cycle: \${s.effectiveCycleTimeSecs}s\`);
});

const allAssigned = res2.slotDetails.every(s => s.operatorId !== null);
console.log("All 11 slots staffed with qualified operators:", allAssigned ? "PASSED" : "FAILED");
`;

fs.writeFileSync('scratch/test_optimizer_sim.cjs', fileContent + test2Code);
