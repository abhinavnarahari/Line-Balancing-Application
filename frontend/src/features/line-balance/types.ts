export interface LinePlan {
  id: string;
  styleName: string;
  targetOutput: number; // Pieces per shift
  shiftDuration: number; // In minutes (e.g., 480 for 8 hours)
  assignments: StationAssignment[];
}

export interface StationAssignment {
  id: string;
  stationNumber: number;
  operationId: string;
  operatorId: string | null;
}

export interface LineBalanceMetrics {
  taktTime: number; // Available time per piece (shiftDuration / targetOutput)
  totalSMV: number;
  lineEfficiency: number;
  bottleneckTime: number;
  totalOperators: number;
}
