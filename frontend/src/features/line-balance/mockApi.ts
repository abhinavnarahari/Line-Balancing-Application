export interface LinePlanAssignment {
  bulletinLineId: string;
  operationId: string;
  operatorId: string | null;
}

export interface LinePlan {
  id: string;
  orderId: string;
  shiftId: string;
  allowance: number;
  assignments: LinePlanAssignment[];
  updatedAt: string;
}

let mockLinePlans: LinePlan[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const linePlanApi = {
  getPlanForOrder: async (orderId: string): Promise<LinePlan | null> => {
    await delay(200);
    return mockLinePlans.find(p => p.orderId === orderId) || null;
  },

  savePlan: async (plan: Omit<LinePlan, "id" | "updatedAt">): Promise<LinePlan> => {
    await delay(300);
    const existingIndex = mockLinePlans.findIndex(p => p.orderId === plan.orderId);
    
    if (existingIndex >= 0) {
      const updated = { 
        ...mockLinePlans[existingIndex], 
        ...plan, 
        updatedAt: new Date().toISOString() 
      };
      mockLinePlans[existingIndex] = updated;
      return updated;
    }

    const newPlan: LinePlan = {
      ...plan,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
    };
    mockLinePlans.push(newPlan);
    return newPlan;
  }
};
