import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">My Profile</h1>
      <div className="card p-6 flex items-center gap-5">
        <Avatar name={user?.name || ''} size="xl" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{user?.name}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{user?.designation}</p>
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Email', value: user?.email },
            { label: 'Phone', value: user?.phone },
            { label: 'Role', value: 'Receptionist' },
            { label: 'Joined', value: formatDate(user?.joinedAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</p>
              <p className="text-sm font-medium text-[var(--color-text)]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
