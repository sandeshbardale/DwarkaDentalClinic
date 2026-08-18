import { useState } from 'react';
import { MOCK_APPOINTMENTS, APPOINTMENT_TYPES, TODAY } from '../../data/appointments';
import { MOCK_DOCTORS } from '../../data/doctors';
import { MOCK_PATIENTS } from '../../data/patients';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime, generateId, today } from '../../utils/formatters';
import { Search, Plus, Calendar } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useDispatch } from 'react-redux';
import { addToast } from '../../app/store';

const STATUSES = ['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];

export default function AppointmentsPage() {
  const dispatch = useDispatch();
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const [form, setForm] = useState({
    patientId: '', doctorId: '', date: today(), time: '', type: 'Consultation', reason: '',
  });

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  function handleBook() {
    const patient = MOCK_PATIENTS.find(p => p.id === form.patientId);
    const doctor = MOCK_DOCTORS.find(d => d.id === form.doctorId);
    if (!patient || !doctor || !form.date || !form.time) {
      dispatch(addToast({ type: 'error', title: 'Missing fields', message: 'Please fill in all required fields.' }));
      return;
    }
    const newApt = {
      id: generateId('APT'),
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: form.date,
      time: form.time,
      type: form.type,
      reason: form.reason,
      status: 'scheduled',
      duration: 30,
      notes: '',
    };
    setAppointments(prev => [newApt, ...prev]);
    dispatch(addToast({ type: 'success', title: 'Appointment Booked', message: `Appointment for ${patient.name} has been scheduled.` }));
    setAddModal(false);
    setForm({ patientId: '', doctorId: '', date: today(), time: '', type: 'Consultation', reason: '' });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Appointments</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{filtered.length} appointments</p>
        </div>
        <button onClick={() => setAddModal(true)} className="flex items-center gap-2 text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-medium transition-colors cursor-pointer">
          <Plus size={15} /> Book Appointment
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-[var(--color-text-muted)]" />
          <input type="search" placeholder="Search patient or doctor…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 text-sm bg-transparent outline-none" aria-label="Search appointments" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm bg-transparent outline-none cursor-pointer" aria-label="Filter by status">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {paginated.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments found" action={<button onClick={() => setAddModal(true)} className="text-sm px-4 h-8 flex items-center gap-1 rounded-lg bg-[var(--color-primary-500)] text-white"><Plus size={13} />Book Appointment</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" aria-label="Appointments table">
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paginated.map(apt => (
                  <tr key={apt.id}>
                    <td><div className="flex items-center gap-2"><Avatar name={apt.patientName} size="sm" /><span className="font-medium text-sm">{apt.patientName}</span></div></td>
                    <td className="text-sm text-[var(--color-text-muted)]">{apt.doctorName}</td>
                    <td className="text-sm">{formatDate(apt.date)}</td>
                    <td className="text-sm">{formatTime(apt.time)}</td>
                    <td className="text-sm">{apt.type}</td>
                    <td><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="text-xs px-3 h-7 rounded border border-[var(--color-border)] disabled:opacity-40 cursor-pointer">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="text-xs px-3 h-7 rounded border border-[var(--color-border)] disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Book appointment modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Book New Appointment" size="md">
        <div className="space-y-4">
          <Select
            label="Patient" id="apt-patient" required
            options={MOCK_PATIENTS.map(p => ({ value: p.id, label: `${p.name} (${p.patientId})` }))}
            placeholder="Select patient"
            value={form.patientId}
            onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
          />
          <Select
            label="Doctor" id="apt-doctor" required
            options={MOCK_DOCTORS.filter(d => d.status === 'active').map(d => ({ value: d.id, label: d.name }))}
            placeholder="Select doctor"
            value={form.doctorId}
            onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" id="apt-date" type="date" required min={today()} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Time" id="apt-time" type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <Select
            label="Appointment Type" id="apt-type"
            options={APPOINTMENT_TYPES}
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          />
          <Input label="Reason / Notes" id="apt-reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for visit…" />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAddModal(false)} className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer">Cancel</button>
            <button onClick={handleBook} className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-medium cursor-pointer">Book Appointment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
