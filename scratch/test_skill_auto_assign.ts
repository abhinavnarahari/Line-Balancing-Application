import { runGlobalPoolOptimization } from "../frontend/src/features/line-balance/globalPoolOptimizer";

const stations = [
  { stationNum: 1, operationId: 1, operationName: "Shoulder Join", smvSeconds: 24, requiredSkillRating: "3", operatorIds: [null] },
  { stationNum: 2, operationId: 2, operationName: "Sleeve Attach Left", smvSeconds: 45, requiredSkillRating: "3", operatorIds: [null, null] },
  { stationNum: 3, operationId: 3, operationName: "Sleeve Attach Right", smvSeconds: 25.2, requiredSkillRating: "5", operatorIds: [null] },
  { stationNum: 4, operationId: 4, operationName: "Side Seam Close", smvSeconds: 30, requiredSkillRating: "4", operatorIds: [null] },
];

const operators = [
  { id: "101", employeeId: "EMP-039", name: "Veena Khanna", role: "OPERATOR", active: true },
  { id: "102", employeeId: "EMP-006", name: "Fatima Begum", role: "FLOATER", active: true },
  { id: "103", employeeId: "EMP-017", name: "Umesh Rao", role: "SUPERVISOR", active: true },
  { id: "104", employeeId: "EMP-033", name: "Varun Bhatt", role: "OPERATOR", active: true },
  { id: "105", employeeId: "EMP-021", name: "Pooja Das", role: "OPERATOR", active: true },
];

const skillAssessments = [
  // Veena has 3 on Op 1
  { id: 1, operatorId: "101", operationId: 1, rating: 3 },
  // Fatima & Umesh have 3 on Op 2
  { id: 2, operatorId: "102", operationId: 2, rating: 3 },
  { id: 3, operatorId: "103", operationId: 2, rating: 3 },
  // Varun has 5 on Op 3
  { id: 4, operatorId: "104", operationId: 3, rating: 5 },
  // Pooja has 4 on Op 4
  { id: 5, operatorId: "105", operationId: 4, rating: 4 },
];

const result = runGlobalPoolOptimization({
  stations,
  operators: operators as any,
  skillAssessments: skillAssessments as any,
  affinities: [],
  taktTimeSecs: 42.8,
  shiftHours: 8,
  fillOnlyEmpty: false,
});

console.log("=== AUTO-ASSIGNMENT TEST RESULTS ===");
result.slotDetails.forEach(slot => {
  console.log(`Station #${slot.stationNum} (${slot.operationName}) [Req: ${stations.find(s => s.stationNum === slot.stationNum)?.requiredSkillRating}]: Assigned ${slot.operatorName} (Rating: ★${slot.assignedRating})`);
});
