import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
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

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [todayApts, setTodayApts] = useState([]);
  const [upcomingApts, setUpcomingApts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, todayRes, upcomingRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAppointments({ view: 'today', limit: 20 }),
        api.getAppointments({ view: 'upcoming', limit: 5 }),
      ]);
      setStats(dashRes.data);
      const todayList = todayRes.data?.data ?? (Array.isArray(todayRes.data) ? todayRes.data : []);
      const upcomingList = upcomingRes.data?.data ?? (Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
      // Filter by this doctor's ID if available
      const doctorId = user?.id;
      setTodayApts(doctorId ? todayList.filter(a => a.doctorId === doctorId) : todayList);
      setUpcomingApts(doctorId ? upcomingList.filter(a => a.doctorId === doctorId) : upcomingList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

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

  const kpis = stats ? [
    { label: "Today's Patients", value: todayApts.length, icon: Calendar, iconColor: 'text-[var(--color-primary-500)]', iconBg: 'bg-[var(--color-primary-50)]' },
    { label: 'Completed Today', value: todayApts.filter(a => a.status === 'completed').length, icon: CheckCircle, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50' },
    { label: 'Waiting / Arrived', value: todayApts.filter(a => ['arrived', 'in_progress'].includes(a.status)).length, icon: Clock, iconColor: 'text-amber-500', iconBg: 'bg-amber-50' },
    { label: 'Upcoming', value: upcomingApts.length, icon: Activity, iconColor: 'text-violet-500', iconBg: 'bg-violet-50' },
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
        <button onClick={loadData} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-4 space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>)
          : kpis.map(k => <KPICard key={k.label} {...k} />)
        }
      </div>

      {/* Today's Schedule */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text)]">Today's Schedule</h2>
          <Link to="/doctor/appointments" className="text-xs text-[var(--color-primary-500)] hover:underline">View all</Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : todayApts.length === 0 ? (
          <div className="py-12">
            <EmptyState icon={Calendar} title="No appointments today" description="Your schedule is clear for today." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {todayApts.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(apt => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-bg-subtle)] transition-colors">
                <div className="text-center min-w-12">
                  <p className="text-sm font-semibold text-[var(--color-primary-600)]">{apt.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text)] truncate">{apt.patientName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{apt.treatmentCategoryName || 'General'}</p>
                </div>
                <StatusBadge status={apt.status} />
                <div className="flex gap-1">
                  {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                    <button onClick={() => markArrived(apt.id)} disabled={actionLoading === apt.id}
                      className="btn btn-outline btn-xs">Mark Arrived</button>
                  ) : apt.status === 'arrived' || apt.status === 'in_progress' ? (
                    <button onClick={() => markCompleted(apt.id)} disabled={actionLoading === apt.id}
                      className="btn btn-primary btn-xs">Complete</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      {!loading && upcomingApts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[var(--color-text)]">Upcoming Appointments</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {upcomingApts.map(apt => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-bg-subtle)]">
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-text)]">{apt.patientName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(apt.date)} · {apt.time}</p>
                </div>
                <StatusBadge status={apt.status} />
                <Link to={`/doctor/patients/${apt.patientId}`} className="btn btn-outline btn-xs">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
