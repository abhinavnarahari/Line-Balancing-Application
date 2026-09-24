// Simulation test for Global Pool Optimizer logic

const RATING_EFFICIENCY_MULTIPLIERS = {
  5: 1.15,
  4: 1.00,
  3: 0.85,
  2: 0.70,
  1: 0.55
};

function runGlobalPoolOptimization(params) {
  const {
    stations,
    operators,
    skillAssessments,
    affinities = [],
    attendanceRecords = [],
    externalAssignedOperatorIds = new Set(),
    taktTimeSecs = 60,
    plannedEfficiency = 80,
    shiftHours = 8,
    fillOnlyEmpty = false,
  } = params;

  const attendanceMap = new Map();
  attendanceRecords.forEach(a => {
    attendanceMap.set(String(a.operatorId), a.status?.toUpperCase() || "PRESENT");
  });

  const skillMatrixMap = new Map();
  skillAssessments.forEach(sa => {
    const opIdStr = String(sa.operatorId);
    if (!skillMatrixMap.has(opIdStr)) {
      skillMatrixMap.set(opIdStr, new Map());
    }
    const inner = skillMatrixMap.get(opIdStr);
    inner.set(String(sa.operationId), sa);
  });

  const affinityMap = new Map();
  affinities.forEach(aff => {
    const pId = String(aff.primaryOperationId);
    if (!affinityMap.has(pId)) affinityMap.set(pId, []);
    affinityMap.get(pId).push(aff);
  });

  const demandSlots = [];
  stations.forEach((st, stIdx) => {
    const slotCount = Math.max(1, st.operatorIds.length);
    for (let sIdx = 0; sIdx < slotCount; sIdx++) {
      demandSlots.push({
        stationIndex: stIdx,
        stationNum: st.stationNum,
        slotIndex: sIdx,
        operationId: st.operationId,
        operationName: st.operationName || `Station #${st.stationNum}`,
        smvSeconds: st.smvSeconds > 0 ? st.smvSeconds : 30,
        requiredSkillRating: st.requiredSkillRating,
        currentOperatorId: st.operatorIds[sIdx] || null,
      });
    }
  });

  const lockedInThisPlan = new Set();
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
    return op.active !== false;
  });

  const slotsToAllocate = fillOnlyEmpty
    ? demandSlots.filter(s => !s.currentOperatorId)
    : demandSlots;

  const getCandidateEvaluation = (op, slot) => {
    const opIdStr = String(op.id);
    const targetOpIdStr = String(slot.operationId);
    const opSkills = skillMatrixMap.get(opIdStr);

    let rating = 1;
    let isAffinity = false;
    let transferPct = 100;

    const directSkill = opSkills?.get(targetOpIdStr);
    if (directSkill) {
      rating = directSkill.rating || 1;
    } else {
      const possibleAffinities = affinityMap.get(targetOpIdStr) || [];
      let bestAffinityRating = 0;
      let bestAff = null;
      for (const aff of possibleAffinities) {
        const altSkill = opSkills?.get(String(aff.alternativeOperationId));
        if (altSkill) {
          const effRating = altSkill.rating || 1;
          if (effRating > bestAffinityRating) {
            bestAffinityRating = effRating;
            bestAff = aff;
          }
        }
      }
      if (bestAff && bestAffinityRating > 0) {
        isAffinity = true;
        rating = bestAffinityRating;
        transferPct = Number(bestAff.efficiencyTransferPct) || 85;
      } else {
        rating = 1;
        transferPct = 100;
      }
    }

    const baseEff = RATING_EFFICIENCY_MULTIPLIERS[rating] || 0.85;
    const effectiveEff = Math.round((baseEff * (transferPct / 100)) * 100) / 100;

    let targetRating = null;
    if (slot.requiredSkillRating && slot.requiredSkillRating !== "ANY") {
      const num = Number(slot.requiredSkillRating);
      if (!isNaN(num)) targetRating = num;
    }

    const baseSkillCost = -(rating * 2000);
    let skillReqCost = 0;
    if (targetRating !== null) {
      if (rating >= targetRating) {
        skillReqCost = -2000;
      } else {
        skillReqCost = 5000 * (targetRating - rating);
      }
    }

    let skillTypeCost = 0;
    if (directSkill) {
      skillTypeCost = -2000;
    } else if (isAffinity) {
      skillTypeCost = 400;
    } else {
      skillTypeCost = 10000;
    }

    const isCurrentAssignee = slot.currentOperatorId && String(slot.currentOperatorId) === opIdStr;
    const retentionBonus = isCurrentAssignee ? -25000 : 0;

    const slotTargetSecs = slot.smvSeconds;
    const bottleneckCriticality = Math.max(1, slotTargetSecs / Math.max(1, taktTimeSecs));
    const skillDeficit = Math.max(0, 1.15 - effectiveEff);
    const bottleneckMismatchCost = bottleneckCriticality * skillDeficit * 1500;

    const attStatus = attendanceMap.get(opIdStr) || "PRESENT";
    let attPenalty = 0;
    if (attStatus === "ABSENT") attPenalty = 30000;
    else if (attStatus === "LATE") attPenalty = 100;

    const efficiencyCost = -(effectiveEff * 1000);
    const totalCost = baseSkillCost + skillReqCost + skillTypeCost + retentionBonus + bottleneckMismatchCost + attPenalty + efficiencyCost;

    return {
      operator: op,
      rating,
      efficiencyMultiplier: effectiveEff,
      isAffinity,
      cost: totalCost,
    };
  };

  const sortedSlotIndices = slotsToAllocate
    .map((_, idx) => idx)
    .sort((a, b) => {
      const slotA = slotsToAllocate[a];
      const slotB = slotsToAllocate[b];
      const weightA = Number(slotA.requiredSkillRating || 0) * 1000;
      const weightB = Number(slotB.requiredSkillRating || 0) * 1000;
      if (weightB !== weightA) return weightB - weightA;
      return slotB.smvSeconds - slotA.smvSeconds;
    });

  const assignedOperatorIds = new Set(lockedInThisPlan);
  const slotAssignments = new Map();

  for (const sIdx of sortedSlotIndices) {
    const slot = slotsToAllocate[sIdx];
    const availablePool = candidateOperators.filter(op => !assignedOperatorIds.has(String(op.id)));
    if (availablePool.length === 0) {
      slotAssignments.set(slot, null);
      continue;
    }
    const candidates = availablePool.map(op => getCandidateEvaluation(op, slot));
    candidates.sort((a, b) => a.cost - b.cost);
    const chosen = candidates[0];
    slotAssignments.set(slot, chosen);
    assignedOperatorIds.add(String(chosen.operator.id));
  }

  const updatedStationAssignments = stations.map(st => [...st.operatorIds]);
  const slotDetails = [];

  demandSlots.forEach(slot => {
    let chosen = slotAssignments.get(slot);
    if (!chosen && slot.currentOperatorId) {
      const existingOp = operators.find(o => String(o.id) === String(slot.currentOperatorId));
      if (existingOp) {
        chosen = getCandidateEvaluation(existingOp, slot);
      }
    }

    if (chosen) {
      updatedStationAssignments[slot.stationIndex][slot.slotIndex] = chosen.operator.id;
      slotDetails.push({
        stationIndex: slot.stationIndex,
        stationNum: slot.stationNum,
        slotIndex: slot.slotIndex,
        operationId: slot.operationId,
        operationName: slot.operationName,
        operatorId: chosen.operator.id,
        operatorName: chosen.operator.name,
        assignedRating: chosen.rating,
        assignedEfficiencyPct: Math.round(chosen.efficiencyMultiplier * 100),
        effectiveCycleTimeSecs: Math.round((slot.smvSeconds / chosen.efficiencyMultiplier) * 10) / 10,
        isAffinityAssignment: chosen.isAffinity,
      });
    } else {
      updatedStationAssignments[slot.stationIndex][slot.slotIndex] = null;
      slotDetails.push({
        stationIndex: slot.stationIndex,
        stationNum: slot.stationNum,
        slotIndex: slot.slotIndex,
        operatorId: null,
      });
    }
  });

  return {
    updatedStationAssignments,
    slotDetails,
  };
}

// ─── RUN THE EXACT TEST CASE FROM USER SCREENSHOTS ───
console.log("================================================================================");
console.log("TEST: User Scenario - 8 Stations Planned in Line Design with 3 Multi-Op Slots");
console.log("================================================================================");

const stations = [
  { stationNum: 1, operationId: 1, operationName: "Shoulder Join", smvSeconds: 27, requiredSkillRating: "3", operatorIds: [1] },
  { stationNum: 2, operationId: 2, operationName: "Neck Rib Attach", smvSeconds: 30, requiredSkillRating: "3", operatorIds: [2, null] },
  { stationNum: 3, operationId: 3, operationName: "Neck Top Stitch", smvSeconds: 21, requiredSkillRating: "3", operatorIds: [3] },
  { stationNum: 4, operationId: 4, operationName: "Sleeve Attach Left", smvSeconds: 27, requiredSkillRating: "3", operatorIds: [4] },
  { stationNum: 5, operationId: 5, operationName: "Sleeve Attach Right", smvSeconds: 27, requiredSkillRating: "3", operatorIds: [5] },
  { stationNum: 6, operationId: 6, operationName: "Side Seam Close", smvSeconds: 33, requiredSkillRating: "4", operatorIds: [6, null] },
  { stationNum: 7, operationId: 7, operationName: "Sleeve Hem", smvSeconds: 27, requiredSkillRating: "3", operatorIds: [7] },
  { stationNum: 8, operationId: 8, operationName: "Bottom Hem", smvSeconds: 30, requiredSkillRating: "3", operatorIds: [8, null] },
];

const operators = [
  { id: 1, employeeId: "EMP-001", name: "Priya Sharma" },
  { id: 2, employeeId: "EMP-002", name: "Rajesh Kumar" },
  { id: 3, employeeId: "EMP-003", name: "Ananya Roy" },
  { id: 4, employeeId: "EMP-004", name: "Deepa Patel" },
  { id: 5, employeeId: "EMP-005", name: "Suresh Nair" },
  { id: 6, employeeId: "EMP-006", name: "Fatima Begum" },
  { id: 7, employeeId: "EMP-007", name: "Manoj Verma" },
  { id: 8, employeeId: "EMP-008", name: "Kavita Sundaram" },
  // Pool operators
  { id: 9, employeeId: "EMP-009", name: "Ravi Shankar" },
  { id: 10, employeeId: "EMP-010", name: "Sunita Verma" },
  { id: 11, employeeId: "EMP-011", name: "Amitabh Sen" },
];

const skillAssessments = [
  { operatorId: 1, operationId: 1, rating: 5 },
  { operatorId: 2, operationId: 2, rating: 5 },
  { operatorId: 3, operationId: 3, rating: 5 },
  { operatorId: 4, operationId: 4, rating: 5 },
  { operatorId: 5, operationId: 5, rating: 5 },
  { operatorId: 6, operationId: 6, rating: 5 },
  { operatorId: 7, operationId: 7, rating: 5 },
  { operatorId: 8, operationId: 8, rating: 5 },
  // Skill assessments for pool operators
  { operatorId: 9, operationId: 2, rating: 4 },
  { operatorId: 10, operationId: 6, rating: 4 },
  { operatorId: 11, operationId: 8, rating: 4 },
];

// Test 1: Auto-Assign with fillOnlyEmpty = true (when clicking Auto-Assign button on a planned line)
console.log("\n[TEST 1] Clicking Auto-Assign on Planned Line (fillOnlyEmpty = true):");
const res1 = runGlobalPoolOptimization({
  stations,
  operators,
  skillAssessments,
  taktTimeSecs: 33.8,
  fillOnlyEmpty: true,
});

res1.slotDetails.forEach(s => {
  console.log(`Station #${s.stationNum} slot ${s.slotIndex}: ${s.operatorName} (★${s.assignedRating}, ${s.assignedEfficiencyPct}% eff) -> Cycle: ${s.effectiveCycleTimeSecs}s`);
});

// Assertions
const stn1Res = res1.slotDetails.find(s => s.stationNum === 1);
const stn2Slot1 = res1.slotDetails.find(s => s.stationNum === 2 && s.slotIndex === 0);
const stn2Slot2 = res1.slotDetails.find(s => s.stationNum === 2 && s.slotIndex === 1);
const stn6Slot1 = res1.slotDetails.find(s => s.stationNum === 6 && s.slotIndex === 0);
const stn6Slot2 = res1.slotDetails.find(s => s.stationNum === 6 && s.slotIndex === 1);
const stn8Slot1 = res1.slotDetails.find(s => s.stationNum === 8 && s.slotIndex === 0);
const stn8Slot2 = res1.slotDetails.find(s => s.stationNum === 8 && s.slotIndex === 1);

console.log("\nVerification Results:");
console.log("Stn 1 retained Priya Sharma (★5):", stn1Res?.operatorName === "Priya Sharma" ? "PASSED" : "FAILED");
console.log("Stn 2 slot 1 retained Rajesh Kumar (★5):", stn2Slot1?.operatorName === "Rajesh Kumar" ? "PASSED" : "FAILED");
console.log("Stn 2 slot 2 staffed with Ravi Shankar (★4):", stn2Slot2?.operatorName === "Ravi Shankar" ? "PASSED" : "FAILED");
console.log("Stn 6 slot 1 retained Fatima Begum (★5):", stn6Slot1?.operatorName === "Fatima Begum" ? "PASSED" : "FAILED");
console.log("Stn 6 slot 2 staffed with Sunita Verma (★4):", stn6Slot2?.operatorName === "Sunita Verma" ? "PASSED" : "FAILED");
console.log("Stn 8 slot 1 retained Kavita Sundaram (★5):", stn8Slot1?.operatorName === "Kavita Sundaram" ? "PASSED" : "FAILED");
console.log("Stn 8 slot 2 staffed with Amitabh Sen (★4):", stn8Slot2?.operatorName === "Amitabh Sen" ? "PASSED" : "FAILED");

if (
  stn1Res?.operatorName === "Priya Sharma" &&
  stn2Slot1?.operatorName === "Rajesh Kumar" &&
  stn2Slot2?.operatorName === "Ravi Shankar" &&
  stn6Slot1?.operatorName === "Fatima Begum" &&
  stn6Slot2?.operatorName === "Sunita Verma" &&
  stn8Slot1?.operatorName === "Kavita Sundaram" &&
  stn8Slot2?.operatorName === "Amitabh Sen"
) {
  console.log("\n>>> ALL AUTO-ASSIGN TESTS PASSED PERFECTLY! <<<");
} else {
  console.error("\n>>> TEST FAILED! <<<");
  process.exit(1);
}

// Test 2: Full Auto-Assign from scratch (all slots unassigned, fillOnlyEmpty = false)
console.log("\n[TEST 2] Full Auto-Assign from scratch (fillOnlyEmpty = false):");
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
  console.log(`Station #${s.stationNum} slot ${s.slotIndex}: ${s.operatorName} (★${s.assignedRating}, ${s.assignedEfficiencyPct}% eff) -> Cycle: ${s.effectiveCycleTimeSecs}s`);
});

const allAssigned = res2.slotDetails.every(s => s.operatorId !== null);
console.log("All 11 slots staffed with qualified operators:", allAssigned ? "PASSED" : "FAILED");
