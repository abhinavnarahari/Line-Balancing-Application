export type UserRole = 
  | "INDUSTRIAL_ENGINEER" 
  | "LINE_SUPERVISOR" 
  | "PRODUCTION_MANAGER"
  | "PLANT_MANAGER" 
  | "QUALITY_MANAGER" 
  | "SYSTEM_ADMIN";

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
  password?: string;
  rememberMe?: boolean;
}

export interface DemoProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  badgeColor: string;
  initials: string;
  description: string;
  defaultRoute: string;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "ie",
    name: "Priya Sharma",
    email: "ie@sewnexa.com",
    role: "INDUSTRIAL_ENGINEER",
    roleTitle: "Industrial Engineer (IE)",
    department: "IE & Operations Planning",
    badgeColor: "bg-[#9C5B3C] text-white",
    initials: "IE",
    description: "Line Balancing, SMVs, Bulletins & Workstation Architecture",
    defaultRoute: "/line-balance",
  },
  {
    id: "line-supervisor",
    name: "Rahim Khan",
    email: "supervisor@sewnexa.com",
    role: "LINE_SUPERVISOR",
    roleTitle: "Line Supervisor",
    department: "Sewing Floor Operations",
    badgeColor: "bg-blue-600 text-white",
    initials: "LS",
    description: "Operator Placement, WIP Bottleneck Warnings & Hourly Boards",
    defaultRoute: "/monitoring",
  },
  {
    id: "production-manager",
    name: "Vikramaditya Rao",
    email: "manager@sewnexa.com",
    role: "PRODUCTION_MANAGER",
    roleTitle: "Production Manager",
    department: "Production & Plant Operations",
    badgeColor: "bg-emerald-600 text-white",
    initials: "PM",
    description: "Factory Overview, Daily Output, OEE & Target Governance",
    defaultRoute: "/overall-dashboard",
  },
];

