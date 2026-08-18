import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, CheckCircle, Pill, Calendar, FileText, ClipboardList, Phone, MapPin } from 'lucide-react';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_CLINICAL_RECORDS } from '../../data/diagnoses';
import { MOCK_DOCTORS } from '../../data/doctors';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime, generateId } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { useDispatch } from 'react-redux';
import { addToast } from '../../app/store';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'history', label: 'Visit History', icon: ClipboardList },
  { id: 'record', label: 'New Clinical Record', icon: Plus },
];

export default function PatientDetailPage({ basePath = '/doctor' }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState(MOCK_CLINICAL_RECORDS.filter(r => r.patientId === id));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Clinical record form state
  const [form, setForm] = useState({
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    clinicalNotes: '',
    followUpDate: '',
    followUpInstructions: '',
    prescriptions: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
  });

  const patient = MOCK_PATIENTS.find(p => p.id === id);
  const doctor = MOCK_DOCTORS.find(d => d.id === patient?.assignedDoctorId);

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <Link to={`${basePath}/patients`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
          <ArrowLeft size={15} /> Back
        </Link>
        <EmptyState title="Patient not found" />
      </div>
    );
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updatePrescription(index, field, value) {
    setForm(prev => {
      const rxs = [...prev.prescriptions];
      rxs[index] = { ...rxs[index], [field]: value };
      return { ...prev, prescriptions: rxs };
    });
  }

  function addPrescription() {
    setForm(prev => ({ ...prev, prescriptions: [...prev.prescriptions, { medicine: '', dosage: '', duration: '', instructions: '' }] }));
  }

  function removePrescription(index) {
    setForm(prev => ({ ...prev, prescriptions: prev.prescriptions.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    if (!form.diagnosis || !form.treatment) {
      dispatch(addToast({ type: 'error', title: 'Required fields missing', message: 'Diagnosis and treatment are required.' }));
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));

    const newRecord = {
      id: generateId('CLN'),
      patientId: id,
      appointmentId: null,
      doctorId: 'DOC-001',
      doctorName: 'Dr. Neha Sharma',
      visitDate: '2024-08-18',
      ...form,
      prescription: form.prescriptions.filter(rx => rx.medicine),
      status: 'completed',
    };
    setRecords(prev => [newRecord, ...prev]);
    setSaving(false);
    setSaved(true);
    setActiveTab('history');
    dispatch(addToast({ type: 'success', title: 'Record Saved', message: `Clinical record for ${patient.name} has been saved.` }));
    // Reset form
    setForm({ chiefComplaint: '', diagnosis: '', treatment: '', clinicalNotes: '', followUpDate: '', followUpInstructions: '', prescriptions: [{ medicine: '', dosage: '', duration: '', instructions: '' }] });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to={`${basePath}/patients`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
        <ArrowLeft size={15} /> Back to Patients
      </Link>

      {/* Patient header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={patient.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="text-sm text-[var(--color-text-muted)] font-mono mb-3">{patient.patientId}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-[var(--color-text-subtle)]">Age / Gender</p><p className="font-medium">{patient.age} · {patient.gender}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Blood Group</p><p className="font-medium">{patient.bloodGroup}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Allergies</p><p className={`font-medium ${patient.allergies !== 'None' ? 'text-amber-600' : ''}`}>{patient.allergies}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Total Visits</p><p className="font-medium">{patient.totalVisits}</p></div>
            </div>
            {patient.medicalHistory && patient.medicalHistory !== 'No significant medical history' && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg mt-3 border border-red-100 inline-block">
                ⚠️ Medical History: {patient.medicalHistory}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'border-[var(--color-primary-500)] text-[var(--color-primary-500)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            <tab.icon size={14} /> {tab.label}
            {tab.id === 'record' && <span className="ml-1 w-5 h-5 rounded-full bg-[var(--color-primary-500)] text-white text-[9px] flex items-center justify-center">New</span>}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]"><Phone size={13} />{patient.phone}</div>
              <div className="flex items-start gap-2 text-[var(--color-text-muted)]"><MapPin size={13} className="mt-0.5" />{patient.address}</div>
            </div>
          </div>
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Clinical Summary</h2>
            <div className="space-y-2 text-sm">
              <div><span className="text-xs text-[var(--color-text-subtle)]">Chief Complaint: </span>{patient.chiefComplaint}</div>
              <div><span className="text-xs text-[var(--color-text-subtle)]">Last Visit: </span>{formatDate(patient.lastVisit)}</div>
              <div><span className="text-xs text-[var(--color-text-subtle)]">Next Follow-up: </span>{formatDate(patient.nextFollowUp)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Visit history tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No clinical records" description="Use 'New Clinical Record' tab to add the first record." />
          ) : (
            records.map(rec => (
              <div key={rec.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(rec.visitDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{rec.doctorName}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Complaint</p><p>{rec.chiefComplaint}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Diagnosis</p><p className="font-medium text-[var(--color-text)]">{rec.diagnosis}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Treatment</p><p>{rec.treatment}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Notes</p><p className="text-[var(--color-text-muted)]">{rec.clinicalNotes}</p></div>
                </div>
                {rec.prescription?.length > 0 && (
                  <div className="bg-[var(--color-bg)] rounded-lg p-3 border border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 flex items-center gap-1"><Pill size={11} /> Prescription</p>
                    {rec.prescription.map((rx, i) => (
                      <p key={i} className="text-sm"><span className="font-medium">{rx.medicine}</span> — {rx.dosage}, {rx.duration}. {rx.instructions}</p>
                    ))}
                  </div>
                )}
                {rec.followUpDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <Calendar size={12} /> Follow-up: {formatDate(rec.followUpDate)} — {rec.followUpInstructions}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* New clinical record tab */}
      {activeTab === 'record' && (
        <div className="card p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--color-text)]">New Clinical Record — {formatDate('2024-08-18')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="complaint" className="text-sm font-medium block mb-1">Chief Complaint <span className="text-red-500">*</span></label>
              <input id="complaint" value={form.chiefComplaint} onChange={e => updateForm('chiefComplaint', e.target.value)} className="form-input" placeholder="Patient's presenting complaint…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="diagnosis" className="text-sm font-medium block mb-1">Diagnosis <span className="text-red-500">*</span></label>
              <textarea id="diagnosis" value={form.diagnosis} onChange={e => updateForm('diagnosis', e.target.value)} className="form-textarea" rows={2} placeholder="Clinical diagnosis…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="treatment" className="text-sm font-medium block mb-1">Treatment / Procedure <span className="text-red-500">*</span></label>
              <textarea id="treatment" value={form.treatment} onChange={e => updateForm('treatment', e.target.value)} className="form-textarea" rows={2} placeholder="Procedure performed…" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium block mb-1">Clinical Notes</label>
              <textarea id="notes" value={form.clinicalNotes} onChange={e => updateForm('clinicalNotes', e.target.value)} className="form-textarea" rows={3} placeholder="Observations, patient response, instructions given…" />
            </div>
            <div>
              <label htmlFor="followUpDate" className="text-sm font-medium block mb-1">Follow-up Date</label>
              <input id="followUpDate" type="date" value={form.followUpDate} onChange={e => updateForm('followUpDate', e.target.value)} className="form-input" min="2024-08-19" />
            </div>
            <div>
              <label htmlFor="followUpInstr" className="text-sm font-medium block mb-1">Follow-up Instructions</label>
              <input id="followUpInstr" value={form.followUpInstructions} onChange={e => updateForm('followUpInstructions', e.target.value)} className="form-input" placeholder="e.g., Crown fitting appointment" />
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium flex items-center gap-2"><Pill size={14} /> Prescriptions</label>
              <button onClick={addPrescription} className="text-xs px-3 h-7 rounded-lg border border-[var(--color-primary-200)] text-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] cursor-pointer">+ Add Medicine</button>
            </div>
            <div className="space-y-3">
              {form.prescriptions.map((rx, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                  <input value={rx.medicine} onChange={e => updatePrescription(i, 'medicine', e.target.value)} className="form-input text-sm" placeholder="Medicine name" aria-label="Medicine name" />
                  <input value={rx.dosage} onChange={e => updatePrescription(i, 'dosage', e.target.value)} className="form-input text-sm" placeholder="Dosage" aria-label="Dosage" />
                  <input value={rx.duration} onChange={e => updatePrescription(i, 'duration', e.target.value)} className="form-input text-sm" placeholder="Duration" aria-label="Duration" />
                  <div className="flex gap-1">
                    <input value={rx.instructions} onChange={e => updatePrescription(i, 'instructions', e.target.value)} className="form-input text-sm flex-1" placeholder="Instructions" aria-label="Instructions" />
                    {form.prescriptions.length > 1 && (
                      <button onClick={() => removePrescription(i)} className="text-red-400 hover:text-red-600 px-1.5 cursor-pointer" aria-label="Remove prescription">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 h-9 rounded-lg bg-[var(--color-primary-500)] text-white text-sm font-medium hover:bg-[var(--color-primary-600)] disabled:opacity-60 cursor-pointer transition-colors"
            >
              {saving ? 'Saving…' : <><Save size={14} /> Save Clinical Record</>}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <CheckCircle size={16} /> Record saved!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
