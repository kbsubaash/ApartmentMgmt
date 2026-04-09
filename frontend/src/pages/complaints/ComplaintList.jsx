import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as complaintsApi from '@/api/complaints.api';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { formatDate } from '@/utils/formatters';

const STATUSES = ['Open', 'InProgress', 'Resolved', 'Closed'];
const CATEGORIES = ['Plumbing', 'Electrical', 'Structural', 'Housekeeping', 'Security', 'Common Area', 'Other'];
const LIMIT = 15;

export default function ComplaintList() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    complaintsApi.getComplaints({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      page,
      limit: LIMIT,
    })
      .then(({ data }) => { setComplaints(data.complaints); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter, page]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const columns = [
    {
      key: 'title', header: 'Title', render: (r) => (
        <Link to={`/complaints/${r._id}`} className="text-brand hover:underline font-medium truncate block max-w-[200px]">
          {r.title}
        </Link>
      )
    },
    { key: 'category', header: 'Category' },
    { key: 'priority', header: 'Priority', render: (r) => <Badge label={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <Badge label={r.status} /> },
    {
      key: 'flat', header: 'Flat',
      render: (r) => r.flatId ? `${r.flatId.block}-${r.flatId.unitNumber}` : '—'
    },
    ...(!(['Resident'].includes(user?.role)) ? [{ key: 'submittedBy', header: 'Raised by', render: (r) => r.submittedBy?.name || '—' }] : []),
    { key: 'createdAt', header: 'Date', render: (r) => formatDate(r.createdAt) },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">
          Complaints <span className="text-sm font-normal text-gray-400">({total})</span>
        </h1>
        <Link to="/complaints/new" className="btn-primary">+ Raise Complaint</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input max-w-[170px]" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Table columns={columns} rows={complaints} loading={loading} emptyMessage="No complaints found." />

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
