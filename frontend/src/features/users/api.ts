import { api } from "../../lib/api";
import type { UserRole } from "../auth/types";

export interface AppUserAccount {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  roleTitle: string;
  department: string | null;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  password: string;
}

export interface UpdateUserInput {
  fullName: string;
  role: UserRole;
  department?: string;
  active: boolean;
}

export const usersApi = {
  list: (): Promise<AppUserAccount[]> => api.get("/users"),
  create: (data: CreateUserInput): Promise<AppUserAccount> => api.post("/users", data),
  update: (id: number, data: UpdateUserInput): Promise<AppUserAccount> => api.put(`/users/${id}`, data),
  resetPassword: (id: number, newPassword: string): Promise<void> =>
    api.post(`/users/${id}/reset-password`, { newPassword }),
};
