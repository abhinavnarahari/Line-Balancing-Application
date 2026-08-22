import { api } from "../../lib/api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";

export interface BiometricSyncRequest {
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceRecord {
  id?: string | number;
  attendanceDate: string; // YYYY-MM-DD
  operatorId: string | number;
  operatorName?: string;
  employeeId?: string;
  shiftId: string | number;
  shiftCode?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  updatedAt?: string;
}

export const attendanceApi = {
  // Get attendance for a specific date and shift
  getAttendanceForDate: async (date: string, shiftId: string | number): Promise<AttendanceRecord[]> => {
    return await api.get("/attendance", { params: { date, shiftId } });
  },

  // Get historical attendance records
  getHistory: async (): Promise<AttendanceRecord[]> => {
    return await api.get("/attendance/history");
  },

  // Mark/update attendance for an operator
  markAttendance: async (data: Omit<AttendanceRecord, "id" | "updatedAt">): Promise<AttendanceRecord> => {
    return await api.post("/attendance", data);
  },
  
  // Sync biometric punches
  syncBiometric: async (data: BiometricSyncRequest[]): Promise<AttendanceRecord[]> => {
    return await api.post("/attendance/biometric-sync", data);
  }
};
