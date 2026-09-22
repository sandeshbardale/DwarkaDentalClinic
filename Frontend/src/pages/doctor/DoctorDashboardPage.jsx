import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, AlertTriangle, RefreshCw, Activity, Search, X, SearchX, Filter, Eye } from 'lucide-react';
import { StatusBadge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[var(--color-border)] rounded ${className}`} />;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'missed', label: 'Missed' },
];

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';

  const [todayApts, setTodayApts] = useState([]);
  const [upcomingApts, setUpcomingApts] = useState([]);
  const [allApts, setAllApts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [statusFilter, setStatusFilter] = useState('all');

  // Keep search input synced with URL search params (e.g. from top header)
  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSearchParams({}, { replace: true });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, todayRes, upcomingRes, allRes, staffRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: null })),
        api.getAppointments({ view: 'today',    limit: 200 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'upcoming', limit: 200 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'all',      limit: 500 }).catch(() => ({ data: [] })),
        api.getStaff().catch(() => ({ data: [] })),
      ]);

      setStats(dashRes.data);
      const todayList = todayRes.data?.data ?? (Array.isArray(todayRes.data) ? todayRes.data : []);
      const upcomingList = upcomingRes.data?.data ?? (Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
      const allList = allRes.data?.data ?? (Array.isArray(allRes.data) ? allRes.data : []);
      const sList = staffRes.data?.data ?? (Array.isArray(staffRes.data) ? staffRes.data : (Array.isArray(staffRes) ? staffRes : []));

      const doctorId = user?.id;
      setTodayApts(doctorId ? todayList.filter(a => a.doctorId === doctorId) : todayList);
      setUpcomingApts(doctorId ? upcomingList.filter(a => a.doctorId === doctorId) : upcomingList);
      setAllApts(doctorId ? allList.filter(a => a.doctorId === doctorId) : allList);

      const defaultStaff = [
        { id: 'stf-1', name: 'Dr. Admin', email: 'admin@dwarkadental.com', role: 'admin', phone: '+91 98765 00001' },
        { id: 'stf-2', name: 'Dr. Neha Sharma', email: 'doctor@dwarkadental.com', role: 'doctor', specialization: 'General Dentistry', phone: '+91 98765 00002' },
        { id: 'stf-3', name: 'Dr. Rohan Mehta', email: 'rohan@dwarkadental.com', role: 'doctor', specialization: 'Endodontics & RCT', phone: '+91 98765 00004' },
        { id: 'stf-4', name: 'Priya Patel', email: 'receptionist@dwarkadental.com', role: 'receptionist', phone: '+91 98765 00003' },
      ];
      setStaffList(sList.length > 0 ? sList : defaultStaff);
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time listeners — instant update when new patient is registered
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('storage', handler);
    window.addEventListener('ddc_patient_data_updated', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('ddc_patient_data_updated', handler);
      window.removeEventListener('focus', handler);
    };
  }, [loadData]);

  async function markArrived(aptId) {
    setActionLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, { status: 'arrived' });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  }

  async function markCompleted(aptId) {
    setActionLoading(aptId);
    try {
      await api.updateAppointmentStatus(aptId, { status: 'completed' });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  }

  // Matching helper function for search query
  const matchesSearch = (apt, q) => {
    if (!q) return true;
    const term = q.toLowerCase().trim();
    const name = (apt.patientName || '').toLowerCase();
    const phone = (apt.patientPhone || '').toLowerCase();
    const num = (apt.patientNumber || apt.appointmentNumber || apt.patientId || apt.id || '').toLowerCase();
    const cat = (apt.treatmentCategoryName || apt.categoryName || '').toLowerCase();
    const status = (apt.status || '').toLowerCase();
    const notes = (apt.notes || apt.chiefComplaint || '').toLowerCase();
    return name.includes(term) || phone.includes(term) || num.includes(term) || cat.includes(term) || status.includes(term) || notes.includes(term);
  };

  const matchesStatus = (apt, sFilter) => {
    if (sFilter === 'all') return true;
    return apt.status === sFilter;
  };

  const filteredToday = todayApts.filter(a => matchesSearch(a, searchQuery) && matchesStatus(a, statusFilter));
  const filteredUpcoming = upcomingApts.filter(a => matchesSearch(a, searchQuery) && matchesStatus(a, statusFilter));
  const filteredGlobal = allApts.filter(a => matchesSearch(a, searchQuery) && matchesStatus(a, statusFilter));

  const filteredStaff = staffList.filter(s => {
    if (!searchQuery.trim()) return false;
    const term = searchQuery.toLowerCase().trim();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.role || '').toLowerCase().includes(term) ||
      (s.specialization || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term)
    );
  });

  const isSearchActive = Boolean(searchQuery.trim() || statusFilter !== 'all');

  const kpis = stats ? [
    { label: "Today's Patients", value: todayApts.length, icon: Calendar, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', to: '/doctor/appointments' },
    { label: 'Completed Today', value: todayApts.filter(a => a.status === 'completed').length, icon: CheckCircle, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', onClick: () => setStatusFilter('completed') },
    { label: 'Waiting / Arrived', value: todayApts.filter(a => ['arrived', 'in_progress'].includes(a.status)).length, icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', onClick: () => setStatusFilter('arrived') },
    { label: 'Upcoming', value: upcomingApts.length, icon: Activity, iconColor: 'text-violet-500', iconBg: 'bg-violet-50', onClick: () => setStatusFilter('upcoming') },
  ] : [];

  const todayDateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting card */}
      <div className="card p-5 flex items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, #0a5a8e 100%)' }}>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name || 'Dr'} size="lg" />
          <div>
            <p className="text-white/80 text-sm">{greeting()},</p>
            <h1 className="text-white text-xl font-semibold">{user?.name || 'Doctor'}</h1>
            <p className="text-white/70 text-sm mt-0.5">{todayDateStr}</p>
          </div>
        </div>
        <button onClick={loadData} title="Refresh Dashboard" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Doctor Dashboard Search & Filter Module */}
      <div className="card p-4 space-y-3 bg-white shadow-2xs border border-[var(--color-border)]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by patient name, phone, appointment ID, treatment, or status..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:bg-white transition-all text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                title="Clear Search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Clear Button */}
          {isSearchActive && (
            <button
              onClick={handleClearSearch}
              className="btn btn-outline btn-sm text-xs flex items-center justify-center gap-1 py-2 cursor-pointer border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          <span className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={12} /> Status:
          </span>
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === sf.key
                  ? 'bg-[var(--color-primary-600)] text-white shadow-2xs font-semibold'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:bg-slate-200 hover:text-[var(--color-text)]'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Active Search Summary */}
        {isSearchActive && (
          <div className="flex items-center justify-between text-xs px-2 pt-1 border-t border-[var(--color-border)] text-[var(--color-primary-700)] font-medium">
            <span>
              Showing search results matching <strong className="underline">{searchQuery || statusFilter}</strong>:
            </span>
            <span className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-md font-bold">
              {filteredGlobal.length} total found
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>)
          : kpis.map(k => <KPICard key={k.label} {...k} />)
        }
      </div>

      {/* If search query is active and yields no results at all */}
      {!loading && isSearchActive && filteredGlobal.length === 0 && (
        <div className="card py-12 px-4 text-center">
          <EmptyState
            icon={SearchX}
            title={`No records found matching "${searchQuery || statusFilter}"`}
            description="Try searching with a different patient name, phone number, appointment ID, or treatment category."
          />
          <button
            onClick={handleClearSearch}
            className="mt-4 btn btn-primary btn-sm mx-auto cursor-pointer"
          >
            Clear Search & Show All Schedule
          </button>
        </div>
      )}

      {/* Today's Schedule */}
      {(!isSearchActive || filteredToday.length > 0) && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[var(--color-text)]">Today's Schedule</h2>
              {isSearchActive && (
                <span className="text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full font-semibold">
                  {filteredToday.length} matching
                </span>
              )}
            </div>
            <Link to="/doctor/appointments" className="text-xs text-[var(--color-primary-500)] hover:underline font-medium">View all</Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filteredToday.length === 0 ? (
            <div className="py-10">
              <EmptyState icon={Calendar} title="No matching appointments today" description={isSearchActive ? "No appointments today match your current search filter." : "Your schedule is clear for today."} />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredToday.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(apt => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-bg-subtle)] transition-colors">
                  <div className="text-center min-w-14">
                    <p className="text-sm font-semibold text-[var(--color-primary-600)]">{apt.time || '–'}</p>
                    {apt.patientNumber && <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{apt.patientNumber}</p>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/doctor/patients/${apt.patientId}`} className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary-600)] truncate">
                        {apt.patientName}
                      </Link>
                      {apt.patientPhone && (
                        <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                          ({apt.patientPhone})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{apt.treatmentCategoryName || 'General Consultation'}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                  <div className="flex gap-1.5 items-center">
                    {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                      <button onClick={() => markArrived(apt.id)} disabled={actionLoading === apt.id}
                        className="btn btn-outline btn-xs cursor-pointer">Mark Arrived</button>
                    ) : apt.status === 'arrived' || apt.status === 'in_progress' ? (
                      <button onClick={() => markCompleted(apt.id)} disabled={actionLoading === apt.id}
                        className="btn btn-primary btn-xs cursor-pointer">Complete</button>
                    ) : null}
                    <Link to={`/doctor/patients/${apt.patientId}`} className="btn btn-ghost btn-xs text-[var(--color-text-muted)]" title="View Patient Details">
                      <Eye size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Appointments */}
      {!loading && (!isSearchActive || filteredUpcoming.length > 0) && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[var(--color-text)]">Upcoming Appointments</h2>
              {isSearchActive && (
                <span className="text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full font-semibold">
                  {filteredUpcoming.length} matching
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {filteredUpcoming.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-bg-subtle)]">
                <div className="flex-1 min-w-0">
                  <Link to={`/doctor/patients/${apt.patientId}`} className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary-600)] truncate block">
                    {apt.patientName}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(apt.date)} · {apt.time} {apt.treatmentCategoryName ? `· ${apt.treatmentCategoryName}` : ''}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
                <Link to={`/doctor/patients/${apt.patientId}`} className="btn btn-outline btn-xs cursor-pointer">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Doctor Search Results (When searching for a patient not in Today or Upcoming) */}
      {!loading && isSearchActive && filteredGlobal.length > 0 && filteredToday.length === 0 && filteredUpcoming.length === 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <h2 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
              <Search size={16} className="text-[var(--color-primary-600)]" />
              All Matching Doctor Records ({filteredGlobal.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {filteredGlobal.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/doctor/patients/${apt.patientId}`} className="font-semibold text-[var(--color-primary-600)] hover:underline">
                      {apt.patientName}
                    </Link>
                    {apt.patientPhone && <span className="text-xs text-[var(--color-text-muted)]">({apt.patientPhone})</span>}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Date: {formatDate(apt.date)} · Time: {apt.time || '–'} · Category: {apt.treatmentCategoryName || 'General'}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
                <Link to={`/doctor/patients/${apt.patientId}`} className="btn btn-outline btn-xs cursor-pointer">View Profile</Link>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Matching Doctors & Staff Members */}
      {!loading && isSearchActive && filteredStaff.length > 0 && (
        <div className="card overflow-hidden bg-white border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-blue-50/50">
            <h2 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
              <Users size={16} className="text-[var(--color-primary-600)]" />
              Matching Doctors & Staff Members ({filteredStaff.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {filteredStaff.map(s => (
              <div key={s.id || s.email} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-bg-subtle)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--color-text)]">{s.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-blue-700">
                      {s.role}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {s.specialization ? `${s.specialization} · ` : ''}{s.email} {s.phone ? `· ${s.phone}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

