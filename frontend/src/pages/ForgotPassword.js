import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';

// SVG Icons
const IconMail = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [visible, setVisible] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    setVisible(true);
    requestAnimationFrame(() => {
      gsap.context(() => {
        gsap.from('.fp-card', { y: 40, duration: 0.7, ease: 'power3.out' });
        gsap.from('.anim-el', { y: 15, duration: 0.4, stagger: 0.08, delay: 0.4, ease: 'power2.out' });
      }, container);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-gray-800 focus:outline-none transition-all font-medium text-sm";

  return (
    <div ref={container} className="min-h-screen bg-gray-50 py-16 px-4 flex items-center justify-center"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}>
      <div className="fp-card w-full max-w-md bg-white rounded-[40px] p-10 sm:p-14 border border-gray-100"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: BLUE }}>
            EveSphere
          </h1>
          <p className="anim-el text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Credential Recovery</p>
        </div>

        {sent ? (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center text-blue-600 mb-6">
              <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                <IconMail />
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}>Check your email</h2>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <div className="pt-6 border-t border-gray-50">
              <Link to="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
                <IconArrowLeft /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="anim-el">
              <label className={labelClass}>Registered Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                onFocus={e => e.target.style.borderColor = BLUE}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Enter your registered email" required
              />
            </div>
            <div className="anim-el pt-4">
              <button
                type="submit" disabled={loading}
                className="w-full text-white py-4.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-600/20 uppercase tracking-[0.2em]"
                style={{ backgroundColor: BLUE, paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
              >
                {loading ? 'Transmitting...' : 'Send Reset Link'}
              </button>
            </div>
            <div className="anim-el mt-8 pt-6 border-t border-gray-50 text-center">
              <Link to="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
                <IconArrowLeft /> Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
