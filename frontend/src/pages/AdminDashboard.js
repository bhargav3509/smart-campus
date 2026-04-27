import { useState, useEffect, useRef, useCallback } from 'react';
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

const IconStats = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const container = useRef(null);

  const [eventForm, setEventForm] = useState({ title: '', description: '', start_time: '', end_time: '', venue_id: '', category: '', max_attendees: '', poster: null });
  const [venueForm, setVenueForm] = useState({ name: '', capacity: '', location: '' });

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actions
  const handlePublish = async (id) => {
    try { await API.put(`/events/${id}/status`, { status: 'published' }); toast.success('Published!'); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete event?')) return;
    try { await API.delete(`/events/${id}`); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleBookingStatus = async (id, status) => {
    try { await API.put(`/bookings/${id}/status`, { status }); toast.success(`Booking ${status}`); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    try { await API.delete(`/bookings/${id}`); toast.success('Booking deleted'); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try { await API.post('/venues', venueForm); toast.success('Venue added'); setShowVenueForm(false); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(eventForm).forEach(key => { if (eventForm[key]) formData.append(key, eventForm[key]); });
    try { await API.post('/events', formData); toast.success('Event created'); setShowEventForm(false); fetchData(); } catch { toast.error('Failed'); }
  };

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        
        const cards = container.current?.querySelectorAll('.admin-card');
        if (cards?.length > 0) {
          gsap.from(cards, { y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.3 });
        }
      }, container);
      return () => ctx.revert();
    }
  }, [loading, activeTab]);

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent transparent transparent` }} />
    </div>
  );

  const inputClass = "w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";

  return (
    <div ref={container} className="min-h-screen bg-[#f8f9fc] flex font-sans antialiased text-gray-900">
      
      {/* Sidebar */}
      <aside className="sidebar w-20 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-50 sticky top-0 h-screen">
        <div className="mb-12">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-900/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <SidebarItem icon={IconVenues} label="Venues" active={activeTab === 'venues'} onClick={() => setActiveTab('venues')} />
          <SidebarItem icon={IconBookings} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
        </div>
        <div className="w-full">
          <SidebarItem icon={IconStats} label="Stats" onClick={() => window.location.href='/analytics'} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8 flex-1">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Control Panel</h1>
            <div className="relative max-w-md w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repository..." className="w-full bg-gray-100/80 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-900 truncate max-w-[100px] leading-tight uppercase tracking-wider">{user?.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                {activeTab === 'events' ? 'Event Management' : activeTab === 'venues' ? 'Venue Infrastructure' : 'Booking Overwatch'}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Administrative Overwatch & Logistics</p>
            </div>
            
            {activeTab === 'events' && (
              <button onClick={() => setShowEventForm(!showEventForm)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                + Add Event
              </button>
            )}
            {activeTab === 'venues' && (
              <button onClick={() => setShowVenueForm(!showVenueForm)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                + Add Venue
              </button>
            )}
          </div>

          {/* Forms */}
          {showEventForm && (
            <div className="mb-10 bg-white rounded-[40px] p-10 shadow-soft border border-blue-100/50">
              <h3 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Event Title" className={inputClass} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                <input type="text" placeholder="Category (e.g. Workshop, Seminar)" className={inputClass} onChange={e => setEventForm({...eventForm, category: e.target.value})} required />
                <textarea placeholder="Event Description" className={`${inputClass} md:col-span-2 h-32`} onChange={e => setEventForm({...eventForm, description: e.target.value})} required />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-2">Start Time</p>
                  <input type="datetime-local" className={inputClass} onChange={e => setEventForm({...eventForm, start_time: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-2">End Time</p>
                  <input type="datetime-local" className={inputClass} onChange={e => setEventForm({...eventForm, end_time: e.target.value})} required />
                </div>
                <select className={inputClass} onChange={e => setEventForm({...eventForm, venue_id: e.target.value})} required>
                  <option value="">Select Venue</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.capacity} capacity)</option>)}
                </select>
                <input type="number" placeholder="Max Attendees" className={inputClass} onChange={e => setEventForm({...eventForm, max_attendees: e.target.value})} required />
                <div className="md:col-span-2 bg-gray-50 p-6 rounded-[24px] border border-dashed border-gray-200 text-center">
                  <input type="file" onChange={e => setEventForm({...eventForm, poster: e.target.files[0]})} className="text-xs" />
                  <p className="text-[10px] font-bold text-gray-400 mt-2">Upload Event Poster (Optional)</p>
                </div>
                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Submit Event</button>
                  <button type="button" onClick={() => setShowEventForm(false)} className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {showVenueForm && (
            <div className="mb-10 bg-white rounded-[40px] p-10 shadow-soft border border-blue-100/50">
              <h3 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Register Infrastructure</h3>
              <form onSubmit={handleCreateVenue} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Venue Name" className={inputClass} onChange={e => setVenueForm({...venueForm, name: e.target.value})} required />
                <input type="number" placeholder="Max Capacity" className={inputClass} onChange={e => setVenueForm({...venueForm, capacity: e.target.value})} required />
                <input type="text" placeholder="Location/Building" className={`${inputClass} md:col-span-2`} onChange={e => setVenueForm({...venueForm, location: e.target.value})} required />
                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Add Venue</button>
                  <button type="button" onClick={() => setShowVenueForm(false)} className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Dynamic Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'events' && filteredEvents.map((event, idx) => (
              <div key={event.id} className="admin-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                <div className="h-44 relative bg-gray-50 overflow-hidden">
                  {event.poster_url && (
                    <img src={event.poster_url.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} 
                      alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl backdrop-blur-md uppercase tracking-widest shadow-sm ${event.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-yellow-400/90 text-gray-900'}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                  <div className="space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                    <p>📍 {event.venue_name || 'No venue assigned'}</p>
                    <p>📅 {new Date(event.start_time).toLocaleString()}</p>
                  </div>
                  <div className="mt-auto flex gap-2">
                    {event.status !== 'published' && (
                      <button onClick={() => handlePublish(event.id)}
                        className="flex-1 bg-green-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20 active:scale-95 transition-all">Publish</button>
                    )}
                    <button onClick={() => handleDeleteEvent(event.id)}
                      className="px-6 bg-red-50 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'venues' && venues.map(venue => (
              <div key={venue.id} className="admin-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{venue.name}</h3>
                <div className="space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <p>📍 Location: {venue.location}</p>
                  <p>👥 Capacity: {venue.capacity} persons</p>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Operational</span>
                </div>
              </div>
            ))}

            {activeTab === 'bookings' && bookings.map(booking => (
              <div key={booking.id} className="admin-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{booking.venue_name}</h3>
                <div className="space-y-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <p className="text-gray-900">Requester: {booking.user_name}</p>
                  <p>📅 Date: {new Date(booking.start_time).toLocaleString()}</p>
                  <p className={`mt-2 inline-block px-2 py-1 rounded-lg ${booking.status === 'approved' ? 'bg-green-100 text-green-600' : booking.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{booking.status}</p>
                </div>
                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => handleBookingStatus(booking.id, 'approved')} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Approve</button>
                      <button onClick={() => handleBookingStatus(booking.id, 'rejected')} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Reject</button>
                    </>
                  )}
                  <button onClick={() => handleDeleteBooking(booking.id)} className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Delete</button>
                </div>
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