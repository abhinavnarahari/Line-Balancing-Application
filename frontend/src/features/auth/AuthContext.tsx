import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, AUTH_EXPIRED_EVENT } from "../../lib/api";
import type { AuthUser, LoginCredentials } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial session check (`/auth/me`) has completed. */
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Per-user work cached in localStorage that must not leak to the next person on a shared floor PC
 * (applied bulletin scenarios; plus the pre-authentication "sewnexa_auth_user" key from older builds).
 * Workstation preferences such as the collapsed sidebar are intentionally kept.
 */
const APP_STORAGE_PREFIXES = ["sewnexa_applied_bulletin_scenario_", "sewnexa_auth_user"];

function clearAppStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => APP_STORAGE_PREFIXES.some((p) => k.startsWith(p)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable (private mode) — nothing to clear
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore an existing server session (HttpOnly cookie) on page load.
  useEffect(() => {
    let cancelled = false;
    api
      .get<AuthUser, AuthUser>("/auth/me")
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from the API (session expired, account disabled) signs the user out locally.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    await api.get("/auth/csrf"); // obtain the XSRF-TOKEN cookie before the first POST
    const me = await api.post<AuthUser, AuthUser>("/auth/login", { email: email.trim(), password });
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAppStorage();
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.put("/auth/password", { currentPassword, newPassword });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, changePassword }}
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
