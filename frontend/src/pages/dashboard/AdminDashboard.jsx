import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMembers } from '@/api/members.api';
import { getFlats } from '@/api/flats.api';
import { getComplaints } from '@/api/complaints.api';
import { getCirculars } from '@/api/circulars.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import CommunityContactsBanner from '@/components/dashboard/CommunityContactsBanner';
import { formatDate } from '@/utils/formatters';

function StatCard({ label, value, icon, to, color = 'bg-brand' }) {
  const card = (
    <div className={`card flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`h-12 w-12 rounded-xl ${color} text-white text-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ members: 0, flats: 0, openComplaints: 0, drafts: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentCirculars, setRecentCirculars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers({ limit: 1 }),
      getFlats(),
      getComplaints({ status: 'Open', limit: 1 }),
      getCirculars({ status: 'Draft', limit: 1 }),
      getComplaints({ limit: 5 }),
      getCirculars({ status: 'Published', limit: 5 }),
    ])
      .then(([mem, flats, open, drafts, complaints, circulars]) => {
        setStats({
          members: mem.data.total,
          flats: flats.data.flats.length,
          openComplaints: open.data.total,
          drafts: drafts.data.total,
        });
        setRecentComplaints(complaints.data.complaints);
        setRecentCirculars(circulars.data.circulars);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Members" value={stats.members} icon="👥" to="/members" color="bg-brand" />
        <StatCard label="Flats" value={stats.flats} icon="🏢" to="/flats" color="bg-indigo-600" />
        <StatCard label="Open Complaints" value={stats.openComplaints} icon="🔧" to="/complaints?status=Open" color="bg-orange-500" />
        <StatCard label="Draft Circulars" value={stats.drafts} icon="📋" to="/circulars?status=Draft" color="bg-yellow-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
            <Link to="/complaints" className="text-sm text-brand hover:underline">View all</Link>
          </div>
          {recentComplaints.length === 0 ? (
            <p className="text-sm text-gray-400">No complaints yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentComplaints.map((c) => (
                <li key={c._id}>
                  <Link to={`/complaints/${c._id}`} className="flex items-start justify-between gap-2 hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.category} · {formatDate(c.createdAt)}</p>
                    </div>
                    <Badge label={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent circulars */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Circulars</h2>
            <Link to="/circulars" className="text-sm text-brand hover:underline">View all</Link>
          </div>
          {recentCirculars.length === 0 ? (
            <p className="text-sm text-gray-400">No published circulars yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentCirculars.map((c) => (
                <li key={c._id}>
                  <Link to={`/circulars/${c._id}`} className="flex items-start justify-between gap-2 hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{formatDate(c.publishedAt || c.createdAt)}</p>
                    </div>
                    <Badge label={c.audience} />
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
