import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';
import { fmtDateTime, fmtTime } from '../utils/time';

const BLUE  = '#1a73e8';
const GREEN = '#34a853';

/* ─── Icons ─── */
const IconEvents   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconBookings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconProfile  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const IC = 'w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';

const StatusBadge = ({ status }) => {
  const map = { published:'bg-green-100 text-green-700', draft:'bg-yellow-100 text-yellow-700', pending:'bg-yellow-100 text-yellow-700', approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-600' };
  return <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]           = useState('events');
  const [events, setEvents]                 = useState([]);
  const [venues, setVenues]                 = useState([]);
  const [myBookings, setMyBookings]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showEventForm, setShowEventForm]   = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [posterFile, setPosterFile]         = useState(null);

  const [eventForm, setEventForm]   = useState({ title:'', description:'', start_time:'', end_time:'', venue_id:'', category:'', max_attendees:'' });
  const [bookingForm, setBookingForm] = useState({ venue_id:'', start_time:'', end_time:'' });

  const fetchData = useCallback(async () => {
    try {
      const [ev, vn, bk] = await Promise.all([
        API.get('/events/my'),
        API.get('/venues'),
        API.get('/bookings'),
      ]);
      setEvents(ev.data);
      setVenues(vn.data);
      setMyBookings(bk.data);
    } catch (err) {
      console.error('FacultyDashboard sync error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    // Fix: attach local timezone offset so backend stores correct UTC
    const toLocalISO = (val) => {
      if (!val) return val;
      const offset = -new Date().getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
      return `${val}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
    };
    const fd = new FormData();
    Object.entries(eventForm).forEach(([k, v]) => {
      if (!v) return;
      if (k === 'start_time' || k === 'end_time') fd.append(k, toLocalISO(v));
      else fd.append(k, v);
    });
    if (posterFile) fd.append('poster', posterFile);
    try { await API.post('/events', fd); toast.success('Event submitted for approval'); setShowEventForm(false); fetchData(); }
    catch { toast.error('Submission failed'); }
  };
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try { await API.post('/bookings', bookingForm); toast.success('Venue booking requested!'); setShowBookingForm(false); setBookingForm({ venue_id:'', start_time:'', end_time:'' }); fetchData(); }
    catch { toast.error('Booking request failed'); }
  };
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking request?')) return;
    try {
      await API.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed'); }
  };

  if (loading) return <FullPageSpinner />;

  const sidebarTop = [
    { icon: IconEvents,   label: 'My Events', active: activeTab === 'events',   onClick: () => setActiveTab('events') },
    { icon: IconBookings, label: 'Bookings',  active: activeTab === 'bookings', onClick: () => setActiveTab('bookings') },
  ];
  const sidebarBottom = [
    { icon: IconProfile, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'events' && (
        <button onClick={() => { setShowEventForm(v => !v); setShowBookingForm(false); }}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: BLUE }}>
          + Create Event
        </button>
      )}
      {activeTab === 'bookings' && (
        <button onClick={() => { setShowBookingForm(v => !v); setShowEventForm(false); }}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: GREEN }}>
          + Book Venue
        </button>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Faculty Console"
      subtitle="Academic Coordination"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor={BLUE}
    >
      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">
            {activeTab === 'events' ? 'Event Hosting' : 'Infrastructure Booking'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Organize and manage campus engagements</p>
        </div>

        {/* ── Event creation form ── */}
        {showEventForm && (
          <div className="mb-8 bg-white rounded-[32px] p-8 border border-blue-100/50 shadow-soft animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black font-display">New Engagement Request</h3>
              <button onClick={() => setShowEventForm(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" placeholder="Event Title *" className={IC} required onChange={e => setEventForm(f => ({...f, title: e.target.value}))} />
              <input type="text" placeholder="Category *" className={IC} required onChange={e => setEventForm(f => ({...f, category: e.target.value}))} />
              <textarea placeholder="Description *" rows={3} className={`${IC} md:col-span-2 h-24 resize-none`} required onChange={e => setEventForm(f => ({...f, description: e.target.value}))} />
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Start Time *</p>
                <input type="datetime-local" className={IC} required onChange={e => setEventForm(f => ({...f, start_time: e.target.value}))} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">End Time *</p>
                <input type="datetime-local" className={IC} required onChange={e => setEventForm(f => ({...f, end_time: e.target.value}))} />
              </div>
              <select className={IC} required onChange={e => setEventForm(f => ({...f, venue_id: e.target.value}))}>
                <option value="">Select Venue *</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name} (cap: {v.capacity})</option>)}
              </select>
              <input type="number" placeholder="Max Attendees *" className={IC} required onChange={e => setEventForm(f => ({...f, max_attendees: e.target.value}))} />
              <div className="md:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Poster (Optional)</p>
                <input type="file" accept="image/*" className="text-xs" onChange={e => setPosterFile(e.target.files[0])} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: BLUE }}>Submit for Approval</button>
                <button type="button" onClick={() => setShowEventForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Venue booking form ── */}
        {showBookingForm && (
          <div className="mb-8 bg-white rounded-[32px] p-8 border border-green-100/50 shadow-soft animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black font-display">Venue Reservation</h3>
              <button onClick={() => setShowBookingForm(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <select className={IC} required onChange={e => setBookingForm(f => ({...f, venue_id: e.target.value}))}>
                  <option value="">Select Venue *</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.location} (cap: {v.capacity})</option>)}
                </select>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Start Time *</p>
                <input type="datetime-local" className={IC} required onChange={e => setBookingForm(f => ({...f, start_time: e.target.value}))} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">End Time *</p>
                <input type="datetime-local" className={IC} required onChange={e => setBookingForm(f => ({...f, end_time: e.target.value}))} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: GREEN }}>Request Slot</button>
                <button type="button" onClick={() => setShowBookingForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── My Events ── */}
        {activeTab === 'events' && (
          events.length === 0
            ? <EmptyState title="No Events Yet" description="Create your first event using the button above"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, idx) => (
                  <div key={event.id} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-soft hover:-translate-y-1 transition-all duration-300 animate-slide-up flex flex-col"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                    <div className="h-36 relative bg-gray-50 overflow-hidden flex-shrink-0">
                      {event.poster_url && (
                        <img src={event.poster_url.startsWith('http') ? event.poster_url : `http://localhost:5000/${event.poster_url.replace(/^\//, '')}`}
                          alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      )}
                      <div className="absolute top-3 left-3 z-10"><StatusBadge status={event.status} /></div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-1 font-display line-clamp-2">{event.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-medium">{event.description}</p>
                      <div className="mt-auto space-y-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50">
                        <p>📍 {event.venue_name || 'No venue'}</p>
                        <p>📅 {fmtDateTime(event.start_time)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Bookings ── */}
        {activeTab === 'bookings' && (
          myBookings.length === 0
            ? <EmptyState title="No Bookings Yet" description="Request a venue using the button above"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              />
            : <div className="space-y-4">
                {myBookings.map((b, idx) => (
                  <div key={b.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-gray-900 font-display">{b.venue_name}</h3>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>📅 {fmtDateTime(b.start_time)}</span>
                        <span>→ {fmtTime(b.end_time)}</span>
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <button onClick={() => handleCancelBooking(b.id)}
                        className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0">
                        Cancel Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;