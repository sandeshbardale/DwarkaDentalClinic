import { Inbox } from 'lucide-react';

/**
 * Empty state component for zero-results screens.
 */
export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
