import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as complaintsApi from '@/api/complaints.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDateTime, flatDisplayId } from '@/utils/formatters';

const STATUSES = ['Open', 'InProgress', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdminOrCommittee = ['Admin', 'Committee'].includes(user?.role);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin status/priority update form
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');

  useEffect(() => {
    complaintsApi
      .getComplaint(id)
      .then(({ data }) => {
        setComplaint(data.complaint);
        setEditStatus(data.complaint.status);
        setEditPriority(data.complaint.priority);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    try {
      const { data } = await complaintsApi.updateComplaint(id, { status: editStatus, priority: editPriority });
      setComplaint(data.complaint);
      setSuccessMsg('Complaint updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const { data } = await complaintsApi.addComment(id, comment.trim());
      setComplaint((prev) => ({ ...prev, comments: data.comments }));
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!complaint) return <p className="text-center text-gray-500 mt-20">Complaint not found.</p>;

  const flat = complaint.flatId;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/complaints" className="text-sm text-brand hover:underline">← Complaints</Link>

      {/* Header card */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge label={complaint.status} />
              <Badge label={complaint.priority} />
              <span className="text-xs text-gray-400 self-center">{complaint.category}</span>
            </div>
          </div>
        </div>

        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />

        <p className="text-sm text-gray-700 whitespace-pre-line">{complaint.description}</p>

        <dl className="text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3">
          <div><dt className="inline">Flat: </dt><dd className="inline font-medium text-gray-700">{flat ? flatDisplayId(flat) : '—'}</dd></div>
          <div><dt className="inline">Raised by: </dt><dd className="inline font-medium text-gray-700">{complaint.submittedBy?.name}</dd></div>
          {complaint.assignedTo && <div><dt className="inline">Assigned to: </dt><dd className="inline font-medium text-gray-700">{complaint.assignedTo.name}</dd></div>}
          <div><dt className="inline">Date: </dt><dd className="inline font-medium text-gray-700">{formatDateTime(complaint.createdAt)}</dd></div>
          {complaint.resolvedAt && <div><dt className="inline">Resolved: </dt><dd className="inline font-medium text-gray-700">{formatDateTime(complaint.resolvedAt)}</dd></div>}
        </dl>

        {/* Attachments */}
        {complaint.attachments?.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-semibold mb-1 text-gray-600">Attachments</p>
            <ul className="space-y-1">
              {complaint.attachments.map((att, i) => (
                <li key={i}>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                    📎 {att.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Admin/Committee: update status/priority */}
      {isAdminOrCommittee && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Update Complaint</h2>
          <form onSubmit={handleUpdate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Status</label>
              <select className="input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button type="submit" disabled={updating} className="btn-primary">
              {updating ? 'Updating…' : 'Update'}
            </button>
          </form>
        </div>
      )}

      {/* Comments thread */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">
          Comments ({complaint.comments?.length || 0})
        </h2>

        {complaint.comments?.length > 0 ? (
          <ul className="space-y-3">
            {complaint.comments.map((c, i) => (
              <li key={c._id || i} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {c.by?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-800">{c.by?.name}</span>
                    <Badge label={c.by?.role} />
                    <span className="text-xs text-gray-400 ml-auto">{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}

        {/* Add comment form */}
        <form onSubmit={handleComment} className="flex gap-3 border-t pt-4">
          <textarea
            className="input flex-1 resize-none"
            rows={2}
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" disabled={posting || !comment.trim()} className="btn-primary self-end">
            {posting ? '…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
