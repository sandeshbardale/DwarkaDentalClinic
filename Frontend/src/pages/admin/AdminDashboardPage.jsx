import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPatients } from '../../app/store';
import { setAppointments } from '../../app/store';
import { setNotifications } from '../../app/store';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_APPOINTMENTS } from '../../data/appointments';
import { MOCK_NOTIFICATIONS } from '../../data/notifications';
import { ADMIN_DASHBOARD } from '../../data/dashboard';
import { MOCK_REVENUE } from '../../data/revenue';
import { MOCK_DOCTORS } from '../../data/doctors';
import {
  Users, Calendar, CheckCircle, Stethoscope, UserCog,
  DollarSign, Clock, TrendingUp,
} from 'lucide-react';
import { KPICard } from '../../components/ui/Card';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../../components/ui/Badge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Avatar from '../../components/ui/Avatar';
import { Link } from 'react-router-dom';

const KPI_CONFIG = [
  { key: 'totalPatients', label: 'Total Patients', icon: Users, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]', format: v => v.toLocaleString('en-IN'), trend: 12, trendLabel: '+12 this month' },
  { key: 'todayAppointments', label: "Today's Appointments", icon: Calendar, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', trend: 0 },
  { key: 'completedTreatments', label: 'Completed Treatments', icon: CheckCircle, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', format: v => v.toLocaleString('en-IN'), trend: 5, trendLabel: '+5 this week' },
  { key: 'totalDoctors', label: 'Total Doctors', icon: Stethoscope, iconColor: 'text-[var(--color-accent-500)]', iconBg: 'bg-[var(--color-accent-50)]' },
  { key: 'activeReceptionists', label: 'Active Staff', icon: UserCog, iconColor: 'text-violet-500', iconBg: 'bg-violet-50' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: DollarSign, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', format: v => formatCurrency(v), trend: 3.2, trendLabel: '+3.2% vs last month' },
  { key: 'pendingFollowUps', label: 'Pending Follow-ups', icon: Clock, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  { key: 'newPatientsThisMonth', label: 'New Patients (Aug)', icon: TrendingUp, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]' },
];

const COLORS = ['#0b6ba7', '#0d9c8e', '#f59e0b', '#ef4444', '#94a3b8'];

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { kpis, patientRegistrations, appointmentTrend, appointmentStatusDistribution, doctorWorkload } = ADMIN_DASHBOARD;

  useEffect(() => {
    dispatch(setPatients(MOCK_PATIENTS));
    dispatch(setAppointments(MOCK_APPOINTMENTS));
    dispatch(setNotifications(MOCK_NOTIFICATIONS));
  }, [dispatch]);

  const todayApts = MOCK_APPOINTMENTS
    .filter(a => a.date === '2024-08-18')
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Clinic Overview</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Sunday, 18 August 2024</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CONFIG.map(cfg => (
          <KPICard
            key={cfg.key}
            label={cfg.label}
            value={cfg.format ? cfg.format(kpis[cfg.key]) : kpis[cfg.key]}
            icon={cfg.icon}
            iconColor={cfg.iconColor}
            iconBg={cfg.iconBg}
            trendLabel={cfg.trendLabel}
          />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2 card p-5">
          <CardHeader>
            <CardTitle>Revenue Trend (2024)</CardTitle>
            <span className="text-xs text-[var(--color-text-muted)]">Monthly ₹</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_REVENUE.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0b6ba7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0b6ba7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0b6ba7" strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment status pie */}
        <div className="card p-5">
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={appointmentStatusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {appointmentStatusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {appointmentStatusDistribution.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[var(--color-text-muted)]">{d.name}</span>
                </div>
                <span className="font-medium text-[var(--color-text)]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient registrations */}
        <div className="card p-5">
          <CardHeader>
            <CardTitle>New Patient Registrations</CardTitle>
            <span className="text-xs text-[var(--color-text-muted)]">Monthly count</span>
          </CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={patientRegistrations} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--color-accent-500)" radius={[4,4,0,0]} name="Registrations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor workload */}
        <div className="card p-5">
          <CardHeader>
            <CardTitle>Doctor Workload (This Month)</CardTitle>
          </CardHeader>
          <div className="space-y-3 mt-2">
            {doctorWorkload.map(d => {
              const max = Math.max(...doctorWorkload.map(x => x.appointments));
              const pct = (d.appointments / max) * 100;
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[70%]">{d.name.replace('Dr. ', '')}</span>
                    <span className="text-xs font-semibold text-[var(--color-text)]">{d.appointments} apts</span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: d.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card p-5">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/admin/appointments" className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]">View all</Link>
          </CardHeader>
          <div className="space-y-3">
            {todayApts.map(apt => (
              <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                <div className="text-xs text-[var(--color-text-muted)] w-14 flex-shrink-0 font-medium">
                  {apt.time}
                </div>
                <Avatar name={apt.patientName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{apt.patientName}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{apt.type} · {apt.doctorName.replace('Dr. ', 'Dr. ')}</p>
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by treatment */}
        <div className="card p-5">
          <CardHeader>
            <CardTitle>Revenue by Treatment</CardTitle>
            <Link to="/admin/revenue" className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]">View all</Link>
          </CardHeader>
          <div className="space-y-3">
            {MOCK_REVENUE.byTreatment.map(t => {
              const total = MOCK_REVENUE.byTreatment.reduce((s, x) => s + x.value, 0);
              const pct = ((t.value / total) * 100).toFixed(0);
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-sm text-[var(--color-text-muted)] flex-1 truncate">{t.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{pct}%</span>
                  <span className="text-sm font-medium text-[var(--color-text)] w-24 text-right">{formatCurrency(t.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
