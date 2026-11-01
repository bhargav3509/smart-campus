import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const GREEN = '#34a853';
const RED = '#ea4335';

// SVG Icons
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            
          </div>
          <h2 className="text-3xl font-black mb-1" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Already Registered!</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Confirmed Seat</p>
          
          <div className="bg-gray-50 rounded-3xl p-6 text-left space-y-3 mb-6 border border-gray-100">
            <h3 className="text-xl font-black text-blue-600 mb-2 truncate" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>{event.title}</h3>
            <div className="space-y-2 text-[13px] text-gray-500 font-medium">
              <div className="flex items-center gap-2"> {event.venue_name || 'TBA'}</div>
              <div className="flex items-center gap-2"> {new Date(event.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
              <div className="flex items-center gap-2"> {user?.name}</div>
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
            <div className="flex items-center gap-2"> {event.venue_name || 'TBA'}</div>
            <div className="flex items-center gap-2"> {new Date(event.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <div className="flex items-center gap-2"> Max {event.max_attendees} spots</div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2"> <span className="font-bold text-gray-700 truncate">{user?.name}</span></div>
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
               Confirm Registration
            </>
          )}
        </button>
        <button onClick={() => navigate('/student')} className="w-full mt-3 bg-transparent text-gray-400 py-2 rounded-xl text-sm font-bold hover:text-gray-600 transition">Cancel</button>
      </div>
    </div>
  );
};

export default QRRegister;