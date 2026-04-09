import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as pollsApi from '@/api/polls.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDate } from '@/utils/formatters';

const STATUS_COLORS = { Draft: 'gray', Active: 'green', Closed: 'red' };

export default function PollList() {
  const { user } = useAuth();
  const isAdminOrCommittee = ['Admin', 'Committee'].includes(user?.role);

  const [polls, setPolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    pollsApi.getPolls({ status: status || undefined, page, limit: LIMIT })
      .then(({ data }) => { setPolls(data.polls); setTotal(data.total); })
      .catch(() => setError('Failed to load polls'))
      .finally(() => setLoading(false));
  }, [status, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this poll?')) return;
    try {
      await pollsApi.deletePoll(id);
      setPolls((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError('Delete failed');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="page-title">Polls & Voting <span className="text-sm font-normal text-gray-400">({total})</span></h1>
        <div className="flex gap-2">
          {isAdminOrCommittee && (
            <select className="input max-w-[150px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
          )}
          {isAdminOrCommittee && (
            <Link to="/polls/new" className="btn-primary whitespace-nowrap">+ New Poll</Link>
          )}
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading ? <Spinner size="lg" className="mt-10" /> : (
        polls.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No polls found.
            {isAdminOrCommittee && (
              <div className="mt-3">
                <Link to="/polls/new" className="btn-primary">Create First Poll</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => (
              <div key={poll._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                        ${poll.status === 'Active' ? 'bg-green-100 text-green-800' :
                          poll.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {poll.status === 'Active' ? '🟢' : poll.status === 'Closed' ? '🔴' : '⚪'} {poll.status}
                      </span>
                      <span className="text-xs text-gray-400">{poll.audience}</span>
                      {poll.hasVoted && <span className="text-xs text-green-600 font-medium">✓ Voted</span>}
                    </div>
                    <Link to={`/polls/${poll._id}`} className="text-base font-semibold text-gray-900 hover:text-brand">
                      {poll.title}
                    </Link>
                    {poll.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{poll.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>By {poll.createdBy?.name}</span>
                      <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                      <span>{poll.options?.length} options</span>
                      {poll.endDate && <span>Closes {formatDate(poll.endDate)}</span>}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isAdminOrCommittee && poll.status === 'Draft' && (
                      <>
                        <Link to={`/polls/${poll._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        <button onClick={() => handleDelete(poll._id)} className="btn btn-danger btn-sm">Delete</button>
                      </>
                    )}
                    <Link to={`/polls/${poll._id}`} className="btn btn-secondary btn-sm">
                      {poll.status === 'Active' && !poll.hasVoted ? 'Vote' : 'View'}
                    </Link>
                  </div>
                </div>

                {/* Mini option progress bars */}
                {(poll.status !== 'Draft' || isAdminOrCommittee) && poll.options?.length > 0 && poll.totalVotes > 0 && (
                  <div className="mt-3 space-y-1.5 border-t pt-3">
                    {poll.options.slice(0, 3).map((opt) => (
                      <div key={opt.id || opt._id} className="flex items-center gap-2 text-xs">
                        <span className="w-32 truncate text-gray-600">{opt.text}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${opt.percentage}%` }} />
                        </div>
                        <span className="text-gray-500 w-10 text-right">{opt.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
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
