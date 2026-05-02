import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import QRModal from '../components/QRModal';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';
import { fmtDateTime } from '../utils/time';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const YELLOW = '#fbbc05';
const RED = '#ea4335';
const PURPLE = '#7c4dff';
const ACCENTS = [BLUE, GREEN, YELLOW, RED, PURPLE];

/* ─── Icons ─── */
const IconHome     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconEvents   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconProfile  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

/* ─── Poster placeholder ─── */
const PosterPlaceholder = ({ title, color }) => (
  <div className="w-full h-full flex items-center justify-center text-white/30" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}>
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  </div>
);

/* ─── Single event card ─── */
const EventCard = ({ event, idx, registered, past, onRegister, onCancel, onViewTicket }) => {
  const accent = ACCENTS[idx % ACCENTS.length];
  const delayMs = Math.min(idx * 50, 300);

  const apiBase = (process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`).replace(/\/api$/, '');
  const posterSrc = event.poster_url
    ? (event.poster_url.startsWith('http') ? event.poster_url : `${apiBase}/${event.poster_url.replace(/^\//, '')}`)

    : null;

  return (
    <div
      className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-soft flex flex-col hover:-translate-y-1.5 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {/* Poster */}
      <div className="h-40 relative overflow-hidden bg-gray-50 flex-shrink-0">
        {posterSrc
          ? <img src={posterSrc} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }}/>
          : <PosterPlaceholder title={event.title} color={accent} />
        }
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 uppercase tracking-widest shadow-sm border border-white/60">
            {event.category || event.status || 'Event'}
          </span>
        </div>
        {past && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-black text-gray-900 mb-1.5 leading-tight font-display line-clamp-2">{event.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-medium leading-relaxed">{event.description}</p>

        <div className="space-y-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {event.venue_name || 'TBA'}
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {fmtDateTime(event.start_time)}
          </div>
          {event.organizer_name && (
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {event.organizer_name}
            </div>
          )}
        </div>

        <div className="mt-auto">
          {past ? (
            <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-center text-[9px] font-black uppercase tracking-widest border border-gray-200">
              Event Ended
            </div>
          ) : registered ? (
            <div className="space-y-2">
              <div className="w-full py-2.5 rounded-xl bg-green-50 text-green-600 text-center text-[9px] font-black uppercase tracking-widest border border-green-100">
                ✓ Registered
              </div>
              <div className="flex gap-2">
                <button onClick={onViewTicket}
                  className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                  🎟 Ticket
                </button>
                <button onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onRegister}
              className="w-full py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
              style={{ backgroundColor: accent, boxShadow: `0 6px 16px ${accent}30` }}>
              Register for Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── My Registrations row ─── */
const RegRow = ({ reg, idx, onViewTicket, onCancel }) => (
  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-slide-up"
    style={{ animationDelay: `${idx * 50}ms` }}>
    <div className="flex-1 min-w-0">
      <h3 className="text-xl font-black text-gray-900 mb-1.5 font-display truncate">{reg.event_title}</h3>
      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">📍 {reg.venue_name || 'TBA'}</span>
        <span className="flex items-center gap-1.5">📅 {fmtDateTime(reg.start_time)}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] ${reg.status === 'attended' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          {reg.status}
        </span>
      </div>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      <button onClick={onViewTicket}
        className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition-all"
        style={{ backgroundColor: BLUE, boxShadow: `0 4px 12px ${BLUE}30` }}>
        🎟 QR Ticket
      </button>
      {reg.status === 'registered' && (
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
          Cancel
        </button>
      )}
    </div>
  </div>
);

/* ─── Page ─── */
const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrEvent, setQrEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [sortOption, setSortOption] = useState('ended_last');

  const fetchData = useCallback(async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        API.get('/events'),
        API.get('/registrations/my'),
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
      toast.success('Registered! Check your email for confirmation.');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Cancel your registration for this event?')) return;
    try {
      await API.delete(`/registrations/${eventId}`);
      toast.success('Registration cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed'); }
  };

  const isRegistered = (id) => myRegistrations.some(r => r.event_id === id);
  const getRegistration = (id) => myRegistrations.find(r => r.event_id === id);
  const isPast = (t) => new Date() > new Date(t);

  const sortedEvents = [...events].sort((a, b) => {
    const aPast = new Date() > new Date(a.end_time);
    const bPast = new Date() > new Date(b.end_time);

    // Always push ended events to bottom regardless of sort mode
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;

    if (sortOption === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return new Date(a.start_time) - new Date(b.start_time); // upcoming / ended_last
  });

  if (loading) return <FullPageSpinner />;

  const sidebarTop = [
    { icon: IconHome,   label: 'Home',     active: activeTab === 'events',         onClick: () => setActiveTab('events') },
    { icon: IconEvents, label: 'My Events', active: activeTab === 'registrations',  onClick: () => setActiveTab('registrations') },
  ];
  const sidebarBottom = [
    { icon: IconProfile, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const headerActions = activeTab === 'events' ? (
      <select value={sortOption} onChange={e => setSortOption(e.target.value)}
      className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 shadow-soft focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
      <option value="ended_last">Active First</option>
      <option value="upcoming">By Start Time</option>
      <option value="newest">Newest First</option>
    </select>
  ) : null;

  return (
    <DashboardLayout
      title="EveSphere"
      subtitle={`Welcome, ${user?.name?.split(' ')[0]}`}
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor={BLUE}
    >
      <div className="px-8 py-8">
        {/* Section header */}
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">
            {activeTab === 'events' ? 'Discovery' : 'My Registrations'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {activeTab === 'events'
              ? 'Explore the full spectrum of campus life'
              : `${myRegistrations.length} active registration${myRegistrations.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Discovery grid */}
        {activeTab === 'events' && (
          sortedEvents.length === 0
            ? <EmptyState
                title="No Events Yet"
                description="Events will appear here once published"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              />
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedEvents.map((event, idx) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    idx={idx}
                    registered={isRegistered(event.id)}
                    past={isPast(event.end_time)}
                    onRegister={() => handleRegister(event.id)}
                    onCancel={() => handleCancelRegistration(event.id)}
                    onViewTicket={() => setQrEvent({ ...event, registration: getRegistration(event.id) })}
                  />
                ))}
              </div>
        )}

        {/* My registrations list */}
        {activeTab === 'registrations' && (
          myRegistrations.length === 0
            ? <EmptyState
                title="No Registrations Yet"
                description="Events you sign up for will appear here"
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                action={
                  <button onClick={() => setActiveTab('events')}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                    style={{ backgroundColor: BLUE }}>
                    Browse Events
                  </button>
                }
              />
            : <div className="space-y-4">
                {myRegistrations.map((reg, idx) => (
                  <RegRow
                    key={reg.id}
                    reg={reg}
                    idx={idx}
                    onViewTicket={() => setQrEvent({ id: reg.event_id, title: reg.event_title, registration: reg })}
                    onCancel={() => handleCancelRegistration(reg.event_id)}
                  />
                ))}
              </div>
        )}
      </div>

      {qrEvent && <QRModal event={qrEvent} onClose={() => setQrEvent(null)} />}
    </DashboardLayout>
  );
};

export default StudentDashboard;