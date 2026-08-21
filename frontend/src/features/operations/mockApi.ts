export interface Operation {
  id: string;
  code: string;
  name: string;
  description: string;
  sequence: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Exact 18 operations from the Line balancing.xlsx requirement
let mockOperations: Operation[] = [
  { id: "1",  code: "OP-001", name: "Shoulder Join",      description: "Join the front and back shoulder seams together",         sequence: 1,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "2",  code: "OP-002", name: "Neck Rib Attach",    description: "Attach the neck rib/ribbing to the neckline",             sequence: 2,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "3",  code: "OP-003", name: "Neck Top Stitch",    description: "Top stitch around the neck rib for a clean finish",       sequence: 3,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "4",  code: "OP-004", name: "Sleeve Attach Left", description: "Attach the left sleeve to the armhole",                  sequence: 4,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "5",  code: "OP-005", name: "Sleeve Attach Right","description": "Attach the right sleeve to the armhole",               sequence: 5,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "6",  code: "OP-006", name: "Side Seam Close",    description: "Close the side seam from underarm to hem",               sequence: 6,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "7",  code: "OP-007", name: "Bottom Hem",         description: "Hem the bottom edge of the garment",                     sequence: 7,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "8",  code: "OP-008", name: "Sleeve Hem",         description: "Hem the sleeve cuff edge",                               sequence: 8,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "9",  code: "OP-009", name: "Label Attach",       description: "Attach the brand/care label inside the garment",         sequence: 9,  active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "10", code: "OP-010", name: "Trim Check",         description: "Check and trim all visible loose threads",               sequence: 10, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "11", code: "OP-011", name: "Thread Trimming",    description: "Trim remaining thread tails across the garment",         sequence: 11, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "12", code: "OP-012", name: "Initial Inspection", description: "First quality inspection of the sewn garment",           sequence: 12, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "13", code: "OP-013", name: "Spot Cleaning",      description: "Remove any stains or marks from the garment surface",    sequence: 13, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "14", code: "OP-014", name: "Final Measurement",  description: "Measure the garment against the size specification",     sequence: 14, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "15", code: "OP-015", name: "Final Inspection",   description: "Final quality check before packing",                     sequence: 15, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "16", code: "OP-016", name: "Folding",            description: "Fold the garment to the specified presentation format",  sequence: 16, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "17", code: "OP-017", name: "Poly Bag Packing",   description: "Insert the folded garment into a poly bag",             sequence: 17, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "18", code: "OP-018", name: "Carton Packing",     description: "Pack poly-bagged garments into export cartons",         sequence: 18, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

export const operationsApi = {
  getOperations: async (search?: string): Promise<Operation[]> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        let results = [...mockOperations];
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(
            (o) => o.name.toLowerCase().includes(s) || o.code.toLowerCase().includes(s)
          );
        }
        resolve(results);
      }, 400)
    );
  },

  createOperation: async (op: Omit<Operation, "id" | "createdAt" | "updatedAt">): Promise<Operation> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOp: Operation = {
          ...op,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockOperations = [...mockOperations, newOp];
        resolve(newOp);
      }, 500);
    });
  },

  updateOperation: async (id: string, op: Omit<Operation, "id" | "createdAt" | "updatedAt">): Promise<Operation> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockOperations = mockOperations.map((o) =>
          o.id === id ? { ...o, ...op, updatedAt: new Date().toISOString() } : o
        );
        resolve({ ...op, id, createdAt: "", updatedAt: new Date().toISOString() });
      }, 500);
    });
  },

  toggleActive: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockOperations = mockOperations.map((o) =>
          o.id === id ? { ...o, active: !o.active, updatedAt: new Date().toISOString() } : o
        );
        resolve();
      }, 300);
    });
  },
};
