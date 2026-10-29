import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthProvider";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) return <p className="p-8 text-center text-sm text-muted-foreground">Checking session...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
