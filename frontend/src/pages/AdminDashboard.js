import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import SearchBar from '../components/SearchBar';
import DarkModeToggle from '../components/DarkModeToggle';
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [sortEventOption, setSortEventOption] = useState('upcoming');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', venue_id: '',
    start_time: '', end_time: '', max_attendees: ''
  });
  const [venueForm, setVenueForm] = useState({
    name: '', capacity: '', location: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchVenues();
    fetchBookings();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events', { params: { status: 'all' } });
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await API.get('/venues');
      setVenues(res.data);
    } catch (err) {
      toast.error('Failed to load venues');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load bookings');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(eventForm).forEach(key => formData.append(key, eventForm[key]));
      if (posterFile) formData.append('poster', posterFile);
      await API.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Event created!');
      setShowEventForm(false);
      setEventForm({ title: '', description: '', venue_id: '', start_time: '', end_time: '', max_attendees: '' });
      setPosterFile(null);
      setPosterPreview(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await API.post('/venues', venueForm);
      toast.success('Venue created!');
      setShowVenueForm(false);
      setVenueForm({ name: '', capacity: '', location: '' });
      fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create venue');
    }
  };

  const handlePublish = async (eventId) => {
    try {
      await API.put(`/events/${eventId}/publish`);
      toast.success('Event published!');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to publish event');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Booking ${status}!`);
      fetchBookings();
    } catch (err) {
      toast.error('Failed to update booking');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${eventId}`);
      toast.success('Event deleted!');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await API.delete(`/bookings/${bookingId}`);
      toast.success('Booking deleted!');
      fetchBookings();
    } catch (err) {
      toast.error('Failed to delete booking');
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',
    };
    return `text-xs font-semibold px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`;
  };

  const inputClass = "w-full border dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    (e.venue_name || '').toLowerCase().includes(eventSearch.toLowerCase())
  ).sort((a, b) => {
    const now = new Date();
    const aIsEnded = new Date(a.end_time) < now;
    const bIsEnded = new Date(b.end_time) < now;
    if (sortEventOption === 'ended_last') {
      if (aIsEnded && !bIsEnded) return 1;
      if (!aIsEnded && bIsEnded) return -1;
      return new Date(a.start_time) - new Date(b.start_time);
    } else if (sortEventOption === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else {
      return new Date(a.start_time) - new Date(b.start_time);
    }
  });

  const filteredVenues = venues.filter(v =>
    v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    (v.location || '').toLowerCase().includes(venueSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">EveSphere — Admin</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/analytics')}
            className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100"
          >
            📊 Analytics
          </button>
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
        <div className="flex gap-4 mb-6">
          {['events', 'venues', 'bookings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {tab}
              {tab === 'bookings' && bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── EVENTS TAB ── */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Events</h2>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                <select
                  value={sortEventOption}
                  onChange={(e) => setSortEventOption(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                >
                  <option value="upcoming">Sort: Upcoming First</option>
                  <option value="newest">Sort: Date Uploaded (Newest)</option>
                  <option value="ended_last">Sort: Ended Last</option>
                </select>
                <SearchBar value={eventSearch} onChange={setEventSearch} placeholder="Search events..." />
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 whitespace-nowrap"
                >
                  + Create Event
                </button>
              </div>
            </div>

            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6 space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">New Event</h3>
                <input type="text" placeholder="Title" value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className={inputClass} required />
                <textarea placeholder="Description" value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className={inputClass} rows={3} />
                <select value={eventForm.venue_id}
                  onChange={e => setEventForm({ ...eventForm, venue_id: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select Venue</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input type="datetime-local" value={eventForm.start_time}
                    onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className={inputClass} required />
                  <input type="datetime-local" value={eventForm.end_time}
                    onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className={inputClass} required />
                </div>
                <input type="number" placeholder="Max Attendees" value={eventForm.max_attendees}
                  onChange={e => setEventForm({ ...eventForm, max_attendees: e.target.value })}
                  className={inputClass} required />
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 font-semibold block mb-1">Event Poster (Optional)</label>
                  <input type="file" accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) { setPosterFile(file); setPosterPreview(URL.createObjectURL(file)); }
                    }}
                    className="w-full border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700" />
                  {posterPreview && (
                    <div className="mt-2 relative">
                      <img src={posterPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                      <button type="button"
                        onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Create Event</button>
                  <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <p className="text-center py-10 text-gray-400">No events found.</p>
              ) : (
                filteredEvents.map(event => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    {event.poster_url && (
                      <img src={event.poster_url?.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} alt={event.title}
                        className="w-full h-40 object-cover rounded-lg mb-3" />
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{event.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(event.start_time).toLocaleString()} • {event.venue_name || 'No venue'}
                        </p>
                        <span className={statusBadge(event.status)}>{event.status}</span>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {event.status !== 'published' && (
                          <button onClick={() => handlePublish(event.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                            Publish
                          </button>
                        )}
                        <button onClick={() => handleDeleteEvent(event.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── VENUES TAB ── */}
        {activeTab === 'venues' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Venues</h2>
              <div className="flex items-center gap-3">
                <SearchBar value={venueSearch} onChange={setVenueSearch} placeholder="Search venues..." />
                <button onClick={() => setShowVenueForm(!showVenueForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                  + Add Venue
                </button>
              </div>
            </div>
            {showVenueForm && (
              <form onSubmit={handleCreateVenue} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6 space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">New Venue</h3>
                <input type="text" placeholder="Venue Name" value={venueForm.name}
                  onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} className={inputClass} required />
                <input type="number" placeholder="Capacity" value={venueForm.capacity}
                  onChange={e => setVenueForm({ ...venueForm, capacity: e.target.value })} className={inputClass} required />
                <input type="text" placeholder="Location" value={venueForm.location}
                  onChange={e => setVenueForm({ ...venueForm, location: e.target.value })} className={inputClass} required />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Add Venue</button>
                  <button type="button" onClick={() => setShowVenueForm(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold">Cancel</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVenues.length === 0 ? (
                <p className="text-center py-10 text-gray-400 col-span-2">No venues found.</p>
              ) : (
                filteredVenues.map(venue => (
                  <div key={venue.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white">{venue.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">📍 {venue.location}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">👥 Capacity: {venue.capacity}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Venue Booking Requests</h2>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No booking requests yet.</p>
              ) : (
                bookings.map(booking => (
                  <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{booking.venue_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">By: {booking.user_name} | {new Date(booking.start_time).toLocaleString()}</p>
                      <span className={statusBadge(booking.status)}>{booking.status}</span>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button onClick={() => handleBookingStatus(booking.id, 'approved')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                            Approve
                          </button>
                          <button onClick={() => handleBookingStatus(booking.id, 'rejected')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">
                            Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteBooking(booking.id)}
                        className="bg-gray-700 dark:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;