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

const IconAnalytics = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconVenues = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconBookings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ev, vn, bk] = await Promise.all([
        API.get('/events', { params: { status: 'all' } }),
        API.get('/venues'),
        API.get('/bookings')
      ]);
      setEvents(ev.data);
      setVenues(vn.data);
      setBookings(bk.data);
    } catch { toast.error('Failed to sync data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.delayedCall(0.3, () => {
          gsap.from('.admin-card', { y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
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
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <SidebarItem icon={IconVenues} label="Venues" active={activeTab === 'venues'} onClick={() => setActiveTab('venues')} />
          <SidebarItem icon={IconBookings} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <SidebarItem icon={IconAnalytics} label="Stats" />
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
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Control Panel</h1>
            <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 border border-gray-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
                <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{user?.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                {activeTab === 'events' ? 'Event Management' : activeTab === 'venues' ? 'Venue Registry' : 'Booking Requests'}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Administrative Overwatch</p>
            </div>
            <div className="flex gap-4">
               {activeTab === 'events' && <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all active:scale-95">Add Event</button>}
               {activeTab === 'venues' && <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all active:scale-95">Add Venue</button>}
            </div>
          </div>

          {/* Dynamic Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'events' && events.map((event, idx) => (
              <div key={event.id} className="admin-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-1 transition-all duration-300">
                <div className="h-40 bg-gray-50 relative border-b border-gray-50 overflow-hidden">
                  {event.poster_url ? <img src={event.poster_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200 font-black text-4xl uppercase" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>No Poster</div>}
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border ${event.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-4 truncate" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                  <div className="space-y-2 mb-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {event.venue_name || 'TBA'}</div>
                    <div className="flex items-center gap-3"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(event.start_time).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Edit</button>
                    <button className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'venues' && venues.map(venue => (
              <div key={venue.id} className="admin-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{venue.name}</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-6">{venue.location}</p>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Capacity</p>
                    <p className="text-2xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{venue.capacity}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Manage</button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'bookings' && bookings.map(booking => (
              <div key={booking.id} className="admin-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight truncate" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{booking.venue_name}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${booking.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}>{booking.status}</span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">{booking.user_name?.charAt(0)}</div>
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">{booking.user_name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Faculty Request</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {new Date(booking.start_time).toLocaleDateString()}
                  </p>
                </div>
                {booking.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Approve</button>
                    <button className="flex-1 bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {events.length === 0 && activeTab === 'events' && (
             <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">No Active Deployments</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;