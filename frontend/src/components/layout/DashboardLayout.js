import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';

/* ─── Shared sidebar item ─── */
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex flex-col items-center gap-1 py-3.5 transition-all border-none cursor-pointer ${
      active
        ? 'text-blue-600 bg-blue-50/80'
        : 'text-gray-400 bg-transparent hover:text-gray-700 hover:bg-gray-50'
    }`}
    style={{ outline: 'none' }}
  >
    <Icon />
    <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

/* ─── Layout ─── */
const DashboardLayout = ({
  children,
  title,
  subtitle,
  headerActions,
  sidebarTop = [],
  sidebarBottom = [],
  accentColor = '#1a73e8',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const homeRoute =
    user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student';

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-sans antialiased text-gray-900">

      {/* ── Sidebar ── */}
      <aside
        className="animate-slide-left w-20 flex-shrink-0 bg-white border-r border-gray-100
                   flex flex-col items-center py-6 z-50 sticky top-0 h-screen overflow-hidden"
        style={{ animationDuration: '0.5s' }}
      >
        {/* Logo */}
        <Link to={homeRoute} className="mb-10 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </Link>

        {/* Top navigation items */}
        <div className="flex-1 w-full flex flex-col gap-0.5">
          {sidebarTop.map((item, i) => (
            <SidebarItem key={i} {...item} />
          ))}
        </div>

        {/* Bottom navigation items */}
        <div className="w-full flex flex-col gap-0.5">
          {sidebarBottom.map((item, i) => (
            <SidebarItem key={i} {...item} />
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Navbar */}
        <header
          className="animate-slide-down h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100
                     flex items-center justify-between px-8 sticky top-0 z-40 flex-shrink-0"
          style={{ animationDuration: '0.45s' }}
        >
          {/* Left: title + subtitle */}
          <div className="flex items-center gap-5 min-w-0 flex-1">
            <h1
              className="text-2xl font-black tracking-tight leading-none shrink-0"
              style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#0f0f11' }}
            >
              {title}
            </h1>
            {subtitle && (
              <span className="hidden md:inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                {subtitle}
              </span>
            )}
          </div>

          {/* Right: actions + bell + avatar */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {headerActions}

            <NotificationBell />

            {/* Avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black overflow-hidden border-2"
                  style={{ borderColor: accentColor + '30', backgroundColor: accentColor }}
                >
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : user?.name?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-wide">{user?.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{user?.role}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-soft-lg z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-black text-gray-800 truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
