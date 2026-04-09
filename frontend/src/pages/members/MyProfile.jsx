import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as membersApi from '@/api/members.api';
import Alert from '@/components/common/Alert';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', mailingAddress: user?.mailingAddress || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await membersApi.updateMyProfile({ name: form.name, phone: form.phone, mailingAddress: form.mailingAddress });
      updateUser({ name: data.member.name, phone: data.member.phone, mailingAddress: data.member.mailingAddress });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="page-title">My Profile</h1>
      <div className="card space-y-4">
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={user?.email} readOnly />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="label">Mailing Address</label>
            <textarea className="input resize-none" rows={3} value={form.mailingAddress} onChange={(e) => setForm((f) => ({ ...f, mailingAddress: e.target.value }))} placeholder="Door No, Street, City, PIN" />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input bg-gray-50" value={user?.role} readOnly />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
