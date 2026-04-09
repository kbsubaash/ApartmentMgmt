import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/common/Spinner';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
