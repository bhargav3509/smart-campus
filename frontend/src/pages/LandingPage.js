import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const YELLOW = '#fbbc05';
const RED = '#ea4335';

const Feature = ({ icon, title, desc, color, delay }) => (
  <div
    className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-soft animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <h3 className="text-2xl font-black text-gray-900 mb-3 font-display">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const Stat = ({ value, label, delay }) => (
  <div className="text-center animate-slide-up" style={{ animationDelay: delay }}>
    <div className="text-6xl font-black text-white mb-2 font-display">{value}</div>
    <div className="text-xs font-black uppercase tracking-widest text-blue-200">{label}</div>
  </div>
);

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const route = user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : '/student';
      navigate(route);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-black font-display" style={{ color: BLUE }}>EveSphere</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-xs font-black uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl hover:bg-gray-50">
            Sign In
          </Link>
          <Link to="/register" className="text-xs font-black uppercase tracking-widest text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: BLUE, boxShadow: `0 6px 20px ${BLUE}30` }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-8 md:px-16 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-yellow-100 rounded-full blur-3xl opacity-40 -z-10" />

        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
            Smart Campus Platform
          </div>

          <h1
            className="text-7xl md:text-8xl font-black leading-none mb-6 animate-slide-up font-display"
            style={{ color: '#0f0f11' }}
          >
            Campus Life,{' '}
            <span style={{ color: BLUE }}>Unified.</span>
          </h1>

          <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up delay-100">
            EveSphere brings together events, venues, and people on one beautiful platform.
            Discover events, RSVP in seconds, and never miss what's happening on campus.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-200">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: BLUE, boxShadow: `0 8px 24px ${BLUE}40` }}>
              Start for Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 text-gray-700 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all">
              Sign In
            </Link>
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="max-w-5xl mx-auto mt-20 animate-slide-up delay-300">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-soft-lg overflow-hidden">
            <div className="h-12 bg-gray-50 flex items-center gap-2 px-6 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-8 h-6 bg-gray-100 rounded-lg" />
            </div>
            <div className="p-8 grid grid-cols-3 gap-4">
              {['Advanced IOT Seminar', 'Git Good Workshop', 'Welfare Drive'].map((title, i) => (
                <div key={i} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="w-full h-24 rounded-2xl mb-4" style={{ backgroundColor: [BLUE, GREEN, YELLOW][i] + '20' }} />
                  <div className="h-4 bg-gray-200 rounded-lg mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="mt-4 h-9 rounded-xl" style={{ backgroundColor: [BLUE, GREEN, YELLOW][i] + '20' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-8 md:px-16 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Platform Features</p>
            <h2 className="text-5xl font-black text-gray-900 font-display">Everything You Need</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature delay="0ms" color={BLUE} title="Event Discovery" desc="Browse published events from faculty and admin. Filter, sort, and RSVP with a single click." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            }/>
            <Feature delay="60ms" color={GREEN} title="QR Tickets" desc="Every registration comes with a unique QR ticket. Scan at the entrance for instant attendance." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
            }/>
            <Feature delay="120ms" color={YELLOW} title="Venue Booking" desc="Faculty can request campus venues for events. Admins review and approve in real time." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            }/>
            <Feature delay="180ms" color={RED} title="Email Notifications" desc="Automated confirmation emails on registration, approval, and event publishing." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            }/>
            <Feature delay="240ms" color={BLUE} title="Platform Analytics" desc="Admins get a bird's-eye view of registrations, venue usage, and engagement metrics." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            }/>
            <Feature delay="300ms" color={GREEN} title="Role-Based Access" desc="Students, faculty, and admins each get a tailored dashboard built for their workflow." icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }/>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-24 px-8 md:px-16" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #0d47a1 100%)` }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="3" label="Roles Supported" delay="0ms" />
          <Stat value="∞" label="Events Hosted" delay="80ms" />
          <Stat value="QR" label="Ticket System" delay="160ms" />
          <Stat value="24/7" label="Platform Access" delay="240ms" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-8 md:px-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-gray-900 mb-6 font-display">Ready to Join?</h2>
          <p className="text-gray-500 mb-10 font-medium">Sign up as a student or faculty member and start exploring campus events today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg"
              style={{ backgroundColor: BLUE, boxShadow: `0 8px 24px ${BLUE}40` }}>
              Create Account
            </Link>
            <Link to="/login"
              className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-8 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-sm font-black font-display" style={{ color: BLUE }}>EveSphere</span>
        </div>
        <p className="text-xs text-gray-400 font-medium">Smart Campus Platform © 2026</p>
      </footer>
    </div>
  );
};

export default LandingPage;
