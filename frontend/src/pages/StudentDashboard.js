import { useState, useEffect, useRef } from 'react';
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

const IconSaved = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
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

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

const StatCard = ({ label, value, color, children }) => (
  <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100/50">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{value}</p>
      </div>
      {children}
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrEvent, setQrEvent] = useState(null);
  const container = useRef(null);

  useEffect(() => {
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await API.get('/registrations/my');
      setMyRegistrations(res.data);
    } catch { console.error('Failed to load registrations'); }
  };

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      toast.success('Successfully registered!');
      fetchMyRegistrations();
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
  };

  const isRegistered = (eventId) => myRegistrations.some(r => r.event_id === eventId);
  const getRegistration = (eventId) => myRegistrations.find(r => r.event_id === eventId);

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.from('.hero-content', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
        gsap.delayedCall(0.4, () => {
          gsap.from('.dashboard-card', { scale: 0.95, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
        });
      }, container);
      return () => ctx.revert();
    }
  }, [loading]);

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
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Home" active />
          <SidebarItem icon={IconEvents} label="Events" />
          <SidebarItem icon={IconSaved} label="Saved" />
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
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>EventHub</h1>
            <div className="relative max-w-md w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input type="text" placeholder="Search events, workshops..." className="w-full bg-gray-100/80 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-8">
              {['Dashboard', 'Events', 'Workshops', 'Communities'].map(link => (
                <a key={link} href="#" className={`text-sm font-bold ${link === 'Dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{link}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6 ml-2">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <IconBell />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
                <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white shadow-sm">
                  {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{user?.name?.charAt(0)}</div>}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-black text-gray-900 truncate max-w-[100px] leading-tight uppercase tracking-wider">{user?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Student Profile</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          {/* Hero Section */}
          <div className="hero-content grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 relative bg-white rounded-[40px] overflow-hidden p-12 flex flex-col justify-center min-h-[360px] shadow-soft border border-gray-100/50">
              <div className="relative z-10 max-w-lg">
                <h2 className="text-7xl font-black text-gray-900 leading-[0.9] mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                  YOUR NEXT ADVENTURE AWAITS! <br />
                  <span className="text-blue-600">EXPLORE & ENGAGE</span>
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-gray-900/20">
                    <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-gray-900"></div>
                    Help Toggle
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"></div>)}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">+</div>
                  </div>
                  <div className="text-sm font-black text-gray-900 uppercase tracking-widest ml-2">UPCOMING EVENTS</div>
                  <div className="flex-1 h-px bg-gray-200 mx-4"></div>
                  <div className="text-sm font-black text-blue-600 uppercase tracking-widest">JOIN NOW</div>
                </div>
              </div>
              {/* Background Campus Illustration Placeholder */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gray-50 flex items-center justify-center overflow-hidden border-l border-gray-100">
                <div className="w-full h-full bg-cover bg-center opacity-80" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800")' }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <StatCard label="Registered" value={myRegistrations.length}>
                <div className="w-16 h-8 flex items-end gap-0.5">
                  {[4,7,3,8,5,9,6].map((h, i) => <div key={i} className="flex-1 bg-green-400/30 rounded-full" style={{ height: `${h * 10}%` }}></div>)}
                </div>
              </StatCard>
              <StatCard label="Workshops" value="4" />
              <div className="bg-white rounded-[32px] p-8 shadow-soft flex-1 border border-gray-100/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Activity graph</p>
                <div className="h-32 flex items-end gap-2">
                  {[20, 45, 30, 60, 40, 75, 55].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500/10 rounded-t-xl relative group">
                      <div className="absolute bottom-0 w-full bg-blue-600 rounded-t-xl transition-all duration-700" style={{ height: `${h}%` }}></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-black text-gray-400 uppercase">
                  <span>Sa</span><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            
            {/* Left Column: Calendar & Filters */}
            <div className="xl:col-span-3 space-y-10">
              <div className="dashboard-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-black" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Upcoming Events</h4>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-3 text-center text-xs font-bold">
                  {Array.from({length: 31}).map((_, i) => (
                    <div key={i} className={`py-1.5 rounded-xl cursor-pointer transition-all ${i+1 === 16 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:bg-gray-50'}`}>
                      {i+1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h4 className="text-xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Calendars</h4>
                <div className="space-y-5">
                  {[
                    { label: 'Tech Innovate Summit', color: BLUE },
                    { label: 'Creative Design', color: GREEN },
                    { label: 'Startup Pitch', color: YELLOW },
                    { label: 'Startup Design', color: RED },
                    { label: 'Tech Events', color: PURPLE },
                  ].map(cat => (
                    <div key={cat.label} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{cat.label}</span>
                      </div>
                      <svg className="text-gray-300 group-hover:text-blue-600 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle/Right Column: Event Feed */}
            <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 6).map((event, idx) => {
                const accent = [BLUE, GREEN, YELLOW, RED, PURPLE, BLUE][idx % 6];
                const registered = isRegistered(event.id);
                return (
                  <div key={event.id} className="dashboard-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                    <div className="h-48 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                      <img src={event.poster_url?.startsWith('http') ? event.poster_url : `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&q=80&w=800`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 z-20">
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-widest">
                          {event.category || 'General'}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-6 right-6 z-20">
                        <h3 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="space-y-3 text-[11px] font-bold text-gray-500 mb-8 uppercase tracking-wider">
                        <div className="flex items-center gap-3">
                          <svg className="text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Date: {new Date(event.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Location: {event.venue_name || 'TBA'}
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Type: {event.type || 'Student'}
                        </div>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100"></div>)}
                          </div>
                          <div className="text-[10px] font-black text-gray-900 uppercase">
                            <span className="text-blue-600">{event.registration_count || 0}</span> Registered
                          </div>
                        </div>
                        <button 
                          onClick={() => registered ? setQrEvent(event) : handleRegister(event.id)}
                          className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
                          style={{ 
                            backgroundColor: registered ? '#f3f4f6' : accent, 
                            color: registered ? '#4b5563' : 'white',
                            boxShadow: registered ? 'none' : `0 4px 15px ${accent}40`
                          }}
                        >
                          {registered ? 'VIEW TICKET' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </main>

      {qrEvent && <QRModal event={qrEvent} onClose={() => setQrEvent(null)} />}
    </div>
  );
};

export default StudentDashboard;