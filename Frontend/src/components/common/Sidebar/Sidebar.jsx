import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../../app/store';
import { useAuth } from '../../../hooks/useAuth';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import SidebarNav from './SidebarNav';
import Avatar from '../../ui/Avatar';

const ROLE_LABELS = {
  admin: 'Administrator',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

const ROLE_BADGE_COLORS = {
  admin: 'bg-violet-500/20 text-violet-300',
  doctor: 'bg-[var(--color-accent-500)]/20 text-[var(--color-accent-300)]',
  receptionist: 'bg-amber-500/20 text-amber-300',
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useSelector(state => state.ui);
  const { user, role, logout } = useAuth();

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarMobileOpen ? 'open' : ''}`}
      aria-label="Application sidebar"
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2C8 2 4 5 4 9c0 2.5 1 4 2 5.5S8 17 8 22h8c0-5 2-4 4-7.5s2-3 2-5.5c0-4-4-7-8-7z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">Dwarka Dental</p>
              <p className="text-[10px] text-slate-400 truncate">Clinic Management</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] flex items-center justify-center mx-auto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2C8 2 4 5 4 9c0 2.5 1 4 2 5.5S8 17 8 22h8c0-5 2-4 4-7.5s2-3 2-5.5c0-4-4-7-8-7z"/>
            </svg>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="hidden md:flex w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role indicator */}
      {!sidebarCollapsed && (
        <div className="px-4 pt-3 pb-2">
          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${ROLE_BADGE_COLORS[role] || 'bg-white/10 text-slate-300'}`}>
            {ROLE_LABELS[role] || role}
          </span>
        </div>
      )}

      {/* Navigation */}
      <SidebarNav collapsed={sidebarCollapsed} />

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || ''} size="sm" />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
