import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleMobileSidebar } from '../../app/store';
import { useNotifications } from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import NotificationPanel from './NotificationPanel';
import { useLocation, useSearchParams } from 'react-router-dom';

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

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  function handleSearchChange(e) {
    const val = e.target.value;
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function handleClearSearch() {
    setSearchParams({}, { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-4 px-6 bg-white border-b border-[var(--color-border)] shadow-2xs">
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

      {/* Real Interactive Top Header Search Bar */}
      <div className="flex items-center gap-2 px-3.5 h-9 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 min-w-[240px] focus-within:ring-2 focus-within:ring-[var(--color-primary-500)] focus-within:bg-white transition-all">
        <Search size={15} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search patient name, phone, doctor..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder:text-slate-400 font-medium"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Clear search"
          >
            ✕
          </button>
        )}
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
