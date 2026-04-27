import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';
const RED = '#ea4335';
const GREEN = '#34a853';

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

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: 'student', department: ''
  });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const container = useRef(null);

  useEffect(() => {
    setVisible(true);
    requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        gsap.from('.register-card', { y: 40, duration: 0.7, ease: 'power3.out' });
        gsap.from('.title-char', { y: 20, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)', delay: 0.3 });
        gsap.from('.anim-el', { y: 15, duration: 0.4, stagger: 0.05, delay: 0.5, ease: 'power2.out' });
      }, container);
      return () => ctx.revert();
    });
  }, []);

  const strength = getStrength(form.password);
  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password),
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (strength < 4) return toast.error('Please choose a stronger password');
    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
        role: form.role, department: form.department,
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-800 focus:outline-none transition-all font-medium text-sm";
  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const titleText = "EveSphere";

  return (
    <div ref={container} className="min-h-screen bg-gray-50 py-12 px-4"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}>
      <div className="register-card mx-auto w-full max-w-md bg-white rounded-[40px] p-8 sm:p-12 border border-gray-100" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black mb-2 overflow-hidden flex justify-center" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: BLUE }}>
            {titleText.split('').map((char, index) => (
              <span key={index} className="title-char inline-block">{char}</span>
            ))}
          </h1>
          <p className="anim-el text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Student Identity Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="anim-el">
            <label className={labelClass}>Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              className={inputClass} placeholder="Enter your name" required
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div className="anim-el">
            <label className={labelClass}>Email Address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className={inputClass} placeholder="name@college.edu" required
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>
          <div className="anim-el">
            <label className={labelClass}>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              className={inputClass} placeholder="••••••••" required
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />

            {form.password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
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
                  { key: 'special', label: 'One special symbol' },
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
            <label className={labelClass}>Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
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

          <div className="anim-el">
            <label className={labelClass}>Access Role</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
              <option value="student">Student Account</option>
              <option value="faculty">Faculty Member</option>
              <option value="admin">Platform Admin</option>
            </select>
          </div>
          <div className="anim-el">
            <label className={labelClass}>Department</label>
            <input type="text" name="department" value={form.department} onChange={handleChange}
              className={inputClass} placeholder="e.g. Computer Science"
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          <div className="anim-el pt-4">
            <button
              type="submit"
              disabled={loading || strength < 4 || form.password !== form.confirm}
              className="w-full text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20 uppercase tracking-widest"
              style={{ backgroundColor: BLUE }}
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="anim-el text-center text-gray-400 mt-8 font-bold text-xs uppercase tracking-wider">
          Returning user?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;