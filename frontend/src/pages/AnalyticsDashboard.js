import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';
const PURPLE = '#7c4dff';

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

const AnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const container = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

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
        gsap.from('.stat-card', { scale: 0.9, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.3 });
        gsap.from('.table-section', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.5 });
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
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <SidebarItem icon={IconDashboard} label="Admin" onClick={() => window.history.back()} />
          <SidebarItem icon={IconAnalytics} label="Stats" active />
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
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: '#111' }}>Analytics Engine</h1>
            <div className="flex items-center gap-2 bg-green-50 rounded-full px-4 py-1.5 border border-green-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Real-time Feed</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
              <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          
          <div className="mb-10">
            <h2 className="text-5xl font-black text-gray-900 leading-none mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>
              System Metrics
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Data-driven insights for EveSphere</p>
          </div>

          {stats && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[
                  { label: 'Platform Users', value: stats.users.total, color: BLUE, sub: 'Total registered accounts' },
                  { label: 'Campus Events', value: stats.events.total, color: GREEN, sub: 'Successfully deployed' },
                  { label: 'Active Venues', value: stats.venues.total, color: PURPLE, sub: 'Allocated spaces' },
                  { label: 'Registrations', value: stats.registrations.total, color: '#fbbc05', sub: 'Total attendance' },
                ].map((stat, i) => (
                  <div key={i} className="stat-card bg-white rounded-[32px] p-8 shadow-soft border border-gray-100/50 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
                    <p className="text-6xl font-black text-gray-900 mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{stat.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.sub}</p>
                    <div className="mt-6 w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                       <div className="h-full rounded-full" style={{ backgroundColor: stat.color, width: '60%' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Events Table Section */}
              <div className="table-section bg-white rounded-[40px] border border-gray-100 p-10 shadow-soft">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>High-Occupancy Activities</h3>
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Top 10 Performers</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 pb-2">Event Detail</th>
                        <th className="px-6 pb-2">Location</th>
                        <th className="px-6 pb-2">Registrations</th>
                        <th className="px-6 pb-2 text-right">Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topEvents.map((event, i) => {
                         const occupancy = event.max_attendees ? Math.round((event.registration_count / event.max_attendees) * 100) : 0;
                         return (
                           <tr key={i} className="bg-gray-50/50 rounded-2xl transition-all hover:bg-gray-100/50">
                             <td className="px-6 py-5 rounded-l-[20px] font-black text-lg text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</td>
                             <td className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">{event.venue_name || 'TBA'}</td>
                             <td className="px-6 py-5 text-xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.registration_count}</td>
                             <td className="px-6 py-5 rounded-r-[20px] text-right">
                               <div className="flex items-center justify-end gap-3">
                                 <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${occupancy}%` }}></div>
                                 </div>
                                 <span className="text-xs font-black text-blue-600">{occupancy}%</span>
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