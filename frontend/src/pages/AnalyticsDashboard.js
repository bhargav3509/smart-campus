import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';
const YELLOW = '#fbbc05';
const PURPLE = '#7c4dff';

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1.5 py-4 cursor-pointer transition-all ${active ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}>
    <Icon />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

const StatCard = ({ label, value, sub, colorClass }) => (
  <div className="bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 stat-card">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-5xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{value ?? '—'}</p>
    </div>
    {sub && <p className="text-xs font-bold text-gray-400 mt-2 lowercase">{sub}</p>}
    <div className={`mt-4 h-1 w-12 rounded-full ${colorClass}`}></div>
  </div>
);

const AnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/analytics/stats');
      setStats(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loading && stats) {
      const ctx = gsap.context(() => {
        gsap.from('.sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
        gsap.delayedCall(0.3, () => {
          gsap.from('.stat-card', { scale: 0.9, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
          gsap.from('.table-section', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.5 });
        });
      }, container);
      return () => ctx.revert();
    }
  }, [loading, stats]);

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
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <SidebarItem icon={IconDashboard} label="Home" active onClick={() => window.history.back()} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="top-nav h-20 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Data Engine</h1>
            <div className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">System Analytics</div>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-10">
          <div className="mb-10">
            <h2 className="text-6xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Platform Health</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Real-time engagement metrics</p>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <StatCard label="Total Users" value={stats.users.total} sub={`${stats.users.students} students / ${stats.users.faculty} faculty`} colorClass="bg-blue-600" />
                <StatCard label="Live Events" value={stats.events.total} sub={`${stats.events.published} published / ${stats.events.draft} drafts`} colorClass="bg-green-500" />
                <StatCard label="Infrastructure" value={stats.venues.total} sub="Active campus venues" colorClass="bg-purple-500" />
                <StatCard label="Engagement" value={stats.registrations.total} sub="Total seat reservations" colorClass="bg-yellow-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white rounded-[40px] p-10 shadow-soft border border-gray-100/50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Queue Status</p>
                      <h4 className="text-3xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Booking Pipeline</h4>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Requests</span>
                      <span className="text-3xl font-black text-orange-500" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{stats.bookings.pending}</span>
                    </div>
                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-400 h-full transition-all duration-1000" style={{ width: `${(stats.bookings.pending / (stats.bookings.total || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 shadow-soft border border-gray-100/50">
                   <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Success Metrics</p>
                      <h4 className="text-3xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Approved Slots</h4>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmed Bookings</span>
                      <span className="text-3xl font-black text-teal-500" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{stats.bookings.approved}</span>
                    </div>
                    <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full transition-all duration-1000" style={{ width: `${(stats.bookings.approved / (stats.bookings.total || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-section bg-white rounded-[40px] p-10 shadow-soft border border-gray-100/50 overflow-hidden">
                <h3 className="text-3xl font-black text-gray-900 mb-8" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>High Occupancy Events</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-50">
                        <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Identity</th>
                        <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue</th>
                        <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrations</th>
                        <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Saturation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.topEvents.map((event, i) => {
                        const fill = event.max_attendees ? Math.round((event.registration_count / event.max_attendees) * 100) : 0;
                        return (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-6 pr-4">
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{event.title}</p>
                            </td>
                            <td className="py-6 pr-4">
                              <p className="text-xs font-bold text-gray-500">{event.venue_name || 'TBA'}</p>
                            </td>
                            <td className="py-6 pr-4">
                              <p className="text-xs font-black text-gray-900">{event.registration_count} / {event.max_attendees}</p>
                            </td>
                            <td className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 max-w-[120px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ${fill > 80 ? 'bg-red-500' : fill > 50 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${Math.min(fill, 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400">{fill}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;