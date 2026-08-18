import { useState } from 'react';
import { Plus, Edit2, Power, Stethoscope } from 'lucide-react';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState(MOCK_DOCTORS);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = doctors.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStatus(id) {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' } : d));
    setConfirmId(null);
  }

  const confirmDoctor = doctors.find(d => d.id === confirmId);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Doctors</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{doctors.filter(d => d.status === 'active').length} active · {doctors.length} total</p>
        </div>
      </div>

      <div className="card p-4">
        <input type="search" placeholder="Search by name or specialization…" value={search} onChange={e => setSearch(e.target.value)} className="form-input max-w-sm" aria-label="Search doctors" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3">
            <EmptyState icon={Stethoscope} title="No doctors found" />
          </div>
        ) : filtered.map(doc => (
          <div key={doc.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={doc.name} size="lg" />
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{doc.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{doc.specialization}</p>
                </div>
              </div>
              <StatusBadge status={doc.status} />
            </div>

            <div className="space-y-2 text-sm text-[var(--color-text-muted)] mb-4">
              <p>📋 {doc.qualification}</p>
              <p>💼 {doc.experience} yrs experience</p>
              <p>📞 {doc.phone}</p>
              <p>✉️ {doc.email}</p>
              <p>📅 Joined {formatDate(doc.joinedAt)}</p>
            </div>

            <div className="mb-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Availability</p>
              <div className="flex flex-wrap gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const full = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[day];
                  const avail = doc.availability.includes(full);
                  return (
                    <span key={day} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${avail ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-subtle)]'}`}>
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text)]">{doc.totalPatients}</span> patients
                <span className="font-semibold text-[var(--color-text)]">{doc.completedAppointments}</span> completed
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setConfirmId(doc.id)}
                className={`text-xs px-3 h-7 rounded-lg border font-medium cursor-pointer transition-colors ${doc.status === 'active' ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                aria-label={doc.status === 'active' ? `Deactivate ${doc.name}` : `Activate ${doc.name}`}
              >
                <Power size={12} className="inline mr-1" />
                {doc.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => toggleStatus(confirmId)}
        title={confirmDoctor?.status === 'active' ? 'Deactivate Doctor' : 'Activate Doctor'}
        message={`Are you sure you want to ${confirmDoctor?.status === 'active' ? 'deactivate' : 'activate'} ${confirmDoctor?.name}?`}
        confirmLabel={confirmDoctor?.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={confirmDoctor?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
}
