import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as flatsApi from '@/api/flats.api';
import * as membersApi from '@/api/members.api';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Alert from '@/components/common/Alert';
import Spinner from '@/components/common/Spinner';
import { flatDisplayId } from '@/utils/formatters';

const FLAT_TYPES = ['1BHK', '2BHK', '3BHK', 'Other'];
const OWNERSHIP = ['Owner', 'Tenant'];

export default function FlatList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [members, setMembers] = useState([]);
  const [assignMemberId, setAssignMemberId] = useState('');
  const [editForm, setEditForm] = useState({ type: '2BHK', ownershipType: 'Owner', status: 'vacant', notes: '' });
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFlats = useCallback(() => {
    setLoading(true);
    flatsApi.getFlats(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => setFlats(data.flats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchFlats(); }, [fetchFlats]);

  const openAssign = (flat) => {
    setSelectedFlat(flat);
    setAssignMemberId('');
    setActionError('');
    membersApi.getMembers({ limit: 100 }).then(({ data }) => setMembers(data.members)).catch(() => {});
    setShowAssignModal(true);
  };

  const openEdit = (flat) => {
    setSelectedFlat(flat);
    setEditForm({ type: flat.type, ownershipType: flat.ownershipType, status: flat.status, notes: flat.notes || '' });
    setActionError('');
    setShowEditModal(true);
  };

  const handleAssign = async () => {
    if (!assignMemberId) return;
    setActionError('');
    try {
      await flatsApi.assignMember(selectedFlat._id, assignMemberId);
      setSuccessMsg('Member assigned successfully.');
      setShowAssignModal(false);
      fetchFlats();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleUnassign = async (flatId, memberId) => {
    if (!window.confirm('Remove this member from the flat?')) return;
    await flatsApi.unassignMember(flatId, memberId).catch(() => {});
    fetchFlats();
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await flatsApi.updateFlat(selectedFlat._id, editForm);
      setSuccessMsg('Flat updated.');
      setShowEditModal(false);
      fetchFlats();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Flats <span className="text-sm font-normal text-gray-400">({flats.length})</span></h1>
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
        </select>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Flat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {flats.map((flat) => (
          <div key={flat._id} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-brand">{flatDisplayId(flat)}</span>
              <Badge label={flat.status} />
            </div>
            <p className="text-xs text-gray-500">{flat.type} · {flat.ownershipType}</p>

            {/* Assigned members */}
            {flat.assignedMembers?.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {flat.assignedMembers.map((m) => (
                  <li key={m._id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-gray-700 max-w-[90px]">{m.name}</span>
                    {isAdmin && (
                      <button onClick={() => handleUnassign(flat._id, m._id)} className="text-red-500 hover:text-red-700 ml-1 text-xs">✕</button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic mt-1">No residents</p>
            )}

            {isAdmin && (
              <div className="flex gap-1 mt-auto pt-2">
                <button onClick={() => openAssign(flat)} className="btn btn-secondary btn-sm flex-1">Assign</button>
                <button onClick={() => openEdit(flat)} className="btn btn-secondary btn-sm flex-1">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <Modal title={`Assign Member to ${flatDisplayId(selectedFlat)}`} onClose={() => setShowAssignModal(false)} size="sm">
          <div className="space-y-4">
            <Alert type="error" message={actionError} onClose={() => setActionError('')} />
            <div>
              <label className="label">Select Member</label>
              <select className="input" value={assignMemberId} onChange={(e) => setAssignMemberId(e.target.value)}>
                <option value="">— Select —</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAssign} disabled={!assignMemberId} className="btn-primary">Assign</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title={`Edit ${flatDisplayId(selectedFlat)}`} onClose={() => setShowEditModal(false)} size="sm">
          <form onSubmit={handleEditSave} className="space-y-4">
            <Alert type="error" message={actionError} onClose={() => setActionError('')} />
            <div>
              <label className="label">Type</label>
              <select className="input" value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
                {FLAT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ownership</label>
              <select className="input" value={editForm.ownershipType} onChange={(e) => setEditForm((f) => ({ ...f, ownershipType: e.target.value }))}>
                {OWNERSHIP.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
