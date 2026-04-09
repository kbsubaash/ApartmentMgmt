import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ASSOCIATION_SHORT = 'DABC Euphorbia Ph3';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['Admin', 'Committee', 'Resident'] },
  { to: '/members', label: 'Members', icon: '👥', roles: ['Admin', 'Committee'] },
  { to: '/flats', label: 'Flats', icon: '🏢', roles: ['Admin', 'Committee'] },
  { to: '/circulars', label: 'Circulars', icon: '📋', roles: ['Admin', 'Committee', 'Resident'] },
  { to: '/polls', label: 'Polls & Voting', icon: '🗳️', roles: ['Admin', 'Committee', 'Resident'] },
  { to: '/complaints', label: 'Complaints', icon: '🔧', roles: ['Admin', 'Committee', 'Resident'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📜', roles: ['Admin'] },
  { to: '/admin/community-contacts', label: 'Community Contacts', icon: '📞', roles: ['Admin'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-brand-dark text-white z-50 flex flex-col
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-xs text-blue-200 uppercase tracking-wide font-medium">Association</p>
          <p className="text-sm font-bold mt-1 leading-tight">{ASSOCIATION_SHORT}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10 text-xs text-blue-200">
          <p className="font-medium text-white truncate">{user?.name}</p>
          <p className="mt-0.5 truncate">{user?.email}</p>
          <span className="mt-1 inline-block bg-white/10 rounded px-2 py-0.5 text-white font-medium">
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
}
