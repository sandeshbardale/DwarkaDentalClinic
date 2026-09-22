import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar, Search, RefreshCw, AlertTriangle, Clock, X, Edit3, ChevronDown, ChevronRight, Tag, Users
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

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

const STATUS_COLORS = {
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  arrived:     'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  missed:      'bg-rose-50 text-rose-700 border-rose-200',
  cancelled:   'bg-slate-100 text-slate-500 border-slate-200',
  rescheduled: 'bg-violet-50 text-violet-700 border-violet-200',
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  // Derive initial view from URL params (?view=today|missed|upcoming|all, ?status=missed etc.)
  const getInitialView = () => {
    const viewParam = searchParams.get('view');
    const statusParam = searchParams.get('status');
    if (viewParam && ['today', 'upcoming', 'missed', 'all'].includes(viewParam)) return viewParam;
    if (statusParam === 'missed') return 'missed';
    return 'today';
  };

  const [view, setView] = useState(getInitialView);
  const [allApts,      setAllApts]      = useState([]);   // raw all
  const [todayApts,    setTodayApts]    = useState([]);
  const [upcomingApts, setUpcomingApts] = useState([]);
  const [missedApts,   setMissedApts]   = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [actionLoading,  setActionLoading] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [error,          setError]         = useState(null);
  const [search,         setSearch]        = useState(searchParams.get('q') || '');
  const [expandedCats,   setExpandedCats]  = useState({});
  const [catFilter,      setCatFilter]     = useState('');
  const [categories,     setCategories]    = useState([]);

  // Keep view in sync with URL
  useEffect(() => {
    const vp = searchParams.get('view');
    const sp = searchParams.get('status');
    if (vp && ['today', 'upcoming', 'missed', 'all'].includes(vp)) setView(vp);
    else if (sp === 'missed') setView('missed');
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const fetchApts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all 4 views in parallel for instant count badges
      const [allRes, todayRes, upcomingRes, missedRes, catsRes] = await Promise.all([
        api.getAppointments({ view: 'all',      limit: 500 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'today',    limit: 200 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'upcoming', limit: 200 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'missed',   limit: 200 }).catch(() => ({ data: [] })),
        api.getCategories({ status: 'active' }).catch(() => ({ data: [] })),
      ]);

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

      const isAptDeleted = (a) => {
        if (!a) return true;
        const pId = String(a.patientId || '').toLowerCase();
        const aId = String(a.id || a._id || '').toLowerCase();
        if (pId && deletedSet.has(pId)) return true;
        if (aId && deletedSet.has(aId)) return true;
        return false;
      };

      const extract = (res) => (res?.data?.data ?? (Array.isArray(res?.data) ? res.data : [])).filter(a => !isAptDeleted(a));

      setAllApts(extract(allRes));
      setTodayApts(extract(todayRes));
      setUpcomingApts(extract(upcomingRes));
      setMissedApts(extract(missedRes));

      const cats = catsRes?.data || [];
      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchApts(); }, [fetchApts]);

  // Real-time listeners: refresh when new patient registered or tab focused
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.action === 'delete') {
        const delId = String(e.detail.patientId || '').toLowerCase();
        const delMongoId = String(e.detail.mongoPatientId || '').toLowerCase();
        const delPhone = (e.detail.phone || '').replace(/\D/g, '');
        const delName = (e.detail.name || '').toLowerCase().trim();
        const filterOut = (list) => list.filter(a => {
          const aPid = String(a.patientId || '').toLowerCase();
          const aId = String(a.id || a._id || '').toLowerCase();
          if (delId && (aPid === delId || aId === delId)) return false;
          if (delMongoId && (aPid === delMongoId || aId === delMongoId)) return false;
          const aPhone = (a.patientPhone || '').replace(/\D/g, '');
          const aName = (a.patientName || '').toLowerCase().trim();
          if (delPhone && aPhone && delPhone === aPhone) return false;
          if (delName && aName && delName === aName) return false;
          return true;
        });
        setAllApts(filterOut);
        setTodayApts(filterOut);
        setUpcomingApts(filterOut);
        setMissedApts(filterOut);
      } else if (e?.detail?.appointment || e?.detail?.card) {
        const apt = e.detail.appointment;
        const card = e.detail.card;
        const todayIso = new Date().toISOString().split('T')[0];
        const aptDate = apt?.date || card?.date || todayIso;
        const isToday = aptDate === todayIso;
        const isUpcoming = aptDate >= todayIso;

        const newApt = {
          id: apt?.id || card?.id || `apt-${Date.now()}`,
          appointmentNumber: apt?.appointmentNumber || `APT-2026-${Math.floor(100 + Math.random() * 900)}`,
          patientId: apt?.patientId || card?.id || '',
          patientName: apt?.patientName || card?.patientName || '',
          patientPhone: apt?.patientPhone || card?.patientPhone || '',
          doctorId: apt?.doctorId || '',
          doctorName: apt?.doctorName || card?.doctorName || 'Dr. Bhagwan Rakh',
          treatmentCategoryName: apt?.treatmentCategoryName || card?.treatmentCategoryName || card?.categoryName || 'General Consultation',
          treatmentCategoryId: apt?.treatmentCategoryId || card?.treatmentCategoryId || '',
          date: aptDate,
          time: apt?.time || '10:00',
          type: 'Consultation',
          status: apt?.status || 'scheduled',
          notes: apt?.notes || card?.chiefComplaint || '',
        };

        const filterDedup = (list) => list.filter(a => {
          if (a.id && newApt.id && String(a.id) === String(newApt.id)) return false;
          const aPhone = (a.patientPhone || '').replace(/\D/g, '');
          const newPhone = (newApt.patientPhone || '').replace(/\D/g, '');
          if (aPhone && newPhone && aPhone === newPhone && a.date === newApt.date) return false;
          return true;
        });

        setAllApts(prev => [newApt, ...filterDedup(prev)]);
        if (isToday) setTodayApts(prev => [newApt, ...filterDedup(prev)]);
        if (isUpcoming) setUpcomingApts(prev => [newApt, ...filterDedup(prev)]);
      }
      fetchApts();
    };

    window.addEventListener('storage', handler);
    window.addEventListener('ddc_patient_data_updated', handler);
    window.addEventListener('focus', handler);

    // Periodic real-time background sync every 12s
    const pollInterval = setInterval(() => {
      fetchApts();
    }, 12000);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('ddc_patient_data_updated', handler);
      window.removeEventListener('focus', handler);
      clearInterval(pollInterval);
    };
  }, [fetchApts]);

  const handleViewChange = (key) => {
    setView(key);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('view', key);
      next.delete('status');
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val.trim()) next.set('q', val.trim()); else next.delete('q');
      return next;
    }, { replace: true });
  };

  // Which appointments are displayed for the current view
  const currentApts = (() => {
    switch (view) {
      case 'today':    return todayApts;
      case 'upcoming': return upcomingApts;
      case 'missed':   return missedApts;
      default:         return allApts;
    }
  })();

  // Apply search + category filter
  const filtered = currentApts.filter(a => {
    if (catFilter && a.treatmentCategoryId !== catFilter && a.treatmentCategoryName !== catFilter) {
      // try name match too
      const cat = categories.find(c => c.id === catFilter);
      if (!cat || (a.treatmentCategoryName || '').toLowerCase() !== (cat.name || '').toLowerCase()) return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.patientPhone || '').toLowerCase().includes(q) ||
      (a.doctorName || '').toLowerCase().includes(q) ||
      (a.appointmentNumber || '').toLowerCase().includes(q) ||
      (a.treatmentCategoryName || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q)
    );
  });

  // Group by category
  const grouped = {};
  filtered.forEach(a => {
    const cat = a.treatmentCategoryName || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });
  const groupKeys = Object.keys(grouped).sort();

  const toggleCat = (cat) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

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
    if (p === 'emergency') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">🚨 Emergency</span>;
    if (p === 'high')      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">⚡ High</span>;
    return null;
  };

  const VIEW_TABS = [
    { key: 'today',    label: 'Today',    icon: Calendar,       count: todayApts.length,    color: 'text-amber-600' },
    { key: 'upcoming', label: 'Upcoming', icon: Clock,          count: upcomingApts.length, color: 'text-blue-600'  },
    { key: 'missed',   label: 'Missed',   icon: AlertTriangle,  count: missedApts.length,   color: 'text-rose-600'  },
    { key: 'all',      label: 'All',      icon: Users,          count: allApts.length,      color: 'text-slate-600' },
  ];

  const viewLabels = { today: "Today's", upcoming: "Upcoming", missed: "Missed", all: "All" };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Appointments</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${filtered.length} ${viewLabels[view] || ''} appointment${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={fetchApts} className="btn btn-outline btn-sm flex items-center gap-1">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* View Tabs with live counts */}
      <div className="flex flex-wrap gap-1 bg-[var(--color-bg-subtle)] p-1 rounded-xl w-fit">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleViewChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white shadow text-[var(--color-primary-600)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {Icon && <Icon size={14} className={active ? tab.color : ''} />}
              {tab.label}
              {!loading && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${
                  active
                    ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + Category Filter Row */}
      <div className="flex flex-wrap gap-3">
        <div className="card p-3 flex items-center gap-2 flex-1 min-w-[260px]">
          <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <input
            type="search"
            placeholder="Search by patient, doctor, category, or appointment ID…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-[var(--color-text)]"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category filter dropdown */}
        {categories.length > 0 && (
          <div className="card p-2.5 flex items-center gap-2">
            <Tag size={14} className="text-[var(--color-text-muted)]" />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="text-sm bg-transparent outline-none text-[var(--color-text)] cursor-pointer pr-1"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-3 border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 space-y-3">
              <div className="h-4 bg-[var(--color-border)] rounded w-1/4 animate-pulse" />
              <div className="h-3 bg-[var(--color-border)] rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-[var(--color-border)] rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <EmptyState
            icon={Calendar}
            title={`No ${viewLabels[view] || ''} appointments`}
            description={search || catFilter ? 'Try clearing your search or category filter.' : 'No appointments match this view.'}
          />
        </div>
      )}

      {/* Category-wise grouped appointment cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {groupKeys.map(catName => {
            const catApts = grouped[catName];
            const isOpen = expandedCats[catName] !== false; // default open
            return (
              <div key={catName} className="card overflow-hidden border border-[var(--color-border)]">
                {/* Category header */}
                <button
                  onClick={() => toggleCat(catName)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border)] transition-colors border-b border-[var(--color-border)]"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={15} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={15} className="text-[var(--color-text-muted)]" />}
                    <span className="font-semibold text-sm text-[var(--color-text)]">{catName}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)]">
                      {catApts.length}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {catApts.filter(a => a.status === 'completed').length} completed
                    {catApts.filter(a => a.status === 'missed').length > 0 && ` · ${catApts.filter(a => a.status === 'missed').length} missed`}
                  </span>
                </button>

                {/* Appointments table for this category */}
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                        <tr>
                          {['Apt #', 'Patient', 'Doctor', 'Date', 'Time', 'Status', 'Priority', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)] whitespace-nowrap text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {catApts.map((apt) => {
                          const actions = STATUS_ACTIONS[apt.status] || [];
                          const statusCls = STATUS_COLORS[apt.status] || 'bg-slate-50 text-slate-600 border-slate-200';
                          return (
                            <tr key={apt.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                                {apt.appointmentNumber || '–'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-[var(--color-text)] whitespace-nowrap">{apt.patientName || '–'}</div>
                                {apt.patientPhone && <div className="text-xs text-[var(--color-text-muted)]">{apt.patientPhone}</div>}
                              </td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{apt.doctorName || '–'}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{apt.date ? formatDate(apt.date) : '–'}</td>
                              <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{apt.time || '–'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusCls}`}>
                                  {(apt.status || '').replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3">{priorityBadge(apt.priority)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {actionLoading === apt.id ? (
                                    <span className="text-xs text-[var(--color-text-muted)]">Updating…</span>
                                  ) : (
                                    <>
                                      {actions.map(action =>
                                        action === 'rescheduled'
                                          ? <button key={action} onClick={() => setRescheduleTarget(apt)} className="btn btn-outline btn-xs">Reschedule</button>
                                          : <button key={action} onClick={() => handleStatusChange(apt.id, action)} className="btn btn-outline btn-xs capitalize">{action.replace('_', ' ')}</button>
                                      )}
                                      {apt.patientId && (
                                        <Link to={`/${role || 'admin'}/patients/${apt.patientId}`} className="btn btn-outline btn-xs">View</Link>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rescheduleTarget && (
        <RescheduleModal apt={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onConfirm={handleReschedule} />
      )}
    </div>
  );
}
