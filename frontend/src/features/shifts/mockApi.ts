import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "./types";

// Initial seed data based on documentation requirements
let mockShifts: Shift[] = [
  { id: "1", shiftCode: "A", shiftName: "A Shift", startTime: "07:00", endTime: "14:00", active: true },
  { id: "2", shiftCode: "B", shiftName: "B Shift", startTime: "14:00", endTime: "23:00", active: true },
  { id: "3", shiftCode: "C", shiftName: "C Shift", startTime: "23:00", endTime: "07:00", active: true },
  { id: "4", shiftCode: "GENERAL", shiftName: "General Shift", startTime: "09:00", endTime: "18:00", active: true },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const shiftApi = {
  getShifts: async (): Promise<Shift[]> => {
    await delay(500); // simulate network
    return [...mockShifts];
  },
  
  createShift: async (data: CreateShiftDTO): Promise<Shift> => {
    await delay(500);
    const newShift: Shift = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    };
    mockShifts.push(newShift);
    return newShift;
  },

  updateShift: async (id: string, data: UpdateShiftDTO): Promise<Shift> => {
    await delay(500);
    const index = mockShifts.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Shift not found");
    
    const updated = { ...mockShifts[index], ...data };
    mockShifts[index] = updated;
    return updated;
  },

  toggleActive: async (id: string): Promise<Shift> => {
    await delay(300);
    const index = mockShifts.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Shift not found");
    
    mockShifts[index].active = !mockShifts[index].active;
    return mockShifts[index];
  }
};
