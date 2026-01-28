import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth'

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}

// Protected Route Wrapper
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Guest Route Wrapper (redirects to home if already logged in)
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}