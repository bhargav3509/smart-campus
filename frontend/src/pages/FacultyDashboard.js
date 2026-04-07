import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import DarkModeToggle from '../components/DarkModeToggle';
import {useNavigate } from 'react-router-dom';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', venue_id: '',
    start_time: '', end_time: '', max_attendees: ''
  });
  const [bookingForm, setBookingForm] = useState({
    venue_id: '', start_time: '', end_time: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchVenues();
    fetchMyBookings();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
    } catch (err) { toast.error('Failed to load events'); }
  };

  const fetchVenues = async () => {
    try {
      const res = await API.get('/venues');
      setVenues(res.data);
    } catch (err) { toast.error('Failed to load venues'); }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await API.get('/bookings');
      setMyBookings(res.data);
    } catch (err) { toast.error('Failed to load bookings'); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(eventForm).forEach(key => formData.append(key, eventForm[key]));
      if (posterFile) formData.append('poster', posterFile);
      await API.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Event submitted for approval!');
      setShowEventForm(false);
      setEventForm({ title: '', description: '', venue_id: '', start_time: '', end_time: '', max_attendees: '' });
      setPosterFile(null);
      setPosterPreview(null);
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create event'); }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await API.post('/bookings', bookingForm);
      toast.success('Booking request submitted!');
      setShowBookingForm(false);
      setBookingForm({ venue_id: '', start_time: '', end_time: '' });
      fetchMyBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await API.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      fetchMyBookings();
    } catch (err) { toast.error('Failed to cancel booking'); }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return `text-xs font-semibold px-3 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`;
  };

  const inputClass = "w-full border dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-blue-700 dark:bg-gray-800 text-white px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">EveSphere — Faculty</h1>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
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
            <button
              onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg text-sm font-semibold transition"
            >
              👤 {user?.name}
            </button>
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
        {/* Events Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Events</h2>
          <button onClick={() => setShowEventForm(!showEventForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            + Create Event
          </button>
        </div>

        {showEventForm && (
          <form onSubmit={handleCreateEvent} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 mb-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">New Event</h3>
            <input type="text" placeholder="Event Title" value={eventForm.title}
              onChange={e => setEventForm({...eventForm, title: e.target.value})} className={inputClass} required />
            <textarea placeholder="Description" value={eventForm.description}
              onChange={e => setEventForm({...eventForm, description: e.target.value})} className={inputClass} rows={3} />
            <select value={eventForm.venue_id}
              onChange={e => setEventForm({...eventForm, venue_id: e.target.value})} className={inputClass} required>
              <option value="">Select Venue</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Capacity: {v.capacity})</option>)}
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Start Time</label>
                <input type="datetime-local" value={eventForm.start_time}
                  onChange={e => setEventForm({...eventForm, start_time: e.target.value})} className={inputClass} required />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">End Time</label>
                <input type="datetime-local" value={eventForm.end_time}
                  onChange={e => setEventForm({...eventForm, end_time: e.target.value})} className={inputClass} required />
              </div>
            </div>
            <input type="number" placeholder="Max Attendees" value={eventForm.max_attendees}
              onChange={e => setEventForm({...eventForm, max_attendees: e.target.value})} className={inputClass} required />
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Event Poster (Optional)</label>
              <input type="file" accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) { setPosterFile(file); setPosterPreview(URL.createObjectURL(file)); }
                }}
                className="w-full border dark:border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700" />
              {posterPreview && (
                <div className="mt-2 relative">
                  <img src={posterPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Submit for Approval</button>
              <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-4 mb-12">
          {events.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No events yet. Create your first event!</p>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
                {event.poster_url && (
                  <img src={event.poster_url?.startsWith('http') ? event.poster_url : `${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}${event.poster_url}`} alt={event.title}
                    className="w-full h-40 object-cover rounded-lg mb-3" />
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-white">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{event.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">📅 {new Date(event.start_time).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">📍 {event.venue_name || 'No venue assigned'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full self-start ${
                    event.status === 'published' ? 'bg-green-100 text-green-700'
                    : event.status === 'draft' ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>{event.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bookings Section */}
        <div className="border-t dark:border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Venue Bookings</h2>
            <button onClick={() => setShowBookingForm(!showBookingForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
              + Book a Venue
            </button>
          </div>

          {showBookingForm && (
            <form onSubmit={handleCreateBooking} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 mb-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">New Booking Request</h3>
              <select value={bookingForm.venue_id}
                onChange={e => setBookingForm({...bookingForm, venue_id: e.target.value})} className={inputClass} required>
                <option value="">Select Venue</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name} (Capacity: {v.capacity})</option>)}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Start Time</label>
                  <input type="datetime-local" value={bookingForm.start_time}
                    onChange={e => setBookingForm({...bookingForm, start_time: e.target.value})} className={inputClass} required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">End Time</label>
                  <input type="datetime-local" value={bookingForm.end_time}
                    onChange={e => setBookingForm({...bookingForm, end_time: e.target.value})} className={inputClass} required />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">Submit Request</button>
                <button type="button" onClick={() => setShowBookingForm(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {myBookings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No booking requests yet.</p>
            ) : (
              myBookings.map(b => (
                <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-white">{b.venue_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                      📅 {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                    </p>
                    <span className={statusBadge(b.status)}>{b.status}</span>
                  </div>
                  {b.status === 'pending' && (
                    <button onClick={() => handleCancelBooking(b.id)}
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 shrink-0">
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;