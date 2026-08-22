import { useState, useEffect } from 'react';
import { UserCog, Power, Edit3, Plus, RefreshCw, UserCheck } from 'lucide-react';
import { MOCK_STAFF } from '../../data/staff';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { api } from '../../utils/api';

const ROLE_LABELS = { receptionist: 'Receptionist', doctor: 'Doctor', assistant: 'Dental Assistant', lab_technician: 'Lab Technician', admin: 'Admin' };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  
  // Modals
  const [editMember, setEditMember] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [form, setForm] = useState({ name: '', email: '', role: 'receptionist', phone: '', specialization: '', shift: 'Morning (9 AM - 5 PM)' });
  const [saving, setSaving] = useState(false);

  async function loadStaff() {
    setLoading(true);
    let localStaff = [];
    try {
      const raw = localStorage.getItem('ddc_staff_v1');
      if (raw) localStaff = JSON.parse(raw);
    } catch (_) {}

    try {
      const res = await api.getStaff();
      const apiStaff = Array.isArray(res?.data) && res.data.length > 0 ? res.data : [];
      const map = new Map();
      MOCK_STAFF.forEach(s => map.set(s.email.toLowerCase(), s));
      localStaff.forEach(s => map.set(s.email.toLowerCase(), s));
      apiStaff.forEach(s => map.set(s.email.toLowerCase(), s));

      const mergedList = Array.from(map.values());
      setStaff(mergedList);
      localStorage.setItem('ddc_staff_v1', JSON.stringify(mergedList));
    } catch {
      const map = new Map();
      MOCK_STAFF.forEach(s => map.set(s.email.toLowerCase(), s));
      localStaff.forEach(s => map.set(s.email.toLowerCase(), s));
      setStaff(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStaff(); }, []);

  function handleEditClick(s) {
    setEditMember(s);
    setForm({
      name: s.name || '',
      email: s.email || '',
      role: s.role || 'receptionist',
      phone: s.phone || '',
      specialization: s.specialization || '',
      shift: s.shift || 'Morning (9 AM - 5 PM)',
      password: '',
    });
  }

  function handleAddClick() {
    setIsAdding(true);
    setForm({ name: '', email: '', role: 'receptionist', phone: '', specialization: '', shift: 'Morning (9 AM - 5 PM)', password: 'Password@123' });
  }

  async function handleSaveSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isAdding) {
        const res = await api.createStaff(form).catch(() => null);
        const newObj = res?.data || { id: `stf-${Date.now()}`, ...form, status: 'active', joinedAt: new Date().toISOString() };
        setStaff(prev => {
          const updated = [newObj, ...prev];
          try { localStorage.setItem('ddc_staff_v1', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        setIsAdding(false);
      } else if (editMember) {
        const targetId = editMember.id || editMember._id;
        await api.updateStaff(targetId, form).catch(() => null);
        setStaff(prev => {
          const updated = prev.map(s => (s.id === targetId || s._id === targetId || s.email === editMember.email) ? { ...s, ...form } : s);
          try { localStorage.setItem('ddc_staff_v1', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        setEditMember(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleStatus(id) {
    setStaff(prev => prev.map(s => (s.id === id || s._id === id) ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    setConfirmId(null);
  }

  const confirmMember = staff.find(s => (s.id === confirmId || s._id === confirmId));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Staff Management</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{staff.filter(s => s.status === 'active').length} active staff member(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadStaff} className="btn btn-outline btn-sm flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleAddClick} className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
            <Plus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-[var(--color-border)] rounded-xl shadow-xs">
        <table className="data-table" aria-label="Staff table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Specialization / Shift</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => {
              const memberId = s.id || s._id;
              return (
                <tr key={memberId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{s.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono">{memberId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm font-medium">{ROLE_LABELS[s.role] || s.role}</td>
                  <td className="text-sm text-[var(--color-text-muted)]">{s.phone || '—'}</td>
                  <td className="text-sm text-[var(--color-text-muted)]">{s.email}</td>
                  <td className="text-sm text-[var(--color-text-muted)]">{s.specialization || s.shift || 'General'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="btn btn-outline btn-xs flex items-center gap-1 text-[var(--color-primary-600)] cursor-pointer"
                        title="Edit Staff Name & Details"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmId(memberId)}
                        className={`text-xs px-2 h-6 rounded-md border font-medium cursor-pointer transition-colors ${
                          s.status === 'active' ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {s.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal */}
      {(editMember || isAdding) && (
        <Modal open={true} onClose={() => { setEditMember(null); setIsAdding(false); }} title={isAdding ? "Add New Staff Member" : `Edit Staff Details — ${editMember?.name}`} size="md">
          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="form-input text-sm"
                placeholder="e.g. Dr. Sarah Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input text-sm"
                  placeholder="staff@dwarkadental.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="form-input text-sm cursor-pointer"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="assistant">Dental Assistant</option>
                  <option value="lab_technician">Lab Technician</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="form-input text-sm"
                  placeholder="+91 98765 00000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Specialization / Notes</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. Orthodontist / Front Desk"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                {isAdding ? "Set Account Password *" : "Reset Password (Optional)"}
              </label>
              <input
                type="text"
                required={isAdding}
                value={form.password || ''}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="form-input text-sm font-mono text-violet-700 font-bold"
                placeholder={isAdding ? "Type Login Password (e.g. Pass123)" : "Leave blank to keep unchanged"}
              />
              <p className="text-[10px] text-slate-500 mt-1">Staff will use this password to log in at /login.</p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => { setEditMember(null); setIsAdding(false); }} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm font-semibold">
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Deactivate Modal */}
      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => toggleStatus(confirmId)}
        title={`${confirmMember?.status === 'active' ? 'Deactivate' : 'Activate'} Staff Member`}
        message={`Are you sure you want to ${confirmMember?.status === 'active' ? 'deactivate' : 'activate'} ${confirmMember?.name}?`}
        confirmLabel={confirmMember?.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={confirmMember?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
}
