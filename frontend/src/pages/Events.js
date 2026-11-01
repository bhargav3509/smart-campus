import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import EmptyState from '../components/ui/EmptyState';
import { FullPageSpinner } from '../components/ui/Spinner';
import { fmtDate } from '../utils/time';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const YELLOW = '#fbbc05';
const RED    = '#ea4335';
const PURPLE = '#7c4dff';
const ACCENTS = [BLUE, GREEN, YELLOW, RED, PURPLE];



const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (q = '') => {
    try {
      const [evRes, regRes] = await Promise.all([
        API.get('/events', { params: q ? { search: q } : {} }),
        user?.role === 'student' ? API.get('/registrations/my') : Promise.resolve({ data: [] }),
      ]);
      setEvents(evRes.data);
      setRegisteredIds(regRes.data.map(r => r.event_id));
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchData]);

  const handleRegister = async (id) => {
    try {
      await API.post(`/events/${id}/register`);
      toast.success('Registered! Check your email for confirmation.');
      setRegisteredIds(prev => [...prev, id]);
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
  };

  if (loading) return <FullPageSpinner />;

  const sidebarTop = [
    { label: 'Home', onClick: () => navigate(-1) },
  ];
  const sidebarBottom = [
    { label: 'Profile', onClick: () => navigate('/profile') },
  ];

  const headerActions = (
    <div className="relative">
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search events…"
        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );

  return (
    <DashboardLayout
      title="Event Catalog"
      subtitle="All published events"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      headerActions={headerActions}
      accentColor={BLUE}
    >
      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">Discovery</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Explore the full spectrum of campus life</p>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title={search ? 'No results found' : 'No Events Yet'}
            description={search ? `Nothing matches "${search}"` : 'Events will appear here once published'}

            action={search ? <button onClick={() => setSearch('')} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: BLUE }}>Clear Search</button> : null}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event, idx) => {
              const accent = ACCENTS[idx % ACCENTS.length];
              const registered = registeredIds.includes(event.id);
              const past = new Date() > new Date(event.end_time);
              const apiBase = (process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`).replace(/\/api$/, '');
              const posterSrc = event.poster_url
                ? (event.poster_url.startsWith('http') ? event.poster_url : `${apiBase}/${event.poster_url.replace(/^\//, '')}`)

                : null;

              return (
                <div key={event.id}
                  className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-soft flex flex-col hover:-translate-y-1.5 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}>
                  <div className="h-40 relative overflow-hidden bg-gray-50 flex-shrink-0">
                    {posterSrc
                      ? <img src={posterSrc} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}12, ${accent}05)` }}>

                        </div>
                    }
                    <div className="absolute top-3 left-3">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 border border-white/60 uppercase tracking-widest shadow-sm">
                        {event.category || event.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1 leading-tight font-display line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-medium">{event.description}</p>
                    <div className="space-y-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                      <div className="flex items-center gap-1.5">Venue: {event.venue_name || 'TBA'}
                      </div>
                      <div className="flex items-center gap-1.5">Date: {fmtDate(event.start_time)}
                      </div>
                    </div>
                    <div className="mt-auto">
                      {past ? (
                        <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-center text-[9px] font-black uppercase tracking-widest border border-gray-200">Event Ended</div>
                      ) : user?.role === 'student' ? (
                        registered ? (
                          <div className="w-full py-2.5 rounded-xl bg-green-50 text-green-600 text-center text-[9px] font-black uppercase tracking-widest border border-green-100">Registered</div>
                        ) : (
                          <button onClick={() => handleRegister(event.id)}
                            className="w-full py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
                            style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}30` }}>
                            Join Event
                          </button>
                        )
                      ) : (
                        <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-300 text-center text-[9px] font-black uppercase tracking-widest">View Only</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Events;