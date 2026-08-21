export interface SkillAssessment {
  id: string;
  operatorId: string;
  operationId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  cycleTime: number; // in seconds
  revision: number;
  effectiveDate: string;
  notes?: string;
}

// Initial mock data
let mockSkills: SkillAssessment[] = [
  { id: "s1", operatorId: "1", operationId: "1", rating: 3, cycleTime: 40, revision: 1, effectiveDate: "2026-01-01" },
  { id: "s2", operatorId: "1", operationId: "1", rating: 4, cycleTime: 32, revision: 2, effectiveDate: "2026-06-01" }, // Current
  { id: "s3", operatorId: "1", operationId: "4", rating: 2, cycleTime: 55, revision: 1, effectiveDate: "2026-01-01" },
  { id: "s4", operatorId: "2", operationId: "1", rating: 5, cycleTime: 25, revision: 1, effectiveDate: "2026-02-15" }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const skillApi = {
  // Get all historical assessments
  getAllAssessments: async (): Promise<SkillAssessment[]> => {
    await delay(400);
    return [...mockSkills];
  },

  // Get only the latest revision for each operator+operation pair
  getCurrentMatrix: async (): Promise<SkillAssessment[]> => {
    await delay(400);
    const map = new Map<string, SkillAssessment>();
    
    mockSkills.forEach(skill => {
      const key = `${skill.operatorId}-${skill.operationId}`;
      const existing = map.get(key);
      if (!existing || skill.revision > existing.revision) {
        map.set(key, skill);
      }
    });

    return Array.from(map.values());
  },

  // Add a new assessment (automatically bumps revision)
  addAssessment: async (data: Omit<SkillAssessment, "id" | "revision">): Promise<SkillAssessment> => {
    await delay(500);
    
    const previousForCombo = mockSkills.filter(
      s => s.operatorId === data.operatorId && s.operationId === data.operationId
    );
    
    const nextRevision = previousForCombo.length > 0 
      ? Math.max(...previousForCombo.map(s => s.revision)) + 1 
      : 1;

    const newSkill: SkillAssessment = {
      ...data,
      id: Date.now().toString(),
      revision: nextRevision
    };

    mockSkills.push(newSkill);
    return newSkill;
  }
};
