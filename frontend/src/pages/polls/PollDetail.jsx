import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as pollsApi from '@/api/polls.api';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';
import { formatDateTime, formatDate } from '@/utils/formatters';

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrCommittee = ['Admin', 'Committee'].includes(user?.role);

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState('');
  const [voting, setVoting] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    pollsApi.getPoll(id)
      .then(({ data }) => setPoll(data.poll))
      .catch(() => setError('Failed to load poll'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async () => {
    if (!selectedOption) { setError('Please select an option'); return; }
    setVoting(true);
    try {
      const { data } = await pollsApi.castVote(id, selectedOption);
      setPoll(data.poll);
      setSuccess('Your vote has been recorded!');
      setSelectedOption('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const handlePublish = async () => {
    setActioning(true);
    try {
      const { data } = await pollsApi.publishPoll(id);
      setPoll(data.poll);
      setSuccess('Poll is now active — members can vote.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to activate poll');
    } finally {
      setActioning(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this poll? Voting will be permanently stopped.')) return;
    setActioning(true);
    try {
      const { data } = await pollsApi.closePoll(id);
      setPoll(data.poll);
      setSuccess('Poll has been closed.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to close poll');
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!poll) return <p className="text-center text-gray-500 mt-20">Poll not found.</p>;

  const canVote = poll.status === 'Active' && !poll.hasVoted && (!poll.endDate || new Date() < new Date(poll.endDate));
  const showResults = poll.hasVoted || poll.status === 'Closed' || isAdminOrCommittee;
  const maxVotes = Math.max(...(poll.options || []).map((o) => o.voteCount), 1);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/polls" className="text-sm text-brand hover:underline">← Polls</Link>

      {/* Header */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex gap-2 items-center flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded
                ${poll.status === 'Active' ? 'bg-green-100 text-green-800' :
                  poll.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {poll.status === 'Active' ? '🟢 Voting Open' : poll.status === 'Closed' ? '🔴 Closed' : '⚪ Draft'}
              </span>
              <span className="text-xs text-gray-400">{poll.audience}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{poll.title}</h1>
            {poll.description && <p className="text-sm text-gray-500 mt-1">{poll.description}</p>}
          </div>
        </div>

        <dl className="text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3">
          <div><dt className="inline">Created by: </dt><dd className="inline font-medium text-gray-700">{poll.createdBy?.name}</dd></div>
          <div><dt className="inline">Total votes: </dt><dd className="inline font-medium text-gray-700">{poll.totalVotes}</dd></div>
          {poll.endDate && <div><dt className="inline">Deadline: </dt><dd className="inline font-medium text-gray-700">{formatDateTime(poll.endDate)}</dd></div>}
        </dl>

        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />

        {/* Admin actions */}
        {isAdminOrCommittee && (
          <div className="flex gap-2 border-t pt-3">
            {poll.status === 'Draft' && (
              <>
                <Link to={`/polls/${poll._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                <button onClick={handlePublish} disabled={actioning} className="btn-primary btn-sm">
                  {actioning ? 'Opening…' : '🟢 Open Voting'}
                </button>
              </>
            )}
            {poll.status === 'Active' && (
              <button onClick={handleClose} disabled={actioning} className="btn btn-danger btn-sm">
                {actioning ? 'Closing…' : '🔴 Close Voting'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vote form */}
      {canVote && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">Cast Your Vote</h2>
          <p className="text-xs text-gray-500">Select one option. You cannot change your vote after submitting.</p>
          <div className="space-y-2">
            {poll.options.map((opt) => (
              <label
                key={opt._id || opt.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedOption === (opt._id || opt.id) ? 'border-brand bg-blue-50' : 'border-gray-200 hover:border-brand/50'}`}
              >
                <input
                  type="radio"
                  name="vote"
                  value={opt._id || opt.id}
                  checked={selectedOption === (opt._id || opt.id)}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="text-brand"
                />
                <span className="text-sm font-medium text-gray-800">{opt.text}</span>
              </label>
            ))}
          </div>
          <button onClick={handleVote} disabled={voting || !selectedOption} className="btn-primary w-full">
            {voting ? 'Submitting…' : 'Submit Vote'}
          </button>
        </div>
      )}

      {/* Already voted badge */}
      {poll.hasVoted && poll.status === 'Active' && (
        <div className="card bg-green-50 border-green-200 text-sm text-green-700 flex items-center gap-2">
          ✅ You have already voted on this poll. Results will be shown below.
        </div>
      )}

      {/* Results */}
      {showResults && poll.options?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800">
            {poll.status === 'Closed' ? 'Final Results' : 'Current Results'}
            <span className="ml-2 text-sm font-normal text-gray-400">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
          </h2>

          {poll.totalVotes === 0 ? (
            <p className="text-sm text-gray-400">No votes yet.</p>
          ) : (
            <div className="space-y-3">
              {poll.options.map((opt) => {
                const isUserVote = poll.userVote?.optionId === (opt._id || opt.id);
                const isLeading = opt.voteCount === maxVotes && poll.totalVotes > 0;
                return (
                  <div key={opt._id || opt.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`font-medium ${isLeading && poll.status === 'Closed' ? 'text-green-700' : 'text-gray-700'}`}>
                        {opt.text}
                        {isUserVote && <span className="ml-2 text-xs text-brand">(your vote)</span>}
                        {isLeading && poll.status === 'Closed' && poll.totalVotes > 0 && <span className="ml-2 text-xs text-green-600">✓ Leading</span>}
                      </span>
                      <span className="text-gray-500">{opt.voteCount} ({opt.percentage}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isLeading && poll.status === 'Closed' ? 'bg-green-500' : 'bg-brand'}`}
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
