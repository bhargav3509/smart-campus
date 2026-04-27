import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import QRModal from '../components/QRModal';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';
const YELLOW = '#fbbc05';
const PURPLE = '#7c4dff';

// SVG Icons from Mockup
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconEvents = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrEvent, setQrEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [sortOption, setSortOption] = useState('upcoming');
  const container = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        API.get('/events'),
        API.get('/registrations/my')
      ]);
      setEvents(evRes.data);
      setMyRegistrations(regRes.data);
    } catch { toast.error('Failed to sync data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      toast.success('Successfully registered!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Cancel your registration for this event?')) return;
    try {
      await API.delete(`/registrations/event/${eventId}`);
      toast.success('Registration cancelled');
      fetchData();
    } catch (err) { toast.error('Cancellation failed'); }
  };

  const isRegistered = (eventId) => myRegistrations.some(r => r.event_id === eventId);
  const getRegistration = (eventId) => myRegistrations.find(r => r.event_id === eventId);
  const isPast = (endTime) => new Date() > new Date(endTime);

  const sortedEvents = [...events].sort((a, b) => {
    if (sortOption === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortOption === 'ended_last') return new Date(b.end_time) - new Date(a.end_time);
    return new Date(a.start_time) - new Date(b.start_time);
  });

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        
        // Only animate if cards are found
        const cards = container.current?.querySelectorAll('.dashboard-card');
        if (cards?.length > 0) {
          gsap.from(cards, { scale: 0.95, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.4 });
        }
      }, container);
      return () => ctx.revert();
    }
  }, [loading, activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent transparent transparent` }} />
    </div>
  );

  return (
    <div ref={container} className="min-h-screen bg-[#f8f9fc] flex font-sans antialiased text-gray-900">
      
      {/* Sidebar */}
      <aside className="sidebar w-20 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-50 sticky top-0 h-screen">
        <div className="mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Home" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <SidebarItem icon={IconEvents} label="My Events" active={activeTab === 'my registrations'} onClick={() => setActiveTab('my registrations')} />
          <SidebarItem icon={IconHistory} label="History" />
        </div>
        <div className="w-full">
          <SidebarItem icon={IconSettings} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>EveSphere</h1>
            <div className="relative max-w-md w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input type="text" placeholder="Search events..." className="w-full bg-gray-100/80 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white shadow-sm">
                {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{user?.name?.charAt(0)}</div>}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-900 truncate max-w-[100px] leading-tight uppercase tracking-wider">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Student Console</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                {activeTab === 'events' ? 'Discovery' : 'My Registrations'}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                {activeTab === 'events' ? 'Explore the full spectrum of campus life' : `You have ${myRegistrations.length} active registrations`}
              </p>
            </div>

            {activeTab === 'events' && (
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-600 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="upcoming">Upcoming First</option>
                <option value="newest">Newest First</option>
                <option value="ended_last">Ended Last</option>
              </select>
            )}
          </div>

          {/* Grid Layout */}
          {activeTab === 'events' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedEvents.map((event, idx) => {
                const registered = isRegistered(event.id);
                const accent = [BLUE, GREEN, YELLOW, RED, PURPLE][idx % 5];
                const past = isPast(event.end_time);

                return (
                  <div key={event.id} className="dashboard-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                    <div className="h-44 relative overflow-hidden bg-gray-50">
                      {event.poster_url && (
                        <img src={event.poster_url.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} 
                          alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-4 left-4 z-20">
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-900 border border-white/50 uppercase tracking-widest shadow-sm">
                          {event.category || 'Event'}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-6 font-medium leading-relaxed">{event.description}</p>
                      
                      <div className="space-y-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                        <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {event.venue_name || 'TBA'}</div>
                        <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(event.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {event.organizer_name}</div>
                      </div>

                      <div className="mt-auto">
                        {past ? (
                          <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-500 text-center text-[10px] font-black uppercase tracking-widest border border-gray-200">Event Ended</div>
                        ) : registered ? (
                          <div className="flex flex-col gap-2">
                             <div className="w-full py-3.5 rounded-2xl bg-green-50 text-green-600 text-center text-[10px] font-black uppercase tracking-widest border border-green-100">✓ Registered</div>
                             <button onClick={() => setQrEvent({ ...event, registration: getRegistration(event.id) })}
                               className="w-full py-3 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all">View Ticket</button>
                             <button onClick={() => handleCancelRegistration(event.id)}
                               className="w-full py-3 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Cancel RSVP</button>
                          </div>
                        ) : (
                          <button onClick={() => handleRegister(event.id)}
                            className="w-full py-3.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            style={{ backgroundColor: accent, boxShadow: `0 8px 20px ${accent}30` }}>Register for Event</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {myRegistrations.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">No registrations yet</p>
                </div>
              ) : (
                myRegistrations.map(reg => (
                  <div key={reg.id} className="dashboard-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                      <h3 className="text-3xl font-black text-gray-900 mb-2 leading-none" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{reg.event_title}</h3>
                      <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">📍 {reg.venue_name || 'TBA'}</div>
                        <div className="flex items-center gap-2">📅 {new Date(reg.start_time).toLocaleString()}</div>
                        <span className={`px-3 py-1 rounded-full ${reg.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{reg.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button onClick={() => setQrEvent({ id: reg.event_id, title: reg.event_title, registration: reg })}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">🎟️ QR Ticket</button>
                      {reg.status === 'registered' && (
                        <button onClick={() => handleCancelRegistration(reg.event_id)}
                          className="flex-1 md:flex-none bg-red-50 text-red-500 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all">Cancel</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {qrEvent && <QRModal event={qrEvent} onClose={() => setQrEvent(null)} />}
    </div>
  );
};

export default StudentDashboard;