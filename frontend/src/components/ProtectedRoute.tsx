import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types";

interface ProtectedRouteProps extends PropsWithChildren {
  role: UserRole;
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-full border border-border/80 bg-surface px-5 py-3 text-sm text-muted-foreground">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === "candidate" ? "/candidate" : "/recruiter"} replace />;
  }

  return <>{children}</>;
}
