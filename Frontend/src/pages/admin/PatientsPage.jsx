import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Eye, ChevronDown, Filter } from 'lucide-react';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import { Users } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'new', 'active', 'follow-up', 'completed', 'inactive'];

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const doctorMap = Object.fromEntries(MOCK_DOCTORS.map(d => [d.id, d.name]));

  const filtered = MOCK_PATIENTS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.patientId.toLowerCase().includes(q) || p.phone.includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Patients</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{total} patients found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, ID, or phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
            aria-label="Search patients"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm bg-transparent outline-none text-[var(--color-text)] cursor-pointer"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon={Users} title="No patients found" description="Try adjusting your search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Patients table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>ID</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Assigned Doctor</th>
                  <th>Last Visit</th>
                  <th>Next Follow-up</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="sm" />
                        <span className="font-medium text-[var(--color-text)]">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-[var(--color-text-muted)] font-mono text-xs">{p.patientId}</td>
                    <td>{p.age}</td>
                    <td className="text-[var(--color-text-muted)]">{p.phone}</td>
                    <td className="text-[var(--color-text-muted)] text-sm">{doctorMap[p.assignedDoctorId] || '—'}</td>
                    <td className="text-[var(--color-text-muted)]">{formatDate(p.lastVisit)}</td>
                    <td className="text-[var(--color-text-muted)]">{formatDate(p.nextFollowUp)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <Link
                        to={`/admin/patients/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-medium"
                        aria-label={`View ${p.name}`}
                      >
                        <Eye size={13} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">Page {page} of {totalPages} · {total} results</span>
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
