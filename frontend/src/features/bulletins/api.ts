import { api } from "../../lib/api";

export interface BulletinLine {
  id?: string | number;
  sequence: number;
  operationId: string | number;
  smv: number;
  machineType: string;
  skillRatingRequired: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type BulletinStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface OperationBulletin {
  id?: string | number;
  bulletinCode: string;
  name: string;
  styles?: { id: string | number, styleNo: string, buyer: string }[];
  version: number;
  status: BulletinStatus;
  lines: BulletinLine[];
  totalSmv?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateBulletinDTO = Omit<OperationBulletin, "id" | "totalSmv" | "createdAt" | "updatedAt" | "styles"> & {
  styleIds: (string | number)[];
};

export const bulletinsApi = {
  getBulletins: async (): Promise<OperationBulletin[]> => {
    return await api.get("/operation-bulletins");
  },

  createBulletin: async (data: CreateBulletinDTO): Promise<OperationBulletin> => {
    return await api.post("/operation-bulletins", data);
  },

  updateBulletin: async (id: string | number, data: Partial<CreateBulletinDTO>): Promise<OperationBulletin> => {
    return await api.put(`/operation-bulletins/${id}`, data);
  }
};
