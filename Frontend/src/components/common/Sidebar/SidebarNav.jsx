import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, UserCheck, UserCog,
  DollarSign, BarChart2, Bell, Settings, Stethoscope,
  ClipboardList, History, User, UserPlus, ChevronRight,
} from 'lucide-react';
import { useSelector } from 'react-redux';

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Patients', to: '/admin/patients', icon: Users },
    { label: 'Appointments', to: '/admin/appointments', icon: Calendar },
    { label: 'Doctors', to: '/admin/doctors', icon: Stethoscope },
    { label: 'Staff', to: '/admin/staff', icon: UserCog },
    { label: 'Revenue', to: '/admin/revenue', icon: DollarSign },
    { label: 'Reports', to: '/admin/reports', icon: BarChart2 },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor', icon: LayoutDashboard, end: true },
    { label: "Today's Appointments", to: '/doctor/appointments', icon: Calendar },
    { label: 'Patients', to: '/doctor/patients', icon: Users },
    { label: 'Follow-ups', to: '/doctor/follow-ups', icon: ClipboardList },
    { label: 'Clinical History', to: '/doctor/history', icon: History },
    { label: 'Notifications', to: '/doctor/notifications', icon: Bell },
    { label: 'Profile', to: '/doctor/profile', icon: User },
  ],
  receptionist: [
    { label: 'Dashboard', to: '/receptionist', icon: LayoutDashboard, end: true },
    { label: 'Patients', to: '/receptionist/patients', icon: Users },
    { label: 'Register Patient', to: '/receptionist/patients/new', icon: UserPlus },
    { label: 'Appointments', to: '/receptionist/appointments', icon: Calendar },
    { label: 'Follow-ups', to: '/receptionist/follow-ups', icon: ClipboardList },
    { label: 'Notifications', to: '/receptionist/notifications', icon: Bell },
    { label: 'Profile', to: '/receptionist/profile', icon: User },
  ],
};

export default function SidebarNav({ collapsed }) {
  const { role } = useSelector(state => state.auth);
  const items = NAV_ITEMS[role] || [];

  return (
    <nav aria-label="Main navigation" className="flex-1 px-3 py-2 overflow-y-auto">
      <ul className="space-y-0.5" role="list">
        {items.map(({ label, to, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="sidebar-icon flex-shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="flex-1 truncate">{label}</span>
              )}
              {!collapsed && (
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
