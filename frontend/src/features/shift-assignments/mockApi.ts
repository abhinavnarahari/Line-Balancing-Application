export interface ShiftAssignment {
  id: string;
  operatorId: string;
  shiftId: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string | null; // null means active indefinitely
  status: "Active" | "Scheduled" | "Completed";
  createdAt: string;
}

// Some dummy data
let mockAssignments: ShiftAssignment[] = [
  {
    id: "a1",
    operatorId: "1", // Assuming '1' exists in operator mock
    shiftId: "1", // A shift
    effectiveFrom: "2026-08-01",
    effectiveTo: null,
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a2",
    operatorId: "2",
    shiftId: "2", // B shift
    effectiveFrom: "2026-08-01",
    effectiveTo: null,
    status: "Active",
    createdAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const shiftAssignmentApi = {
  getAssignments: async (): Promise<ShiftAssignment[]> => {
    await delay(400);
    return [...mockAssignments];
  },

  assignShift: async (data: Omit<ShiftAssignment, "id" | "status" | "createdAt">): Promise<ShiftAssignment> => {
    await delay(500);
    
    // Simple validation: check for overlapping active assignments
    const activeForOperator = mockAssignments.filter(
      (a) => a.operatorId === data.operatorId && a.effectiveTo === null
    );

    if (activeForOperator.length > 0 && data.effectiveTo === null) {
      throw new Error("Operator already has an active, indefinite assignment. End that assignment first.");
    }

    const newAssignment: ShiftAssignment = {
      ...data,
      id: Date.now().toString(),
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    mockAssignments.push(newAssignment);
    return newAssignment;
  },

  endAssignment: async (id: string, endDate: string): Promise<ShiftAssignment> => {
    await delay(400);
    const idx = mockAssignments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Assignment not found");

    const updated = { ...mockAssignments[idx], effectiveTo: endDate, status: "Completed" as const };
    mockAssignments[idx] = updated;
    return updated;
  },

  deleteAssignment: async (id: string): Promise<void> => {
    await delay(300);
    mockAssignments = mockAssignments.filter((a) => a.id !== id);
  }
};
