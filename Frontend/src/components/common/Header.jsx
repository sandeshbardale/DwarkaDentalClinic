import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleMobileSidebar } from '../../app/store';
import { useNotifications } from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import NotificationPanel from './NotificationPanel';
import { useLocation } from 'react-router-dom';

/** Derives a page title from the current route path. */
function usePageTitle() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return 'Dashboard';
  const last = segments[segments.length - 1];
  if (/^[A-Z0-9\-]+$/.test(last)) return 'Detail';
  return last
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Header() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const pageTitle = usePageTitle();

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-4 px-6 bg-white border-b border-[var(--color-border)]">
      {/* Mobile menu toggle */}
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        className="md:hidden p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-[var(--color-text)] hidden sm:block">{pageTitle}</h1>

      <div className="flex-1" />

      {/* Search hint */}
      <div className="hidden lg:flex items-center gap-2 px-3 h-8 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] cursor-text min-w-48">
        <Search size={14} aria-hidden="true" />
        <span>Search…</span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          id="notifications-toggle"
          onClick={() => setNotifOpen(v => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
          aria-expanded={notifOpen}
          aria-controls="notifications-panel"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        )}
      </div>

      {/* User avatar */}
      <Avatar name={user?.name || ''} size="sm" />
    </header>
  );
}
