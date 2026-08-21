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
};
