import { useState } from 'react';
import { UserCog, Power } from 'lucide-react';
import { MOCK_STAFF } from '../../data/staff';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import { ConfirmModal } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const ROLE_LABELS = { receptionist: 'Receptionist', assistant: 'Dental Assistant', lab_technician: 'Lab Technician' };

export default function StaffPage() {
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [confirmId, setConfirmId] = useState(null);

  function toggleStatus(id) {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    setConfirmId(null);
  }

  const confirmMember = staff.find(s => s.id === confirmId);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Staff Management</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{staff.filter(s => s.status === 'active').length} active staff members</p>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table" aria-label="Staff table">
          <thead>
            <tr><th>Staff Member</th><th>Role</th><th>Phone</th><th>Email</th><th>Shift</th><th>Joined</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{s.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">{s.id}</p>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{ROLE_LABELS[s.role] || s.role}</td>
                <td className="text-sm text-[var(--color-text-muted)]">{s.phone}</td>
                <td className="text-sm text-[var(--color-text-muted)]">{s.email}</td>
                <td className="text-sm text-[var(--color-text-muted)]">{s.shift}</td>
                <td className="text-sm">{formatDate(s.joinedAt)}</td>
                <td><StatusBadge status={s.status} /></td>
                <td>
                  <button
                    onClick={() => setConfirmId(s.id)}
                    className={`text-xs px-2.5 h-7 rounded-lg border font-medium cursor-pointer transition-colors ${s.status === 'active' ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    {s.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
