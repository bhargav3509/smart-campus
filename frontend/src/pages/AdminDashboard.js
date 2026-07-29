import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';
import { fmtDateTime, fmtTime } from '../utils/time';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const RED    = '#ea4335';

/* ─── Icons ─── */
const IconEvents   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconVenues   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconBookings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconStats    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

/* ─── Input class ─── */
const IC = 'w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';

/* ─── Inline form wrapper ─── */
const FormCard = ({ title, onClose, children }) => (
  <div className="mb-8 bg-white rounded-[32px] p-8 border border-blue-100/50 shadow-soft animate-slide-up">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-black font-display">{title}</h3>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    {children}
  </div>
);

/* ─── Status badge ─── */
const Badge = ({ status }) => {
  const map = {
    published: 'bg-green-100 text-green-700',
    draft:     'bg-yellow-100 text-yellow-700',
    pending:   'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

/* ─── Page ─── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState('events');
  const [events, setEvents]               = useState([]);
  const [venues, setVenues]               = useState([]);
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);

  const [eventForm, setEventForm] = useState({ title: '', description: '', start_time: '', end_time: '', venue_id: '', category: '', max_attendees: '', poster: null });
  const [venueForm, setVenueForm] = useState({ name: '', capacity: '', location: '' });

  const fetchData = useCallback(async () => {
    try {
      const [ev, vn, bk] = await Promise.all([
        API.get('/events', { params: { status: 'all' } }),
        API.get('/venues'),
        API.get('/bookings'),
      ]);
      setEvents(ev.data);
      setVenues(vn.data);
      setBookings(bk.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to sync data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Actions ─── */
  const handlePublish = async (id) => {
    try { await API.put(`/events/${id}/publish`); toast.success('Event published!'); fetchData(); }
    catch { toast.error('Failed to publish'); }
  };
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return;
    try { await API.delete(`/events/${id}`); toast.success('Event deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };
  const handleBookingStatus = async (id, status) => {
    try { await API.put(`/bookings/${id}/status`, { status }); toast.success(`Booking ${status}`); fetchData(); }
    catch { toast.error('Update failed'); }
  };
  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    try { await API.delete(`/bookings/${id}`); toast.success('Booking deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };
  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try { await API.post('/venues', venueForm); toast.success('Venue added!'); setShowVenueForm(false); setVenueForm({ name:'', capacity:'', location:'' }); fetchData(); }
    catch { toast.error('Failed to add venue'); }
  };
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
      if (v == null || v === '') return;
      if (k === 'start_time' || k === 'end_time') fd.append(k, toLocalISO(v));
      else fd.append(k, v);
    });
    try { await API.post('/events', fd); toast.success('Event created!'); setShowEventForm(false); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || err.message || 'Failed to create event'); }

  };

  if (loading) return <FullPageSpinner />;

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const sidebarTop = [
    { icon: IconEvents,   label: 'Events',   active: activeTab === 'events',   onClick: () => setActiveTab('events') },
    { icon: IconVenues,   label: 'Venues',   active: activeTab === 'venues',   onClick: () => setActiveTab('venues') },
    { icon: IconBookings, label: 'Bookings', active: activeTab === 'bookings', onClick: () => setActiveTab('bookings') },
  ];
  const sidebarBottom = [
    { icon: IconStats, label: 'Analytics', onClick: () => navigate('/analytics') },
  ];

  const headerActions = (
    <div className="flex items-center gap-3">
      <div className="relative hidden md:block">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44" />
      </div>
      {activeTab === 'events' && (
        <button onClick={() => { setShowEventForm(v => !v); setShowVenueForm(false); }}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: BLUE }}>
          + Add Event
        </button>
      )}
      {activeTab === 'venues' && (
        <button onClick={() => { setShowVenueForm(v => !v); setShowEventForm(false); }}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: GREEN }}>
          + Add Venue
        </button>
      )}
    </div>
  );

  const tabTitle = activeTab === 'events' ? 'Event Management' : activeTab === 'venues' ? 'Venue Infrastructure' : 'Booking Overwatch';

  return (
    <DashboardLayout
      title="Admin Console"
      subtitle="EveSphere Platform"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor="#0f0f11"
    >
      <div className="px-8 py-8">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">{tabTitle}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Administrative overwatch & logistics</p>
        </div>

        {/* ── Event form ── */}
        {showEventForm && (
          <FormCard title="Create New Event" onClose={() => setShowEventForm(false)}>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" placeholder="Event Title *" className={IC} required onChange={e => setEventForm(f => ({...f, title: e.target.value}))} />
              <input type="text" placeholder="Category (e.g. Workshop, Seminar) *" className={IC} required onChange={e => setEventForm(f => ({...f, category: e.target.value}))} />
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
                <input type="file" accept="image/*" className="text-xs" onChange={e => setEventForm(f => ({...f, poster: e.target.files[0]}))} />
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: BLUE }}>Create Event</button>
                <button type="button" onClick={() => setShowEventForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </FormCard>
        )}

        {/* ── Venue form ── */}
        {showVenueForm && (
          <FormCard title="Add New Venue" onClose={() => setShowVenueForm(false)}>
            <form onSubmit={handleCreateVenue} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" placeholder="Venue Name *" className={IC} required onChange={e => setVenueForm(f => ({...f, name: e.target.value}))} />
              <input type="number" placeholder="Max Capacity *" className={IC} required onChange={e => setVenueForm(f => ({...f, capacity: e.target.value}))} />
              <input type="text" placeholder="Location / Building *" className={`${IC} md:col-span-2`} required onChange={e => setVenueForm(f => ({...f, location: e.target.value}))} />
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: GREEN }}>Add Venue</button>
                <button type="button" onClick={() => setShowVenueForm(false)} className="px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </FormCard>
        )}

        {/* ── Events grid ── */}
        {activeTab === 'events' && (
          filteredEvents.length === 0
            ? <EmptyState title="No Events Found" description="Create your first event using the button above"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, idx) => (
                  <div key={event.id} className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-soft flex flex-col hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                    <div className="h-36 relative bg-gray-50 overflow-hidden">
                      {event.poster_url && (
                        <img src={event.poster_url.startsWith('http') ? event.poster_url : `${(process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`).replace(/\/api$/, '')}/${event.poster_url.replace(/^\//, '')}`}

                          alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      )}
                      <div className="absolute top-3 left-3 z-10"><Badge status={event.status} /></div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-1.5 font-display line-clamp-2">{event.title}</h3>
                      <div className="space-y-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                        <p>📍 {event.venue_name || 'No venue'}</p>
                        <p>📅 {fmtDateTime(event.start_time)}</p>
                        <p>👤 {event.organizer_name || 'Unknown'}</p>
                      </div>
                      <div className="mt-auto flex gap-2">
                        {event.status !== 'published' && (
                          <button onClick={() => handlePublish(event.id)}
                            className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                            style={{ backgroundColor: GREEN }}>Publish</button>
                        )}
                        <button onClick={() => handleDeleteEvent(event.id)}
                          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Venues grid ── */}
        {activeTab === 'venues' && (
          venues.length === 0
            ? <EmptyState title="No Venues Registered" description="Add your first venue using the button above"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue, idx) => (
                  <div key={venue.id} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-soft hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-1 font-display">{venue.name}</h3>
                    <div className="space-y-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                      <p>📍 {venue.location}</p>
                      <p>👥 Capacity: {venue.capacity}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Operational</span>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Bookings list ── */}
        {activeTab === 'bookings' && (
          bookings.length === 0
            ? <EmptyState title="No Bookings Yet" description="Venue booking requests from faculty will appear here"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              />
            : <div className="space-y-4">
                {bookings.map((b, idx) => (
                  <div key={b.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-gray-900 font-display">{b.venue_name}</h3>
                        <Badge status={b.status} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>👤 {b.user_name}</span>
                        <span>📅 {fmtDateTime(b.start_time)}</span>
                        <span>→ {fmtTime(b.end_time)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleBookingStatus(b.id, 'approved')}
                            className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                            style={{ backgroundColor: GREEN }}>Approve</button>
                          <button onClick={() => handleBookingStatus(b.id, 'rejected')}
                            className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                            style={{ backgroundColor: RED }}>Reject</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteBooking(b.id)}
                        className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;