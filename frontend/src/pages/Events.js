import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';

// SVG Icons
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

const Events = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const container = useRef(null);

  const fetchEvents = useCallback(async (searchTerm = '') => {
    try {
      const res = await API.get('/events', { params: { search: searchTerm } });
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const res = await API.get('/registrations/my');
      setRegisteredEvents(res.data.map(r => r.event_id));
    } catch (err) {}
  };

  useEffect(() => { 
    fetchMyRegistrations();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => { fetchEvents(search); }, 400);
    return () => clearTimeout(delay);
  }, [search, fetchEvents]);

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.from('.event-card', { scale: 0.95, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.3 });
      }, container);
      return () => ctx.revert();
    }
  }, [loading]);

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      toast.success('Successfully registered!');
      setRegisteredEvents(prev => [...prev, eventId]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading && events.length === 0) return (
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
          <SidebarItem icon={IconDashboard} label="Home" onClick={() => window.history.back()} />
          <SidebarItem icon={IconEvents} label="Events" active />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Event Catalog</h1>
            <div className="relative max-w-md w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for events, organizers..." 
                className="w-full bg-gray-100/80 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-blue-600 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Catalog Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="mb-10">
            <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
              Discovery
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Explore the full spectrum of campus life</p>
          </div>

          {events.length === 0 ? (
             <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">No Events Found</p>
               <button onClick={() => setSearch('')} className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">Reset Discovery</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {events.map((event, idx) => {
                const registered = registeredEvents.includes(event.id);
                return (
                  <div key={event.id} className="event-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                    <div className="h-44 relative overflow-hidden">
                      <img src={event.poster_url || `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&q=80&w=800`} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-gray-900 border border-white/50 uppercase tracking-widest shadow-sm">
                          {event.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                      <div className="space-y-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                        <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {event.venue_name || 'TBA'}</div>
                        <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(event.start_time).toLocaleDateString()}</div>
                      </div>
                      <div className="mt-auto">
                        {user?.role === 'student' ? (
                          <button 
                            onClick={() => !registered && handleRegister(event.id)}
                            disabled={registered}
                            className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${registered ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:opacity-90 active:scale-95'}`}
                          >
                            {registered ? 'ALREADY REGISTERED' : 'JOIN EVENT'}
                          </button>
                        ) : (
                          <div className="text-center py-2 text-[10px] font-black text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-4">ReadOnly Mode</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events;