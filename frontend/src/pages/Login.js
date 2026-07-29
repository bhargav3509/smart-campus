import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const BLUE = '#1a73e8';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const container = useRef(null);

  useEffect(() => {
    setVisible(true);
    requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        gsap.from('.login-card', { y: 40, duration: 0.7, ease: 'power3.out' });
        gsap.from('.title-char', { y: 20, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)', delay: 0.3 });
        gsap.from('.anim-el', { y: 15, duration: 0.4, stagger: 0.07, delay: 0.5, ease: 'power2.out' });
      }, container);
      return () => ctx.revert();
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      const role = res.data.user.role;
      const redirect = localStorage.getItem('redirect_after_login');
      if (redirect) {
        localStorage.removeItem('redirect_after_login');
        navigate(redirect);
      } else {
        if (role === 'admin') navigate('/admin');
        else if (role === 'faculty') navigate('/faculty');
        else navigate('/student');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const titleText = "EveSphere";
  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-gray-800 focus:outline-none transition-all font-medium text-sm";

  return (
    <div ref={container} className="min-h-screen bg-gray-50 py-16 px-4 flex items-center justify-center"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.1s' }}>
      <div className="login-card w-full max-w-md bg-white rounded-[40px] p-10 sm:p-14 border border-gray-100" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-2 overflow-hidden flex justify-center" style={{ fontFamily: '"Big Shoulders Display", sans-serif', color: BLUE }}>
            {titleText.split('').map((char, index) => (
              <span key={index} className="title-char inline-block">{char}</span>
            ))}
          </h1>
          <p className="anim-el text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Campus Life Unified</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="anim-el">
            <label className={labelClass}>Corporate Identity</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              className={inputClass}
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              placeholder="name@university.edu" required
            />
          </div>
          <div className="anim-el">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Security Pass</label>
              <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Lost access?</Link>
            </div>
            <input
              type="password" name="password" value={form.password} onChange={handleChange}
              className={inputClass}
              onFocus={e => e.target.style.borderColor = BLUE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              placeholder="••••••••" required
            />
          </div>
          <div className="anim-el pt-4">
            <button
              type="submit" disabled={loading}
              className="w-full text-white py-4.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-blue-600/20 uppercase tracking-[0.2em]"
              style={{ backgroundColor: BLUE, paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="anim-el mt-12 pt-8 border-t border-gray-50">
          <p className="text-center text-gray-400 font-bold text-xs uppercase tracking-wider">
            New to EveSphere?{' '}
            <Link to="/register" className="text-blue-600 hover:underline ml-1">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;