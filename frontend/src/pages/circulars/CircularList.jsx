import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as circularsApi from '@/api/circulars.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDate } from '@/utils/formatters';

export default function CircularList() {
  const { user } = useAuth();
  const canManage = ['Admin', 'Committee'].includes(user?.role);

  const [circulars, setCirculars] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const LIMIT = 12;

  const fetchCirculars = useCallback(() => {
    setLoading(true);
    circularsApi.getCirculars({ status: statusFilter || undefined, page, limit: LIMIT })
      .then(({ data }) => { setCirculars(data.circulars); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchCirculars(); }, [fetchCirculars]);

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this circular? It will be sent to all relevant members.')) return;
    try {
      await circularsApi.publishCircular(id);
      setSuccessMsg('Circular published and members notified.');
      fetchCirculars();
    } catch (err) {
      alert(err.response?.data?.message || 'Publish failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this circular?')) return;
    await circularsApi.deleteCircular(id).catch(() => {});
    fetchCirculars();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Circulars</h1>
        {canManage && (
          <Link to="/circulars/new" className="btn-primary">+ New Circular</Link>
        )}
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Filters */}
      {canManage && (
        <div className="flex gap-3">
          <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      )}

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : circulars.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No circulars found.</p>
          {canManage && <Link to="/circulars/new" className="mt-4 btn-primary inline-block">Create First Circular</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {circulars.map((c) => (
            <div key={c._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link to={`/circulars/${c._id}`} className="text-brand font-semibold hover:underline text-base truncate block">
                    {c.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                    <Badge label={c.status} />
                    <Badge label={c.audience} />
                    <span className="text-xs text-gray-400">
                      {c.status === 'Published' ? `Published ${formatDate(c.publishedAt)}` : `Created ${formatDate(c.createdAt)}`}
                      {c.createdBy && ` · by ${c.createdBy.name}`}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-2 flex-shrink-0">
                    {c.status === 'Draft' && (
                      <>
                        <Link to={`/circulars/${c._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        <button onClick={() => handlePublish(c._id)} className="btn-primary btn-sm">Publish</button>
                      </>
                    )}
                    {user?.role === 'Admin' && (
                      <button onClick={() => handleDelete(c._id)} className="btn btn-danger btn-sm">Delete</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
