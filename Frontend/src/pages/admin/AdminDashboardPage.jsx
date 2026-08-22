import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, CheckCircle, AlertTriangle,
  DollarSign, Clock, TrendingUp, Activity,
  RefreshCw,
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
  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [todayApts, setTodayApts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

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
      const [statsRes, patientsRes, apts] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getPatients({ sortBy: 'registeredAt', sortOrder: 'desc', limit: 5 }).catch(() => ({ data: [] })),
        api.getAppointments({ view: 'today', limit: 10 }).catch(() => ({ data: [] })),
      ]);

      const apiStats = statsRes?.data || {};

      const finalStats = {
        totalPatients: Math.max(localCards.length, apiStats.totalPatients || 0),
        todayAppointments: Math.max(localTodayApts, apiStats.todayAppointments || 0),
        completedAppointments: Math.max(localCompletedApts, apiStats.completedAppointments || 0),
        missedAppointments: Math.max(localMissedApts, apiStats.missedAppointments || 0),
        upcomingAppointments: Math.max(localUpcomingApts, apiStats.upcomingAppointments || 0),
        todayRevenue: Math.max(localTodayPaid, apiStats.todayRevenue || 0),
        totalRevenue: Math.max(localTotalPaid, apiStats.totalRevenue || 0),
        categoryBreakdown: (apiStats.categoryBreakdown && apiStats.categoryBreakdown.some(b => b.count > 0))
          ? apiStats.categoryBreakdown
          : defaultCategoryBreakdown
      };

      setStats(finalStats);
      const pList = patientsRes?.data?.data || patientsRes?.data || [];
      setRecentPatients(Array.isArray(pList) && pList.length > 0 ? pList : localCards.slice(0, 5).map(c => ({ id: c.id, name: c.patientName, phone: c.patientPhone, status: 'active', patientId: `PAT-2026-${c.id}` })));
      const aList = apts?.data?.data || apts?.data || [];
      setTodayApts(Array.isArray(aList) ? aList : []);
      setLastRefresh(new Date());
    } catch (err) {
      setStats({
        totalPatients: localCards.length,
        todayAppointments: localTodayApts,
        completedAppointments: localCompletedApts,
        missedAppointments: localMissedApts,
        upcomingAppointments: localUpcomingApts,
        todayRevenue: localTodayPaid,
        totalRevenue: localTotalPaid,
        categoryBreakdown: defaultCategoryBreakdown
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const kpiCards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients?.toLocaleString('en-IN') ?? '–', icon: Users, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', trend: null },
    { label: "Today's Appointments", value: stats.todayAppointments ?? '–', icon: Calendar, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', trend: null },
    { label: 'Completed Treatments', value: stats.completedAppointments?.toLocaleString('en-IN') ?? '–', icon: CheckCircle, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', trend: null },
    { label: 'Missed Appointments', value: stats.missedAppointments ?? '–', icon: AlertTriangle, iconColor: 'text-red-500', iconBg: 'bg-red-50', trend: null },
    { label: 'Upcoming Appointments', value: stats.upcomingAppointments ?? '–', icon: Clock, iconColor: 'text-violet-500', iconBg: 'bg-violet-50', trend: null },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue ?? 0), icon: DollarSign, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', trend: null },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue ?? 0), icon: TrendingUp, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', trend: null },
    { label: 'Active Sessions', value: '1', icon: Activity, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-50', trend: null },
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
            className="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
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

      {/* Charts Row */}
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

        {/* Treatment Categories Breakdown (Orthodontics, RCT, Prostho, etc.) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Treatment Categories Breakdown</CardTitle>
            <Link to="/admin/categories" className="text-xs text-[var(--color-primary-500)] hover:underline">Manage Categories</Link>
          </CardHeader>
          <div className="px-4 pb-4">
            {loading ? <Skeleton className="h-48" /> : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(stats?.categoryBreakdown || []).slice(0, 6).map((cat, idx) => (
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

        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/admin/appointments" className="text-xs text-[var(--color-primary-500)] hover:underline">View all</Link>
          </CardHeader>
          <div className="px-4 pb-4 overflow-x-auto">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : todayApts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No appointments scheduled today.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Patient</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Time</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Doctor</th>
                    <th className="text-left py-2 font-medium text-[var(--color-text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayApts.map((apt) => (
                    <tr key={apt.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)]">
                      <td className="py-2 font-medium">{apt.patientName}</td>
                      <td className="py-2 text-[var(--color-text-muted)]">{apt.time}</td>
                      <td className="py-2 text-[var(--color-text-muted)]">{apt.doctorName}</td>
                      <td className="py-2"><StatusBadge status={apt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Registered Patients</CardTitle>
          <Link to="/admin/patients" className="text-xs text-[var(--color-primary-500)] hover:underline">View all</Link>
        </CardHeader>
        <div className="px-4 pb-4 overflow-x-auto">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : recentPatients.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">No patients registered yet.</p>
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
                {recentPatients.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)]">
                    <td className="py-2 text-[var(--color-text-muted)] font-mono text-xs">{p.patientId}</td>
                    <td className="py-2 font-medium">
                      <Link to={`/admin/patients/${p.id}`} className="hover:text-[var(--color-primary-500)]">{p.name}</Link>
                    </td>
                    <td className="py-2 text-[var(--color-text-muted)]">{p.phone}</td>
                    <td className="py-2"><StatusBadge status={p.status} /></td>
                    <td className="py-2 text-[var(--color-text-muted)]">{formatDate(p.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
