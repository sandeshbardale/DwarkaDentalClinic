import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatientsList, fetchAppointmentsList, updateAppointmentStatusThunk, addToast } from '../../app/store';
import { Users, Calendar, UserPlus, Clock, CalendarCheck, Check, Send, AlertTriangle } from 'lucide-react';
import { KPICard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatTime, formatDate, today } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { api } from '../../utils/api';

export default function ReceptionistDashboardPage() {
  const dispatch = useDispatch();
  const patients = useSelector(state => state.patients.list);
  const appointments = useSelector(state => state.appointments.list);

  const [activeTab, setActiveTab] = useState('today'); // today, missed, upcoming
  const [sendingReminders, setSendingReminders] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [rescheForm, setRescheForm] = useState({ date: today(), time: '' });

  useEffect(() => {
    dispatch(fetchPatientsList());
    dispatch(fetchAppointmentsList());
  }, [dispatch]);

  const todayStr = today();

  // Classify Appointments
  const todayApts = appointments.filter(a => a.date === todayStr);
  const missedApts = appointments.filter(a => a.date < todayStr && (a.status === 'scheduled' || a.status === 'confirmed'));
  const upcomingApts = appointments.filter(a => a.date > todayStr);

  // KPIs
  const totalPatients = patients.length;
  const todayAppointments = todayApts.length;
  const missedCount = missedApts.length;
  const upcomingCount = upcomingApts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

  const quickActions = [
    { label: 'Register Patient', icon: UserPlus, to: '/receptionist/patients/new', color: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white' },
    { label: 'Book Appointment', icon: CalendarCheck, to: '/receptionist/appointments', color: 'bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white' },
    { label: 'Search Patient', icon: Users, to: '/receptionist/patients', color: 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]' },
    { label: "Today's Schedule", icon: Calendar, to: '/receptionist/appointments', color: 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]' },
  ];

  // Handler for visited action
  const handleMarkVisited = async (apt) => {
    try {
      const response = await dispatch(updateAppointmentStatusThunk(apt.id, 'completed'));
      if (response && response.success) {
        let msg = `Appointment for ${apt.patientName} completed.`;
        if (response.followUpAppointment) {
          msg += ` Next follow-up auto-scheduled on ${formatDate(response.followUpAppointment.date)}.`;
        }
        dispatch(addToast({ type: 'success', title: 'Status Updated', message: msg }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for dispatching Twilio reminders
  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const response = await api.sendWhatsAppReminders();
      if (response.success) {
        dispatch(addToast({
          type: 'success',
          title: 'Reminders Sent',
          message: `Dispatched ${response.processedCount} WhatsApp notifications for tomorrow's schedule successfully.`
        }));
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Reminder Dispatch Failed', message: err.message }));
    } finally {
      setSendingReminders(false);
    }
  };

  // Reschedule Trigger
  const openRescheduleModal = (apt) => {
    setRescheduleApt(apt);
    setRescheForm({ date: apt.date, time: apt.time });
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheForm.date || !rescheForm.time) {
      dispatch(addToast({ type: 'error', title: 'Missing parameters', message: 'Please select both date and time.' }));
      return;
    }
    try {
      await dispatch(updateAppointmentStatusThunk(rescheduleApt.id, 'rescheduled', rescheForm.date, rescheForm.time));
      dispatch(addToast({ type: 'success', title: 'Appointment Rescheduled', message: `Rescheduled ${rescheduleApt.patientName} to ${formatDate(rescheForm.date)} at ${formatTime(rescheForm.time)}.` }));
      setRescheduleApt(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting & Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Front Desk Overview</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleSendReminders}
          disabled={sendingReminders}
          className="flex items-center gap-2 text-xs font-semibold px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-60 transition-colors"
        >
          <Send size={14} className={sendingReminders ? 'animate-pulse' : ''} />
          {sendingReminders ? 'Sending Reminders...' : 'Send Tomorrow WhatsApp Reminders (Twilio)'}
        </button>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Patients" value={totalPatients} icon={Users} iconColor="text-[var(--color-primary-500)]" iconBg="bg-[var(--color-primary-50)]" />
        <KPICard label="Today's Patients" value={todayAppointments} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KPICard label="Missed (Call Needed)" value={missedCount} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" trendLabel={missedCount > 0 ? 'Needs Reschedule' : ''} />
        <KPICard label="Upcoming Appointments" value={upcomingCount} icon={Clock} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      {/* Schedule Classification System */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer relative ${activeTab === 'today' ? 'border-[var(--color-primary-500)] text-[var(--color-primary-500)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              Today ({todayAppointments})
            </button>
            <button
              onClick={() => setActiveTab('missed')}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer relative ${activeTab === 'missed' ? 'border-red-500 text-red-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              Missed ({missedCount})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer relative ${activeTab === 'upcoming' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              Upcoming ({upcomingCount})
            </button>
          </div>
          <Link to="/receptionist/appointments" className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]">View Appointment Book</Link>
        </div>

        {/* Tab contents */}
        {activeTab === 'today' && (
          todayApts.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments scheduled for today" />
          ) : (
            <div className="space-y-3">
              {todayApts.map(apt => (
                <div key={apt.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary-300)] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[var(--color-primary-500)] w-14">{formatTime(apt.time)}</span>
                    <Avatar name={apt.patientName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{apt.patientName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{apt.doctorName} · {apt.type} · {apt.reason || 'General check'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status} />
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => handleMarkVisited(apt)}
                          className="flex items-center gap-1 text-xs px-2.5 h-7 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors cursor-pointer"
                        >
                          <Check size={12} /> Mark Visited
                        </button>
                        <button
                          onClick={() => openRescheduleModal(apt)}
                          className="text-xs px-2.5 h-7 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text)] transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'missed' && (
          missedApts.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No missed appointments" description="Everyone attended their appointments, great job!" />
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200 mb-2">
                ⚠️ Missed Patients list. Call these patients to reschedule their appointments immediately.
              </div>
              {missedApts.map(apt => (
                <div key={apt.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-bg)] rounded-xl border border-red-100 hover:border-red-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-red-500 font-semibold w-16">{formatDate(apt.date)}</span>
                    <Avatar name={apt.patientName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{apt.patientName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{apt.doctorName} · {apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRescheduleModal(apt)}
                      className="text-xs px-3 h-7 rounded bg-red-100 text-red-800 hover:bg-red-200 font-semibold cursor-pointer"
                    >
                      Reschedule Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'upcoming' && (
          upcomingApts.length === 0 ? (
            <EmptyState icon={Calendar} title="No upcoming appointments" />
          ) : (
            <div className="space-y-3">
              {upcomingApts.slice(0, 10).map(apt => (
                <div key={apt.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary-300)] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-text-muted)] font-medium w-16">{formatDate(apt.date)}</span>
                    <span className="text-xs text-[var(--color-text-muted)] w-12">{formatTime(apt.time)}</span>
                    <Avatar name={apt.patientName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{apt.patientName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{apt.doctorName} · {apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status} />
                    <button
                      onClick={() => openRescheduleModal(apt)}
                      className="text-xs px-2.5 h-7 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] text-[var(--color-text)] cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Reschedule appointment modal */}
      {rescheduleApt && (
        <Modal open={!!rescheduleApt} onClose={() => setRescheduleApt(null)} title={`Reschedule Appointment — ${rescheduleApt.patientName}`} size="sm">
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-text-muted)]">Select the new date and time for the patient's appointment.</p>
            <div>
              <label htmlFor="res-date" className="text-sm font-medium block mb-1">New Date</label>
              <input
                id="res-date"
                type="date"
                required
                min={today()}
                value={rescheForm.date}
                onChange={e => setRescheForm(prev => ({ ...prev, date: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="res-time" className="text-sm font-medium block mb-1">New Time</label>
              <input
                id="res-time"
                type="time"
                required
                value={rescheForm.time}
                onChange={e => setRescheForm(prev => ({ ...prev, time: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setRescheduleApt(null)} className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer">Cancel</button>
              <button onClick={handleRescheduleSubmit} className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-medium cursor-pointer">Save New Date</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
