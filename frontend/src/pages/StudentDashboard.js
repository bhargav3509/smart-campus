import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import QRModal from '../components/QRModal';
import { useNavigate } from 'react-router-dom';
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [qrEvent, setQrEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await API.get('/registrations/my');
      setMyRegistrations(res.data);
    } catch (err) {
      console.error('Failed to load registrations');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      toast.success('Successfully registered!');
      fetchMyRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await API.delete(`/registrations/${eventId}`);
      toast.success('Registration cancelled');
      fetchMyRegistrations();
    } catch (err) {
      toast.error('Failed to cancel registration');
    }
  };

  const isRegistered = (eventId) => myRegistrations.some(r => r.event_id === eventId);
  const getRegistration = (eventId) => myRegistrations.find(r => r.event_id === eventId);
  const isPast = (endTime) => new Date(endTime) < new Date();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">EveSphere</h1>
        <div className="flex items-center gap-4">
          <button
  onClick={() => navigate('/profile')}
  className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm font-semibold transition"
>
  👤 {user?.name}
</button>
          <DarkModeToggle />
          <NotificationBell />
          <button onClick={logout} className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['events', 'my registrations'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}>
              {tab}
              {tab === 'my registrations' && myRegistrations.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {myRegistrations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">

            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No published events yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    {event.poster_url && (
                      <img
                        src={event.poster_url?.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`}
                        alt={event.title}
                        className="w-full object-contain rounded-lg mb-3 bg-gray-50"
                      />
                    )}
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{event.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{event.description}</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                      <p>📍 {event.venue_name || 'TBA'}</p>
                      <p>📅 {new Date(event.start_time).toLocaleString()}</p>
                      <p>🕐 Ends: {new Date(event.end_time).toLocaleString()}</p>
                      <p>👥 Max: {event.max_attendees} attendees</p>
                      <p>🎓 By: {event.organizer_name}</p>
                    </div>

                    {isPast(event.end_time) ? (
                      <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 py-2 rounded-lg font-semibold text-center text-sm">
                        Event Ended
                      </div>
                    ) : isRegistered(event.id) ? (
                      <div className="space-y-2">
                        <div className="w-full bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 py-2 rounded-lg font-semibold text-center text-sm">
                          ✓ Registered
                        </div>
                        <button
                          onClick={() => setQrEvent({ ...event, registration: getRegistration(event.id) })}
                          className="w-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 py-2 rounded-lg font-semibold hover:bg-blue-100 transition text-sm"
                        >
                          🎟️ View QR Ticket
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(event.id)}
                          className="w-full bg-red-50 dark:bg-red-900 text-red-500 dark:text-red-300 py-2 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
                        >
                          Cancel Registration
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Register for Event
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* My Registrations Tab */}
        {activeTab === 'my registrations' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Registrations</h2>
            {myRegistrations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">You haven't registered for any events yet.</p>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map(reg => (
                  <div key={reg.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{reg.event_title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">📍 {reg.venue_name || 'TBA'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">📅 {new Date(reg.start_time).toLocaleString()}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full mt-1 inline-block ${
                        reg.status === 'attended' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{reg.status}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setQrEvent({ id: reg.event_id, title: reg.event_title, registration: reg })}
                        className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100"
                      >
                        🎟️ QR Ticket
                      </button>
                      {reg.status === 'registered' && (
                        <button
                          onClick={() => handleCancelRegistration(reg.event_id)}
                          className="bg-red-50 dark:bg-red-900 text-red-500 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Modal */}
      {qrEvent && <QRModal event={qrEvent} onClose={() => setQrEvent(null)} />}
    </div>
  );
};

export default StudentDashboard;