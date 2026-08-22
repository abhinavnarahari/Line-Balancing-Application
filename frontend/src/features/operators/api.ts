import { api } from "../../lib/api";

export interface Operator {
  id: string; // The backend returns Long, which translates to number, but we can treat as string for URL paths. Wait, backend returns number? We can cast or use string in our TS.
  employeeId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  department: string;
  joiningDate: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const MOCK_OPERATORS: Operator[] = [
  { id: "1", employeeId: "SKIL-EMP-055", name: "Abhinav Narahari", age: 28, gender: "Male", department: "Sewing Line 1", joiningDate: "2023-01-15", active: true },
  { id: "2", employeeId: "SKIL-EMP-056", name: "Rahul Sharma", age: 32, gender: "Male", department: "Sewing Line 2", joiningDate: "2022-05-20", active: true },
  { id: "3", employeeId: "SKIL-EMP-057", name: "Priya Patel", age: 25, gender: "Female", department: "Quality Control", joiningDate: "2024-02-10", active: false }
];

export const operatorsApi = {
  getOperators: async (search?: string): Promise<Operator[]> => {
    try {
      const params = search ? { search } : {};
      return await api.get("/operators", { params });
    } catch (error) {
      console.warn("Backend not connected, falling back to mock operators data.");
      return MOCK_OPERATORS.filter(op => !search || op.name.toLowerCase().includes(search.toLowerCase()) || op.employeeId.toLowerCase().includes(search.toLowerCase()));
    }
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
