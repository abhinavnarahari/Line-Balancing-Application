import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F1E8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#9C5B3C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#8C7E6E] tracking-wider uppercase">
            Verifying SewNexa Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
};
