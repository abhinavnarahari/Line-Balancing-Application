export interface LineSummaryItem {
  lineId: number;
  lineCode: string;
  lineName: string;
  lineType: string;
  currentStyle?: string;
  currentBulletin?: string;
  orderId?: number;
  orderNo?: string;
  bulletinId?: number;
  bulletinCode?: string;
  revisionNumber?: number;
  targetHourlyOutput: number;
  plannedEfficiency: number;
  designedManpower: number;
  machineCount: number;
  lineDesignId?: number;
  designCode?: string;
}

export interface OrderSummaryItem {
  orderId: number;
  orderNo: string;
  styleNo: string;
  customerName: string;
  orderQuantity: number;
  bulletinId?: number;
  bulletinCode?: string;
  bulletinRevision?: number;
}

export interface PlanningContextResponse {
  plantLocation: string;
  planningDate: string;
  shiftId: number;
  shiftName: string;
  shiftWorkingHours: number;
  selectedLines: LineSummaryItem[];
  activeOrders: OrderSummaryItem[];
  totalTargetHourlyOutput: number;
  totalDesignedManpower: number;
  totalAvailableOperators: number;
  totalPresentOperators: number;
  totalAbsentOperators: number;
  totalAvailableMachines: number;
  totalRequiredMachines: number;
}

export interface QualifiedOperationItem {
  operationId: number;
  operationCode: string;
  operationName: string;
  rating: number; // 1 to 5
  cycleTimeSeconds?: number;
}

export interface QualifiedMachineItem {
  machineType: string;
  qualificationLevel: number;
  experienceMonths: number;
  isPrimary: boolean;
}

export interface OperatorPoolItem {
  operatorId: number;
  employeeCode: string;
  operatorName: string;
  age: number;
  gender: string;
  department: string;
  role: string;
  currentLineId?: number;
  currentLineName?: string;
  averageSkillRating: number;
  qualifiedOperations: QualifiedOperationItem[];
  qualifiedMachines: QualifiedMachineItem[];
  shiftAvailability: string;
  attendanceStatus: "PRESENT" | "ABSENT" | "ON_LEAVE" | "LATE" | "NOT_REPORTED";
  historicalEfficiency: number;
  historicalQualityRate: number;
  availabilityStatus: "AVAILABLE" | "ASSIGNED" | "ABSENT" | "ON_LEAVE" | "NOT_QUALIFIED";
  isAssigned: boolean;
  assignedLineId?: number;
  assignedLineName?: string;
  assignedStationCode?: string;
}

export interface StationRequirementItem {
  stationIndex: number;
  stationCode: string;
  operationId: number;
  operationCode: string;
  operationName: string;
  section: string;
  operationSmv: number;
  requiredMachineType?: string;
  requiredSkillLevel: number;
  isParallelizable: boolean;
  splitAllowed: boolean;
  designedCycleTimeSecs: number;
}

export interface MachineRequirementItem {
  machineType: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
}

export interface LineRequirementItem {
  lineId: number;
  lineCode: string;
  lineName: string;
  lineType: string;
  orderId?: number;
  orderNo?: string;
  styleNo?: string;
  bulletinId?: number;
  bulletinCode?: string;
  bulletinRevision?: number;
  targetPiecesPerHour: number;
  customerTaktSecs: number;
  designedPitchSecs: number;
  designedManpower: number;
  plannedLineEfficiency: number;
  totalSmvMinutes: number;
  workstationCount: number;
  stations: StationRequirementItem[];
  machines: MachineRequirementItem[];
  currentBottleneckStation: string;
  status: string;
}

export interface ValidationIssueItem {
  severity: "ERROR" | "WARNING" | "INFO";
  issueType: string;
  lineId?: number;
  lineName?: string;
  stationCode?: string;
  operationName?: string;
  problemDescription: string;
  recommendedAction: string;
}

export interface PreflightValidationResponse {
  valid: boolean;
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  summaryMessage: string;
  issues: ValidationIssueItem[];
}

export interface FixedAssignmentItem {
  lineId: number;
  stationIndex: number;
  operatorId: number;
  justification?: string;
}

export interface OptimizationRequest {
  plantLocation?: string;
  planningDate: string;
  shiftId?: number;
  lineIds: number[];
  primaryScenario?: string;
  fixedAssignments?: FixedAssignmentItem[];
  allowCrossLineTransfers?: boolean;
  allowTraineesOnSimpleOps?: boolean;
  createdBy?: string;
  weights?: SolverWeights;
}


export interface OverallSummary {
  totalSelectedLines: number;
  totalAvailableOperators: number;
  totalAssignedOperators: number;
  totalUnassignedOperators: number;
  totalDesignedOutput: number;
  totalAchievableOutput: number;
  overallDesignedEfficiency: number;
  overallAchievableEfficiency: number;
  targetAchievementPercent: number;
  totalSkillGaps: number;
  totalMachineGaps: number;
  totalBottleneckStations: number;
  executiveSummaryStatement: string;
}

export interface LineResultItem {
  lineId: number;
  lineCode: string;
  lineName: string;
  styleNo: string;
  orderNo: string;
  targetHourlyOutput: number;
  designedCapacity: number;
  achievableCapacity: number;
  designedEfficiency: number;
  achievableEfficiency: number;
  assignedOperators: number;
  requiredOperators: number;
  operatorShortage: number;
  skillGaps: number;
  machineGaps: number;
  bottleneckStation: string;
  bottleneckOperation: string;
  targetAchievementPercent: number;
  lineStatus:
    | "TARGET_ACHIEVED"
    | "PARTIALLY_ACHIEVED"
    | "OPERATOR_SHORTAGE"
    | "SKILL_GAP"
    | "MACHINE_SHORTAGE"
    | "INFEASIBLE"
    | "REQUIRES_IE_REVIEW";
}

export interface AllocationAssignmentItem {
  assignmentId: number;
  lineId: number;
  lineCode: string;
  lineName: string;
  stationIndex: number;
  stationCode: string;
  operationId: number;
  operationName: string;
  operationCode: string;
  requiredSkillLevel: number;
  requiredMachineType?: string;
  operatorId?: number;
  operatorName?: string;
  operatorCode?: string;
  assignedSkillLevel?: number;
  performanceSource: "HISTORICAL" | "CALIBRATED" | "ESTIMATED" | "MISSING";
  standardSmv: number;
  effectiveCycleTimeSecs: number;
  operatorEfficiencyPercent: number;
  matchStatus: "EXCELLENT" | "MATCH" | "SKILL_GAP" | "MACHINE_GAP" | "TRAINEE" | "UNASSIGNED";
  isBottleneck: boolean;
  isFixed: boolean;
  notes?: string;
}

export interface BottleneckItem {
  id: number;
  lineId: number;
  lineName: string;
  stationIndex: number;
  stationCode: string;
  operationName: string;
  requiredCycleTimeSecs: number;
  effectiveCycleTimeSecs: number;
  requiredSkillLevel: number;
  assignedOperatorSkill?: number;
  requiredMachineType?: string;
  bottleneckReason: string;
  recommendedAction: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ScenarioItem {
  id: number;
  scenarioCode: string;
  scenarioTitle: string;
  scenarioDescription: string;
  totalAchievableOutput: number;
  overallEfficiency: number;
  assignedManpower: number;
  unassignedManpower: number;
  totalSkillGaps: number;
  totalMachineGaps: number;
  mainTradeoffs: string;
  isRecommended: boolean;
}

export interface OptimizationResponse {
  runId: number;
  runCode: string;
  planningDate: string;
  shiftId?: number;
  shiftName?: string;
  plantLocation: string;
  solverStatus: "OPTIMAL" | "FEASIBLE" | "TIME_LIMIT_BEST_FOUND" | "INFEASIBLE" | "INVALID_INPUT";
  solverExplanation: string;
  solverRuntimeMs: number;
  status: "DRAFT" | "VALIDATED" | "OPTIMIZED" | "IE_REVIEW" | "APPROVED" | "APPLIED";
  createdAt: string;
  createdBy: string;
  summary: OverallSummary;
  lineResults: LineResultItem[];
  matrix: AllocationAssignmentItem[];
  bottlenecks: BottleneckItem[];
  scenarios: ScenarioItem[];
}

export interface AuditLogItem {
  id: number;
  actionType: string;
  performedBy: string;
  lineName?: string;
  stationCode?: string;
  operatorName?: string;
  previousValue?: string;
  newValue?: string;
  justification?: string;
  timestamp: string;
}

export interface RunSummaryItem {
  runId: number;
  runCode: string;
  planningDate: string;
  shiftId?: number;
  shiftName?: string;
  plantLocation: string;
  solverStatus: string;
  status: "DRAFT" | "VALIDATED" | "OPTIMIZED" | "IE_REVIEW" | "APPROVED" | "APPLIED";
  totalSelectedLines: number;
  totalAssignedOperators: number;
  totalAchievableOutput: number;
  overallAchievableEfficiency: number;
  targetAchievementPercent: number;
  totalSkillGaps: number;
  totalBottleneckStations: number;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  appliedBy?: string;
  appliedAt?: string;
}

export interface SolverWeights {
  efficiencyWeight: number;
  skillMatchWeight: number;
  machineCompatWeight: number;
  lineBalanceWeight: number;
}
