import { useEffect, useState } from 'react';
import * as contactsApi from '@/api/communityContacts.api';
import Spinner from '@/components/common/Spinner';
import Alert from '@/components/common/Alert';

const EMPTY = { category: '', name: '', phone: '', phone2: '', address: '', notes: '', icon: '', order: 0, isActive: true };

const EMOJI_SUGGESTIONS = ['⚡', '🔧', '🧹', '🛡️', '🏥', '🚑', '🚒', '👮', '📮', '🏛️', '🏘️', '🛺', '🚕', '💊', '👔', '🌐', '💡', '📞', '🏠', '🌿'];

export default function CommunityContactsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    contactsApi.getContacts()
      .then(({ data }) => setContacts(data.contacts))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditingId(null); setShowForm(true); setError(''); };
  const openEdit = (c) => { setForm({ ...c }); setEditingId(c._id); setShowForm(true); setError(''); };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.category.trim() || !form.name.trim()) { setError('Category and Name are required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await contactsApi.updateContact(editingId, form);
        setSuccess('Contact updated.');
      } else {
        await contactsApi.createContact(form);
        setSuccess('Contact added.');
      }
      closeForm();
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    try {
      await contactsApi.updateContact(c._id, { isActive: !c.isActive });
      load();
    } catch {}
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.category} — ${c.name}"?`)) return;
    try {
      await contactsApi.deleteContact(c._id);
      setSuccess('Contact deleted.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Community Contacts</h1>
        <button onClick={openCreate} className="btn-primary">+ Add Contact</button>
      </div>

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Edit/Create Form */}
      {showForm && (
        <div className="card border-brand border-2 space-y-4">
          <h2 className="font-semibold text-gray-800">{editingId ? 'Edit Contact' : 'Add New Contact'}</h2>

          {/* Icon picker */}
          <div>
            <label className="label">Icon (emoji)</label>
            <div className="flex gap-1 flex-wrap mb-2">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, icon: e }))}
                  className={`text-xl p-1 rounded border ${form.icon === e ? 'border-brand bg-blue-50' : 'border-transparent hover:border-gray-300'}`}>
                  {e}
                </button>
              ))}
            </div>
            <input className="input w-24" placeholder="or type" value={form.icon} onChange={set('icon')} maxLength={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <input className="input" value={form.category} onChange={set('category')} placeholder="e.g. Electrician" />
            </div>
            <div>
              <label className="label">Name / Description *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Association Electrician" />
            </div>
            <div>
              <label className="label">Phone 1</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="label">Phone 2 (alternate)</label>
              <input className="input" value={form.phone2} onChange={set('phone2')} placeholder="+91 9876543210" />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={set('address')} placeholder="Street, Area" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={set('notes')} placeholder="Availability, working hours, etc." />
            </div>
            <div>
              <label className="label">Display Order</label>
              <input className="input" type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} min={0} />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="text-sm text-gray-700">Visible to all members</label>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Contacts table */}
      <div className="card p-0 overflow-hidden">
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">No contacts yet. Add your first one above.</p>
        ) : (
          <div className="divide-y">
            {contacts.map((c) => (
              <div key={c._id} className={`flex items-center justify-between px-4 py-3 gap-3 ${!c.isActive ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon || '📋'}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.category}</p>
                    <p className="text-xs text-gray-500">{c.name}</p>
                    {(c.phone || c.phone2) && (
                      <p className="text-xs text-brand font-medium">{[c.phone, c.phone2].filter(Boolean).join(' / ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  <button onClick={() => handleToggle(c)} className={`text-xs px-2 py-1 rounded border ${c.isActive ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={() => handleDelete(c)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
