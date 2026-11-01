import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const RED = '#ea4335';
const GREEN = '#34a853';

// SVG Icons
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconCircle = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  return score;
};

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', RED, '#f97316', '#eab308', GREEN];

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    setVisible(true);
    requestAnimationFrame(() => {
      gsap.context(() => {
        gsap.from('.rp-card', { y: 40, duration: 0.7, ease: 'power3.out' });
        gsap.from('.anim-el', { y: 15, duration: 0.4, stagger: 0.08, delay: 0.4, ease: 'power2.out' });
      }, container);
    });
  }, []);

  const strength = getStrength(form.password);
  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (strength < 4) return toast.error('Please choose a stronger password');
    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password: form.password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally { setLoading(false); }
  };

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-gray-800 focus:outline-none transition-all font-medium text-sm";

  return (
    <div ref={container} className="min-h-screen bg-gray-50 py-16 px-4 flex items-center justify-center"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}>
      <div className="rp-card w-full max-w-md bg-white rounded-[40px] p-10 sm:p-14 border border-gray-100"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black mb-2" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: BLUE }}>
            EveSphere
          </h1>
          <p className="anim-el text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Access Recovery</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="anim-el">
            <label className={labelClass}>New Credentials</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className={inputClass} placeholder="••••••••" required
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            {form.password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: i <= strength ? strengthColors[strength] : '#f3f4f6' }} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: strengthColors[strength] }}>
                  Security: {strengthLabels[strength]}
                </p>
              </div>
            )}
            {form.password && (
              <ul className="mt-3 space-y-1.5">
                {[
                  { key: 'length', label: 'Minimum 8 characters' },
                  { key: 'upper', label: 'One uppercase letter' },
                  { key: 'number', label: 'One numeric digit' },
                  { key: 'special', label: 'One special symbol' }
                ].map(({ key, label }) => (
                  <li key={key} className="text-[10px] flex items-center gap-2 font-black uppercase tracking-wider"
                    style={{ color: checks[key] ? GREEN : '#d1d5db' }}>
                    {checks[key] ? <IconCheck /> : <IconCircle />} {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="anim-el">
            <label className={labelClass}>Re-enter Credentials</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
              className={inputClass} placeholder="••••••••" required
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-[10px] font-black uppercase tracking-wider mt-1.5" style={{ color: RED }}>Mismatch detected</p>
            )}
            {form.confirm && form.password === form.confirm && (
              <p className="text-[10px] font-black uppercase tracking-wider mt-1.5 flex items-center gap-1" style={{ color: GREEN }}><IconCheck /> Passwords match</p>
            )}
          </div>

          <div className="anim-el pt-4">
            <button type="submit"
              disabled={loading || strength < 4 || form.password !== form.confirm}
              className="w-full text-white py-4.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20 uppercase tracking-[0.2em]"
              style={{ backgroundColor: BLUE, paddingTop: '1.125rem', paddingBottom: '1.125rem' }}>
              {loading ? 'Processing...' : 'Reset Password'}
            </button>
          </div>

          <div className="anim-el mt-8 pt-6 border-t border-gray-50 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
              <IconArrowLeft /> Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
