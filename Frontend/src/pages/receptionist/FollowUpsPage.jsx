import { MOCK_FOLLOW_UPS } from '../../data/diagnoses';
import { StatusBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

export default function FollowUpsPage() {
  const dueToday = MOCK_FOLLOW_UPS.filter(f => f.status === 'due-today');
  const dueTomorrow = MOCK_FOLLOW_UPS.filter(f => f.status === 'due-tomorrow');
  const upcoming = MOCK_FOLLOW_UPS.filter(f => f.status === 'upcoming');

  function Section({ title, items, accent }) {
    if (!items.length) return null;
    return (
      <div>
        <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${accent}`}>{title} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(fu => (
            <div key={fu.id} className="card p-4 flex flex-wrap items-center gap-3">
              <Avatar name={fu.patientName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)]">{fu.patientName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{fu.reason} · {fu.doctorName || 'Dr. Neha Sharma'}</p>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{formatDate(fu.date)}</p>
              <StatusBadge status={fu.status} />
              <Link
                to={`/receptionist/patients/${fu.patientId}`}
                className="text-xs px-3 h-7 flex items-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] font-medium"
              >
                View Patient
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Follow-ups</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{MOCK_FOLLOW_UPS.length} follow-ups tracked</p>
      </div>

      {MOCK_FOLLOW_UPS.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No follow-ups" />
      ) : (
        <>
          <Section title="Due Today" items={dueToday} accent="text-red-500" />
          <Section title="Due Tomorrow" items={dueTomorrow} accent="text-amber-600" />
          <Section title="Upcoming" items={upcoming} accent="text-[var(--color-text-muted)]" />
        </>
      )}
    </div>
  );
}
