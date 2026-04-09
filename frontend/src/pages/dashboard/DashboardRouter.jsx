import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import ResidentDashboard from './ResidentDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'Resident') return <ResidentDashboard />;
  return <AdminDashboard />;
}
