import { useEffect, useState, useCallback } from 'react';
import api from '@/api/axios';
import Table from '@/components/common/Table';
import { formatDateTime } from '@/utils/formatters';

const ENTITIES = ['User', 'Flat', 'Circular', 'Complaint', 'Auth'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    api.get('/audit-logs', { params: { entity: entity || undefined, page, limit: LIMIT } })
      .then(({ data }) => { setLogs(data.logs); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entity, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    { key: 'action', header: 'Action', render: (r) => <code className="text-xs bg-gray-100 px-1 rounded">{r.action}</code> },
    { key: 'entity', header: 'Entity' },
    { key: 'performedBy', header: 'By', render: (r) => r.performedBy?.name || '—' },
    { key: 'createdAt', header: 'Time', render: (r) => formatDateTime(r.createdAt) },
    { key: 'ipAddress', header: 'IP', render: (r) => r.ipAddress || '—' },
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Audit Logs <span className="text-sm font-normal text-gray-400">({total})</span></h1>
        <select className="input max-w-[160px]" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
          <option value="">All entities</option>
          {ENTITIES.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>

      <Table columns={columns} rows={logs} loading={loading} emptyMessage="No audit logs found." />

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
