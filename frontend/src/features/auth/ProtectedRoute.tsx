import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { defaultRouteFor, type UserRole } from "./types";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  /** Restrict to these roles (UX only — the backend enforces the same rules). */
  roles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F1E8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#9C5B3C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#8C7E6E] tracking-wider uppercase">
            Verifying Made2Balance Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user.role)} replace />;
  }

  return children ? <>{children}</> : null;
};
