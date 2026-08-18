import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, ClipboardList } from 'lucide-react';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_DOCTORS } from '../../data/doctors';
import { MOCK_APPOINTMENTS } from '../../data/appointments';
import { MOCK_CLINICAL_RECORDS } from '../../data/diagnoses';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate, formatTime } from '../../utils/formatters';
import EmptyState from '../../components/ui/EmptyState';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'clinical', label: 'Clinical History', icon: FileText },
];

export default function PatientDetailPage({ basePath = '/admin' }) {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const patient = MOCK_PATIENTS.find(p => p.id === id);
  const doctor = MOCK_DOCTORS.find(d => d.id === patient?.assignedDoctorId);
  const appointments = MOCK_APPOINTMENTS.filter(a => a.patientId === id);
  const records = MOCK_CLINICAL_RECORDS.filter(r => r.patientId === id);

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <EmptyState title="Patient not found" description="This patient record doesn't exist." />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <Link to={`${basePath}/patients`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
        <ArrowLeft size={15} /> Back to Patients
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={patient.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-[var(--color-text)]">{patient.name}</h1>
              <StatusBadge status={patient.status} />
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3 font-mono">{patient.patientId}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Age / Gender</p>
                <p className="font-medium text-[var(--color-text)]">{patient.age} yrs · {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Blood Group</p>
                <p className="font-medium text-[var(--color-text)]">{patient.bloodGroup}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Registered</p>
                <p className="font-medium text-[var(--color-text)]">{formatDate(patient.registeredAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-subtle)] mb-0.5">Total Visits</p>
                <p className="font-medium text-[var(--color-text)]">{patient.totalVisits}</p>
              </div>
            </div>
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
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contact info */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Contact Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                  <span className="break-all">{patient.email}</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <span className="text-[var(--color-text-muted)]">{patient.address}</span>
              </div>
            </div>
            {patient.emergencyContact && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Emergency Contact</p>
                <p className="text-sm font-medium">{patient.emergencyContact.name} <span className="font-normal text-[var(--color-text-muted)]">({patient.emergencyContact.relation})</span></p>
                <p className="text-sm text-[var(--color-text-muted)]">{patient.emergencyContact.phone}</p>
              </div>
            )}
          </div>

          {/* Medical info */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Medical Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Chief Complaint</p>
                <p className="text-[var(--color-text)]">{patient.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Allergies</p>
                <p className={patient.allergies === 'None' ? 'text-[var(--color-text-muted)]' : 'text-amber-600 font-medium'}>{patient.allergies}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Medical History</p>
                <p className="text-[var(--color-text)]">{patient.medicalHistory}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Assigned Doctor</p>
                <p className="font-medium text-[var(--color-primary-500)]">{doctor?.name || '—'}</p>
                {doctor && <p className="text-xs text-[var(--color-text-muted)]">{doctor.specialization}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments tab */}
      {activeTab === 'appointments' && (
        <div className="card overflow-hidden">
          {appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments" description="This patient has no appointment history." />
          ) : (
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

      {/* Clinical history tab */}
      {activeTab === 'clinical' && (
        <div className="space-y-4">
          {records.length === 0 ? (
            <EmptyState icon={FileText} title="No clinical records" description="No clinical history found for this patient." />
          ) : (
            records.sort((a,b) => b.visitDate.localeCompare(a.visitDate)).map(rec => (
              <div key={rec.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{formatDate(rec.visitDate)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{rec.doctorName}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Complaint</p>
                    <p>{rec.chiefComplaint}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Diagnosis</p>
                    <p>{rec.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Treatment</p>
                    <p className="text-[var(--color-text)]">{rec.treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-[var(--color-text-muted)]">{rec.clinicalNotes}</p>
                  </div>
                </div>
                {rec.prescription?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Pill size={12} /> Prescription
                    </p>
                    <div className="space-y-1.5">
                      {rec.prescription.map((rx, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-[var(--color-text)]">{rx.medicine}</span>
                          <span className="text-[var(--color-text-muted)]"> — {rx.dosage} for {rx.duration}. {rx.instructions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rec.followUpDate && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <Calendar size={12} /> Follow-up scheduled: {formatDate(rec.followUpDate)} — {rec.followUpInstructions}
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
