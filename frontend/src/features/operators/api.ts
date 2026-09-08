import { api } from "../../lib/api";

export type OperatorRole = "OPERATOR" | "HELPER" | "FLOATER" | "LINE_SUPERVISOR" | "QUALITY_CHECKER";

export interface Operator {
  id: string;
  employeeId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  department: string;
  joiningDate: string;
  role?: OperatorRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const operatorsApi = {
  getOperators: async (search?: string): Promise<Operator[]> => {
    const params = search ? { search } : {};
    return await api.get("/operators", { params });
  },

  createOperator: async (op: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> => {
    return await api.post("/operators", op);
  },

  updateOperator: async (id: string, op: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> => {
    return await api.put(`/operators/${id}`, op);
  },

  toggleActive: async (id: string): Promise<void> => {
    return await api.patch(`/operators/${id}/toggle-status`);
  },

  getAttachments: async (id: string): Promise<any[]> => {
    return await api.get(`/operators/${id}/attachments`);
  },

  uploadAttachment: async (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    // When using FormData, let the browser set the Content-Type to multipart/form-data with boundary
    // api (axios) usually handles this automatically if you pass FormData.
    return await api.post(`/operators/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  deleteAttachment: async (id: string): Promise<void> => {
    return await api.delete(`/operators/attachments/${id}`);
  }
};
