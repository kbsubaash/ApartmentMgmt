import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/utils/formatters';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markOneRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="flex-1 text-sm font-semibold text-gray-700 hidden sm:block truncate">
        DABC Euphorbia Phase 3 Apartment Owners Welfare Association
      </span>

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-gray-400">No notifications</li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n._id}
                    onClick={() => markOneRead(n._id)}
                    className={`px-4 py-3 text-xs cursor-pointer hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <p className={`font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-gray-400 mt-0.5">{formatDateTime(n.createdAt)}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <div className="h-7 w-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
            {user?.name}
          </span>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg border border-gray-200 z-50 text-sm">
            <Link
              to="/profile"
              onClick={() => setProfileOpen(false)}
              className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50"
            >
              My Profile
            </Link>
            <hr className="border-gray-100" />
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
