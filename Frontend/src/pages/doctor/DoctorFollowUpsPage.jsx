import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, RefreshCw, Phone, Calendar } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';

const TABS = [
  { key: 'missed', label: 'Missed / Overdue' },
  { key: 'upcoming', label: 'Upcoming Follow-ups' },
];

export default function DoctorFollowUpsPage() {
  const [tab, setTab] = useState('missed');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments({ view: tab, limit: 50 });
      const list = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setAppointments(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleStatusChange(aptId, status) {
    setActionLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, { status });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  }

  const daysOverdue = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return diff > 0 ? `${diff}d overdue` : null;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Follow-ups</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${appointments.length} appointments`}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-outline btn-sm flex items-center gap-1">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
              <tr>
                {['Patient', 'Phone', 'Doctor', 'Category', 'Scheduled Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-[var(--color-border)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center">
                  <EmptyState icon={Clock} title={`No ${tab} follow-ups`} description="All follow-ups are on track." />
                </td></tr>
              ) : (
                appointments.map(apt => {
                  const overdue = tab === 'missed' ? daysOverdue(apt.date) : null;
                  return (
                    <tr key={apt.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors ${tab === 'missed' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <Link to={`/doctor/patients/${apt.patientId}`} className="font-medium text-[var(--color-primary-600)] hover:underline">
                          {apt.patientName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${apt.patientPhone}`} className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary-500)]">
                          <Phone size={13} /> {apt.patientPhone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.doctorName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.treatmentCategoryName || '–'}</td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--color-text)]">{formatDate(apt.date)}</p>
                        {overdue && <p className="text-xs text-red-500 font-medium">{overdue}</p>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {tab === 'missed' && apt.status !== 'cancelled' && (
                            <>
                              <button onClick={() => handleStatusChange(apt.id, 'missed')}
                                disabled={actionLoading === apt.id || apt.status === 'missed'}
                                className="btn btn-outline btn-xs">Mark Missed</button>
                              <button onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                disabled={actionLoading === apt.id}
                                className="btn btn-outline btn-xs text-red-600">Cancel</button>
                            </>
                          )}
                          {tab === 'upcoming' && (
                            <Link to={`/doctor/patients/${apt.patientId}`} className="btn btn-outline btn-xs">
                              View Patient
                            </Link>
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
      </div>
    </div>
  );
}
