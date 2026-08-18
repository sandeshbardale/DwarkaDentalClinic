import { useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../utils/formatters';

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          !document.getElementById('notifications-toggle')?.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const typeIcon = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    danger: '🔴',
  };

  return (
    <div
      id="notifications-panel"
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-[var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in"
      role="dialog"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Bell size={14} /> Notifications
        </h2>
        <button
          onClick={markAllAsRead}
          className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] flex items-center gap-1 cursor-pointer"
          aria-label="Mark all notifications as read"
        >
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>

      {/* List */}
      <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]" role="list">
        {notifications.length === 0 && (
          <li className="py-8 text-center text-sm text-[var(--color-text-muted)]">No notifications</li>
        )}
        {notifications.map(n => (
          <li key={n.id}>
            <button
              onClick={() => markAsRead(n.id)}
              className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[var(--color-bg)] transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{typeIcon[n.type] || 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${!n.read ? 'font-medium text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{n.title}</p>
                <p className="text-xs text-[var(--color-text-subtle)] mt-0.5 truncate">{n.message}</p>
                <p className="text-[10px] text-[var(--color-text-subtle)] mt-1">{formatDistanceToNow(n.time)}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] mt-1.5 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
