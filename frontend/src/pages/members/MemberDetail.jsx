import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as membersApi from '@/api/members.api';
import Badge from '@/components/common/Badge';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDate, formatDateTime, flatDisplayId } from '@/utils/formatters';

export default function MemberDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const canSeePrivate = ['Admin', 'Committee'].includes(currentUser?.role) || currentUser?.id === id;
  const canSendReminder = ['Admin', 'Committee'].includes(currentUser?.role);

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reminder state
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminder, setReminder] = useState({ month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), amount: '', notes: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    membersApi.getMember(id).then(({ data }) => setMember(data.member)).finally(() => setLoading(false));
  }, [id]);

  const sendReminder = async () => {
    setSending(true);
    setError('');
    try {
      const { data } = await membersApi.sendPaymentReminder(id, reminder);
      setSuccess(data.message);
      setReminderOpen(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!member) return <p className="text-center text-gray-500 mt-20">Member not found.</p>;

  const flat = member.flat;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/members" className="text-sm text-brand hover:underline">← Members</Link>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand text-white text-2xl font-bold flex items-center justify-center flex-shrink-0">
              {member.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
              {canSeePrivate && <p className="text-sm text-gray-500">{member.email}</p>}
              <div className="flex gap-2 mt-2">
                <Badge label={member.role} />
                <Badge label={member.status} />
              </div>
            </div>
          </div>
          {canSendReminder && (
            <button onClick={() => setReminderOpen((p) => !p)} className="btn btn-secondary btn-sm flex-shrink-0">
              📧 Payment Reminder
            </button>
          )}
        </div>

        {/* Payment Reminder Panel */}
        {reminderOpen && canSendReminder && (
          <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Send Maintenance Payment Reminder</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Month</label>
                <input className="input text-sm" value={reminder.month} onChange={(e) => setReminder((r) => ({ ...r, month: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Amount Due (₹)</label>
                <input className="input text-sm" type="number" value={reminder.amount} onChange={(e) => setReminder((r) => ({ ...r, amount: e.target.value }))} placeholder="e.g. 2000" />
              </div>
            </div>
            <div>
              <label className="label text-xs">Additional Notes (optional)</label>
              <textarea className="input text-sm resize-none" rows={2} value={reminder.notes} onChange={(e) => setReminder((r) => ({ ...r, notes: e.target.value }))} placeholder="e.g. Please include your flat number in the transfer remarks." />
            </div>
            <div className="flex gap-2">
              <button onClick={sendReminder} disabled={sending} className="btn-primary btn-sm">
                {sending ? 'Sending…' : 'Send Email Reminder'}
              </button>
              <button onClick={() => setReminderOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          {canSeePrivate && (
            <>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{member.phone || '—'}</dd></div>
              <div className="col-span-2">
                <dt className="text-gray-500">Mailing Address</dt>
                <dd className="font-medium whitespace-pre-wrap">{member.mailingAddress || '—'}</dd>
              </div>
            </>
          )}
          <div><dt className="text-gray-500">Flat</dt><dd className="font-medium">{flat ? flatDisplayId(flat) : '—'}</dd></div>
          {flat && (
            <>
              <div><dt className="text-gray-500">Flat Type</dt><dd className="font-medium">{flat.type}</dd></div>
              <div><dt className="text-gray-500">Ownership</dt><dd className="font-medium">{flat.ownershipType}</dd></div>
            </>
          )}
          <div><dt className="text-gray-500">Joined</dt><dd className="font-medium">{formatDate(member.createdAt)}</dd></div>
          <div><dt className="text-gray-500">Last Updated</dt><dd className="font-medium">{formatDateTime(member.updatedAt)}</dd></div>
        </dl>

        {!canSeePrivate && (
          <p className="mt-4 text-xs text-gray-400 italic">Contact details are visible to Committee members only.</p>
        )}
      </div>
    </div>
  );
}
