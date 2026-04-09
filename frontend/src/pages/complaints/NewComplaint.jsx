import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as complaintsApi from '@/api/complaints.api';
import * as flatsApi from '@/api/flats.api';
import Alert from '@/components/common/Alert';
import { flatDisplayId } from '@/utils/formatters';

const CATEGORIES = ['Plumbing', 'Electrical', 'Structural', 'Housekeeping', 'Security', 'Common Area', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Plumbing',
    priority: 'Medium',
    flatId: user?.flatId?._id || user?.flatId || '',
  });
  const [files, setFiles] = useState([]);
  const [flats, setFlats] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    flatsApi.getFlats().then(({ data }) => setFlats(data.flats)).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.flatId) { setError('Please select your flat.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('priority', form.priority);
      fd.append('flatId', form.flatId);
      files.forEach((file) => fd.append('attachments', file));

      const { data } = await complaintsApi.createComplaint(fd);
      navigate(`/complaints/${data.complaint._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/complaints" className="text-sm text-brand hover:underline">← Complaints</Link>
      <h1 className="page-title">Raise a Complaint</h1>

      <div className="card space-y-4">
        <Alert type="error" message={error} onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={set('title')} placeholder="Brief summary of the issue" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea required className="input" rows={4} value={form.description} onChange={set('description')} placeholder="Describe the issue in detail…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Flat</label>
            <select className="input" value={form.flatId} onChange={set('flatId')} required>
              <option value="">— Select flat —</option>
              {flats.map((f) => <option key={f._id} value={f._id}>{flatDisplayId(f)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Attachments (max 3 files, 10 MB each)</label>
            <input
              type="file"
              className="input"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/complaints" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
