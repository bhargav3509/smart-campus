import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';

const QRRegister = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/register-event/${id}`);
      navigate('/login');
      return;
    }
    fetchEvent();
  }, [user, id]);

  const fetchEvent = async () => {
    try {
      const cleanId = id.replace(/\/$/, '').trim();
      const res = await API.get(`/events/${cleanId}`);
      setEvent(res.data);
      const regRes = await API.get('/registrations/my');
      const isReg = regRes.data.some(r => r.event_id === cleanId);
      if (isReg) setAlreadyRegistered(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Error loading event: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await API.post(`/events/${id}/register`);
      toast.success('Successfully registered!');
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (msg === 'Already registered') {
        setAlreadyRegistered(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-2xl mb-2">❌</p>
          <p className="text-gray-600">Event not found.</p>
        </div>
      </div>
    );
  }

  // Already registered screen
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Already Registered!</h2>
          <p className="text-gray-500 mb-2">You are registered for</p>
          <p className="text-xl font-bold text-blue-600 mb-4">{event.title}</p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4 text-sm">
            <p className="text-gray-600">📍 <span className="font-medium">{event.venue_name || 'TBA'}</span></p>
            <p className="text-gray-600">📅 <span className="font-medium">{new Date(event.start_time).toLocaleString()}</span></p>
            <p className="text-gray-600">👤 <span className="font-medium">{user?.name}</span></p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl py-3 px-4">
            <p className="text-green-700 font-semibold text-sm">✓ Your registration is confirmed</p>
          </div>
        </div>
      </div>
    );
  }

  // Success screen after registering
  if (done) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You're Registered!</h2>
          <p className="text-gray-500">
            You have successfully registered for <strong>{event.title}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // New registration screen
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{event.title}</h2>
        <p className="text-gray-500 text-sm mb-4">{event.description}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
          <p className="text-gray-600">📍 <span className="font-medium">{event.venue_name || 'TBA'}</span></p>
          <p className="text-gray-600">📅 <span className="font-medium">{new Date(event.start_time).toLocaleString()}</span></p>
          <p className="text-gray-600">👥 <span className="font-medium">Max {event.max_attendees} attendees</span></p>
          <p className="text-gray-600">👤 <span className="font-medium">Registering as: {user?.name}</span></p>
        </div>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-lg"
        >
          {registering ? 'Registering...' : '✅ Confirm Registration'}
        </button>
      </div>
    </div>
  );
};

export default QRRegister;