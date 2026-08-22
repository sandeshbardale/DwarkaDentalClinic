import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Eye, ChevronUp, ChevronDown, Loader2, RefreshCw, Filter, LayoutGrid, List, Tag, Users } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'completed', label: 'Completed' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { value: 'registeredAt', label: 'Date Registered' },
  { value: 'name', label: 'Name' },
  { value: 'lastVisit', label: 'Last Visit' },
  { value: 'nextFollowUp', label: 'Next Follow-up' },
];

export default function PatientsPage() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'category-grid'
  const [patients, setPatients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    api.getCategories({ status: 'active' })
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPatients({
        search, status: statusFilter, categoryId: categoryFilter, sortBy, sortOrder, page, limit: 15,
      });
      const result = res.data;
      setPatients(result?.data ?? (Array.isArray(result) ? result : []));
      if (result?.pagination) setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Sync categoryFilter with URL searchParam
  useEffect(() => {
    const paramCat = searchParams.get('categoryId');
    if (paramCat !== null && paramCat !== categoryFilter) {
      setCategoryFilter(paramCat);
      setPage(1);
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const activeCategoryObj = categories.find(c => c.id === categoryFilter);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            {activeCategoryObj ? `${activeCategoryObj.name} Patients` : 'Patients'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${pagination.total.toLocaleString('en-IN')} patients found`}
            {activeCategoryObj && (
              <button
                onClick={() => { setCategoryFilter(''); setSearchParams({}); }}
                className="ml-2 text-xs text-[var(--color-primary-500)] underline"
              >
                Clear category filter
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              title="Table View"
              className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'list' ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('category-grid')}
              title="Category-Wise View"
              className={`p-1.5 rounded text-sm transition-colors ${viewMode === 'category-grid' ? 'bg-white shadow text-[var(--color-primary-600)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {(role === 'receptionist' || role === 'admin') && (
            <Link to="/receptionist/register" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Plus size={15} /> Register Patient
            </Link>
          )}
        </div>
      </div>

      {/* Category Grid Mode */}
      {viewMode === 'category-grid' ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)] font-medium">Select a Treatment Category to view its patients:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map(cat => {
              const isSelected = categoryFilter === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setCategoryFilter(isSelected ? '' : cat.id);
                    setSearchParams(isSelected ? {} : { categoryId: cat.id });
                    setViewMode('list');
                  }}
                  className={`card p-5 cursor-pointer hover:shadow-md transition-all border-2 ${isSelected ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]' : 'border-transparent hover:border-[var(--color-border)]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                      {cat.code}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{cat.defaultDurationMinutes} min</span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)] text-base mb-1">{cat.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">
                    Follow-up: {cat.defaultFollowUpDays === 0 ? 'None' : `${cat.defaultFollowUpDays} days`}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-primary-600)] font-medium">
                    <span className="flex items-center gap-1"><Users size={13} /> View Patients</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Mode */
        <>
          {/* Filters */}
          <div className="card p-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-48">
              <Search size={16} className="text-[var(--color-text-muted)]" />
              <input
                type="search"
                placeholder="Search by name, ID, or phone…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => {
                const val = e.target.value;
                setCategoryFilter(val);
                setSearchParams(val ? { categoryId: val } : {});
                setPage(1);
              }}
              className="text-sm border border-[var(--color-border)] rounded px-3 py-1.5 bg-[var(--color-bg)] text-[var(--color-text)]"
            >
              <option value="">All Treatment Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm border border-[var(--color-border)] rounded px-3 py-1.5 bg-[var(--color-bg)] text-[var(--color-text)]"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={e => {
                const [f, o] = e.target.value.split(':');
                setSortBy(f); setSortOrder(o); setPage(1);
              }}
              className="text-sm border border-[var(--color-border)] rounded px-3 py-1.5 bg-[var(--color-bg)] text-[var(--color-text)]"
            >
              {SORT_OPTIONS.map(o => (
                <>
                  <option key={`${o.value}:desc`} value={`${o.value}:desc`}>{o.label} ↓</option>
                  <option key={`${o.value}:asc`} value={`${o.value}:asc`}>{o.label} ↑</option>
                </>
              ))}
            </select>

            <button onClick={fetchPatients} className="btn btn-outline btn-sm flex items-center gap-1">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                  <tr>
                    {['Patient ID', 'Name', 'Phone', 'Gender', 'Status', 'Last Visit', 'Next Follow-up', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-[var(--color-border)] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <EmptyState
                          icon={Users}
                          title={categoryFilter ? `No patients in "${activeCategoryObj?.name || 'this category'}"` : "No patients found"}
                          description="Try adjusting your search, filters, or category selection."
                        />
                      </td>
                    </tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{p.patientId}</td>
                        <td className="px-4 py-3 font-medium text-[var(--color-text)]">{p.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.phone}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize">{p.gender || '–'}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.lastVisit ? formatDate(p.lastVisit) : '–'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.nextFollowUp ? formatDate(p.nextFollowUp) : '–'}</td>
                        <td className="px-4 py-3">
                          <Link to={`/${role}/patients/${p.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
                            <Eye size={13} /> View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] text-sm">
                <span className="text-[var(--color-text-muted)]">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline btn-xs">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="btn btn-outline btn-xs">Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
