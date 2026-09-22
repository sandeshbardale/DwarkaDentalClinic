import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Eye, ChevronUp, ChevronDown, Loader2, RefreshCw, Filter, LayoutGrid, List, Tag, Users, Trash2 } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { ConfirmModal } from '../../components/ui/Modal';
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
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.getCategories({ status: 'active' })
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      // Read set of deleted patients
      let deletedSet = new Set();
      try {
        const raw = localStorage.getItem('ddc_deleted_patients');
        if (raw) {
          const arr = JSON.parse(raw);
          const cleaned = Array.isArray(arr) ? arr.filter(x => !String(x).startsWith('phone:') && !String(x).startsWith('name:')) : [];
          if (Array.isArray(arr) && cleaned.length !== arr.length) {
            localStorage.setItem('ddc_deleted_patients', JSON.stringify(cleaned));
          }
          cleaned.forEach(x => {
            deletedSet.add(String(x));
            deletedSet.add(String(x).toLowerCase());
          });
        }
      } catch (_) {}

      const isPatientDeleted = (id) => {
        if (!id) return false;
        const str = String(id).toLowerCase();
        return deletedSet.has(str) || deletedSet.has(String(id));
      };

      const res = await api.getPatients({
        search, status: statusFilter, categoryId: categoryFilter, sortBy, sortOrder, page, limit: 200,
      });
      const result = res.data;
      const apiList = result?.data ?? (Array.isArray(result) ? result : []);

      // Build map keyed by MongoDB ID — these are authoritative
      const map = new Map();
      // Also track by normalized phone to deduplicate local cards against DB patients
      const phoneSet = new Set();
      apiList.forEach(p => {
        const id = (p.id || p._id || '').toString();
        if (p.isDeleted || isPatientDeleted(id) || isPatientDeleted(p.patientNumber)) return;
        if (id) map.set(id.toLowerCase(), p);
        const phone = (p.phone || '').replace(/\D/g, '');
        if (phone.length >= 10) phoneSet.add(phone);
      });

      // Only include local cards that have a real MongoDB ObjectId (24-hex)
      // and are not already represented in the API response (by ID or phone)
      const isRealMongoId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));
      const isDemoId = (id) => /^(apt|pat|stf)-/.test(String(id || ''));

      let localCards = [];
      try {
        const raw = localStorage.getItem('ddc_patient_cards_v2');
        if (raw) localCards = JSON.parse(raw);
      } catch (_) {}

      localCards.forEach(c => {
        const cId = (c.id || c._id || '').toString();
        const cPhone = (c.patientPhone || c.phone || '').replace(/\D/g, '');
        const cName = (c.patientName || c.name || '').toLowerCase().trim();

        if (isPatientDeleted(cId)) return;
        // Skip demo/fake cards
        if (isDemoId(cId)) return;
        // Skip if already in API list (by MongoDB ID)
        if (isRealMongoId(cId) && map.has(cId.toLowerCase())) return;
        // Skip if same phone already in DB (avoid duplicate)
        if (cPhone.length >= 10 && phoneSet.has(cPhone)) return;

        // Apply category filter if active
        if (categoryFilter) {
          const filterCatObj = categories.find(cat => cat.id === categoryFilter);
          const filterCatName = (filterCatObj?.name || '').toLowerCase();
          const cardCatName = (c.treatmentCategoryName || c.categoryName || '').toLowerCase();
          const cardCatId = String(c.treatmentCategoryId || '');
          if (cardCatId !== String(categoryFilter) && (!filterCatName || !cardCatName.includes(filterCatName))) {
            return;
          }
        }

        // Only add if it has a real MongoDB ID (recently registered patient not yet server-fetched)
        if (isRealMongoId(cId)) {
          map.set(cId.toLowerCase(), {
            id: cId,
            patientId: cId,
            patientNumber: c.patientNumber || '',
            name: c.patientName || c.name || '',
            phone: c.patientPhone || c.phone || '',
            email: c.email || '',
            gender: (c.gender || 'male').toLowerCase(),
            age: c.age || 0,
            status: 'new',
            treatmentCategoryId: c.treatmentCategoryId || '',
            treatmentCategoryName: c.treatmentCategoryName || c.categoryName || 'General Consultation',
            categoryName: c.categoryName || c.treatmentCategoryName || 'General Consultation',
            registeredAt: c.createdAt || c.date || new Date().toISOString(),
            doctorName: c.doctorName || '',
            totalVisits: 0,
          });
          if (cPhone.length >= 10) phoneSet.add(cPhone);
        }
      });

      const combined = Array.from(map.values());
      setPatients(combined);
      setPagination(result?.pagination
        ? { ...result.pagination, total: Math.max(combined.length, result.pagination.total || 0) }
        : { page: 1, limit: 200, total: combined.length, totalPages: 1 }
      );
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder, page]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const p = deleteTarget;
    setDeleteTarget(null);

    const idToDelete = p.id || p._id;
    const phoneClean = (p.phone || '').replace(/\D/g, '');
    const nameClean = (p.name || '').toLowerCase().trim();

    // 1. Remove from state immediately
    setPatients(prev => prev.filter(item => {
      if (item.id === idToDelete) return false;
      const iPhone = (item.phone || '').replace(/\D/g, '');
      const iName = (item.name || '').toLowerCase().trim();
      if (phoneClean && iPhone && iPhone === phoneClean) return false;
      if (nameClean && iName && iName === nameClean) return false;
      return true;
    }));

    // 2. Remove from local storage
    const storageKeys = ['ddc_patient_cards_v2', 'ddc_patient_cards_v1', 'ddc_patient_cards', 'dwarka_patients', 'patients'];
    storageKeys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const filtered = arr.filter(c => {
              const cId = c.id || c._id;
              const cPhone = (c.patientPhone || c.phone || '').replace(/\D/g, '');
              const cName = (c.patientName || c.name || '').toLowerCase().trim();
              if (cId === idToDelete) return false;
              if (phoneClean && cPhone === phoneClean) return false;
              if (nameClean && cName === nameClean) return false;
              return true;
            });
            localStorage.setItem(k, JSON.stringify(filtered));
          }
        }
      } catch (_) {}
    });

    // 3. Track deleted in ddc_deleted_patients (ID only, never blacklist phone or name)
    try {
      const deletedArr = JSON.parse(localStorage.getItem('ddc_deleted_patients') || '[]');
      const toAdd = [String(idToDelete).toLowerCase()];
      toAdd.forEach(item => { if (!deletedArr.includes(item)) deletedArr.push(item); });
      localStorage.setItem('ddc_deleted_patients', JSON.stringify(deletedArr));
    } catch (_) {}

    // 4. Delete on backend
    try {
      if (idToDelete) {
        await api.deletePatient(idToDelete).catch(() => null);
      }
      const aptsRes = await api.getAppointmentsByPatient(idToDelete).catch(() => null);
      const aptList = aptsRes?.data?.data || aptsRes?.data || [];
      if (Array.isArray(aptList)) {
        for (const a of aptList) {
          if (a.id && !['completed', 'cancelled'].includes(a.status)) {
            await api.updateAppointmentStatus(a.id, { status: 'cancelled' }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete patient on backend:', err);
    }

    // 5. Broadcast real-time update
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('ddc_patient_data_updated', {
      detail: { action: 'delete', patientId: idToDelete, phone: phoneClean, name: nameClean }
    }));
  };


  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Live real-time updates when patients are registered or modified
  useEffect(() => {
    const handleDataUpdate = (e) => {
      if (e?.detail?.action === 'delete') {
        const delId = e.detail.patientId;
        const delMongoId = e.detail.mongoPatientId;
        const delPhone = (e.detail.phone || '').replace(/\D/g, '');
        const delName = (e.detail.name || '').toLowerCase().trim();
        setPatients(prev => prev.filter(p => {
          if (delId && (p.id === delId || p._id === delId || p.patientId === delId)) return false;
          if (delMongoId && (p.id === delMongoId || p._id === delMongoId || p.patientId === delMongoId)) return false;
          const iPhone = (p.phone || '').replace(/\D/g, '');
          const iName = (p.name || '').toLowerCase().trim();
          if (delPhone && iPhone && iPhone === delPhone) return false;
          if (delName && iName && iName === delName) return false;
          return true;
        }));
      } else if (e?.detail?.patient || e?.detail?.card) {
        const item = e.detail.patient || e.detail.card;
        const newP = {
          id: (item.id || item._id || `pat-${Date.now()}`).toString(),
          patientId: item.patientNumber || item.patientId || item.id || item._id || '',
          patientNumber: item.patientNumber || item.patientId || '',
          name: item.name || item.patientName || '',
          phone: item.phone || item.patientPhone || '',
          email: item.email || '',
          gender: (item.gender || 'male').toLowerCase(),
          age: item.age || 0,
          status: item.status || 'new',
          treatmentCategoryId: item.treatmentCategoryId || '',
          treatmentCategoryName: item.treatmentCategoryName || item.categoryName || 'General Consultation',
          categoryName: item.categoryName || item.treatmentCategoryName || 'General Consultation',
          registeredAt: item.registeredAt || item.createdAt || new Date().toISOString(),
          doctorName: item.doctorName || '',
          totalVisits: item.totalVisits || 0,
        };

        setPatients(prev => {
          const cleanPPhone = (newP.phone || '').replace(/\D/g, '');
          const filtered = prev.filter(p => {
            if (p.id && newP.id && String(p.id).toLowerCase() === String(newP.id).toLowerCase()) return false;
            const pPhone = (p.phone || '').replace(/\D/g, '');
            if (cleanPPhone && pPhone && cleanPPhone === pPhone) return false;
            return true;
          });
          return [newP, ...filtered];
        });
      }
      fetchPatients();
    };

    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('ddc_patient_data_updated', handleDataUpdate);
    window.addEventListener('focus', handleDataUpdate);

    // Periodic real-time background sync every 12s
    const pollInterval = setInterval(() => {
      fetchPatients();
    }, 12000);

    return () => {
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('ddc_patient_data_updated', handleDataUpdate);
      window.removeEventListener('focus', handleDataUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchPatients]);

  // Sync categoryFilter and q from URL searchParam
  useEffect(() => {
    const paramCat = searchParams.get('categoryId');
    if (paramCat !== null && paramCat !== categoryFilter) {
      setCategoryFilter(paramCat);
      setPage(1);
    }
    const qParam = searchParams.get('q');
    if (qParam !== null && qParam !== searchInput) {
      setSearchInput(qParam || '');
      setSearch(qParam || '');
      setPage(1);
    }
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      if (searchInput.trim()) {
        const currentParams = Object.fromEntries(searchParams.entries());
        setSearchParams({ ...currentParams, q: searchInput.trim() }, { replace: true });
      }
    }, 400);
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
            <Link
              to={categoryFilter ? `/receptionist/register?categoryId=${categoryFilter}` : "/receptionist/register"}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
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
                    <Link
                      to={`/receptionist/register?categoryId=${cat.id}`}
                      onClick={e => e.stopPropagation()}
                      className="hover:underline font-semibold flex items-center gap-0.5 text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-2 py-0.5 rounded"
                      title={`Register patient under ${cat.name}`}
                    >
                      + Register
                    </Link>
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
                    {['Patient ID', 'Name', 'Phone', 'Gender', 'Treatment Category', 'Status', 'Last Visit', 'Next Follow-up', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-[var(--color-border)] rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
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
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <Tag size={11} />
                            {p.treatmentCategoryName || p.categoryName || 'General Consultation'}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.lastVisit ? formatDate(p.lastVisit) : '–'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.nextFollowUp ? formatDate(p.nextFollowUp) : '–'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Link to={`/${role}/patients/${p.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
                              <Eye size={13} /> View
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="btn btn-ghost btn-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete Patient"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* Delete Patient Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient Record"
        message={`Are you sure you want to delete "${deleteTarget?.name || 'this patient'}"? All associated appointments will also be cancelled.`}
        confirmLabel="Delete Patient"
        variant="danger"
      />
    </div>
  );
}
