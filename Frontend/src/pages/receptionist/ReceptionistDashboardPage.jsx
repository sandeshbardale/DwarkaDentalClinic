import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPatients, setAppointments, setNotifications } from '../../app/store';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_APPOINTMENTS, TODAY } from '../../data/appointments';
import { MOCK_NOTIFICATIONS } from '../../data/notifications';
import { MOCK_FOLLOW_UPS } from '../../data/diagnoses';
import { RECEPTIONIST_DASHBOARD } from '../../data/dashboard';
import { useAuth } from '../../hooks/useAuth';
import { Users, Calendar, UserPlus, Clock, CalendarCheck } from 'lucide-react';
import { KPICard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatTime, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';

export default function ReceptionistDashboardPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  useEffect(() => {
    dispatch(setPatients(MOCK_PATIENTS));
    dispatch(setAppointments(MOCK_APPOINTMENTS));
    dispatch(setNotifications(MOCK_NOTIFICATIONS));
  }, [dispatch]);

  const todayApts = MOCK_APPOINTMENTS.filter(a => a.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
  const dueFollowUps = MOCK_FOLLOW_UPS.filter(f => f.status === 'due-today' || f.status === 'due-tomorrow');
  const { kpis } = RECEPTIONIST_DASHBOARD;

  const quickActions = [
    { label: 'Register Patient', icon: UserPlus, to: '/receptionist/patients/new', color: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white' },
    { label: 'Book Appointment', icon: CalendarCheck, to: '/receptionist/appointments', color: 'bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white' },
    { label: 'Search Patient', icon: Users, to: '/receptionist/patients', color: 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]' },
    { label: "Today's Schedule", icon: Calendar, to: '/receptionist/appointments', color: 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Good morning, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Sunday, 18 August 2024 · Front Desk Overview</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, to, color }) => (
          <Link key={label} to={to} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${color}`}>
            <Icon size={22} />
            <span className="text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Total Patients" value={kpis.totalPatients} icon={Users} iconColor="text-[var(--color-primary-500)]" iconBg="bg-[var(--color-primary-50)]" />
        <KPICard label="Today's Appointments" value={kpis.todayAppointments} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KPICard label="New Registrations" value={kpis.newRegistrationsToday} icon={UserPlus} iconColor="text-emerald-600" iconBg="bg-emerald-50" trendLabel="Today" />
        <KPICard label="Pending Appointments" value={kpis.pendingAppointments} icon={Clock} iconColor="text-[var(--color-accent-500)]" iconBg="bg-[var(--color-accent-50)]" />
        <KPICard label="Follow-ups Due Today" value={kpis.followUpsDueToday} icon={CalendarCheck} iconColor="text-red-500" iconBg="bg-red-50" trendLabel={kpis.followUpsDueToday > 0 ? 'Needs attention' : ''} />
        <KPICard label="Follow-ups Tomorrow" value={kpis.followUpsDueTomorrow} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Today's Appointments</h2>
            <Link to="/receptionist/appointments" className="text-xs text-[var(--color-primary-500)]">View all</Link>
          </div>
          {todayApts.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" />
          ) : (
            <div className="space-y-2">
              {todayApts.slice(0, 6).map(apt => (
                <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="text-xs text-[var(--color-primary-500)] font-semibold w-12 flex-shrink-0">{formatTime(apt.time)}</span>
                  <Avatar name={apt.patientName} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{apt.patientName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{apt.doctorName} · {apt.type}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-ups due */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Follow-ups Due</h2>
            <Link to="/receptionist/follow-ups" className="text-xs text-[var(--color-primary-500)]">View all</Link>
          </div>
          {dueFollowUps.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No follow-ups due" description="All clear for today and tomorrow." />
          ) : (
            <div className="space-y-3">
              {dueFollowUps.map(fu => (
                <div key={fu.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                  <Avatar name={fu.patientName} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{fu.patientName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{fu.reason}</p>
                  </div>
                  <StatusBadge status={fu.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
