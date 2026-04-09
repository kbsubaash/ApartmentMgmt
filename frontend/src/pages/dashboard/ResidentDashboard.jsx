import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getCirculars } from '@/api/circulars.api';
import { getComplaints } from '@/api/complaints.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import CommunityContactsBanner from '@/components/dashboard/CommunityContactsBanner';
import { formatDate, flatDisplayId } from '@/utils/formatters';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [circulars, setCirculars] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCirculars({ status: 'Published', limit: 5 }),
      getComplaints({ limit: 5 }),
    ])
      .then(([c, comp]) => {
        setCirculars(c.data.circulars);
        setComplaints(comp.data.complaints);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card bg-gradient-to-r from-brand to-brand-light text-white">
        <h1 className="text-xl font-bold">Welcome, {user?.name}! 👋</h1>
        <p className="text-sm text-blue-100 mt-1">DABC Euphorbia Phase 3 Apartment Owners Welfare Association</p>
        {user?.flatId && (
          <p className="text-sm mt-2 font-medium">
            Flat: <span className="bg-white/20 px-2 py-0.5 rounded">{flatDisplayId(user.flatId)}</span>
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/complaints/new" className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-2">🔧</div>
          <p className="font-medium text-gray-900 text-sm">Raise Complaint</p>
        </Link>
        <Link to="/circulars" className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-3xl mb-2">📋</div>
          <p className="font-medium text-gray-900 text-sm">View Circulars</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Complaints</h2>
            <Link to="/complaints" className="text-sm text-brand hover:underline">View all</Link>
          </div>
          {complaints.length === 0 ? (
            <p className="text-sm text-gray-400">No complaints raised.</p>
          ) : (
            <ul className="space-y-3">
              {complaints.map((c) => (
                <li key={c._id}>
                  <Link to={`/complaints/${c._id}`} className="flex items-start justify-between gap-2 hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                    </div>
                    <Badge label={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest circulars */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Latest Circulars</h2>
            <Link to="/circulars" className="text-sm text-brand hover:underline">View all</Link>
          </div>
          {circulars.length === 0 ? (
            <p className="text-sm text-gray-400">No circulars published yet.</p>
          ) : (
            <ul className="space-y-3">
              {circulars.map((c) => (
                <li key={c._id}>
                  <Link to={`/circulars/${c._id}`} className="flex items-start justify-between gap-2 hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(c.publishedAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Community Contacts */}
      <CommunityContactsBanner />
    </div>
  );
}
