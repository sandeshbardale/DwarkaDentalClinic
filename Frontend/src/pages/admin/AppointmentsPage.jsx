import { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { MOCK_APPOINTMENTS, APPOINTMENT_TYPES } from '../../data/appointments';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';

const STATUSES = ['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

export default function AppointmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const filtered = MOCK_APPOINTMENTS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchDoctor = doctorFilter === 'all' || a.doctorId === doctorFilter;
    return matchSearch && matchStatus && matchDoctor;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Appointments</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{filtered.length} appointments</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-[var(--color-text-muted)]" />
          <input type="search" placeholder="Search patient, doctor, type…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 text-sm bg-transparent outline-none" aria-label="Search appointments" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm bg-transparent outline-none cursor-pointer text-[var(--color-text)]" aria-label="Filter by status">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={doctorFilter} onChange={e => { setDoctorFilter(e.target.value); setPage(1); }} className="text-sm bg-transparent outline-none cursor-pointer text-[var(--color-text)]" aria-label="Filter by doctor">
          <option value="all">All Doctors</option>
          {MOCK_DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments found" description="Try adjusting your search filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Appointments table">
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paginated.map(apt => (
                  <tr key={apt.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={apt.patientName} size="sm" />
                        <span className="font-medium text-sm">{apt.patientName}</span>
                      </div>
                    </td>
                    <td className="text-sm text-[var(--color-text-muted)]">{apt.doctorName}</td>
                    <td className="text-sm">{formatDate(apt.date)}</td>
                    <td className="text-sm">{formatTime(apt.time)}</td>
                    <td className="text-sm">{apt.type}</td>
                    <td className="text-sm text-[var(--color-text-muted)] max-w-48 truncate">{apt.reason}</td>
                    <td><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="text-xs px-3 h-7 rounded border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg)] cursor-pointer">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="text-xs px-3 h-7 rounded border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-bg)] cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
