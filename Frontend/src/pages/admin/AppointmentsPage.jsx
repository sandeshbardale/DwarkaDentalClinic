import { useState, useEffect, useCallback } from 'react';
import { Calendar, Search, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock, X, Edit3 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';

const VIEW_TABS = [
  { key: 'today', label: 'Today', icon: Calendar },
  { key: 'upcoming', label: 'Upcoming', icon: Clock },
  { key: 'missed', label: 'Missed', icon: AlertTriangle },
  { key: 'all', label: 'All', icon: null },
];

const STATUS_ACTIONS = {
  scheduled: ['arrived', 'cancelled', 'missed'],
  confirmed: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  missed: ['rescheduled'],
  cancelled: [],
  rescheduled: [],
};

function RescheduleModal({ apt, onClose, onConfirm }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold text-[var(--color-text)]">Reschedule Appointment</h3>
        <p className="text-sm text-[var(--color-text-muted)]">{apt.patientName} — {apt.doctorName}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)]">New Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input mt-1 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)]">New Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input mt-1 w-full" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-outline btn-sm">Cancel</button>
          <button onClick={() => date && time && onConfirm(apt.id, date, time)} disabled={!date} className="btn btn-primary btn-sm">Reschedule</button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [view, setView] = useState('today');
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [error, setError] = useState(null);

  const fetchApts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.getAppointments({ view, page, limit: 20 });
      const result = res.data;
      let list = result?.data ?? (Array.isArray(result) ? result : []);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(a => a.patientName?.toLowerCase().includes(q) || a.doctorName?.toLowerCase().includes(q) || a.appointmentNumber?.toLowerCase().includes(q));
      }
      setAppointments(list);
      if (result?.pagination) setPagination(result.pagination);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [view, page, search]);

  useEffect(() => { fetchApts(); }, [fetchApts]);

  async function handleStatusChange(aptId, status) {
    setActionLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, { status });
      fetchApts();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  }

  async function handleReschedule(aptId, nextDate, nextTime) {
    setActionLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, { status: 'rescheduled', nextDate, nextTime });
      setRescheduleTarget(null);
      fetchApts();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  }

  const priorityBadge = (p) => {
    if (p === 'emergency') return <span className="badge badge-red text-xs">🚨 Emergency</span>;
    if (p === 'high') return <span className="badge badge-amber text-xs">⚡ High</span>;
    return null;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Appointments</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${pagination.total} appointments`}
          </p>
        </div>
        <button onClick={fetchApts} className="btn btn-outline btn-sm flex items-center gap-1">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg w-fit">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === tab.key ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-3 flex items-center gap-2">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Search patient, doctor, or appointment ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)]"
        />
      </div>

      {error && (
        <div className="card p-3 border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
              <tr>
                {['Apt #', 'Patient', 'Doctor', 'Category', 'Date', 'Time', 'Status', 'Priority', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--color-border)] rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <EmptyState icon={Calendar} title={`No ${view} appointments`} description="No appointments match your current filter." />
                </td></tr>
              ) : (
                appointments.map((apt) => {
                  const actions = STATUS_ACTIONS[apt.status] || [];
                  return (
                    <tr key={apt.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{apt.appointmentNumber}</td>
                      <td className="px-4 py-3 font-medium">{apt.patientName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.doctorName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.treatmentCategoryName || '–'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(apt.date)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.time}</td>
                      <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                      <td className="px-4 py-3">{priorityBadge(apt.priority)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {actionLoading === apt.id ? (
                            <span className="text-xs text-[var(--color-text-muted)]">Updating…</span>
                          ) : (
                            actions.map(action => (
                              action === 'rescheduled'
                                ? <button key={action} onClick={() => setRescheduleTarget(apt)} className="btn btn-outline btn-xs capitalize">Reschedule</button>
                                : <button key={action} onClick={() => handleStatusChange(apt.id, action)} className="btn btn-outline btn-xs capitalize">{action.replace('_', ' ')}</button>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] text-sm">
            <span className="text-[var(--color-text-muted)]">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline btn-xs">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="btn btn-outline btn-xs">Next →</button>
            </div>
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <RescheduleModal apt={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onConfirm={handleReschedule} />
      )}
    </div>
  );
}
