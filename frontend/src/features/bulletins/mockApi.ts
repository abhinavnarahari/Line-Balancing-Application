export interface BulletinLine {
  id: string;
  sequence: number;
  operationId: string;
  smv: number;
  machineType: string;
  skillRatingRequired: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type BulletinStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface OperationBulletin {
  id: string;
  bulletinCode: string;
  name: string;
  styleIds: string[]; // One bulletin can be attached to multiple styles
  version: number;
  status: BulletinStatus;
  lines: BulletinLine[];
  totalSMV: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateBulletinDTO = Omit<OperationBulletin, "id" | "totalSMV" | "createdAt" | "updatedAt">;

let mockBulletins: OperationBulletin[] = [
  {
    id: "b1",
    bulletinCode: "OB-TS-001",
    name: "Basic Crew Neck T-Shirt Flow",
    styleIds: ["1"], // TS-1001
    version: 1,
    status: "PUBLISHED",
    lines: [
      { id: "l1", sequence: 1, operationId: "1", smv: 0.52, machineType: "Single Needle", skillRatingRequired: 3 },
      { id: "l2", sequence: 2, operationId: "2", smv: 0.68, machineType: "Overlock", skillRatingRequired: 3 },
      { id: "l3", sequence: 3, operationId: "3", smv: 0.45, machineType: "Flatlock", skillRatingRequired: 4 },
      { id: "l4", sequence: 4, operationId: "6", smv: 0.75, machineType: "Overlock", skillRatingRequired: 3 },
    ],
    totalSMV: 2.40,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const bulletinsApi = {
  getBulletins: async (): Promise<OperationBulletin[]> => {
    await delay(400);
    return [...mockBulletins];
  },

  createBulletin: async (data: CreateBulletinDTO): Promise<OperationBulletin> => {
    await delay(500);
    
    if (mockBulletins.some(b => b.bulletinCode.toLowerCase() === data.bulletinCode.toLowerCase())) {
      throw new Error("Bulletin Code must be unique");
    }

    const totalSMV = data.lines.reduce((sum, line) => sum + (line.smv || 0), 0);

    const newBulletin: OperationBulletin = {
      ...data,
      id: Date.now().toString(),
      totalSMV,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockBulletins.push(newBulletin);
    return newBulletin;
  },

  updateBulletin: async (id: string, data: Partial<CreateBulletinDTO>): Promise<OperationBulletin> => {
    await delay(400);
    const idx = mockBulletins.findIndex(b => b.id === id);
    if (idx === -1) throw new Error("Bulletin not found");

    const updated = { ...mockBulletins[idx], ...data, updatedAt: new Date().toISOString() };
    
    if (data.lines) {
      updated.totalSMV = data.lines.reduce((sum, line) => sum + (line.smv || 0), 0);
    }
    
    mockBulletins[idx] = updated;
    return updated;
  }
};
