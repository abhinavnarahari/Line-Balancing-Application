import React, { createContext, useContext, useState, useEffect } from "react";
import { DEMO_PROFILES } from "./types";
import type { AuthUser, DemoProfile, LoginCredentials, UserRole } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithProfile: (profile: DemoProfile) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "sewnexa_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load saved auth session", e);
    }
    // Return null by default so unauthenticated users land on Login page
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    // Simulate enterprise SSO/Auth latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Match against demo profiles or generate dynamic user
    const emailLower = credentials.email.toLowerCase().trim();
    const matchedProfile = DEMO_PROFILES.find(
      (p) =>
        p.email.toLowerCase() === emailLower ||
        (p.id === "ie" && (emailLower.includes("ie") || emailLower.includes("priya"))) ||
        (p.id === "line-supervisor" && (emailLower.includes("supervisor") || emailLower.includes("rahim"))) ||
        (p.id === "production-manager" && (emailLower.includes("manager") || emailLower.includes("prod") || emailLower.includes("vikram")))
    );

    if (matchedProfile) {
      setUser({
        id: matchedProfile.id,
        name: matchedProfile.name,
        email: matchedProfile.email,
        role: matchedProfile.role,
        roleTitle: matchedProfile.roleTitle,
        department: matchedProfile.department,
        initials: matchedProfile.initials,
        permissions: ["READ", "WRITE", "EXECUTE_LINE_BALANCE", "PUBLISH_BULLETINS", "ASSIGN_OPERATORS"],
      });
    } else {
      // Custom user
      const namePart = credentials.email.split("@")[0].replace(".", " ");
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const initials = formattedName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      setUser({
        id: "custom-" + Date.now(),
        name: formattedName || "Industrial Engineer",
        email: credentials.email,
        role: "INDUSTRIAL_ENGINEER",
        roleTitle: "Industrial Engineer (IE)",
        department: "Operations & Floor Governance",
        initials: initials || "IE",
        permissions: ["READ", "WRITE", "EXECUTE_LINE_BALANCE"],
      });
    }
    setIsLoading(false);
  };

  const loginWithProfile = async (profile: DemoProfile): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      roleTitle: profile.roleTitle,
      department: profile.department,
      initials: profile.initials,
      permissions: ["READ", "WRITE", "EXECUTE_LINE_BALANCE", "PUBLISH_BULLETINS", "ASSIGN_OPERATORS"],
    });
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    const profile = DEMO_PROFILES.find((p) => p.role === newRole) || DEMO_PROFILES[0];
    loginWithProfile(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithProfile,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
