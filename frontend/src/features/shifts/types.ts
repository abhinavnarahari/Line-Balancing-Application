export interface Shift {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDurationMinutes?: number;
  active: boolean;
}

export type CreateShiftDTO = Omit<Shift, "id">;
export type UpdateShiftDTO = Partial<CreateShiftDTO>;
