import { useState } from 'react';
import { MOCK_APPOINTMENTS, TODAY } from '../../data/appointments';
import { StatusBadge } from '../../components/ui/Badge';
import { formatTime, formatDate } from '../../utils/formatters';
import Avatar from '../../components/ui/Avatar';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';

const STATUS_OPTIONS = ['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState('all');
  const [notesModal, setNotesModal] = useState(null);

  // Filter to this doctor's appointments
  const all = MOCK_APPOINTMENTS.filter(a => a.doctorId === 'DOC-001')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const filtered = filter === 'all' ? all : all.filter(a => a.status === filter);

  const today = filtered.filter(a => a.date === TODAY);
  const upcoming = filtered.filter(a => a.date > TODAY);
  const past = filtered.filter(a => a.date < TODAY);

  function Section({ title, items }) {
    if (!items.length) return null;
    return (
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(apt => (
            <div key={apt.id} className={`card p-4 flex flex-wrap items-center gap-3 ${apt.status === 'in-progress' ? 'border-amber-300 bg-amber-50/30' : ''}`}>
              <div className="text-xs font-semibold text-[var(--color-primary-500)] w-16 flex-shrink-0">
                <div>{formatDate(apt.date)}</div>
                <div>{formatTime(apt.time)}</div>
              </div>
              <Avatar name={apt.patientName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)]">{apt.patientName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{apt.type} — {apt.reason}</p>
              </div>
              <StatusBadge status={apt.status} />
              <div className="flex gap-2">
                <Link
                  to={`/doctor/patients/${apt.patientId}`}
                  className="text-xs px-3 h-7 flex items-center rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors font-medium"
                >
                  Patient Record
                </Link>
                {apt.notes && (
                  <button
                    onClick={() => setNotesModal(apt)}
                    className="text-xs px-3 h-7 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] cursor-pointer"
                  >
                    Notes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Appointments</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Sunday, 18 August 2024</p>
        </div>
        <div className="flex gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg">
          {STATUS_OPTIONS.slice(0, 4).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 h-7 rounded-md font-medium transition-colors cursor-pointer ${filter === s ? 'bg-white text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments found" description="No appointments match the current filter." />
      ) : (
        <>
          <Section title="Today" items={today} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
        </>
      )}

      {/* Notes modal */}
      <Modal open={!!notesModal} onClose={() => setNotesModal(null)} title={`Notes — ${notesModal?.patientName}`} size="sm">
        <p className="text-sm text-[var(--color-text)]">{notesModal?.notes}</p>
      </Modal>
    </div>
  );
}
