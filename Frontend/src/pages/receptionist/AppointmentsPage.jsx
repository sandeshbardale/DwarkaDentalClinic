import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppointmentsList, fetchPatientsList, bookAppointmentThunk, addToast } from '../../app/store';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime, today } from '../../utils/formatters';
import { Search, Plus, Calendar, Sparkles } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';

const STATUSES = ['all', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'];
const APPOINTMENT_TYPES = [
  'Consultation', 'Cleaning & Scaling', 'Cavity Filling', 'Root Canal',
  'Tooth Extraction', 'Orthodontic', 'X-Ray & Diagnosis', 'Other',
];

export default function AppointmentsPage() {
  const dispatch = useDispatch();
  const appointments = useSelector(state => state.appointments.list);
  const patients = useSelector(state => state.patients.list);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [suggestedApplied, setSuggestedApplied] = useState(false);
  const PER_PAGE = 12;

  const [form, setForm] = useState({
    patientId: '', doctorId: 'DOC-001', date: today(), time: '10:00', type: 'Consultation', reason: '', isEmergency: false,
  });

  useEffect(() => {
    dispatch(fetchAppointmentsList());
    dispatch(fetchPatientsList());
  }, [dispatch]);

  // Smart Scheduling Date Predictor
  function getSuggestedDate(type) {
    const intervals = {
      'Orthodontic': 28,
      'Root Canal': 10,
      'Tooth Extraction': 5,
      'Consultation': 30,
      'Cleaning & Scaling': 30,
      'Cavity Filling': 30,
      'X-Ray & Diagnosis': 30,
      'Other': 30,
    };
    const days = intervals[type] || 30;
    const target = new Date();
    target.setDate(target.getDate() + days);

    // Find nearest Mon (1) or Thu (4)
    let bestDate = new Date(target);
    let minDiff = Infinity;
    for (let offset = -3; offset <= 3; offset++) {
      const candidate = new Date(target);
      candidate.setDate(target.getDate() + offset);
      const day = candidate.getDay();
      if (day === 1 || day === 4) {
        const diff = Math.abs(offset);
        if (diff < minDiff) {
          minDiff = diff;
          bestDate = candidate;
        } else if (diff === minDiff && offset > 0) {
          bestDate = candidate;
        }
      }
    }
    return bestDate.toISOString().split('T')[0];
  }

  const handleTypeChange = (newType) => {
    const suggestion = getSuggestedDate(newType);
    setForm(f => ({ ...f, type: newType, date: suggestion }));
    setSuggestedApplied(true);
    setTimeout(() => setSuggestedApplied(false), 2500);
  };

  const handleEmergencyChange = (isEmergency) => {
    setForm(f => ({
      ...f,
      isEmergency,
      date: isEmergency ? today() : getSuggestedDate(f.type),
      time: isEmergency ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : f.time,
    }));
  };

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  async function handleBook() {
    if (!form.patientId || !form.doctorId || !form.date || !form.time) {
      dispatch(addToast({ type: 'error', title: 'Missing fields', message: 'Please fill in all required fields.' }));
      return;
    }
    try {
      await dispatch(bookAppointmentThunk(form));
      dispatch(addToast({
        type: 'success',
        title: form.isEmergency ? 'Emergency Visit Active' : 'Appointment Booked',
        message: `Successfully booked appointment for patient.`,
      }));
      setAddModal(false);
      setForm({ patientId: '', doctorId: 'DOC-001', date: today(), time: '10:00', type: 'Consultation', reason: '', isEmergency: false });
    } catch (e) {
      console.error(e);
    }
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
          <EmptyState icon={Calendar} title="No appointments found" action={<button onClick={() => setAddModal(true)} className="text-sm px-4 h-8 flex items-center gap-1 rounded-lg bg-[var(--color-primary-500)] text-white cursor-pointer"><Plus size={13} />Book Appointment</button>} />
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
                    <td className="text-sm">
                      {apt.notes && apt.notes.includes('EMERGENCY') ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs">🚨 Emergency</span>
                      ) : (
                        apt.type
                      )}
                    </td>
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
          <div className="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-200">
            <label className="flex items-center gap-2 text-sm text-red-800 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEmergency}
                onChange={e => handleEmergencyChange(e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              🚨 Mark as Emergency Visit (High Priority, Book for Today)
            </label>
          </div>

          <Select
            label="Patient" id="apt-patient" required
            options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.patientId})` }))}
            placeholder="Select patient"
            value={form.patientId}
            onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
          />
          
          <Select
            label="Doctor (Availability: Mon/Thu)" id="apt-doctor" required
            options={MOCK_DOCTORS.filter(d => d.status === 'active').map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))}
            placeholder="Select doctor"
            value={form.doctorId}
            onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
          />

          <Select
            label="Appointment / Treatment Type" id="apt-type"
            options={APPOINTMENT_TYPES}
            value={form.type}
            onChange={e => handleTypeChange(e.target.value)}
            disabled={form.isEmergency}
          />

          <div className="grid grid-cols-2 gap-3 relative">
            <div>
              <label htmlFor="apt-date" className="text-sm font-medium block mb-1">
                Date {suggestedApplied && <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-0.5"><Sparkles size={11}/> Smart scheduled!</span>}
              </label>
              <input
                id="apt-date"
                type="date"
                required
                min={today()}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="form-input text-sm"
                disabled={form.isEmergency}
              />
              {!form.isEmergency && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Prefilled with nearest Monday or Thursday based on treatment workflow.</p>}
            </div>
            <Input
              label="Time" id="apt-time" type="time" required
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>

          <Input label="Reason / Complaint" id="apt-reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for visit…" />
          
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAddModal(false)} className="text-sm px-4 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] cursor-pointer">Cancel</button>
            <button onClick={handleBook} className="text-sm px-4 h-9 rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] font-medium cursor-pointer">Book Appointment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
