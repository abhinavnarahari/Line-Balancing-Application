import { api } from "../../lib/api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";

export interface AttendanceRecord {
  id?: string | number;
  attendanceDate: string; // YYYY-MM-DD
  operatorId: string | number;
  shiftId: string | number;
  status: AttendanceStatus;
  remarks?: string;
  updatedAt?: string;
}

export const attendanceApi = {
  // Get attendance for a specific date and shift
  getAttendanceForDate: async (date: string, shiftId: string | number): Promise<AttendanceRecord[]> => {
    return await api.get("/attendance", { params: { date, shiftId } });
  },

  // Mark/update attendance for an operator
  markAttendance: async (data: Omit<AttendanceRecord, "id" | "updatedAt">): Promise<AttendanceRecord> => {
    return await api.post("/attendance", data);
  }
};
