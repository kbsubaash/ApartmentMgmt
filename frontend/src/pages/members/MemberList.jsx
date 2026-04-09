import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as membersApi from '@/api/members.api';
import * as flatsApi from '@/api/flats.api';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Alert from '@/components/common/Alert';
import { formatDate, flatDisplayId } from '@/utils/formatters';

const ROLES = ['Admin', 'Committee', 'Resident'];

export default function MemberList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [flats, setFlats] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Resident', phone: '', flatId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const LIMIT = 15;

  const fetchMembers = useCallback(() => {
    setLoading(true);
    membersApi
      .getMembers({ search, role: roleFilter || undefined, page, limit: LIMIT })
      .then(({ data }) => { setMembers(data.members); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (isAdmin) {
      flatsApi.getFlats().then(({ data }) => setFlats(data.flats)).catch(() => {});
    }
  }, [isAdmin]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', email: '', password: '', role: 'Resident', phone: '', flatId: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditTarget(member);
    setForm({ name: member.name, email: member.email, password: '', role: member.role, phone: member.phone || '', flatId: member.flatId?._id || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name, role: form.role, phone: form.phone, flatId: form.flatId || null };
      if (!editTarget) {
        payload.email = form.email;
        payload.password = form.password;
        await membersApi.createMember(payload);
      } else {
        if (form.password) payload.password = form.password;
        await membersApi.updateMember(editTarget._id, payload);
      }
      setSuccessMsg(editTarget ? 'Member updated.' : 'Member created.');
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this member?')) return;
    await membersApi.deleteMember(id).catch(() => {});
    fetchMembers();
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <Link to={`/members/${r._id}`} className="text-brand hover:underline font-medium">{r.name}</Link> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => <Badge label={r.role} /> },
    { key: 'flat', header: 'Flat', render: (r) => r.flatId ? flatDisplayId(r.flatId) : '—' },
    { key: 'status', header: 'Status', render: (r) => <Badge label={r.status} /> },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    ...(isAdmin ? [{
      key: 'actions', header: '', render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="btn btn-secondary btn-sm">Edit</button>
          {r.status === 'active' && r._id !== user._id && (
            <button onClick={() => handleDeactivate(r._id)} className="btn btn-danger btn-sm">Deactivate</button>
          )}
        </div>
      )
    }] : []),
  ];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="page-title">Members <span className="text-sm font-normal text-gray-400">({total})</span></h1>
        {isAdmin && <button onClick={openCreate} className="btn-primary">+ Add Member</button>}
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" placeholder="Search name or email…" className="input max-w-xs"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="input max-w-[160px]" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <Table columns={columns} rows={members} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Edit Member' : 'Add Member'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Alert type="error" message={formError} onClose={() => setFormError('')} />
            <div><label className="label">Full Name</label><input required className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            {!editTarget && (
              <div><label className="label">Email</label><input type="email" required className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            )}
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Flat</label>
              <select className="input" value={form.flatId} onChange={(e) => setForm((f) => ({ ...f, flatId: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {flats.map((f) => <option key={f._id} value={f._id}>{flatDisplayId(f)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{editTarget ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" className="input" required={!editTarget} minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
