// Receptionist patient detail — shares same component as admin view
import PatientDetailPage from '../admin/PatientDetailPage';
import { useParams } from 'react-router-dom';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_DOCTORS } from '../../data/doctors';
import { MOCK_APPOINTMENTS } from '../../data/appointments';
import { MOCK_CLINICAL_RECORDS } from '../../data/diagnoses';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Mail, MapPin, User, Calendar, FileText } from 'lucide-react';
import { Pill } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'clinical', label: 'Clinical History', icon: FileText },
];

export default function ReceptionistPatientDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const patient = MOCK_PATIENTS.find(p => p.id === id);
  const doctor = MOCK_DOCTORS.find(d => d.id === patient?.assignedDoctorId);
  const appointments = MOCK_APPOINTMENTS.filter(a => a.patientId === id);
  const records = MOCK_CLINICAL_RECORDS.filter(r => r.patientId === id);

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <EmptyState title="Patient not found" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Link to="/receptionist/patients" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
        <ArrowLeft size={15} /> Back to Patients
      </Link>

      {/* Header */}
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
              <div><p className="text-xs text-[var(--color-text-subtle)]">Registered</p><p className="font-medium">{formatDate(patient.registeredAt)}</p></div>
              <div><p className="text-xs text-[var(--color-text-subtle)]">Total Visits</p><p className="font-medium">{patient.totalVisits}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'border-[var(--color-primary-500)] text-[var(--color-primary-500)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Contact</h2>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-center gap-2"><Phone size={13} />{patient.phone}</div>
              {patient.email && <div className="flex items-center gap-2"><Mail size={13} />{patient.email}</div>}
              <div className="flex items-start gap-2"><MapPin size={13} className="mt-0.5" />{patient.address}</div>
            </div>
            {patient.emergencyContact?.name && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Emergency Contact</p>
                <p className="text-sm font-medium">{patient.emergencyContact.name} ({patient.emergencyContact.relation})</p>
                <p className="text-sm text-[var(--color-text-muted)]">{patient.emergencyContact.phone}</p>
              </div>
            )}
          </div>
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Clinical Summary</h2>
            <div className="space-y-2 text-sm">
              <div><p className="text-xs text-[var(--color-text-muted)]">Complaint</p><p>{patient.chiefComplaint}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">Allergies</p><p className={patient.allergies !== 'None' ? 'text-amber-600 font-medium' : 'text-[var(--color-text-muted)]'}>{patient.allergies}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">Assigned Doctor</p><p className="font-medium text-[var(--color-primary-500)]">{doctor?.name || '—'}</p></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card overflow-hidden">
          {appointments.length === 0 ? <EmptyState icon={Calendar} title="No appointments" /> : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {appointments.sort((a,b) => b.date.localeCompare(a.date)).map(apt => (
                  <tr key={apt.id}>
                    <td>{formatDate(apt.date)}</td>
                    <td>{formatTime(apt.time)}</td>
                    <td>{apt.doctorName}</td>
                    <td>{apt.type}</td>
                    <td><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'clinical' && (
        <div className="space-y-4">
          {records.length === 0 ? <EmptyState icon={FileText} title="No clinical records" description="Clinical records are managed by the treating doctor." /> : (
            records.sort((a,b) => b.visitDate.localeCompare(a.visitDate)).map(rec => (
              <div key={rec.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(rec.visitDate)} · {rec.doctorName}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Diagnosis</p><p>{rec.diagnosis}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Treatment</p><p>{rec.treatment}</p></div>
                </div>
                {rec.prescription?.length > 0 && (
                  <div className="mt-3 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Pill size={11} /> {rec.prescription.map(rx => rx.medicine).join(', ')}
                  </div>
                )}
                {rec.followUpDate && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <Calendar size={12} /> Follow-up: {formatDate(rec.followUpDate)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
