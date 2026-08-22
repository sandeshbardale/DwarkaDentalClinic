import { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Search } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export default function DoctorHistoryPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments({
        status: 'completed',
        sortBy: 'startAt',
        sortOrder: 'desc',
        limit: 100,
      });
      let list = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      // Filter by this doctor if available
      if (user?.id) list = list.filter(a => a.doctorId === user.id || !user.id);
      setAppointments(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = search
    ? appointments.filter(a =>
        a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        a.treatmentCategoryName?.toLowerCase().includes(search.toLowerCase()) ||
        a.notes?.toLowerCase().includes(search.toLowerCase())
      )
    : appointments;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Clinical History</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${filtered.length} completed treatments`}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-outline btn-sm flex items-center gap-1">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="card p-3 flex items-center gap-2">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Search by patient, category, or notes…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)]"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
              <tr>
                {['Date', 'Patient', 'Category', 'Duration', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-[var(--color-border)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center">
                  <EmptyState icon={FileText} title="No clinical history" description="Completed treatments will appear here." />
                </td></tr>
              ) : (
                filtered.map(apt => (
                  <tr key={apt.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)]">
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(apt.date)}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{apt.patientName}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.treatmentCategoryName || '–'}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{apt.durationMinutes ? `${apt.durationMinutes} min` : '–'}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] max-w-xs truncate">{apt.notes || '–'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
