import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pollsApi from '@/api/polls.api';
import Alert from '@/components/common/Alert';

export default function PollEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('All');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (idx, val) => setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (idx) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) return 'At least 2 non-empty options are required';
    return null;
  };

  const save = async (andPublish = false) => {
    const err = validate();
    if (err) { setError(err); return; }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      audience,
      endDate: endDate || undefined,
      options: options.filter((o) => o.trim()),
    };

    andPublish ? setPublishing(true) : setSaving(true);
    try {
      const { data } = await pollsApi.createPoll(payload);
      const id = data.poll._id || data.poll.id;
      if (andPublish) {
        await pollsApi.publishPoll(id);
      }
      navigate('/polls');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save poll');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Create Poll</h1>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="card space-y-4">
        <div>
          <label className="label">Poll Title *</label>
          <input className="input" placeholder="e.g. Approve parking fee hike for FY2026" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">Description / Context</label>
          <textarea className="input resize-none" rows={3} placeholder="Provide background or details for members to make an informed decision..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Audience</label>
            <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="All">All Members</option>
              <option value="Residents">Residents Only</option>
              <option value="Committee">Committee Only</option>
            </select>
          </div>
          <div>
            <label className="label">Voting Deadline (optional)</label>
            <input type="datetime-local" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="label">Voting Options *</label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}.</span>
                <input
                  className="input flex-1"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addOption} className="mt-2 text-sm text-brand hover:underline">+ Add Option</button>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={() => navigate('/polls')} className="btn btn-secondary">Cancel</button>
        <button onClick={() => save(false)} disabled={saving} className="btn btn-secondary">
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button onClick={() => save(true)} disabled={publishing} className="btn-primary">
          {publishing ? 'Publishing…' : 'Save & Open Voting'}
        </button>
      </div>
    </div>
  );
}
