import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
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
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [eventForm, setEventForm] = useState({ title: '', description: '', start_time: '', end_time: '', venue_id: '', category: '', max_attendees: '' });
  const [bookingForm, setBookingForm] = useState({ venue_id: '', start_time: '', end_time: '' });
  const [posterFile, setPosterFile] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [ev, vn, bk] = await Promise.all([
        API.get('/events/my'),
        API.get('/venues'),
        API.get('/bookings/my')
      ]);
      setEvents(ev.data);
      setVenues(vn.data);
      setMyBookings(bk.data);
    } catch { toast.error('Sync failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(eventForm).forEach(k => formData.append(k, eventForm[k]));
    if (posterFile) formData.append('poster', posterFile);
    try { await API.post('/events', formData); toast.success('Submitted for approval'); setShowEventForm(false); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try { await API.post('/bookings', bookingForm); toast.success('Booking requested'); setShowBookingForm(false); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleCancelBooking = async (id) => {
    try { await API.delete(`/bookings/${id}`); toast.success('Cancelled'); fetchData(); } catch { toast.error('Failed'); }
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

  const inputClass = "w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none";

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
          <SidebarItem icon={IconDashboard} label="My Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <SidebarItem icon={IconCalendar} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Faculty Console</h1>
            <div className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">Academic Coordination</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-900 truncate max-w-[100px] leading-tight uppercase tracking-wider">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Faculty Member</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
                {activeTab === 'events' ? 'Event Hosting' : 'Infrastructure Booking'}
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Organize and Manage Campus Engagements</p>
            </div>
            
            {activeTab === 'events' && (
              <button onClick={() => setShowEventForm(!showEventForm)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                + Create Event
              </button>
            )}
            {activeTab === 'bookings' && (
              <button onClick={() => setShowBookingForm(!showBookingForm)}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                + Book Venue
              </button>
            )}
          </div>

          {/* Forms */}
          {showEventForm && (
            <div className="mb-10 bg-white rounded-[40px] p-10 shadow-soft border border-blue-100/50">
              <h3 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>New Engagement Request</h3>
              <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Event Title" className={inputClass} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                <input type="text" placeholder="Category" className={inputClass} onChange={e => setEventForm({...eventForm, category: e.target.value})} required />
                <textarea placeholder="Description" className={`${inputClass} md:col-span-2 h-32`} onChange={e => setEventForm({...eventForm, description: e.target.value})} required />
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
                  <input type="file" onChange={e => setPosterFile(e.target.files[0])} className="text-xs" />
                  <p className="text-[10px] font-bold text-gray-400 mt-2">Upload Event Poster (Optional)</p>
                </div>
                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Submit for Approval</button>
                  <button type="button" onClick={() => setShowEventForm(false)} className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {showBookingForm && (
            <div className="mb-10 bg-white rounded-[40px] p-10 shadow-soft border border-blue-100/50">
              <h3 className="text-2xl font-black mb-6" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Venue Reservation</h3>
              <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select className={inputClass} onChange={e => setBookingForm({...bookingForm, venue_id: e.target.value})} required>
                  <option value="">Select Venue</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.capacity} capacity)</option>)}
                </select>
                <div className="hidden md:block"></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-2">Start Time</p>
                  <input type="datetime-local" className={inputClass} onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase ml-2">End Time</p>
                  <input type="datetime-local" className={inputClass} onChange={e => setBookingForm({...bookingForm, end_time: e.target.value})} required />
                </div>
                <div className="md:col-span-2 flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Request Slot</button>
                  <button type="button" onClick={() => setShowBookingForm(false)} className="px-8 bg-gray-100 text-gray-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'events' && events.map((event, idx) => (
              <div key={event.id} className="faculty-card bg-white rounded-[32px] overflow-hidden shadow-soft border border-gray-100/50 flex flex-col hover:-translate-y-2 transition-all duration-300">
                <div className="h-44 relative bg-gray-50 overflow-hidden">
                  {event.poster_url && (
                    <img src={event.poster_url?.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} 
                      alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl backdrop-blur-md uppercase tracking-widest shadow-sm ${
                      event.status === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-6 font-medium">{event.description}</p>
                  <div className="mt-auto space-y-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50">
                    <p>📍 {event.venue_name || 'No venue'}</p>
                    <p>📅 {new Date(event.start_time).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'bookings' && myBookings.map(b => (
              <div key={b.id} className="faculty-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50">
                <h3 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{b.venue_name}</h3>
                <div className="space-y-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <p>📅 From: {new Date(b.start_time).toLocaleString()}</p>
                  <p>📅 To: {new Date(b.end_time).toLocaleString()}</p>
                  <span className={`mt-3 inline-block px-3 py-1 rounded-full ${
                    b.status === 'approved' ? 'bg-green-100 text-green-600' : b.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>{b.status}</span>
                </div>
                {b.status === 'pending' && (
                  <button onClick={() => handleCancelBooking(b.id)} className="w-full bg-red-50 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Cancel Request</button>
                )}
              </div>
            ))}
          </div>

          {(activeTab === 'events' ? events : myBookings).length === 0 && (
            <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-sm">No activity recorded</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;