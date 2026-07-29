import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import gsap from 'gsap';

const BLUE = '#1a73e8';

// SVG Icons
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AppNavbar = ({ role = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    gsap.from('.app-navbar', { y: -80, duration: 0.7, ease: 'power3.out' });
  }, []);

  return (
    <nav className="app-navbar bg-white sticky top-0 z-50 px-4 sm:px-8 py-3.5"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-black tracking-tight cursor-pointer select-none"
            style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: BLUE }}
            onClick={() => navigate(role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/student')}
          >
            EveSphere
          </h1>
          {role && (
            <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: `${BLUE}15`, color: BLUE }}>
              {role}
            </span>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {role === 'admin' && (
            <button onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
              <IconBarChart /> Analytics
            </button>
          )}
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
            <IconUser /> {user?.name}
          </button>
          <NotificationBell />
          <button onClick={logout}
            className="flex items-center gap-2 ml-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition">
            <IconLogOut /> Logout
          </button>
        </div>

        {/* Mobile */}
        <div className="flex sm:hidden items-center gap-2">
          <NotificationBell />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition" aria-label="Toggle menu">
            {mobileMenuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-3 flex flex-col gap-0.5 pb-2 border-t border-gray-100 pt-3">
          {role === 'admin' && (
            <button onClick={() => { navigate('/analytics'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition text-left">
              <IconBarChart /> Analytics
            </button>
          )}
          <button onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition text-left">
            <IconUser /> {user?.name}
          </button>
          <button onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left hover:bg-red-50 transition"
            style={{ color: '#ea4335' }}>
            <IconLogOut /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default AppNavbar;
