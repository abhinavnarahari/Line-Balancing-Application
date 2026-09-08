import { api } from "../../lib/api";

export interface BulletinLine {
  id?: string | number;
  sequence: number;
  operationId: string | number;
  operationCode?: string;
  operationName?: string;
  smv: number;
  machineType: string;
  skillRatingRequired: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type BulletinStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface BulletinStyleSummary {
  id: string | number;
  styleNo: string;
  buyer?: string;
}

export interface OperationBulletin {
  id?: string | number;
  bulletinCode: string;
  name: string;
  description?: string;
  styles?: BulletinStyleSummary[];
  version: number;
  status: BulletinStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  lines: BulletinLine[];
  totalSmv?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBulletinDTO {
  bulletinCode: string;
  name: string;
  description?: string;
  version?: number;
  status?: BulletinStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  styleIds: (string | number)[];
  lines: {
    sequence: number;
    operationId: string | number;
    smv: number;
    machineType?: string;
    skillRatingRequired?: number;
    notes?: string;
  }[];
}

export const bulletinsApi = {
  getBulletins: async (): Promise<OperationBulletin[]> => {
    return await api.get("/operation-bulletins");
  },

  getBulletinById: async (id: string | number): Promise<OperationBulletin> => {
    return await api.get(`/operation-bulletins/${id}`);
  },

  createBulletin: async (data: CreateBulletinDTO): Promise<OperationBulletin> => {
    return await api.post("/operation-bulletins", data);
  },

  updateBulletin: async (id: string | number, data: Partial<CreateBulletinDTO>): Promise<OperationBulletin> => {
    return await api.put(`/operation-bulletins/${id}`, data);
  },

  deleteBulletin: async (id: string | number): Promise<void> => {
    return await api.delete(`/operation-bulletins/${id}`);
  },

  cloneBulletin: async (id: string | number, newCode?: string, newName?: string): Promise<OperationBulletin> => {
    const params = new URLSearchParams();
    if (newCode) params.append("newCode", newCode);
    if (newName) params.append("newName", newName);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return await api.post(`/operation-bulletins/${id}/clone${queryString}`, {});
  },

  updateStatus: async (id: string | number, status: BulletinStatus): Promise<OperationBulletin> => {
    return await api.patch(`/operation-bulletins/${id}/status?status=${status}`, {});
  }
};
