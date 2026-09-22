import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users, Calendar, CheckCircle, AlertTriangle,
  DollarSign, Clock, TrendingUp, Activity,
  RefreshCw, Search, X, SearchX, UserCheck, Shield, Stethoscope, Phone, Mail, Filter
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { KPICard, Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate, today } from '../../utils/formatters';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

const COLORS = ['#0b6ba7', '#0d9c8e', '#f59e0b', '#ef4444', '#94a3b8'];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[var(--color-border)] rounded ${className}`} />;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';

  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [todayApts, setTodayApts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [allPatientsList, setAllPatientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [searchCategory, setSearchCategory] = useState('all'); // 'all' | 'patients' | 'appointments' | 'staff'

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
    setSearchCategory('all');
    setSearchParams({}, { replace: true });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let localCards = [];
    try {
      const keys = ['ddc_patient_cards_v2', 'ddc_patient_cards_v1', 'ddc_patient_cards'];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localCards = parsed;
            break;
          }
        }
      }
    } catch (e) { console.error(e); }

    const localTotalPaid = localCards.reduce((acc, c) => acc + (Number(c.amountPaid) || 0), 0);
    const localTodayPaid = localCards.filter(c => c.status === 'Today').reduce((acc, c) => acc + (Number(c.amountPaid) || 0), 0);
    const localTodayApts = localCards.filter(c => c.status === 'Today').length;
    const localCompletedApts = localCards.filter(c => c.paymentStatus === 'Paid' || c.status === 'Completed').length;
    const localMissedApts = localCards.filter(c => c.status === 'Missed').length;
    const localUpcomingApts = localCards.filter(c => c.status === 'Upcoming').length;

    const catCounts = {};
    for (const c of localCards) {
      const cat = c.categoryName || 'Orthodontic';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    const defaultCategoryBreakdown = [
      { id: 'cat-1', name: 'Root Canal', code: 'RCT', count: catCounts['Root Canal'] || 0 },
      { id: 'cat-2', name: 'Orthodontics', code: 'ORTHO', count: catCounts['Orthodontic'] || catCounts['Orthodontics'] || 0 },
      { id: 'cat-3', name: 'Extraction', code: 'EXT', count: catCounts['Extraction'] || 0 },
      { id: 'cat-4', name: 'Dental Implant', code: 'IMP', count: catCounts['Dental Implant'] || 0 },
      { id: 'cat-5', name: 'General Consultation', code: 'CONSULT', count: catCounts['General Consultation'] || 0 },
      { id: 'cat-6', name: 'Cavity Filling', code: 'FILL', count: catCounts['Cavity Filling'] || 0 },
    ];

    try {
      const [statsRes, patientsRes, todayAptsRes, missedAptsRes, staffRes] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getPatients({ limit: 500 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'today',  limit: 200 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'missed', limit: 200 }).catch(() => ({ data: [] })),
        api.getStaff().catch(() => ({ data: [] })),
      ]);

      const apiStats = statsRes?.data || {};

      // Robustly merge backend patients with local cards
      const pList = patientsRes?.data?.data || (Array.isArray(patientsRes?.data) ? patientsRes.data : []);
      const mergedMap = new Map();
      const phoneSet = new Set();
      // Add API patients first (authoritative)
      pList.forEach(p => {
        const key = (p.id || p._id || '').toString().toLowerCase();
        if (key) mergedMap.set(key, p);
        const phoneKey = (p.phone || '').replace(/\D/g, '');
        if (phoneKey.length >= 10) phoneSet.add(phoneKey);
      });

      // Helper: check if ID is a real MongoDB ObjectId (24 hex chars)
      const isRealMongoId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));
      const isDemoId = (id) => /^(apt|pat|stf)-/.test(String(id || ''));

      // Overlay local cards only if: real MongoDB ID + not already in API + not same phone as DB patient
      localCards.forEach(c => {
        const idKey = (c.id || '').toString().toLowerCase();
        const phoneKey = (c.patientPhone || c.phone || '').replace(/\D/g, '');

        if (isDemoId(idKey)) return;  // skip demo cards
        if (!isRealMongoId(idKey)) return;  // skip fake IDs
        if (mergedMap.has(idKey)) return;  // already from DB
        if (phoneKey.length >= 10 && phoneSet.has(phoneKey)) return;  // same phone already in DB

        const shaped = {
          id: c.id, patientNumber: c.patientNumber || c.id,
          name: c.patientName || c.name, phone: c.patientPhone || c.phone,
          email: c.email || '', gender: (c.gender || 'male').toLowerCase(),
          age: c.age || 0, status: 'new',
          registeredAt: c.createdAt || c.date || new Date().toISOString(),
          doctorName: c.doctorName || '',
        };
        mergedMap.set(idKey, shaped);
        if (phoneKey.length >= 10) phoneSet.add(phoneKey);
      });
      const formattedPatients = Array.from(mergedMap.values());


      // Appointment lists
      const todayList  = todayAptsRes?.data?.data  || (Array.isArray(todayAptsRes?.data)  ? todayAptsRes.data  : []);
      const missedList = missedAptsRes?.data?.data || (Array.isArray(missedAptsRes?.data) ? missedAptsRes.data : []);

      const finalStats = {
        totalPatients:          Math.max(formattedPatients.length, apiStats.totalPatients || 0),
        todayAppointments:      Math.max(localTodayApts,     todayList.length,  apiStats.todayAppointments  || 0),
        completedAppointments:  Math.max(localCompletedApts, apiStats.completedAppointments || 0),
        missedAppointments:     Math.max(localMissedApts,    missedList.length, apiStats.missedAppointments || 0),
        upcomingAppointments:   Math.max(localUpcomingApts,  apiStats.upcomingAppointments || 0),
        todayRevenue:           Math.max(localTodayPaid,  apiStats.todayRevenue  || 0),
        totalRevenue:           Math.max(localTotalPaid,  apiStats.totalRevenue  || 0),
        categoryBreakdown: (apiStats.categoryBreakdown && apiStats.categoryBreakdown.some(b => b.count > 0))
          ? apiStats.categoryBreakdown
          : defaultCategoryBreakdown,
      };

      setStats(finalStats);
      setRecentPatients(formattedPatients.slice(0, 10));
      setAllPatientsList(formattedPatients);
      setTodayApts(Array.isArray(todayList) ? todayList : []);

      const sList = staffRes?.data?.data || staffRes?.data || [];
      const defaultStaff = [
        { id: 'stf-1', name: 'Dr. Admin', email: 'admin@dwarkadental.com', role: 'admin', phone: '+91 98765 00001' },
        { id: 'stf-2', name: 'Dr. Neha Sharma', email: 'doctor@dwarkadental.com', role: 'doctor', specialization: 'General Dentistry', phone: '+91 98765 00002' },
        { id: 'stf-3', name: 'Dr. Rohan Mehta', email: 'rohan@dwarkadental.com', role: 'doctor', specialization: 'Endodontics & RCT', phone: '+91 98765 00004' },
        { id: 'stf-4', name: 'Priya Patel', email: 'receptionist@dwarkadental.com', role: 'receptionist', phone: '+91 98765 00003' },
      ];
      setStaffList(Array.isArray(sList) && sList.length > 0 ? sList : defaultStaff);

      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time listeners — reload when new patient registered
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

  // Search filtering logic
  const q = searchQuery.toLowerCase().trim();

  const filteredPatients = allPatientsList.filter(p => {
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.patientId || p.patientNumber || p.id || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  });

  const filteredApts = todayApts.filter(a => {
    if (!q) return true;
    return (
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.patientPhone || '').toLowerCase().includes(q) ||
      (a.doctorName || '').toLowerCase().includes(q) ||
      (a.treatmentCategoryName || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q) ||
      (a.appointmentNumber || '').toLowerCase().includes(q)
    );
  });

  const filteredStaff = staffList.filter(s => {
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q) ||
      (s.specialization || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q)
    );
  });

  const totalMatches = (q ? filteredPatients.length : 0) + (q ? filteredApts.length : 0) + (q ? filteredStaff.length : 0);
  const isSearchActive = Boolean(searchQuery.trim());

  const kpiCards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients?.toLocaleString('en-IN') ?? '–', icon: Users, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', trend: null, to: '/admin/patients' },
    { label: "Today's Appointments", value: stats.todayAppointments ?? '–', icon: Calendar, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', trend: null, to: '/admin/appointments' },
    { label: 'Completed Treatments', value: stats.completedAppointments?.toLocaleString('en-IN') ?? '–', icon: CheckCircle, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', trend: null, to: '/admin/appointments?status=completed' },
    { label: 'Missed Appointments', value: stats.missedAppointments ?? '–', icon: AlertTriangle, iconColor: 'text-red-500', iconBg: 'bg-red-50', trend: null, to: '/admin/appointments?status=missed' },
    { label: 'Upcoming Appointments', value: stats.upcomingAppointments ?? '–', icon: Clock, iconColor: 'text-violet-500', iconBg: 'bg-violet-50', trend: null, to: '/admin/appointments?status=upcoming' },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue ?? 0), icon: DollarSign, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', trend: null, to: '/admin/patients' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue ?? 0), icon: TrendingUp, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', trend: null, to: '/admin/patients' },
    { label: 'Active Staff Members', value: staffList.length || '4', icon: Activity, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-50', trend: null, to: '/admin/staff' },
  ] : [];

  const aptStatusData = stats ? [
    { name: 'Completed', value: stats.completedAppointments || 0 },
    { name: 'Upcoming', value: stats.upcomingAppointments || 0 },
    { name: "Today", value: stats.todayAppointments || 0 },
    { name: 'Missed', value: stats.missedAppointments || 0 },
  ] : [];

  const todayDateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Clinic Overview</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{todayDateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-outline btn-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Interactive Search & Filter Module */}
      <div className="card p-4 space-y-3 bg-white shadow-2xs border border-[var(--color-border)]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search across patients, appointments, doctors, and staff members..."
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
          {isSearchActive && (
            <button
              onClick={handleClearSearch}
              className="btn btn-outline btn-sm text-xs flex items-center justify-center gap-1 py-2 cursor-pointer border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          <span className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={12} /> Category:
          </span>
          {[
            { key: 'all', label: `All (${totalMatches})` },
            { key: 'patients', label: `Patients (${filteredPatients.length})` },
            { key: 'appointments', label: `Appointments (${filteredApts.length})` },
            { key: 'staff', label: `Staff & Doctors (${filteredStaff.length})` },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setSearchCategory(c.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                searchCategory === c.key
                  ? 'bg-[var(--color-primary-600)] text-white shadow-2xs font-semibold'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:bg-slate-200 hover:text-[var(--color-text)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isSearchActive && (
          <div className="flex items-center justify-between text-xs px-2 pt-1 border-t border-[var(--color-border)] text-[var(--color-primary-700)] font-medium">
            <span>
              Search query matching <strong className="underline">{searchQuery}</strong>:
            </span>
            <span className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-md font-bold">
              {totalMatches} matching results found
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          Failed to load dashboard data: {error}
          <button onClick={loadData} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
          : kpiCards.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))
        }
      </div>

      {/* Active Search No-Match Empty State */}
      {!loading && isSearchActive && totalMatches === 0 && (
        <div className="card py-12 px-4 text-center">
          <SearchX size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-semibold text-[var(--color-text)]">No matches found for "{searchQuery}"</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Try searching with a patient name, phone number, doctor name, or staff email.</p>
          <button onClick={handleClearSearch} className="mt-4 btn btn-primary btn-sm mx-auto cursor-pointer">
            Clear Search & Reset View
          </button>
        </div>
      )}

      {/* Staff & Doctors Search Match Section (when searching or staff tab selected) */}
      {!loading && (isSearchActive || searchCategory === 'staff') && (searchCategory === 'all' || searchCategory === 'staff') && filteredStaff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope size={18} className="text-[var(--color-primary-600)]" />
              Matching Doctors & Staff ({filteredStaff.length})
            </CardTitle>
            <Link to="/admin/doctors" className="text-xs text-[var(--color-primary-500)] hover:underline font-medium">Manage Doctors</Link>
          </CardHeader>
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-left">
                  <th className="py-2.5 font-medium">Name</th>
                  <th className="py-2.5 font-medium">Role</th>
                  <th className="py-2.5 font-medium">Specialization</th>
                  <th className="py-2.5 font-medium">Email</th>
                  <th className="py-2.5 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredStaff.map(s => (
                  <tr key={s.id || s.email} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                    <td className="py-2.5 font-semibold text-[var(--color-text)]">{s.name}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : s.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-[var(--color-text-muted)]">{s.specialization || '–'}</td>
                    <td className="py-2.5 text-[var(--color-text-muted)]">{s.email}</td>
                    <td className="py-2.5 text-[var(--color-text-muted)]">{s.phone || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Standard Charts Row */}
      {(!isSearchActive || searchCategory === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Appointment Status Pie */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Appointment Status</CardTitle></CardHeader>
            <div className="px-4 pb-4">
              {loading ? <Skeleton className="h-48" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={aptStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {aptStatusData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => v.toLocaleString('en-IN')} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Treatment Categories Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Treatment Categories Breakdown</CardTitle>
              <Link to="/admin/categories" className="text-xs text-[var(--color-primary-500)] hover:underline">Manage Categories</Link>
            </CardHeader>
            <div className="px-4 pb-4">
              {loading ? <Skeleton className="h-48" /> : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(stats?.categoryBreakdown || []).slice(0, 6).map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/admin/patients?categoryId=${cat.id}`}
                        className="p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-primary-300)] transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">{cat.code}</span>
                          <span className="text-xs font-semibold text-[var(--color-primary-600)]">{cat.count} patients</span>
                        </div>
                        <p className="text-xs font-medium text-[var(--color-text)] truncate">{cat.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Today's Appointments Section */}
      {(searchCategory === 'all' || searchCategory === 'appointments') && (!isSearchActive || filteredApts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} className="text-[var(--color-primary-600)]" />
              Today's Appointments {isSearchActive && `(${filteredApts.length} matching)`}
            </CardTitle>
            <Link to="/admin/appointments" className="text-xs text-[var(--color-primary-500)] hover:underline font-medium">View all</Link>
          </CardHeader>
          <div className="px-4 pb-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : filteredApts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No appointments match your search.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Patient</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Time</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Doctor</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Category</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApts.map((apt) => (
                    <tr key={apt.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                      <td className="py-2.5 font-medium">{apt.patientName}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{apt.time}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{apt.doctorName}</td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{apt.treatmentCategoryName || 'General'}</td>
                      <td className="py-2.5"><StatusBadge status={apt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* Registered Patients Section */}
      {(searchCategory === 'all' || searchCategory === 'patients') && (!isSearchActive || filteredPatients.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} className="text-[var(--color-primary-600)]" />
              {isSearchActive ? `Matching Patients (${filteredPatients.length})` : 'Recently Registered Patients'}
            </CardTitle>
            <Link to="/admin/patients" className="text-xs text-[var(--color-primary-500)] hover:underline font-medium">View all</Link>
          </CardHeader>
          <div className="px-4 pb-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No patients match your search.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Patient ID', 'Name', 'Phone', 'Status', 'Registered'].map((h) => (
                      <th key={h} className="text-left py-2 font-medium text-[var(--color-text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors">
                      <td className="py-2.5 text-[var(--color-text-muted)] font-mono text-xs">{p.patientId || `PAT-${p.id}`}</td>
                      <td className="py-2.5 font-semibold">
                        <Link to={`/admin/patients/${p.id}`} className="text-[var(--color-primary-600)] hover:underline">{p.name}</Link>
                      </td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{p.phone}</td>
                      <td className="py-2.5"><StatusBadge status={p.status} /></td>
                      <td className="py-2.5 text-[var(--color-text-muted)]">{formatDate(p.registeredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

