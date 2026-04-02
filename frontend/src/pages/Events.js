import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import SearchBar from '../components/SearchBar';
import DarkModeToggle from '../components/DarkModeToggle';

const Events = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [sortOption, setSortOption] = useState('upcoming');
  const fetchEvents = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const res = await API.get('/events', { params: { search: searchTerm } });
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const res = await API.get('/registrations/my');
      setRegisteredEvents(res.data.map(r => r.event_id));
    } catch (err) {}
  };

  useEffect(() => { fetchMyRegistrations(); }, []);

  useEffect(() => {
    const delay = setTimeout(() => { fetchEvents(search); }, 400);
    return () => clearTimeout(delay);
  }, [search, fetchEvents]);

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      toast.success('Successfully registered!');
      setRegisteredEvents(prev => [...prev, eventId]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await API.delete(`/registrations/${eventId}`);
      toast.success('Registration cancelled');
      setRegisteredEvents(prev => prev.filter(id => id !== eventId));
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Smart Campus — Events</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.name}</span>
          <DarkModeToggle />
          <NotificationBell />
          <button onClick={logout} className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            All Events
            {events.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">{events.length} found</span>
            )}
          </h2>
          <div className="flex w-full md:w-auto flex-col md:flex-row items-stretch md:items-center gap-3">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
            >
              <option value="upcoming">Sort: Upcoming First</option>
              <option value="newest">Sort: Date Uploaded (Newest)</option>
              <option value="ended_last">Sort: Ended Last</option>
            </select>
            <div className="flex-1 md:flex-none">
              <SearchBar value={search} onChange={setSearch} placeholder="Search events..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No events found{search ? ` for "${search}"` : ''}.</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-blue-600 hover:underline text-sm">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...events].sort((a, b) => {
              const now = new Date();
              const aIsEnded = new Date(a.end_time) < now;
              const bIsEnded = new Date(b.end_time) < now;
              if (sortOption === 'ended_last') {
                if (aIsEnded && !bIsEnded) return 1;
                if (!aIsEnded && bIsEnded) return -1;
                return new Date(a.start_time) - new Date(b.start_time);
              } else if (sortOption === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
              } else {
                return new Date(a.start_time) - new Date(b.start_time);
              }
            }).map(event => {
              const registered = registeredEvents.includes(event.id);
              return (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  {event.poster_url && (
                    <img src={`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} alt={event.title}
                      className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{event.title}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{event.description}</p>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    <p>📍 {event.venue_name || 'TBA'}</p>
                    <p>📅 {new Date(event.start_time).toLocaleString()}</p>
                    <p>🕐 Ends: {new Date(event.end_time).toLocaleString()}</p>
                    <p>👥 Max: {event.max_attendees} attendees</p>
                    <p>🎓 By: {event.organizer_name}</p>
                  </div>
                  {user?.role === 'student' && (
                    registered ? (
                      <div className="space-y-2">
                        <div className="w-full bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 py-2 rounded-lg font-semibold text-center text-sm">
                          ✓ Registered
                        </div>
                        <button onClick={() => handleCancelRegistration(event.id)}
                          className="w-full bg-red-50 dark:bg-red-900 text-red-500 dark:text-red-300 py-2 rounded-lg font-semibold hover:bg-red-100 transition text-sm">
                          Cancel Registration
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleRegister(event.id)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                        Register for Event
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;