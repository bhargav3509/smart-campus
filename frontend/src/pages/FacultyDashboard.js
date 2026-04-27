import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';
const YELLOW = '#fbbc05';

// SVG Icons
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconVenues = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ev, vn, bk] = await Promise.all([
        API.get('/events'),
        API.get('/venues'),
        API.get('/bookings')
      ]);
      setEvents(ev.data);
      setVenues(vn.data);
      setMyBookings(bk.data);
    } catch { toast.error('Failed to sync data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.delayedCall(0.3, () => {
          gsap.from('.faculty-card', { scale: 0.95, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
        });
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
          <SidebarItem icon={IconDashboard} label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <SidebarItem icon={IconVenues} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <SidebarItem icon={IconSettings} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Faculty Hub</h1>
            <div className="hidden lg:flex items-center gap-2 bg-blue-50 rounded-full px-4 py-1.5 border border-blue-100">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Session</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-blue-600 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Faculty Member</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-6xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                {activeTab === 'events' ? 'Event Console' : 'Venue Scheduler'}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Academic Event Coordination</p>
            </div>
            <div className="flex gap-4">
               {activeTab === 'events' && <button className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"><IconPlus /> Create Event</button>}
               {activeTab === 'bookings' && <button className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-900/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"><IconPlus /> New Booking</button>}
            </div>
          </div>

          {/* Dynamic Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'events' && events.map((event, idx) => (
              <div key={event.id} className="faculty-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                <div className="h-44 relative bg-gray-50 border-b border-gray-50 overflow-hidden">
                  {event.poster_url ? <img src={event.poster_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-100 font-black text-5xl uppercase" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Poster</div>}
                  <div className="absolute bottom-4 left-6 right-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border bg-white/80 backdrop-blur-md ${event.status === 'published' ? 'text-green-600 border-green-100' : 'text-gray-500 border-gray-200'}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                  <div className="space-y-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                    <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {event.venue_name || 'TBA'}</div>
                    <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(event.start_time).toLocaleDateString()}</div>
                  </div>
                  <button className="w-full border-2 border-gray-100 text-gray-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Event Details</button>
                </div>
              </div>
            ))}

            {activeTab === 'bookings' && myBookings.map(booking => (
              <div key={booking.id} className="faculty-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-black text-gray-900 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{booking.venue_name}</h3>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${booking.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{booking.status}</span>
                </div>
                <div className="space-y-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-10">
                   <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(booking.start_time).toLocaleDateString()}</div>
                   <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {new Date(booking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <button className="mt-auto w-full bg-red-50 text-red-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Cancel Request</button>
              </div>
            ))}
          </div>

          {events.length === 0 && activeTab === 'events' && (
             <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">Initiate Your First Event</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;