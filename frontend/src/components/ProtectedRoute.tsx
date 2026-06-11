import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, roles } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Admin overrides all, otherwise check intersection
  const hasAccess = roles.includes('ADMIN') || allowedRoles.some(role => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
