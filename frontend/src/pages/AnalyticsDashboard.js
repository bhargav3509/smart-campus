import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FullPageSpinner } from '../components/ui/Spinner';

const BLUE   = '#1a73e8';
const GREEN  = '#34a853';
const YELLOW = '#fbbc05';
const RED    = '#ea4335';

const IconStats  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconAdmin  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon, color, delay }) => (
  <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-soft animate-slide-up" style={{ animationDelay: delay }}>
    <div className="flex items-center justify-between mb-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15', color }}>
        {icon}
      </div>
    </div>
    <p className="text-4xl font-black font-display" style={{ color }}>{value ?? '—'}</p>
  </div>
);

/* ─── Bar ─── */
const PipelineBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <span className="text-[10px] font-black text-gray-400">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await API.get('/analytics/stats');
      setStats(res.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <FullPageSpinner />;

  const sidebarTop = [
    { icon: IconStats, label: 'Analytics', active: true, onClick: () => {} },
  ];
  const sidebarBottom = [
    { icon: IconAdmin, label: 'Admin', onClick: () => navigate('/admin') },
  ];

  const bTotal     = Number(stats?.bookings?.total    || 0);
  const bApproved  = Number(stats?.bookings?.approved || 0);
  const bPending   = Number(stats?.bookings?.pending  || 0);
  const bRejected  = bTotal - bApproved - bPending;

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Platform Health"
      sidebarTop={sidebarTop}
      sidebarBottom={sidebarBottom}
      accentColor="#0f0f11"
    >
      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-5xl font-black text-gray-900 leading-none mb-1 font-display">Platform Health</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Real-time campus engagement metrics</p>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Events" value={stats?.events?.total} delay="0ms" color={BLUE}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
          <StatCard label="Registrations" value={stats?.registrations?.total} delay="60ms" color={GREEN}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard label="Published" value={stats?.events?.published} delay="120ms" color={YELLOW}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <StatCard label="Total Venues" value={stats?.venues?.total} delay="180ms" color={RED}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* ── Booking pipeline ── */}
          <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-soft animate-slide-up delay-200">
            <h3 className="text-2xl font-black text-gray-900 mb-6 font-display">Venue Booking Pipeline</h3>
            {bTotal === 0 ? (
              <p className="text-sm text-gray-400 font-medium">No booking data yet.</p>
            ) : (
              <>
                <PipelineBar label="Approved" value={bApproved} max={bTotal} color={GREEN} />
                <PipelineBar label="Pending"  value={bPending}  max={bTotal} color={YELLOW} />
                <PipelineBar label="Rejected" value={bRejected} max={bTotal} color={RED} />
              </>
            )}
            <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Approved', value: bApproved, color: GREEN  },
                { label: 'Pending',  value: bPending,  color: YELLOW },
                { label: 'Rejected', value: bRejected, color: RED    },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-2xl font-black font-display" style={{ color }}>{value}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Platform health ── */}
          <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-soft animate-slide-up delay-300">
            <h3 className="text-2xl font-black text-gray-900 mb-6 font-display">System Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Users',    value: Number(stats?.users?.total    || 0) },
                { label: 'Students',       value: Number(stats?.users?.students || 0) },
                { label: 'Faculty',        value: Number(stats?.users?.faculty  || 0) },
                { label: 'Total Venues',   value: Number(stats?.venues?.total   || 0) },
                { label: 'Total Bookings', value: bTotal },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-semibold text-gray-600">{label}</p>
                  <p className="text-lg font-black font-display text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Top events table ── */}
        {stats?.topEvents && stats.topEvents.length > 0 && (
          <div className="bg-white rounded-[28px] p-8 border border-gray-100 shadow-soft animate-slide-up delay-400">
            <h3 className="text-2xl font-black text-gray-900 mb-6 font-display">Top Events by Registrations</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Event', 'Category', 'Venue', 'Registrations', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.topEvents.map((ev, i) => (
                    <tr key={ev.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-sm font-bold text-gray-900">{ev.title}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-500">{ev.category || '—'}</td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-500">{ev.venue_name || 'TBA'}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-black text-blue-600">{ev.registration_count}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${ev.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ev.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;