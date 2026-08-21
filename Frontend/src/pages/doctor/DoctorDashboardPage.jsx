import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppointmentsList } from '../../app/store';
import { MOCK_NOTIFICATIONS } from '../../data/notifications';
import { MOCK_FOLLOW_UPS } from '../../data/diagnoses';
import { useAuth } from '../../hooks/useAuth';
import { formatTime, formatDate, today } from '../../utils/formatters';
import { StatusBadge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import { DOCTOR_DASHBOARD } from '../../data/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorDashboardPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const appointments = useSelector(state => state.appointments.list);

  useEffect(() => {
    dispatch(fetchAppointmentsList());
  }, [dispatch]);

  // Filter based on today's date and the logged-in doctor's ID
  const todayStr = today();
  const todayApts = appointments.filter(a => a.date === todayStr && a.doctorId === user?.id)
    .sort((a, b) => a.time.localeCompare(b.time));

  const followUps = MOCK_FOLLOW_UPS.filter(f => f.doctorId === user?.id || f.doctorId === 'DOC-001');
  const dueToday = followUps.filter(f => f.status === 'due-today');
  const upcoming = followUps.filter(f => f.status !== 'due-today');

  const { todayStats, weeklyAppointments } = DOCTOR_DASHBOARD;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="card p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, #0a5a8e 100%)' }}>
        <Avatar name={user?.name || ''} size="lg" />
        <div>
          <p className="text-white/80 text-sm">{greeting()},</p>
          <h1 className="text-xl font-semibold text-white">{user?.name}</h1>
          <p className="text-white/70 text-sm mt-0.5">Sunday, 18 August 2024 · {todayApts.length} appointments today</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Today's Appointments" value={todayApts.length} icon={Calendar} iconColor="text-[var(--color-primary-500)]" iconBg="bg-[var(--color-primary-50)]" />
        <KPICard label="In Progress" value={todayApts.filter(a => a.status === 'in-progress').length} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KPICard label="Completed Today" value={todayApts.filter(a => a.status === 'completed').length} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KPICard label="Follow-ups Due" value={dueToday.length} icon={Users} iconColor="text-red-500" iconBg="bg-red-50" trendLabel={dueToday.length > 0 ? 'Requires attention' : ''} />
      </div>

      {/* Today's appointments + follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment queue */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Today's Appointments</h2>
            <Link to="/doctor/appointments" className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]">View all</Link>
          </div>
          {todayApts.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" description="Enjoy your free day!" />
          ) : (
            <div className="space-y-2">
              {todayApts.map(apt => (
                <div key={apt.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${apt.status === 'in-progress' ? 'bg-amber-50 border-amber-200' : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}>
                  <div className="text-xs font-semibold text-[var(--color-primary-500)] w-14 flex-shrink-0 text-center">
                    {formatTime(apt.time)}
                  </div>
                  <Avatar name={apt.patientName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{apt.patientName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{apt.type} — {apt.reason}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                  <Link
                    to={`/doctor/patients/${apt.patientId}`}
                    className="text-xs px-2.5 h-7 flex items-center rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors whitespace-nowrap font-medium"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups sidebar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Follow-ups</h2>
            <Link to="/doctor/follow-ups" className="text-xs text-[var(--color-primary-500)]">View all</Link>
          </div>
          <div className="space-y-3">
            {followUps.slice(0, 5).map(fu => (
              <div key={fu.id} className="flex items-start gap-3 pb-3 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                <Avatar name={fu.patientName} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{fu.patientName}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{fu.reason}</p>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">{formatDate(fu.date)}</p>
                </div>
                <StatusBadge status={fu.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">My Weekly Appointments</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyAppointments}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="var(--color-primary-500)" radius={[4,4,0,0]} name="Appointments" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
