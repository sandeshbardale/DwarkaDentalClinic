import { MOCK_CLINICAL_RECORDS } from '../../data/diagnoses';
import { MOCK_PATIENTS } from '../../data/patients';
import { formatDate } from '../../utils/formatters';
import { History } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { Link } from 'react-router-dom';
import { Pill, Calendar } from 'lucide-react';

export default function DoctorHistoryPage() {
  const records = MOCK_CLINICAL_RECORDS.filter(r => r.doctorId === 'DOC-001')
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));

  const patientMap = Object.fromEntries(MOCK_PATIENTS.map(p => [p.id, p]));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Clinical History</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{records.length} clinical records</p>
      </div>

      {records.length === 0 ? (
        <EmptyState icon={History} title="No clinical records" />
      ) : (
        <div className="space-y-4">
          {records.map(rec => {
            const patient = patientMap[rec.patientId];
            return (
              <div key={rec.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {patient && <Avatar name={patient.name} size="sm" />}
                    <div>
                      <Link to={`/doctor/patients/${rec.patientId}`} className="text-sm font-semibold text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)]">
                        {patient?.name || rec.patientId}
                      </Link>
                      <p className="text-xs text-[var(--color-text-muted)]">{formatDate(rec.visitDate)}</p>
                    </div>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Diagnosis</p><p className="font-medium">{rec.diagnosis}</p></div>
                  <div><p className="text-xs text-[var(--color-text-muted)] mb-0.5">Treatment</p><p>{rec.treatment}</p></div>
                </div>
                {rec.prescription?.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Pill size={12} />
                    {rec.prescription.map(rx => rx.medicine).join(', ')}
                  </div>
                )}
                {rec.followUpDate && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Calendar size={12} /> Follow-up: {formatDate(rec.followUpDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
