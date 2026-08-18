import { useState } from 'react';
import { MOCK_PATIENTS } from '../../data/patients';
import { MOCK_APPOINTMENTS } from '../../data/appointments';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');

  // Only patients assigned to this doctor
  const patients = MOCK_PATIENTS.filter(p => p.assignedDoctorId === 'DOC-001');
  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">My Patients</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{patients.length} patients assigned</p>
      </div>

      <div className="card p-4 flex items-center gap-2">
        <Search size={15} className="text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Search patients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none"
          aria-label="Search my patients"
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No patients found" />
        ) : (
          <table className="data-table" aria-label="My patients table">
            <thead>
              <tr><th>Patient</th><th>Age</th><th>Status</th><th>Last Visit</th><th>Next Follow-up</th><th>Chief Complaint</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] font-mono">{p.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.age}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-[var(--color-text-muted)]">{formatDate(p.lastVisit)}</td>
                  <td className="text-[var(--color-text-muted)]">{formatDate(p.nextFollowUp)}</td>
                  <td className="text-sm text-[var(--color-text-muted)] max-w-48 truncate">{p.chiefComplaint}</td>
                  <td>
                    <Link
                      to={`/doctor/patients/${p.id}`}
                      className="text-xs px-3 h-7 flex items-center rounded-lg bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)] transition-colors font-medium w-fit"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
