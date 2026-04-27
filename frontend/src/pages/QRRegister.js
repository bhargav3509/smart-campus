import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';

// SVG Icons
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const QRRegister = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/register-event/${id}`);
      navigate('/login');
      return;
    }
    fetchEvent();
  }, [user, id]);

  useEffect(() => {
    if (!loading && (event || done || alreadyRegistered)) {
      gsap.from('.qr-card', { scale: 0.95, opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
    }
  }, [loading, event, done, alreadyRegistered]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent transparent transparent` }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="qr-card bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${RED}15`, color: RED }}>
            <IconX />
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Event Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/student')} className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95">Go Back</button>
        </div>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="qr-card bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${GREEN}15`, color: GREEN }}>
            <IconCheck />
          </div>
          <h2 className="text-3xl font-black mb-1" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Already Registered!</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Confirmed Seat</p>
          
          <div className="bg-gray-50 rounded-3xl p-6 text-left space-y-3 mb-6 border border-gray-100">
            <h3 className="text-xl font-black text-blue-600 mb-2 truncate" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
            <div className="space-y-2 text-[13px] text-gray-500 font-medium">
              <div className="flex items-center gap-2"><IconLocation /> {event.venue_name || 'TBA'}</div>
              <div className="flex items-center gap-2"><IconCalendar /> {new Date(event.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
              <div className="flex items-center gap-2"><IconUser /> {user?.name}</div>
            </div>
          </div>
          
          <button onClick={() => navigate('/student')} className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition active:scale-95">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="qr-card bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${GREEN}15`, color: GREEN }}>
            <IconCheck />
          </div>
          <h2 className="text-3xl font-black mb-2 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>You're Registered!</h2>
          <p className="text-gray-500 mb-6">
            Your seat for <span className="font-bold text-gray-900">{event.title}</span> has been confirmed.
          </p>
          <button onClick={() => navigate('/student')} className="w-full text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-600/20" style={{ backgroundColor: BLUE }}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="qr-card bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100">
        <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Event Registration</div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h2>
        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{event.description}</p>
        
        <div className="bg-gray-50 rounded-3xl p-6 text-left space-y-3 mb-8 border border-gray-100">
          <div className="space-y-2 text-[13px] text-gray-500 font-medium">
            <div className="flex items-center gap-2"><IconLocation /> {event.venue_name || 'TBA'}</div>
            <div className="flex items-center gap-2"><IconCalendar /> {new Date(event.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div className="flex items-center gap-2"><IconUsers /> Max {event.max_attendees} spots</div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2"><IconUser /> <span className="font-bold text-gray-700 truncate">{user?.name}</span></div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={registering}
          className="w-full text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          style={{ backgroundColor: BLUE }}
        >
          {registering ? 'Registering...' : (
            <>
              <IconCheck /> Confirm Registration
            </>
          )}
        </button>
        <button onClick={() => navigate('/student')} className="w-full mt-3 bg-transparent text-gray-400 py-2 rounded-xl text-sm font-bold hover:text-gray-600 transition">Cancel</button>
      </div>
    </div>
  );
};

export default QRRegister;