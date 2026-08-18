import { useDispatch } from 'react-redux';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../utils/formatters';
import { Bell, CheckCheck } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_ICON = { success: '✅', warning: '⚠️', info: 'ℹ️', danger: '🔴' };
const TYPE_BG = { success: 'bg-emerald-50 border-emerald-200', warning: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200', danger: 'bg-red-50 border-red-200' };

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Notifications</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{notifications.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={markAllAsRead} className="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] flex items-center gap-1.5 cursor-pointer">
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border cursor-pointer transition-opacity ${!n.read ? TYPE_BG[n.type] || 'bg-blue-50 border-blue-200' : 'bg-white border-[var(--color-border)]'} ${!n.read ? 'opacity-100' : 'opacity-70'}`}
              onClick={() => markAsRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && markAsRead(n.id)}
              aria-label={n.title}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{TYPE_ICON[n.type] || 'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[var(--color-text)]' : 'font-medium text-[var(--color-text-muted)]'}`}>{n.title}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1">{formatDistanceToNow(n.time)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] mt-1.5 flex-shrink-0" aria-hidden="true" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
