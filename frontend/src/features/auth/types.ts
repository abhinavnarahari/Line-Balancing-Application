/** Roles issued by the backend (`auth.entity.UserRole`). */
export type UserRole =
  | "SYSTEM_ADMIN"
  | "INDUSTRIAL_ENGINEER"
  | "PRODUCTION_MANAGER"
  | "LINE_SUPERVISOR";

/** Signed-in user as returned by `GET /api/auth/me`. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarUrl?: string;
  initials: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const ROLE_TITLES: Record<UserRole, string> = {
  SYSTEM_ADMIN: "System Administrator",
  INDUSTRIAL_ENGINEER: "Industrial Engineer (IE)",
  PRODUCTION_MANAGER: "Production Manager",
  LINE_SUPERVISOR: "Line Supervisor",
};

/** Landing page after sign-in for each role. */
export function defaultRouteFor(role: UserRole): string {
  switch (role) {
    case "LINE_SUPERVISOR":
      return "/monitoring";
    case "PRODUCTION_MANAGER":
      return "/overall-dashboard";
    default:
      return "/line-balance";
  }
}

/** Roles allowed to change plans and master data (mirrors backend SecurityConfig). */
export const PLANNER_ROLES: UserRole[] = ["SYSTEM_ADMIN", "INDUSTRIAL_ENGINEER", "PRODUCTION_MANAGER"];
