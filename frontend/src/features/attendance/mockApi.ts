export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  operatorId: string;
  shiftId: string;
  status: AttendanceStatus;
  remarks?: string;
  updatedAt: string;
}

let mockAttendance: AttendanceRecord[] = [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const attendanceApi = {
  // Get attendance for a specific date and shift
  getAttendanceForDate: async (date: string, shiftId: string): Promise<AttendanceRecord[]> => {
    await delay(300);
    return mockAttendance.filter(a => a.date === date && a.shiftId === shiftId);
  },

  // Mark/update attendance for an operator
  markAttendance: async (data: Omit<AttendanceRecord, "id" | "updatedAt">): Promise<AttendanceRecord> => {
    await delay(200);
    
    const existingIndex = mockAttendance.findIndex(
      a => a.date === data.date && a.shiftId === data.shiftId && a.operatorId === data.operatorId
    );

    const record: AttendanceRecord = {
      ...data,
      id: existingIndex >= 0 ? mockAttendance[existingIndex].id : Date.now().toString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      mockAttendance[existingIndex] = record;
    } else {
      mockAttendance.push(record);
    }

    return record;
  }
};
