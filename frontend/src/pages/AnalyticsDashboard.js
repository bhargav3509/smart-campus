import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';

const StatCard = ({ label, value, sub, color }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 ${color}`}>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-800 dark:text-white">{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const AnalyticsDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/analytics/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">EveSphere — Analytics</h1>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-sm">Welcome, {user?.name}</span>
            <DarkModeToggle />
            <NotificationBell />
            <button onClick={logout} className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100">
              Logout
            </button>
          </div>
          {/* Mobile: bell + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 flex flex-col gap-2 pb-2">
            <span className="text-sm px-2">Welcome, {user?.name}</span>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <span className="text-sm">Dark Mode</span>
            </div>
            <button onClick={logout} className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 text-left">
              Logout
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Platform Overview</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Users" value={stats.users.total}
                sub={`${stats.users.students} students · ${stats.users.faculty} faculty`} color="border-blue-500" />
              <StatCard label="Total Events" value={stats.events.total}
                sub={`${stats.events.published} published · ${stats.events.draft} draft`} color="border-green-500" />
              <StatCard label="Venues" value={stats.venues.total} sub="Active venues" color="border-purple-500" />
              <StatCard label="Registrations" value={stats.registrations.total} sub="Across all events" color="border-yellow-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard label="Pending Bookings" value={stats.bookings.pending} sub="Awaiting admin approval" color="border-orange-400" />
              <StatCard label="Approved Bookings" value={stats.bookings.approved} sub="Venue bookings confirmed" color="border-teal-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top Events by Registrations</h3>
              {stats.topEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">No event data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="text-left text-gray-400 dark:text-gray-500 border-b dark:border-gray-700">
                      <th className="pb-3">Event</th>
                      <th className="pb-3">Venue</th>
                      <th className="pb-3">Registrations</th>
                      <th className="pb-3">Capacity</th>
                      <th className="pb-3">Fill %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topEvents.map((event, i) => {
                      const fill = event.max_attendees
                        ? Math.round((event.registration_count / event.max_attendees) * 100) : 0;
                      return (
                        <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                          <td className="py-3 font-medium text-gray-800 dark:text-white">{event.title}</td>
                          <td className="py-3 text-gray-500 dark:text-gray-400">{event.venue_name || 'TBA'}</td>
                          <td className="py-3 text-gray-700 dark:text-gray-300">{event.registration_count}</td>
                          <td className="py-3 text-gray-500 dark:text-gray-400">{event.max_attendees}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${fill > 75 ? 'bg-red-400' : fill > 40 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                  style={{ width: `${Math.min(fill, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{fill}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No data available.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;