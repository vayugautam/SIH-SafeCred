import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute() {
  const { user } = useAuthStore();
  const location = useLocation();

  // If there is no authenticated user, redirect to appropriate login
  if (!user) {
    if (location.pathname.startsWith('/portal')) {
      return <Navigate to="/portal/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes
  return <Outlet />;
}
